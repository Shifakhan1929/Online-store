import { z } from 'zod';

export const sortOptions = ['price_asc', 'price_desc', 'newest', 'oldest'] as const;
export type SortOption = (typeof sortOptions)[number];

const parsePrice = (fieldName: string) =>
  z.preprocess((val) => {
    if (val === undefined || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number({ invalid_type_error: `${fieldName} must be a valid number` })
      .finite(`${fieldName} must be a finite number`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .optional()
  );

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

export const getProductsQuerySchema = z
  .object({
    category: z.string().trim().min(1, 'Category cannot be empty').optional(),
    minPrice: parsePrice('minPrice').optional(),
    maxPrice: parsePrice('maxPrice').optional(),
    sort: z
      .enum(sortOptions, {
        errorMap: () => ({
          message: `sort must be one of: ${sortOptions.join(', ')}`,
        }),
      })
      .optional(),
    page: parsePositiveInt('page', 1),
    limit: parsePositiveInt('limit', 12, 50),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    }
  );

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.string().uuid('Product ID must be a valid UUID'),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

