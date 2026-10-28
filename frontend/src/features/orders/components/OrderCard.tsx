import { Link } from 'react-router-dom';
import type { Order, OrderStatus } from '../../../types/index.ts';

export interface OrderCardProps {
  order: Order;
}

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

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const totalInRupees = (order.totalAmount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {/* Header bar of the card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 text-xs dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Order Placed: </span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">{formattedDate}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Order ID: </span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
              {order.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${getStatusBadgeStyle(
              order.status
            )}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Main card body */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
            {order.couponCodeSnapshot && (
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                Coupon: {order.couponCodeSnapshot}
              </span>
            )}
          </div>

          {/* List of item preview titles */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {order.items.slice(0, 3).map((item, idx) => (
              <span key={item.id}>
                {item.productName} (&times;{item.quantity})
                {idx < Math.min(order.items.length, 3) - 1 ? ', ' : ''}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="text-gray-400 dark:text-gray-500">
                {' '}
                and {order.items.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0 dark:border-gray-800">
          <div className="sm:text-right">
            <span className="block text-[11px] text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ₹{totalInRupees}
            </span>
          </div>

          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <span>View Details</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

