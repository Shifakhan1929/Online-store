import { useState, useEffect } from 'react';
import { fetchAdminOrdersApi } from '../api/adminApi.ts';
import AdminOrderDetailModal from '../components/AdminOrderDetailModal.tsx';
import type { Order, Pagination, OrderStatus } from '../../../types/index.ts';

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    totalOrders: 0,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState<number>(1);

  // Load orders effect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function executeLoad() {
      try {
        const result = await fetchAdminOrdersApi({ page, limit: 12 });
        if (isMounted) {
          setOrders(result.orders);
          setPagination(result.pagination);
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve admin orders');
          setIsLoading(false);
        }
      }
    }

    executeLoad();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const refreshOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchAdminOrdersApi({ page, limit: 12 });
      setOrders(result.orders);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve admin orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setSelectedOrder(updatedOrder);
    setFeedbackMessage(
      `Order ${updatedOrder.id.slice(0, 8)} status successfully transitioned to ${updatedOrder.status}.`
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Customer Orders Management
        </h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Review customer purchases, inspect items, and advance fulfillment statuses.
        </p>
      </div>

      {/* Global Alerts */}
      {feedbackMessage && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 shadow-xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={refreshOrders}
            className="rounded bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="my-12 rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No customer orders placed yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => {
                  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  const totalInRupees = (order.totalAmount / 100).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white block">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formattedDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-900 dark:text-white block">
                          {order.user?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {order.user?.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getStatusBadgeStyle(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                        ₹{totalInRupees}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Manage Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 p-4 text-xs dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} (Total {pagination.totalOrders || pagination.total} orders)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail & Transition Modal */}
      <AdminOrderDetailModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
