import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchOrderById } from '../api/ordersApi.ts';
import { ApiError } from '../../../api/client.ts';
import type { Order, OrderStatus } from '../../../types/index.ts';

const getStatusBadgeStyle = (status: OrderStatus) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
    case 'SHIPPED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
    case 'PLACED':
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300';
  }
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const isJustPlaced = Boolean((location.state as { justPlaced?: boolean })?.justPlaced);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!id) {
        if (isMounted) {
          setErrorMessage('Order ID is missing');
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await fetchOrderById(id);
        if (isMounted) {
          setOrder(data);
          setErrorMessage(null);
          setStatusCode(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setStatusCode(err.statusCode);
            setErrorMessage(err.message || 'Order could not be loaded');
          } else {
            setErrorMessage('Failed to connect to the server');
          }
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRetry = () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    fetchOrderById(id)
      .then((data) => {
        setOrder(data);
        setStatusCode(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setStatusCode(err.statusCode);
          setErrorMessage(err.message || 'Order could not be loaded');
        } else {
          setErrorMessage('Failed to connect to the server');
        }
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900" />
      </div>
    );
  }

  if (errorMessage || !order) {
    const isNotFound = statusCode === 404;
    const isBadRequest = statusCode === 400;

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
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

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isNotFound
              ? 'Order Not Found'
              : isBadRequest
              ? 'Invalid Order Identifier'
              : 'Error Loading Order'}
          </h2>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isNotFound
              ? 'This order does not exist or you do not have permission to view it.'
              : isBadRequest
              ? 'The requested order ID format is invalid.'
              : errorMessage}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            {!isNotFound && !isBadRequest && (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Try Again
              </button>
            )}
            <Link
              to="/orders"
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              &larr; Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotalInRupees = (order.subtotal / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const discountInRupees = (order.discountAmount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalInRupees = (order.totalAmount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/orders"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          &larr; Back to My Orders
        </Link>
      </div>

      {/* Just placed banner */}
      {isJustPlaced && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <svg
            className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Order placed successfully! Below is your official receipt.</span>
        </div>
      )}

      {/* Order Details Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        {/* Card Header */}
        <div className="border-b border-gray-200 bg-gray-50/60 p-6 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Order ID</span>
              <h2 className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {order.id}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Placed on {formattedDate}
              </p>
            </div>

            <div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${getStatusBadgeStyle(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Order Items ({order.items.length})
          </h3>

          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {order.items.map((item) => {
              const itemUnitPrice = (item.unitPrice / 100).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const itemLineTotal = (item.lineTotal / 100).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              return (
                <div key={item.id} className="flex items-center justify-between py-3.5 text-xs">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.productName}
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity} &times; ₹{itemUnitPrice}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{itemLineTotal}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-gray-200">
                ₹{subtotalInRupees}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>
                  Coupon Discount{' '}
                  {order.couponCodeSnapshot && (
                    <span className="font-mono font-semibold">({order.couponCodeSnapshot})</span>
                  )}
                  {order.discountTypeSnapshot && (
                    <span className="text-[11px] text-gray-400">
                      {' '}
                      [{order.discountTypeSnapshot === 'PERCENTAGE'
                        ? `${order.discountValueSnapshot}% off`
                        : `Flat ₹${((order.discountValueSnapshot || 0) / 100).toFixed(2)} off`}]
                    </span>
                  )}
                </span>
                <span className="font-semibold">-₹{discountInRupees}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900 dark:border-gray-800 dark:text-white">
              <span>Final Total Paid</span>
              <span className="text-base text-indigo-600 dark:text-indigo-400">
                ₹{totalInRupees}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

