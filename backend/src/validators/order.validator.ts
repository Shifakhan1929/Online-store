import { z } from 'zod';

export const checkoutSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(1, 'Coupon code cannot be empty')
    .max(50, 'Coupon code cannot exceed 50 characters')
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Order ID is required' })
    .uuid('Invalid order ID format'),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

