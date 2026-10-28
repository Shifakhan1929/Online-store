import { apiClient } from '../../../api/client.ts';
import type { ApiResponse, Order } from '../../../types/index.ts';

export interface CheckoutPayload {
  couponCode?: string;
}

export interface CheckoutResponseData {
  order: Order;
}

export const submitCheckout = async (payload: CheckoutPayload = {}): Promise<Order> => {
  const body: Record<string, string> = {};

  if (payload.couponCode && payload.couponCode.trim() !== '') {
    body.couponCode = payload.couponCode.trim().toUpperCase();
  }

  const response = await apiClient.post<ApiResponse<CheckoutResponseData> & { order?: Order }>(
    '/orders/checkout',
    body
  );

  const createdOrder = response.data?.order ?? response.order;

  if (!createdOrder) {
    throw new Error('Order creation succeeded but order details were not returned.');
  }

  return createdOrder;
};

