import { Link } from 'react-router-dom';
import type { Order, OrderStatus } from '../../../types/index.ts';

export interface OrderCardProps {
  order: Order;
}

const getStatusBadgeStyle = (status: OrderStatus) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'SHIPPED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'PLACED':
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
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
    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      {/* Header bar of the card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 text-xs dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="text-gray-400 dark:text-gray-500 font-medium">Order Date: </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{formattedDate}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500 font-medium">ID: </span>
            <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-300">
              {order.id.slice(0, 13)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getStatusBadgeStyle(
              order.status
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {order.status}
          </span>
        </div>
      </div>

      {/* Main card body */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
            {order.couponCodeSnapshot && (
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/40">
                Coupon: {order.couponCodeSnapshot}
              </span>
            )}
          </div>

          {/* List of item preview titles */}
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {order.items.slice(0, 3).map((item, idx) => (
              <span key={item.id}>
                <span className="font-medium text-gray-700 dark:text-gray-300">{item.productName}</span> (&times;{item.quantity})
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
            <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total
            </span>
            <span className="text-base font-extrabold text-gray-900 dark:text-white">
              ₹{totalInRupees}
            </span>
          </div>

          <Link
            to={`/orders/${order.id}`}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span>Receipt Details</span>
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
