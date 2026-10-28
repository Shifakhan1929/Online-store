import { useState, useEffect } from 'react';
import { fetchProducts } from '../../products/api/productsApi.ts';
import {
  createAdminProductApi,
  updateAdminProductApi,
  deleteAdminProductApi,
} from '../api/adminApi.ts';
import ProductFormModal from '../components/ProductFormModal.tsx';
import DeleteProductModal from '../components/DeleteProductModal.tsx';
import type { Product, Pagination } from '../../../types/index.ts';
import type { CreateProductInputData, UpdateProductInputData } from '../types.ts';

export default function AdminProductsPage() {
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [page, setPage] = useState(1);

  // Load products effect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function executeLoad() {
      try {
        const data = await fetchProducts({ page, limit: 12 });
        if (isMounted) {
          setProducts(data.products || []);
          setPagination(
            data.pagination || {
              page,
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
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load products');
          setIsLoading(false);
        }
      }
    }

    executeLoad();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const refreshProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchProducts({ page, limit: 12 });
      setProducts(data.products || []);
      setPagination(
        data.pagination || {
          page,
          limit: 12,
          totalProducts: 0,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (
    data: CreateProductInputData | UpdateProductInputData
  ) => {
    if (editingProduct) {
      const updated = await updateAdminProductApi(editingProduct.id, data);
      setFeedbackMessage(`Product "${updated.name}" updated successfully.`);
    } else {
      const created = await createAdminProductApi(data as CreateProductInputData);
      setFeedbackMessage(`Product "${created.name}" created successfully.`);
    }

    // Refresh list
    await refreshProducts();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDelete = async (productId: string) => {
    await deleteAdminProductApi(productId);
    setFeedbackMessage('Product removed successfully from catalogue.');
    await refreshProducts();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div>
      {/* Action Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Product Catalogue Management
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Create, update pricing and stock, and manage products in the store.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Product</span>
        </button>
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
            onClick={refreshProducts}
            className="rounded bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Product Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="my-12 rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No products found in the catalogue.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((product) => {
                  const priceInRupees = (product.price / 100).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400 text-[10px]">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block max-w-xs truncate">
                              {product.name}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400">
                              {product.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        ₹{priceInRupees}
                      </td>
                      <td className="py-3.5 px-4">
                        {product.stockQuantity === 0 ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                            Out of stock
                          </span>
                        ) : product.stockQuantity <= 5 ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {product.stockQuantity} left
                          </span>
                        ) : (
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {product.stockQuantity} units
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsFormOpen(true);
                            }}
                            className="rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
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
                Page {pagination.page} of {pagination.totalPages}
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

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleCreateOrUpdate}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteProductModal
        isOpen={Boolean(deletingProduct)}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}
