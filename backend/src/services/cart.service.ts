import { prisma } from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validator.js';
import { CartItem, Product } from '../generated/prisma/client.js';

export interface FormattedCartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stockQuantity: number;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    stockQuantity: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CartResponse {
  items: FormattedCartItem[];
  totalAmount: number;
  totalQuantity: number;
  itemCount: number;
  subtotal: number;
}

export const formatCartItem = (item: CartItem & { product: Product }): FormattedCartItem => {
  const itemSubtotal = item.product.price * item.quantity;
  return {
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    price: item.product.price,
    stockQuantity: item.product.stockQuantity,
    quantity: item.quantity,
    subtotal: itemSubtotal,
    product: {
      id: item.product.id,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      price: item.product.price,
      stockQuantity: item.product.stockQuantity,
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const getCart = async (userId: string): Promise<CartResponse> => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  const items = cartItems.map(formatCartItem);

  const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    totalAmount,
    totalQuantity,
    itemCount: totalQuantity,
    subtotal: totalAmount,
  };
};

export const addItemToCart = async (
  userId: string,
  input: AddCartItemInput
): Promise<{ item: FormattedCartItem; cart: CartResponse; isNew: boolean }> => {
  const { productId, quantity } = input;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    include: { product: true },
  });

  const currentQuantity = existingItem ? existingItem.quantity : 0;
  const targetQuantity = currentQuantity + quantity;

  if (targetQuantity > product.stockQuantity) {
    throw new BadRequestError(
      `Requested quantity (${targetQuantity}) exceeds available stock (${product.stockQuantity})`
    );
  }

  let savedItem: CartItem & { product: Product };

  if (existingItem) {
    savedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: targetQuantity },
      include: { product: true },
    });
  } else {
    savedItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: { product: true },
    });
  }

  const cart = await getCart(userId);

  return {
    item: formatCartItem(savedItem),
    cart,
    isNew: !existingItem,
  };
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<{ item: FormattedCartItem; cart: CartResponse }> => {
  const { quantity } = input;

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
    include: { product: true },
  });

  if (!cartItem) {
    throw new NotFoundError('Cart item not found');
  }

  if (quantity > cartItem.product.stockQuantity) {
    throw new BadRequestError(
      `Requested quantity (${quantity}) exceeds available stock (${cartItem.product.stockQuantity})`
    );
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity },
    include: { product: true },
  });

  const cart = await getCart(userId);

  return {
    item: formatCartItem(updatedItem),
    cart,
  };
};

export const removeCartItem = async (
  userId: string,
  itemId: string
): Promise<{ cart: CartResponse }> => {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
  });

  if (!cartItem) {
    throw new NotFoundError('Cart item not found');
  }

  await prisma.cartItem.delete({
    where: { id: cartItem.id },
  });

  const cart = await getCart(userId);

  return { cart };
};

export const clearCart = async (userId: string): Promise<void> => {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
};

