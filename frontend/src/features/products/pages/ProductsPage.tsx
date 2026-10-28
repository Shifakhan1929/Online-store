import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth.ts';
import { useCart } from '../../cart/context/useCart.ts';
import { fetchProducts } from '../api/productsApi.ts';
import { addItemToCart } from '../../cart/api/cartApi.ts';
import ProductCard from '../components/ProductCard.tsx';
import ProductFilters from '../components/ProductFilters.tsx';
import type { Product, Pagination } from '../../../types/index.ts';
import type { ProductFiltersState, ProductSortOption } from '../types.ts';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { setCartCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    totalProducts: 0,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cart action state
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cartSuccessFeedback, setCartSuccessFeedback] = useState<string | null>(null);
  const [cartErrorFeedback, setCartErrorFeedback] = useState<string | null>(null);

  // Read current filters from URL search params
  const currentCategory = searchParams.get('category') || undefined;
  const currentMinPrice = searchParams.get('minPrice') || undefined;
  const currentMaxPrice = searchParams.get('maxPrice') || undefined;
  const currentSort = (searchParams.get('sort') as ProductSortOption) || 'newest';
  const currentPage = Number(searchParams.get('page')) || 1;

  const filters: ProductFiltersState = useMemo(
    () => ({
      category: currentCategory,
      minPrice: currentMinPrice,
      maxPrice: currentMaxPrice,
      sort: currentSort,
      page: currentPage,
      limit: 12,
    }),
    [currentCategory, currentMinPrice, currentMaxPrice, currentSort, currentPage]
  );

  // Load products effect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function executeFetch() {
      try {
        const data = await fetchProducts(filters);
        if (isMounted) {
          setProducts(data.products || []);
          setPagination(
            data.pagination || {
              page: 1,
              limit: 12,
              totalProducts: 0,
              total: 0,
              totalPages: 0,
            }
          );
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load products';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    fetchProducts(filters)
      .then((data) => {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 12,
            totalProducts: 0,
            total: 0,
            totalPages: 0,
          }
        );
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load products');
        setIsLoading(false);
      });
  };

  // Update query params in URL
  const updateFilters = (updated: Partial<ProductFiltersState>) => {
    setIsLoading(true);
    setErrorMessage(null);
    const nextParams = new URLSearchParams(searchParams);

    if (updated.category !== undefined) {
      if (updated.category) {
        nextParams.set('category', updated.category);
      } else {
        nextParams.delete('category');
      }
    }

    if (updated.minPrice !== undefined) {
      if (updated.minPrice) {
        nextParams.set('minPrice', updated.minPrice);
      } else {
        nextParams.delete('minPrice');
      }
    }

    if (updated.maxPrice !== undefined) {
      if (updated.maxPrice) {
        nextParams.set('maxPrice', updated.maxPrice);
      } else {
        nextParams.delete('maxPrice');
      }
    }

    if (updated.sort !== undefined) {
      if (updated.sort && updated.sort !== 'newest') {
        nextParams.set('sort', updated.sort);
      } else {
        nextParams.delete('sort');
      }
    }

    if (updated.page !== undefined) {
      if (updated.page > 1) {
        nextParams.set('page', String(updated.page));
      } else {
        nextParams.delete('page');
      }
    }

    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: location, message: 'Please log in to add items to your cart' },
      });
      return;
    }

    setAddingProductId(product.id);
    setCartErrorFeedback(null);
    setCartSuccessFeedback(null);

    try {
      const result = await addItemToCart(product.id, 1);
      setCartCount(result.cart.totalQuantity);
      setRecentlyAddedId(product.id);
      setCartSuccessFeedback(`"${product.name}" added to cart!`);

      setTimeout(() => {
        setRecentlyAddedId(null);
      }, 2500);

      setTimeout(() => {
        setCartSuccessFeedback(null);
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add product to cart';
      setCartErrorFeedback(msg);
      setTimeout(() => {
        setCartErrorFeedback(null);
      }, 5000);
    } finally {
      setAddingProductId(null);
    }
  };

  // Derive all unique categories from products
  const availableCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  const totalCount = pagination.totalProducts ?? pagination.total ?? products.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Title & Intro */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Explore Our Catalogue
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Discover premium items with upfront pricing and real-time stock availability.
          </p>
        </div>
      </div>

      {/* Cart Feedback Alerts */}
      {cartSuccessFeedback && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
            <span>{cartSuccessFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setCartSuccessFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
          >
            &times;
          </button>
        </div>
      )}

      {cartErrorFeedback && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 shadow-xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-red-600 dark:text-red-400"
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
            <span>{cartErrorFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setCartErrorFeedback(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters & Sorting Bar */}
      <div className="mb-8">
        <ProductFilters
          filters={filters}
          availableCategories={availableCategories}
          onChange={updateFilters}
          onReset={handleResetFilters}
          totalProducts={totalCount}
        />
      </div>

      {/* Content Area */}
      {errorMessage ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mb-3 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/70 dark:text-red-400">
            <svg
              className="h-6 w-6"
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
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Failed to Load Products
          </h2>
          <p className="mt-1 max-w-md text-xs text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none"
          >
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="aspect-4/3 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="mt-4 h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
              <div className="mt-1 h-3 w-2/3 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
              <div className="mt-6 flex items-center justify-between">
                <div className="h-5 w-16 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="my-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            No products found
          </h2>
          <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            We couldn't find any items matching your selected criteria. Try adjusting your
            filters or resetting them.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdding={addingProductId === product.id}
                isAdded={recentlyAddedId === product.id}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-900 dark:text-white">{pagination.page}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show current, first, last, and immediate neighbours
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - pagination.page) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-1 text-xs text-gray-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                              pagination.page === p
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
