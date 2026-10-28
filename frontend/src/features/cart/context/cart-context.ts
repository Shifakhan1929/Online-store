import { createContext } from 'react';

export interface CartContextValue {
  itemCount: number;
  isLoading: boolean;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

