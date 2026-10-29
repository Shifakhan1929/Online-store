import { Link } from 'react-router-dom';
import type { Cart } from '../../../types/index.ts';

export interface CartSummaryProps {
  cart: Cart;
  onProceedToCheckout: () => void;
  onClearCartRequest: () => void;
  isProcessing?: boolean;
}

export default function CartSummary({
  cart,
  onProceedToCheckout,
  onClearCartRequest,
  isProcessing = false,
}: CartSummaryProps) {
  const subtotalInRupees = (cart.subtotal / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalInRupees = (cart.totalAmount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalQuantity = cart.totalQuantity ?? cart.itemCount ?? 0;
  const isCartEmpty = cart.items.length === 0;

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-colors">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Order Summary
      </h3>

      <dl className="mt-6 space-y-3.5 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <dt>Total Items</dt>
          <dd className="font-bold text-gray-900 dark:text-gray-100">
            {totalQuantity} {totalQuantity === 1 ? 'unit' : 'units'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt>Cart Subtotal</dt>
          <dd className="font-bold text-gray-900 dark:text-gray-100">
            ₹{subtotalInRupees}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5">
            <span>Estimated Delivery</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              FREE
            </span>
          </dt>
          <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
            ₹0.00
          </dd>
        </div>

        {/* Promotional Banner Callout */}
        <div className="rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-900 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60">
          <div className="flex items-center gap-1.5 font-bold">
            <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Have a discount coupon?</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-normal">
            You can apply coupons like <code className="font-bold">WELCOME10</code> or <code className="font-bold">FLAT500</code> on the next checkout step.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-extrabold text-gray-900 dark:border-gray-800 dark:text-white">
          <dt>Total Amount</dt>
          <dd className="text-xl text-indigo-600 dark:text-indigo-400 font-black">
            ₹{totalInRupees}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={isCartEmpty || isProcessing}
          className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
        >
          <span>Proceed to Checkout</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {!isCartEmpty && (
          <button
            type="button"
            onClick={onClearCartRequest}
            disabled={isProcessing}
            className="w-full min-h-[38px] rounded-xl border border-gray-200 py-2 px-3 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            Clear Entire Cart
          </button>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 text-center dark:border-gray-800">
          <Link
            to="/products"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            &larr; Or continue browsing products
          </Link>
        </div>
      </div>
    </div>
  );
}
