import { Request, Response } from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../services/cart.service.js';
import {
  AddCartItemInput,
  UpdateCartItemInput,
  CartItemIdParam,
} from '../validators/cart.validator.js';

export const getCartHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const cart = await getCart(userId);

  res.status(200).json({
    status: 'success',
    data: {
      ...cart,
      cart,
    },
  });
};

export const addItemHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const input = req.body as AddCartItemInput;
  const result = await addItemToCart(userId, input);

  res.status(result.isNew ? 201 : 200).json({
    status: 'success',
    data: {
      item: result.item,
      cart: result.cart,
      ...result.cart,
    },
  });
};

export const updateItemHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { itemId } = req.params as CartItemIdParam;
  const input = req.body as UpdateCartItemInput;
  const result = await updateCartItem(userId, itemId, input);

  res.status(200).json({
    status: 'success',
    data: {
      item: result.item,
      cart: result.cart,
      ...result.cart,
    },
  });
};

export const removeItemHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { itemId } = req.params as CartItemIdParam;
  const result = await removeCartItem(userId, itemId);

  res.status(200).json({
    status: 'success',
    message: 'Cart item removed successfully',
    data: {
      cart: result.cart,
      ...result.cart,
    },
  });
};

export const clearCartHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  await clearCart(userId);

  const emptyCart = {
    items: [],
    totalAmount: 0,
    totalQuantity: 0,
    itemCount: 0,
    subtotal: 0,
  };

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared successfully',
    data: {
      ...emptyCart,
      cart: emptyCart,
    },
  });
};

