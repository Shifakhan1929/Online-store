import { useState } from 'react';
import { updateAdminOrderStatusApi } from '../api/adminApi.ts';
import type { Order, OrderStatus } from '../../../types/index.ts';

export interface AdminOrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
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

export default function AdminOrderDetailModal({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}: AdminOrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'PLACED') return 'SHIPPED';
    if (current === 'SHIPPED') return 'DELIVERED';
    return null;
  };

  const nextStatus = getNextStatus(order.status);

  const handleUpdateStatus = async () => {
    if (!nextStatus || isUpdating) return;

    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateAdminOrderStatusApi(order.id, nextStatus);
      onOrderUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Order ID</span>
            <h3 className="font-mono text-sm font-bold text-gray-900 dark:text-white">
              {order.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Customer & Status Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-xs dark:border-gray-800 dark:bg-gray-800/40">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Customer</span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">
              {order.user?.name || 'Customer'}
            </span>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400">
              {order.user?.email}
            </span>
          </div>

          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Date Placed</span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {formattedDate}
            </span>
          </div>

          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Current Status</span>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadgeStyle(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Status Transition Control */}
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                Order Status Workflow
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Permitted progression: <span className="font-mono">PLACED &rarr; SHIPPED &rarr; DELIVERED</span>
              </p>
            </div>

            {nextStatus ? (
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <span>Updating...</span>
                ) : (
                  <span>Advance to {nextStatus} &rarr;</span>
                )}
              </button>
            ) : (
              <span className="rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Delivered (Final state)
              </span>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Order Items ({order.items.length})
          </h4>

          <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto pr-1">
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
                <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.productName}
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                      Qty: {item.quantity} &times; ₹{itemUnitPrice}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{itemLineTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              ₹{subtotalInRupees}
            </span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>
                Discount {order.couponCodeSnapshot ? `(${order.couponCodeSnapshot})` : ''}
              </span>
              <span className="font-semibold">-₹{discountInRupees}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-900 dark:border-gray-800 dark:text-white">
            <span>Total Paid</span>
            <span className="text-base text-indigo-600 dark:text-indigo-400">
              ₹{totalInRupees}
            </span>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

