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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Order Summary
      </h3>

      <dl className="mt-6 space-y-3 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <dt>Total Items</dt>
          <dd className="font-semibold text-gray-900 dark:text-gray-200">
            {totalQuantity} {totalQuantity === 1 ? 'unit' : 'units'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-gray-900 dark:text-gray-200">
            ₹{subtotalInRupees}
          </dd>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900 dark:border-gray-800 dark:text-white">
          <dt>Total Amount</dt>
          <dd className="text-base text-indigo-600 dark:text-indigo-400">
            ₹{totalInRupees}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={isCartEmpty || isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 px-4 text-xs font-semibold tracking-wide text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
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
            className="w-full rounded-lg border border-red-200 bg-red-50/50 py-2.5 px-4 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Clear Shopping Cart
          </button>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/products"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

