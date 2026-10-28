import { apiClient } from '../../../api/client.ts';
import type { ApiResponse, Cart, CartItem } from '../../../types/index.ts';

export interface CartResponseData {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  itemCount: number;
  subtotal: number;
  cart?: Cart;
}

const normalizeCartResponse = (data?: CartResponseData): Cart => {
  if (!data) {
    return {
      items: [],
      totalAmount: 0,
      totalQuantity: 0,
      itemCount: 0,
      subtotal: 0,
    };
  }

  const rawCart = data.cart || data;
  return {
    items: Array.isArray(rawCart.items) ? rawCart.items : [],
    totalAmount: typeof rawCart.totalAmount === 'number' ? rawCart.totalAmount : 0,
    totalQuantity: typeof rawCart.totalQuantity === 'number' ? rawCart.totalQuantity : 0,
    itemCount: typeof rawCart.itemCount === 'number' ? rawCart.itemCount : (rawCart.totalQuantity || 0),
    subtotal: typeof rawCart.subtotal === 'number' ? rawCart.subtotal : (rawCart.totalAmount || 0),
  };
};

export const fetchCart = async (): Promise<Cart> => {
  const response = await apiClient.get<ApiResponse<CartResponseData>>('/cart');
  return normalizeCartResponse(response.data);
};

export const addItemToCart = async (
  productId: string,
  quantity = 1
): Promise<{ item: CartItem; cart: Cart }> => {
  const response = await apiClient.post<ApiResponse<{ item: CartItem; cart: Cart }>>(
    '/cart/items',
    {
      productId,
      quantity,
    }
  );

  if (!response.data) {
    throw new Error('Failed to add item to cart');
  }

  return {
    item: response.data.item,
    cart: normalizeCartResponse(response.data.cart as CartResponseData | undefined),
  };
};

export const updateCartItemQuantity = async (
  itemId: string,
  quantity: number
): Promise<{ item: CartItem; cart: Cart }> => {
  const response = await apiClient.patch<ApiResponse<{ item: CartItem; cart: Cart }>>(
    `/cart/items/${itemId}`,
    {
      quantity,
    }
  );

  if (!response.data) {
    throw new Error('Failed to update cart item quantity');
  }

  return {
    item: response.data.item,
    cart: normalizeCartResponse(response.data.cart as CartResponseData | undefined),
  };
};

export const removeCartItem = async (itemId: string): Promise<{ cart: Cart }> => {
  const response = await apiClient.delete<ApiResponse<{ cart: Cart }>>(
    `/cart/items/${itemId}`
  );

  if (!response.data) {
    throw new Error('Failed to remove item from cart');
  }

  return {
    cart: normalizeCartResponse(response.data.cart as CartResponseData | undefined),
  };
};

export const clearCart = async (): Promise<{ cart: Cart }> => {
  const response = await apiClient.delete<ApiResponse<{ cart: Cart }>>('/cart');

  return {
    cart: normalizeCartResponse(response.data ? (response.data.cart as CartResponseData | undefined) : undefined),
  };
};
