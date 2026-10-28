import { apiClient } from '../../../api/client.ts';
import type { ApiResponse, Order } from '../../../types/index.ts';

export interface OrdersResponseData {
  orders: Order[];
}

export interface SingleOrderResponseData {
  order: Order;
}

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<ApiResponse<OrdersResponseData> & { orders?: Order[] }>(
    '/orders'
  );

  const orders = response.data?.orders ?? response.orders;
  return Array.isArray(orders) ? orders : [];
};

export const fetchOrderById = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<
    ApiResponse<SingleOrderResponseData> & { order?: Order }
  >(`/orders/${orderId}`);

  const order = response.data?.order ?? response.order;

  if (!order) {
    throw new Error('Order details could not be retrieved.');
  }

  return order;
};

