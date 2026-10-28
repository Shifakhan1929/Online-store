import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from '../../auth/context/useAuth.ts';
import { fetchCart } from '../api/cartApi.ts';
import { CartContext } from './cart-context.ts';
import type { CartContextValue } from './cart-context.ts';

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sequence ref to prevent stale API responses from overwriting newer counts
  const requestSeqRef = useRef<number>(0);

  // Synchronize cart count with authoritative backend when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;
    const currentSeq = ++requestSeqRef.current;

    fetchCart()
      .then((cart) => {
        if (isMounted && currentSeq === requestSeqRef.current) {
          setItemCount(cart.totalQuantity ?? 0);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted && currentSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const setCartCount = useCallback((count: number): void => {
    // Invalidate any in-flight fetches so stale responses are discarded
    requestSeqRef.current++;
    setItemCount(Math.max(0, count));
  }, []);

  const refreshCart = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);

    try {
      const cart = await fetchCart();
      if (currentSeq === requestSeqRef.current) {
        setItemCount(cart.totalQuantity ?? 0);
      }
    } catch {
      // Discard errors or preserve current count on temporary network failure
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  const value: CartContextValue = {
    itemCount: isAuthenticated ? itemCount : 0,
    isLoading,
    setCartCount,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

