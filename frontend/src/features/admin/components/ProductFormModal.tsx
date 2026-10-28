import { useState, type FormEvent } from 'react';
import type { Product } from '../../../types/index.ts';
import type { CreateProductInputData, UpdateProductInputData } from '../types.ts';

export interface ProductFormModalProps {
  product?: Product | null; // if provided, we are editing; otherwise adding
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductInputData | UpdateProductInputData) => Promise<void>;
}

export default function ProductFormModal({
  product,
  isOpen,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  // Existing price is in paise, convert to rupees for display and edit
  const [price, setPrice] = useState(
    product ? String(product.price / 100) : ''
  );
  const [stockQuantity, setStockQuantity] = useState(
    product ? String(product.stockQuantity) : '0'
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [description, setDescription] = useState(product?.description || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (name.trim().length > 200) {
      newErrors.name = 'Name cannot exceed 200 characters';
    }

    if (!category.trim()) {
      newErrors.category = 'Category is required';
    } else if (category.trim().length > 100) {
      newErrors.category = 'Category cannot exceed 100 characters';
    }

    const priceNum = Number(price);
    if (price === '' || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Valid non-negative price in rupees is required';
    }

    const stockNum = Number(stockQuantity);
    if (stockQuantity === '' || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      newErrors.stockQuantity = 'Stock must be a non-negative integer';
    }

    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        newErrors.imageUrl = 'Image URL must be a valid URL';
      }
    }

    if (description.trim().length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
      };

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
          >
            &times;
          </button>
        </div>

        {apiError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Mechanical Gaming Keyboard"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Category *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Electronics, Accessories, Home & Kitchen"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {errors.category && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>

          {/* Price (Rupees) & Stock Quantity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Price in Rupees (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. 1999.00"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              {errors.price && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Stock Quantity *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. 25"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                  {errors.stockQuantity}
                </p>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isSubmitting}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.imageUrl}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Product features, specifications, and details..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {errors.description && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

