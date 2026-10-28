import type { Order, Pagination } from '../../types/index.ts';

export interface CreateProductInputData {
  name: string;
  description?: string;
  category: string;
  price: number; // in rupees
  stockQuantity: number;
  imageUrl?: string;
}

export interface UpdateProductInputData {
  name?: string;
  description?: string | null;
  category?: string;
  price?: number; // in rupees
  stockQuantity?: number;
  imageUrl?: string | null;
}

export interface AdminOrdersQueryParams {
  page?: number;
  limit?: number;
}

export interface AdminOrdersResponseData {
  orders: Order[];
  pagination: Pagination;
}

