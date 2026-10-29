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
  const [showQuickView, setShowQuickView] = useState(false);
  const [hasRippled, setHasRippled] = useState(false);

  const priceInRupees = (product.price / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Calculate an illustrative pre-discount MSRP (15% markup) to show strikethrough value
  const originalPriceInRupees = ((product.price * 1.15) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasRippled(true);
    setTimeout(() => setHasRippled(false), 500);
    onAddToCart(product);
  };

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-300 hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.22)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-500/50 dark:hover:shadow-[0_15px_30px_-5px_rgba(147,51,234,0.25)]">
        {/* Product Image & Badges */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800/80">
          {product.imageUrl && !imageFailed ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageFailed(true)}
              loading="lazy"
              width={400}
              height={300}
              className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-gray-400 dark:text-gray-600">
              <svg
                className="h-12 w-12 stroke-[1.25]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {product.category}
              </span>
            </div>
          )}

          {/* Badges Top Row */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm backdrop-blur-xs">
              Sale
            </span>
          </div>

          <div className="absolute top-3 right-3">
            {isOutOfStock ? (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 shadow-xs dark:bg-red-950/80 dark:text-red-400">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-xs dark:bg-amber-950/80 dark:text-amber-300">
                Only {product.stockQuantity} left
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100/95 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-xs backdrop-blur-xs dark:bg-emerald-950/80 dark:text-emerald-300">
                In Stock
              </span>
            )}
          </div>

          {/* Category Tag Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-800 shadow-xs backdrop-blur-xs dark:bg-gray-900/90 dark:text-gray-200">
              {product.category}
            </span>
          </div>

          {/* Slide-Up Quick Actions Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/25 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setShowQuickView(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-900 shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:bg-white active:scale-95 focus:outline-none dark:bg-gray-800/95 dark:text-white dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Product Information */}
        <div className="flex flex-1 flex-col p-5">
          <button
            type="button"
            onClick={() => setShowQuickView(true)}
            className="text-left focus:outline-none"
          >
            <h3 className="line-clamp-1 font-extrabold text-base text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400">
              {product.name}
            </h3>
          </button>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {product.description || 'Premium everyday staple designed with durable materials and refined aesthetics.'}
          </p>

          {/* Price & Action Section */}
          <div className="mt-auto pt-5">
            <div className="flex items-baseline justify-between mb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Best Price
                </span>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-gray-900 tracking-tight dark:text-white">
                    ₹{priceInRupees}
                  </div>
                  <span className="text-xs text-gray-400 line-through dark:text-gray-500 font-semibold">
                    ₹{originalPriceInRupees}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddClick}
              disabled={isOutOfStock || isAdding}
              className={`relative overflow-hidden w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : isAdded
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus:ring-indigo-500 dark:focus:ring-offset-gray-900'
              }`}
            >
              {hasRippled && (
                <span className="absolute inset-0 rounded-xl bg-white/30 animate-ping pointer-events-none" />
              )}

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

      {/* Product Detail Modal */}
      {showQuickView && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowQuickView(false)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setShowQuickView(false)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 hover:text-gray-900 shadow-xs backdrop-blur-xs transition hover:bg-white dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-white"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Product Photo */}
              <div className="relative aspect-square md:aspect-auto h-full w-full bg-gray-100 dark:bg-gray-800">
                {product.imageUrl && !imageFailed ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    width={500}
                    height={500}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Information & CTA */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ID: {product.id.slice(0, 8)}
                    </span>
                    {isOutOfStock ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/70 dark:text-red-400">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        {product.stockQuantity} in stock
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
                    {product.name}
                  </h2>

                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      ₹{priceInRupees}
                    </span>
                    <span className="text-sm font-semibold text-gray-400 line-through">
                      ₹{originalPriceInRupees}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Description
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      {product.description || 'This premium item is crafted to the highest quality specifications with authentic materials and durable construction.'}
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 border border-gray-200/80 dark:bg-gray-800/60 dark:border-gray-700">
                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Eligible for coupons at checkout</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAddClick(e);
                    }}
                    disabled={isOutOfStock || isAdding}
                    className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-bold shadow-md transition-all ${
                      isOutOfStock
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800'
                        : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {isAdding ? (
                      <span>Adding to Cart...</span>
                    ) : isAdded ? (
                      <span>Added! Keep Shopping</span>
                    ) : isOutOfStock ? (
                      <span>Currently Unavailable</span>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Add to Cart &bull; ₹{priceInRupees}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
