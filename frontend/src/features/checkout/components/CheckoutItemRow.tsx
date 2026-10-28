import { useState } from 'react';
import type { CartItem } from '../../../types/index.ts';

export interface CheckoutItemRowProps {
  item: CartItem;
}

export default function CheckoutItemRow({ item }: CheckoutItemRowProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const priceInRupees = (item.price / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const subtotalInRupees = (item.subtotal / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
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
                className="h-6 w-6"
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
          <h4 className="truncate text-xs font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Qty: {item.quantity} &times; ₹{priceInRupees}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          ₹{subtotalInRupees}
        </span>
      </div>
    </div>
  );
}

