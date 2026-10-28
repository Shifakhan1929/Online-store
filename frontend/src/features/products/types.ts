import type { Product, Pagination } from '../../types/index.ts';

export type ProductSortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export interface ProductFiltersState {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}

export interface ProductsResponseData {
  products: Product[];
  pagination: Pagination;
}
