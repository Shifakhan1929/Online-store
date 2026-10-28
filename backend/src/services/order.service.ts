import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';
import { CheckoutInput } from '../validators/order.validator.js';
import { Order, OrderItem } from '../generated/prisma/client.js';
import { OrderStatus, DiscountType } from '../generated/prisma/enums.js';

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export const checkoutOrder = async (
  userId: string,
  input: CheckoutInput
): Promise<OrderWithItems> => {
  const { couponCode } = input;

  return await prisma.$transaction(
    async (tx) => {
      // 1. Retrieve the authenticated user's cart items with current product details
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestError('Cannot checkout with an empty cart');
      }

      // 2. Validate product availability and recalculate line totals and subtotal
      let subtotal = 0;
      for (const item of cartItems) {
        if (!item.product) {
          throw new BadRequestError('A product in your cart is no longer available');
        }

        if (item.quantity > item.product.stockQuantity) {
          throw new ConflictError(
            `Insufficient stock for product "${item.product.name}". Available: ${item.product.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        const lineTotal = item.product.price * item.quantity;
        subtotal += lineTotal;
      }

      // 3. Validate coupon if provided
      let couponId: string | null = null;
      let couponCodeSnapshot: string | null = null;
      let discountTypeSnapshot: DiscountType | null = null;
      let discountValueSnapshot: number | null = null;
      let discountAmount = 0;

      if (couponCode && couponCode.trim() !== '') {
        const normalizedCode = couponCode.trim().toUpperCase();
        const coupon = await tx.coupon.findUnique({
          where: { code: normalizedCode },
        });

        if (!coupon) {
          throw new BadRequestError(`Coupon "${normalizedCode}" is invalid or does not exist`);
        }

        if (!coupon.isActive) {
          throw new BadRequestError(`Coupon "${coupon.code}" is currently inactive`);
        }

        if (new Date() > new Date(coupon.expiryDate)) {
          throw new BadRequestError(`Coupon "${coupon.code}" has expired`);
        }

        if (subtotal < coupon.minOrderValue) {
          throw new BadRequestError(
            `Order subtotal (₹${(subtotal / 100).toFixed(2)}) does not meet the minimum order value of ₹${(coupon.minOrderValue / 100).toFixed(2)} for coupon ${coupon.code}`
          );
        }

        if (coupon.discountType === DiscountType.PERCENTAGE) {
          if (coupon.discountValue <= 0 || coupon.discountValue > 100) {
            throw new BadRequestError('Invalid coupon percentage discount value');
          }
          // Documented consistent integer rounding rule: standard Math.round in integer paise
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        } else if (coupon.discountType === DiscountType.FLAT) {
          if (coupon.discountValue <= 0) {
            throw new BadRequestError('Invalid coupon flat discount value');
          }
          // Flat discount cannot exceed eligible subtotal
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }

        // Final sanity check: discount cannot exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        couponId = coupon.id;
        couponCodeSnapshot = coupon.code;
        discountTypeSnapshot = coupon.discountType;
        discountValueSnapshot = coupon.discountValue;
      }

      // 4. Calculate final total (guaranteed non-negative)
      const totalAmount = Math.max(0, subtotal - discountAmount);

      // 5. Critical atomic, conditional database-level stock deduction
      for (const item of cartItems) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: {
              gte: item.quantity,
            },
          },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictError(
            `Insufficient stock for product "${item.product.name}". The requested quantity is no longer available.`
          );
        }
      }

      // 6. Create the order and historical snapshots in order items
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PLACED,
          subtotal,
          discountAmount,
          totalAmount,
          couponId,
          couponCodeSnapshot,
          discountTypeSnapshot,
          discountValueSnapshot,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              quantity: item.quantity,
              lineTotal: item.product.price * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 7. Clear the user's cart only after order and stock deduction succeed
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return order;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
};

export const getCustomerOrders = async (userId: string): Promise<OrderWithItems[]> => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
};

export const getCustomerOrderById = async (
  userId: string,
  orderId: string
): Promise<OrderWithItems> => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
};

