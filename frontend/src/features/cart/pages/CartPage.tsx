import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCart, updateCartItemQuantity, removeCartItem, clearCart } from '../api/cartApi.ts';
import { useCart } from '../context/useCart.ts';
import CartItemRow from '../components/CartItemRow.tsx';
import CartSummary from '../components/CartSummary.tsx';
import type { Cart } from '../../../types/index.ts';

export default function CartPage() {
  const navigate = useNavigate();
  const { setCartCount } = useCart();

  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
    totalQuantity: 0,
    itemCount: 0,
    subtotal: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Per-item mutation states to avoid blocking the whole UI while preventing race conditions
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Sequence ref to discard stale responses from out-of-order network replies
  const requestSeqRef = useRef<number>(0);

  // Load cart on component mount
  useEffect(() => {
    let isMounted = true;
    const currentSeq = ++requestSeqRef.current;

    async function loadInitialCart() {
      try {
        const data = await fetchCart();
        if (isMounted && currentSeq === requestSeqRef.current) {
          setCart(data);
          setCartCount(data.totalQuantity);
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted && currentSeq === requestSeqRef.current) {
          const msg = err instanceof Error ? err.message : 'Failed to load shopping cart';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      }
    }

    loadInitialCart();

    return () => {
      isMounted = false;
    };
  }, [setCartCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    const currentSeq = ++requestSeqRef.current;

    fetchCart()
      .then((data) => {
        if (currentSeq === requestSeqRef.current) {
          setCart(data);
          setCartCount(data.totalQuantity);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (currentSeq === requestSeqRef.current) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load shopping cart');
          setIsLoading(false);
        }
      });
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItemId(itemId);
    setErrorMessage(null);
    setFeedbackMessage(null);
    const currentSeq = ++requestSeqRef.current;

    try {
      const result = await updateCartItemQuantity(itemId, newQuantity);
      if (currentSeq === requestSeqRef.current) {
        setCart(result.cart);
        setCartCount(result.cart.totalQuantity);
      }
    } catch (err: unknown) {
      if (currentSeq === requestSeqRef.current) {
        const msg = err instanceof Error ? err.message : 'Could not update item quantity';
        setErrorMessage(msg);
        // Refresh authoritative cart state in case server state diverged
        try {
          const synced = await fetchCart();
          if (currentSeq === requestSeqRef.current) {
            setCart(synced);
            setCartCount(synced.totalQuantity);
          }
        } catch {
          // ignore secondary fetch error
        }
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setUpdatingItemId(null);
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    setErrorMessage(null);
    setFeedbackMessage(null);
    const currentSeq = ++requestSeqRef.current;

    try {
      const result = await removeCartItem(itemId);
      if (currentSeq === requestSeqRef.current) {
        setCart(result.cart);
        setCartCount(result.cart.totalQuantity);
        setFeedbackMessage('Item removed from cart');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err: unknown) {
      if (currentSeq === requestSeqRef.current) {
        const msg = err instanceof Error ? err.message : 'Could not remove item from cart';
        setErrorMessage(msg);
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setRemovingItemId(null);
      }
    }
  };

  const handleConfirmClearCart = async () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    const currentSeq = ++requestSeqRef.current;

    try {
      const result = await clearCart();
      if (currentSeq === requestSeqRef.current) {
        setCart(result.cart);
        setCartCount(0);
        setFeedbackMessage('Shopping cart cleared');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err: unknown) {
      if (currentSeq === requestSeqRef.current) {
        const msg = err instanceof Error ? err.message : 'Could not clear shopping cart';
        setErrorMessage(msg);
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsClearing(false);
      }
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  const isCartEmpty = !isLoading && cart.items.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Shopping Cart
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Review your selected products, adjust quantities, and proceed to checkout.
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      {/* Global Alerts: Error / Success */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 shadow-xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            &times;
          </button>
        </div>
      )}

      {feedbackMessage && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-1/3 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900" />
          </div>
        </div>
      ) : isCartEmpty ? (
        /* Empty Cart State */
        <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mb-4 rounded-full bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Your shopping cart is empty
          </h2>
          <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Looks like you haven't added any products to your cart yet. Explore our catalogue to find top items!
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        /* Cart Contents: Items list + Summary */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Cart Items List */}
          <div className="lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="hidden border-b border-gray-200 pb-3 text-xs font-semibold text-gray-500 sm:flex sm:justify-between dark:border-gray-800 dark:text-gray-400">
                <span className="flex-1">Product</span>
                <span className="w-28 text-center">Quantity</span>
                <span className="w-24 text-right">Subtotal</span>
                <span className="w-8 text-right"></span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {cart.items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={updatingItemId === item.id}
                    isRemoving={removingItemId === item.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <CartSummary
                cart={cart}
                onProceedToCheckout={handleProceedToCheckout}
                onClearCartRequest={() => setShowClearConfirm(true)}
                isProcessing={Boolean(updatingItemId || removingItemId || isClearing)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Clear Shopping Cart?
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Are you sure you want to remove all items from your shopping cart? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCart}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Network Failure Retry State */}
      {errorMessage && !isLoading && cart.items.length === 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Retry Loading Cart
          </button>
        </div>
      )}
    </div>
  );
}

