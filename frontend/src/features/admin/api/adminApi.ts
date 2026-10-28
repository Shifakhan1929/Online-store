import { apiClient } from '../../../api/client.ts';
import type { ApiResponse, Product, Order, OrderStatus } from '../../../types/index.ts';
import type {
  CreateProductInputData,
  UpdateProductInputData,
  AdminOrdersQueryParams,
  AdminOrdersResponseData,
} from '../types.ts';

export const createAdminProductApi = async (
  input: CreateProductInputData
): Promise<Product> => {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    category: input.category.trim(),
    price: Number(input.price),
    stockQuantity: Math.floor(Number(input.stockQuantity)),
  };

  if (input.description && input.description.trim() !== '') {
    payload.description = input.description.trim();
  }

  if (input.imageUrl && input.imageUrl.trim() !== '') {
    payload.imageUrl = input.imageUrl.trim();
  }

  const response = await apiClient.post<
    ApiResponse<{ product: Product }> & { product?: Product }
  >('/admin/products', payload);

  const product = response.data?.product ?? response.product;
  if (!product) {
    throw new Error('Product creation succeeded but product details were missing.');
  }

  return product;
};

export const updateAdminProductApi = async (
  id: string,
  input: UpdateProductInputData
): Promise<Product> => {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }

  if (input.description !== undefined) {
    payload.description = input.description ? input.description.trim() : null;
  }

  if (input.category !== undefined) {
    payload.category = input.category.trim();
  }

  if (input.price !== undefined) {
    payload.price = Number(input.price);
  }

  if (input.stockQuantity !== undefined) {
    payload.stockQuantity = Math.floor(Number(input.stockQuantity));
  }

  if (input.imageUrl !== undefined) {
    payload.imageUrl = input.imageUrl && input.imageUrl.trim() !== '' ? input.imageUrl.trim() : null;
  }

  const response = await apiClient.patch<
    ApiResponse<{ product: Product }> & { product?: Product }
  >(`/admin/products/${id}`, payload);

  const product = response.data?.product ?? response.product;
  if (!product) {
    throw new Error('Product update succeeded but product details were missing.');
  }

  return product;
};

export const deleteAdminProductApi = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse>(`/admin/products/${id}`);
};

export const fetchAdminOrdersApi = async (
  params: AdminOrdersQueryParams = {}
): Promise<AdminOrdersResponseData> => {
  const queryParams: Record<string, number> = {};

  if (params.page && params.page > 0) {
    queryParams.page = params.page;
  }

  if (params.limit && params.limit > 0) {
    queryParams.limit = params.limit;
  }

  const response = await apiClient.get<
    ApiResponse<AdminOrdersResponseData> & {
      orders?: Order[];
      pagination?: AdminOrdersResponseData['pagination'];
    }
  >('/admin/orders', {
    params: queryParams,
  });

  const orders = response.data?.orders ?? response.orders ?? [];
  const pagination =
    response.data?.pagination ??
    response.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 12,
      totalOrders: orders.length,
      total: orders.length,
      totalPages: 1,
    };

  return {
    orders,
    pagination,
  };
};

export const fetchAdminOrderByIdApi = async (id: string): Promise<Order> => {
  const response = await apiClient.get<
    ApiResponse<{ order: Order }> & { order?: Order }
  >(`/admin/orders/${id}`);

  const order = response.data?.order ?? response.order;
  if (!order) {
    throw new Error('Order details could not be retrieved.');
  }

  return order;
};

export const updateAdminOrderStatusApi = async (
  id: string,
  status: OrderStatus
): Promise<Order> => {
  const response = await apiClient.patch<
    ApiResponse<{ order: Order }> & { order?: Order }
  >(`/admin/orders/${id}/status`, {
    status,
  });

  const order = response.data?.order ?? response.order;
  if (!order) {
    throw new Error('Order status update succeeded but order details were missing.');
  }

  return order;
};
