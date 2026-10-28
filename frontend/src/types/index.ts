export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED';

export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number; // in integer paise
  stockQuantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalProducts?: number;
  totalOrders?: number;
  total?: number;
  totalPages: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stockQuantity: number;
  quantity: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    stockQuantity: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  itemCount: number;
  subtotal: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponId: string | null;
  couponCodeSnapshot: string | null;
  discountTypeSnapshot: DiscountType | null;
  discountValueSnapshot: number | null;
  items: OrderItem[];
  user?: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

