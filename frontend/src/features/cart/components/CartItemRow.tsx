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
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 py-4 transition-opacity dark:border-gray-800 ${
        isRemoving ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Product Image and Details */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
          {item.imageUrl && !imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImageFailed(true)}
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
          <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Unit Price: <span className="font-medium text-gray-700 dark:text-gray-300">₹{priceInRupees}</span>
          </p>
          {isMaxStockReached ? (
            <span className="mt-1 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              Max available stock ({item.stockQuantity}) reached
            </span>
          ) : (
            <span className="mt-1 inline-block text-[11px] text-gray-500 dark:text-gray-400">
              Available: {item.stockQuantity} in stock
            </span>
          )}
        </div>
      </div>

      {/* Quantity Stepper and Subtotal Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
        {/* Quantity Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={isMinQuantity || isBusy}
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            <span className="flex h-8 min-w-10 items-center justify-center px-2 text-xs font-semibold text-gray-900 dark:text-white">
              {isUpdating ? (
                <svg className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                item.quantity
              )}
            </span>

            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isMaxStockReached || isBusy}
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Item Subtotal */}
        <div className="w-24 text-right">
          <span className="block text-xs text-gray-500 dark:text-gray-400 sm:hidden">Subtotal</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ₹{subtotalInRupees}
          </span>
        </div>

        {/* Remove Button */}
        <div>
          <button
            type="button"
            aria-label={`Remove ${item.name} from cart`}
            onClick={() => onRemove(item.id)}
            disabled={isBusy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            {isRemoving ? (
              <svg className="h-4 w-4 animate-spin text-red-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

