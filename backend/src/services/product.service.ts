import { prisma } from '../lib/prisma.js';
import { GetProductsQuery } from '../validators/product.validator.js';
import { NotFoundError } from '../utils/errors.js';
import { Prisma, Product } from '../generated/prisma/client.js';

export interface ProductsPagination {
  page: number;
  limit: number;
  totalProducts: number;
  total: number;
  totalPages: number;
}

export interface ProductsResult {
  products: Product[];
  pagination: ProductsPagination;
}

export const getProducts = async (query: GetProductsQuery): Promise<ProductsResult> => {
  const { category, minPrice, maxPrice, sort, page = 1, limit = 12 } = query;

  const where: Prisma.ProductWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = Math.round(minPrice * 100);
    }
    if (maxPrice !== undefined) {
      where.price.lte = Math.round(maxPrice * 100);
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput[];

  switch (sort) {
    case 'price_asc':
      orderBy = [{ price: 'asc' }, { id: 'asc' }];
      break;
    case 'price_desc':
      orderBy = [{ price: 'desc' }, { id: 'asc' }];
      break;
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
      break;
    case 'newest':
    default:
      orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
      break;
  }

  const skip = (page - 1) * limit;

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({
      where,
    }),
  ]);

  const totalPages = totalProducts === 0 ? 0 : Math.ceil(totalProducts / limit);

  return {
    products,
    pagination: {
      page,
      limit,
      totalProducts,
      total: totalProducts,
      totalPages,
    },
  };
};

export const getProductById = async (id: string): Promise<Product> => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
};

