import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .uuid('Invalid product ID format'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be a positive integer'),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be a positive integer'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const cartItemIdParamSchema = z.object({
  itemId: z
    .string({ required_error: 'Cart item ID is required' })
    .uuid('Invalid cart item ID format'),
});

export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;

