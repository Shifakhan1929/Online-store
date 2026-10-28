import { useState } from 'react';
import type { Product } from '../../../types/index.ts';

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdding?: boolean;
  isAdded?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  isAdding = false,
  isAdded = false,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const priceInRupees = (product.price / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageFailed(true)}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-gray-400 dark:text-gray-600">
            <svg
              className="h-12 w-12"
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
            <span className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {product.category}
            </span>
          </div>
        )}

        {/* Stock Badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 shadow-xs dark:bg-red-950/80 dark:text-red-400">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-xs dark:bg-amber-950/80 dark:text-amber-300">
              Only {product.stockQuantity} left
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 shadow-xs dark:bg-emerald-950/80 dark:text-emerald-300">
              In Stock
            </span>
          )}
        </div>

        {/* Category tag overlay */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium tracking-wide text-gray-800 backdrop-blur-xs shadow-xs dark:bg-gray-900/90 dark:text-gray-200">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400">
          {product.name}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {product.description || 'No description available for this product.'}
        </p>

        {/* Price & Action Section */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{priceInRupees}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock || isAdding}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-semibold tracking-wide transition shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : isAdded
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:focus:ring-offset-gray-900'
            }`}
          >
            {isAdding ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
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
                <span>Adding...</span>
              </>
            ) : isAdded ? (
              <>
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Added to Cart!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
