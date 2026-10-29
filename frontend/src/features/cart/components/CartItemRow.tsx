import { useState } from 'react';
import type { CartItem } from '../../../types/index.ts';

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: CartItemRowProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const priceInRupees = (item.price / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const subtotalInRupees = (item.subtotal / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isMinQuantity = item.quantity <= 1;
  const isMaxStockReached = item.quantity >= item.stockQuantity;
  const isBusy = isUpdating || isRemoving;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        isRemoving ? 'opacity-40 scale-[0.99]' : 'opacity-100 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      {/* Product Image and Details */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/80">
          {item.imageUrl && !imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImageFailed(true)}
              width={80}
              height={80}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-600">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Unit Price: <span className="font-semibold text-gray-800 dark:text-gray-200">₹{priceInRupees}</span>
          </p>
          {isMaxStockReached ? (
            <span className="mt-1.5 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              Max available stock ({item.stockQuantity}) reached
            </span>
          ) : (
            <span className="mt-1.5 inline-block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              &bull; In Stock
            </span>
          )}
        </div>
      </div>

      {/* Stepper Controls & Line Subtotal */}
      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0 dark:border-gray-800">
        {/* Quantity Controls */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/80 p-1 shadow-xs dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isMinQuantity || isBusy}
            aria-label={`Decrease quantity of ${item.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>

          <span
            className="w-10 text-center text-xs font-bold text-gray-900 dark:text-white"
            aria-live="polite"
          >
            {isUpdating ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
            ) : (
              item.quantity
            )}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isMaxStockReached || isBusy}
            aria-label={`Increase quantity of ${item.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Line Subtotal */}
        <div className="w-24 text-right">
          <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Subtotal
          </div>
          <div className="text-sm font-extrabold text-gray-900 dark:text-white">
            ₹{subtotalInRupees}
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={isBusy}
          aria-label={`Remove ${item.name} from cart`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
