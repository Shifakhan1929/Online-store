import { apiClient } from '../../../api/client.ts';
import type { ApiResponse, Product } from '../../../types/index.ts';
import type { ProductFiltersState, ProductsResponseData } from '../types.ts';

export interface GetProductsQueryParams {
  category?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const fetchProducts = async (
  filters: ProductFiltersState = {}
): Promise<ProductsResponseData> => {
  const params: Record<string, string | number> = {};

  if (filters.category && filters.category.trim() !== '') {
    params.category = filters.category.trim();
  }

  if (filters.minPrice !== undefined && filters.minPrice !== '') {
    const min = Number(filters.minPrice);
    if (!isNaN(min) && min >= 0) {
      params.minPrice = min;
    }
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    const max = Number(filters.maxPrice);
    if (!isNaN(max) && max >= 0) {
      params.maxPrice = max;
    }
  }

  if (filters.sort && filters.sort.trim() !== '') {
    params.sort = filters.sort;
  }

  if (filters.page && filters.page > 0) {
    params.page = filters.page;
  }

  if (filters.limit && filters.limit > 0) {
    params.limit = filters.limit;
  }

  const response = await apiClient.get<ApiResponse<ProductsResponseData>>('/products', {
    params,
  });

  if (!response.data) {
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalProducts: 0,
        totalPages: 0,
      },
    };
  }

  return response.data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
  if (!response.data || !response.data.product) {
    throw new Error('Product not found in response');
  }
  return response.data.product;
};
