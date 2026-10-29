import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/ordersApi.ts';
import OrderCard from '../components/OrderCard.tsx';
import type { Order } from '../../../types/index.ts';

const ORDERS_PER_PAGE = 8;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const data = await fetchOrders();
        if (isMounted) {
          setOrders(data);
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve your order history';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);

    fetchOrders()
      .then((data) => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve your order history');
        setIsLoading(false);
      });
  };

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Customer Order History
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Track fulfillment, review purchases, and inspect itemized receipts.
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          &larr; Browse Catalogue
        </Link>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl border border-gray-200/80 bg-white p-5 animate-shimmer dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mb-3.5 rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/70 dark:text-red-400">
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Unable to Load Orders
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg
              className="h-8 w-8 stroke-[1.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            No orders placed yet
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            When you purchase items from our store, your order history and receipt details will appear here.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-900 dark:text-gray-100">{orders.length}</span>{' '}
            {orders.length === 1 ? 'completed order' : 'completed orders'}
          </div>

          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination controls if more than 1 page */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-gray-200/80 pt-6 text-xs dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="min-h-[38px] rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  &larr; Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="min-h-[38px] rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
