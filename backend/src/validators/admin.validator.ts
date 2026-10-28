import { z } from 'zod';
import { OrderStatus } from '../generated/prisma/enums.js';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(1, 'Category cannot be empty')
    .max(100, 'Category cannot exceed 100 characters'),
  price: z
    .number({
      required_error: 'Price in rupees is required',
      invalid_type_error: 'Price must be a valid number',
    })
    .finite('Price must be a finite number')
    .min(0, 'Price must be non-negative'),
  stockQuantity: z
    .number({
      required_error: 'Stock quantity is required',
      invalid_type_error: 'Stock quantity must be a number',
    })
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative'),
  imageUrl: z
    .string()
    .trim()
    .url('Image URL must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty')
      .max(200, 'Name cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, 'Description cannot exceed 5000 characters')
      .nullable()
      .optional(),
    category: z
      .string()
      .trim()
      .min(1, 'Category cannot be empty')
      .max(100, 'Category cannot exceed 100 characters')
      .optional(),
    price: z
      .number({ invalid_type_error: 'Price must be a valid number' })
      .finite('Price must be a finite number')
      .min(0, 'Price must be non-negative')
      .optional(),
    stockQuantity: z
      .number({ invalid_type_error: 'Stock quantity must be a number' })
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative')
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .url('Image URL must be a valid URL')
      .nullable()
      .optional()
      .or(z.literal('')),
  })
  .strict();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const adminProductIdParamSchema = z.object({
  id: z.string({ required_error: 'Product ID is required' }).uuid('Invalid product ID format'),
});

export type AdminProductIdParam = z.infer<typeof adminProductIdParamSchema>;

export const adminOrderIdParamSchema = z.object({
  id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid order ID format'),
});

export type AdminOrderIdParam = z.infer<typeof adminOrderIdParamSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum([OrderStatus.PLACED, OrderStatus.SHIPPED, OrderStatus.DELIVERED], {
    errorMap: () => ({
      message: `Status must be one of: ${OrderStatus.PLACED}, ${OrderStatus.SHIPPED}, ${OrderStatus.DELIVERED}`,
    }),
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

const parsePositiveInt = (fieldName: string, defaultVal: number, max?: number) => {
  let schema = z
    .number({ invalid_type_error: `${fieldName} must be a number` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be a positive integer`);

  if (max !== undefined) {
    schema = schema.max(max, `${fieldName} cannot exceed ${max}`);
  }

  return z.preprocess((val) => {
    if (val === undefined || val === '') return defaultVal;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, schema.default(defaultVal));
};

export const adminOrdersQuerySchema = z.object({
  page: parsePositiveInt('page', 1),
  limit: parsePositiveInt('limit', 12, 50),
});

export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

