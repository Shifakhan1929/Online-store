import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart } from '../../cart/api/cartApi.ts';
import { useCart } from '../../cart/context/useCart.ts';
import { submitCheckout } from '../api/checkoutApi.ts';
import CheckoutItemRow from '../components/CheckoutItemRow.tsx';
import CouponSection from '../components/CouponSection.tsx';
import { ApiError } from '../../../api/client.ts';
import type { Cart } from '../../../types/index.ts';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { setCartCount } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(true);
  const [cartError, setCartError] = useState<string | null>(null);

  // Staged coupon code
  const [stagedCoupon, setStagedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Submission state
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // General error state & stock error state
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStockConflict, setIsStockConflict] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCartData() {
      try {
        const cartData = await fetchCart();
        if (isMounted) {
          setCart(cartData);
          setCartCount(cartData.totalQuantity);
          setCartError(null);
          setIsLoadingCart(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve your shopping cart';
          setCartError(msg);
          setIsLoadingCart(false);
        }
      }
    }

    loadCartData();

    return () => {
      isMounted = false;
    };
  }, [setCartCount]);

  const handleApplyCoupon = (code: string) => {
    setCouponError(null);
    setCheckoutError(null);
    setStagedCoupon(code);
  };

  const handleRemoveCoupon = () => {
    setCouponError(null);
    setCheckoutError(null);
    setStagedCoupon(null);
  };

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current || isPlacingOrder) {
      return;
    }

    if (!cart || cart.items.length === 0) {
      setCheckoutError('Your cart is empty. Please add items before checking out.');
      return;
    }

    isSubmittingRef.current = true;
    setIsPlacingOrder(true);
    setCheckoutError(null);
    setCouponError(null);
    setIsStockConflict(false);

    try {
      const order = await submitCheckout({
        couponCode: stagedCoupon || undefined,
      });

      // Synchronize cart count: backend transactionally empties cart upon successful checkout
      setCartCount(0);

      // Order placement succeeded: navigate to order details page
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorMsg = err.message || 'Failed to place order';

        // Check if error is coupon-related
        if (errorMsg.toLowerCase().includes('coupon') || errorMsg.toLowerCase().includes('minimum order value')) {
          setCouponError(errorMsg);
          setCheckoutError(errorMsg);
        } else if (err.statusCode === 409 || errorMsg.toLowerCase().includes('stock')) {
          setIsStockConflict(true);
          setCheckoutError(errorMsg);
        } else {
          setCheckoutError(errorMsg);
        }
      } else {
        // Ambiguous network failure: do not auto-retry
        setCheckoutError('A network error occurred. Please verify your connection before trying again.');
      }
    } finally {
      setIsPlacingOrder(false);
      isSubmittingRef.current = false;
    }
  };

  const subtotalInRupees = cart
    ? (cart.subtotal / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  const totalQuantity = cart ? (cart.totalQuantity ?? cart.itemCount ?? 0) : 0;
  const isCartEmpty = !isLoadingCart && (!cart || cart.items.length === 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Order Checkout
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Review your order details, apply coupons, and confirm your purchase.
          </p>
        </div>

        <Link
          to="/cart"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          &larr; Return to Cart
        </Link>
      </div>

      {/* Global Alerts: Error */}
      {checkoutError && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 shadow-xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
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
            <div>
              <p>{checkoutError}</p>
              {isStockConflict && (
                <div className="mt-2">
                  <Link
                    to="/cart"
                    className="inline-block rounded-md bg-red-100 px-3 py-1 text-xs font-bold text-red-900 hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
                  >
                    Return to Cart to Update Quantities &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCheckoutError(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Cart Loading Skeleton */}
      {isLoadingCart ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900" />
          </div>
        </div>
      ) : cartError ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Could Not Retrieve Cart
          </h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{cartError}</p>
          <Link
            to="/cart"
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Return to Cart
          </Link>
        </div>
      ) : isCartEmpty ? (
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
            Cannot checkout with an empty cart
          </h2>
          <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Your shopping cart contains no items. Add products to your cart before proceeding to checkout.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/products"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Explore Products
            </Link>
            <Link
              to="/cart"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              View Cart
            </Link>
          </div>
        </div>
      ) : (
        /* Active Checkout Grid */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Order Review List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Order Review ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </h3>
                <Link
                  to="/cart"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Edit Cart
                </Link>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {cart?.items.map((item) => (
                  <CheckoutItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Coupon Section */}
            <CouponSection
              appliedCoupon={stagedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              error={couponError}
              isDisabled={isPlacingOrder}
            />
          </div>

          {/* Checkout Final Summary & Place Order Action */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Payment Summary
              </h3>

              <dl className="mt-4 space-y-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-gray-900 dark:text-gray-200">
                    ₹{subtotalInRupees}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt>Coupon Discount</dt>
                  <dd className="font-medium text-gray-500 dark:text-gray-400">
                    {stagedCoupon ? (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {stagedCoupon} applied
                      </span>
                    ) : (
                      'None'
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                  <dt>Estimated Payable Amount</dt>
                  <dd className="text-base text-indigo-600 dark:text-indigo-400">
                    ₹{subtotalInRupees}
                  </dd>
                </div>
              </dl>

              {stagedCoupon && (
                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  * Final discount and total will be authoritatively calculated by the backend upon placement.
                </p>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || isCartEmpty}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 px-4 text-xs font-semibold tracking-wide text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
                >
                  {isPlacingOrder ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Place Order</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    to="/cart"
                    className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    &larr; Return to Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

