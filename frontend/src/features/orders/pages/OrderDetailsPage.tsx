import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchOrderById } from '../api/ordersApi.ts';
import { ApiError } from '../../../api/client.ts';
import type { Order, OrderStatus } from '../../../types/index.ts';

const getStatusBadgeStyle = (status: OrderStatus) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
    case 'SHIPPED':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800';
    case 'PLACED':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
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
    setStatusCode(null);

    fetchOrderById(id)
      .then((data) => {
        setOrder(data);
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-6 w-36 rounded-md animate-shimmer" />
        <div className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-20 w-full rounded-2xl animate-shimmer" />
          <div className="mt-6 space-y-4">
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-24 w-full rounded-xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !order) {
    const isNotFound = statusCode === 404;
    const isBadRequest = statusCode === 400;

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            &larr; Back to My Orders
          </Link>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400">
            <svg
              className="h-7 w-7"
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

          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNotFound
              ? 'Order Not Found'
              : isBadRequest
                ? 'Invalid Order Request'
                : 'Could Not Load Order'}
          </h2>

          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            {isNotFound
              ? 'We could not find an order matching this ID, or it may belong to another account.'
              : errorMessage}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            {!isNotFound && !isBadRequest && (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                Try Again
              </button>
            )}
            <Link
              to="/orders"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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

  const isStepPlaced = true;
  const isStepShipped = order.status === 'SHIPPED' || order.status === 'DELIVERED';
  const isStepDelivered = order.status === 'DELIVERED';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/orders"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          &larr; Back to My Orders
        </Link>
      </div>

      {/* Just placed banner */}
      {isJustPlaced && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in duration-300"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div>Order Placed Successfully!</div>
            <div className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
              Your cart has been safely cleared and your items are staged for dispatch.
            </div>
          </div>
        </div>
      )}

      {/* Order Details Card */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900 transition-colors">
        {/* Card Header */}
        <div className="border-b border-gray-100 bg-gray-50/70 p-6 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Official Receipt
              </span>
              <h2 className="mt-0.5 font-mono text-sm font-bold text-gray-900 dark:text-white">
                {order.id}
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Placed on {formattedDate}
              </p>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${getStatusBadgeStyle(
                  order.status
                )}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {order.status}
              </span>
            </div>
          </div>

          {/* Visual Order Progress Tracker */}
          <div className="mt-6 pt-6 border-t border-gray-200/60 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isStepPlaced ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <span className="mt-1.5 font-bold text-gray-800 dark:text-gray-200 text-[11px]">Placed</span>
              </div>

              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isStepShipped ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                }`}>
                  2
                </div>
                <span className={`mt-1.5 font-bold text-[11px] ${
                  isStepShipped ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'
                }`}>Shipped</span>
              </div>

              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isStepDelivered ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                }`}>
                  3
                </div>
                <span className={`mt-1.5 font-bold text-[11px] ${
                  isStepDelivered ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'
                }`}>Delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Purchased Items ({order.items.length})
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
                <div key={item.id} className="flex items-center justify-between py-4 text-xs">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.productName}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity} &times; ₹{itemUnitPrice}
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                    ₹{itemLineTotal}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-6 border-t border-gray-100 pt-5 space-y-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">
                ₹{subtotalInRupees}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>
                  Promotional Coupon{' '}
                  {order.couponCodeSnapshot && (
                    <span className="font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900">
                      {order.couponCodeSnapshot}
                    </span>
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
                <span className="font-bold">-₹{discountInRupees}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-4 text-sm font-extrabold text-gray-900 dark:border-gray-800 dark:text-white">
              <span>Final Amount Paid</span>
              <span className="text-xl text-indigo-600 dark:text-indigo-400 font-black">
                ₹{totalInRupees}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
