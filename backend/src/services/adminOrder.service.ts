import { prisma } from '../lib/prisma.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { OrderStatus } from '../generated/prisma/enums.js';

export interface AdminOrdersPagination {
  page: number;
  limit: number;
  totalOrders: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersResult {
  orders: any[];
  pagination: AdminOrdersPagination;
}

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export const getAdminOrders = async (
  page = 1,
  limit = 12
): Promise<AdminOrdersResult> => {
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: {
          select: safeUserSelect,
        },
      },
    }),
    prisma.order.count(),
  ]);

  const totalPages = totalOrders === 0 ? 0 : Math.ceil(totalOrders / limit);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalOrders,
      total: totalOrders,
      totalPages,
    },
  };
};

export const getAdminOrderById = async (id: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: safeUserSelect,
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
};

export const updateAdminOrderStatus = async (
  id: string,
  newStatus: OrderStatus
): Promise<any> => {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Fetch current order
      const order = await tx.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // 2. Validate permitted status transitions: PLACED → SHIPPED → DELIVERED
      if (order.status === OrderStatus.DELIVERED) {
        throw new ConflictError(
          'A delivered order cannot transition back to another status.'
        );
      }

      const isValidTransition =
        (order.status === OrderStatus.PLACED && newStatus === OrderStatus.SHIPPED) ||
        (order.status === OrderStatus.SHIPPED && newStatus === OrderStatus.DELIVERED);

      if (!isValidTransition) {
        throw new ConflictError(
          `Cannot transition order status from '${order.status}' to '${newStatus}'. Permitted transitions are: PLACED → SHIPPED → DELIVERED.`
        );
      }

      // 3. Conditional database-level update to prevent concurrent status race conditions
      const updateResult = await tx.order.updateMany({
        where: {
          id,
          status: order.status,
        },
        data: {
          status: newStatus,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictError(
          'Concurrent status modification conflict: order status could not be updated.'
        );
      }

      // 4. Return updated order with items and sanitized customer details
      const updatedOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          user: {
            select: safeUserSelect,
          },
        },
      });

      return updatedOrder;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
};

