import React, { useState } from 'react';
import type { ProductFiltersState, ProductSortOption } from '../types.ts';

export interface ProductFiltersProps {
  filters: ProductFiltersState;
  availableCategories?: string[];
  onChange: (updated: Partial<ProductFiltersState>) => void;
  onReset: () => void;
  totalProducts?: number;
}

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Accessories',
  'Home & Kitchen',
  'Fitness & Lifestyle',
];

export default function ProductFilters({
  filters,
  availableCategories = [],
  onChange,
  onReset,
  totalProducts,
}: ProductFiltersProps) {
  // Local state for price inputs so the user can type freely without firing on every keystroke
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || '');
  const [priceError, setPriceError] = useState<string | null>(null);

  // Synchronize local input state during render when external filter props change (e.g. on reset)
  const [prevMin, setPrevMin] = useState(filters.minPrice);
  const [prevMax, setPrevMax] = useState(filters.maxPrice);
  if (filters.minPrice !== prevMin || filters.maxPrice !== prevMax) {
    setPrevMin(filters.minPrice);
    setPrevMax(filters.maxPrice);
    setMinPriceInput(filters.minPrice || '');
    setMaxPriceInput(filters.maxPrice || '');
  }

  // Combine default categories with any discovered in products
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...availableCategories])
  ).filter(Boolean);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceError(null);

    const minNum = minPriceInput ? Number(minPriceInput) : undefined;
    const maxNum = maxPriceInput ? Number(maxPriceInput) : undefined;

    if (minNum !== undefined && (isNaN(minNum) || minNum < 0)) {
      setPriceError('Min price must be a non-negative number');
      return;
    }

    if (maxNum !== undefined && (isNaN(maxNum) || maxNum < 0)) {
      setPriceError('Max price must be a non-negative number');
      return;
    }

    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      setPriceError('Min price cannot be greater than Max price');
      return;
    }

    onChange({
      minPrice: minPriceInput ? String(minPriceInput) : undefined,
      maxPrice: maxPriceInput ? String(maxPriceInput) : undefined,
      page: 1, // reset page on filter change
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      category: value === '' ? undefined : value,
      page: 1,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ProductSortOption;
    onChange({
      sort: value,
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      (filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Category & Sort controls */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
          {/* Category Dropdown */}
          <div className="flex flex-col gap-1 sm:w-48">
            <label
              htmlFor="filter-category"
              className="text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={filters.category || ''}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex flex-col gap-1 sm:w-48">
            <label
              htmlFor="filter-sort"
              className="text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              Sort By
            </label>
            <select
              id="filter-sort"
              value={filters.sort || 'newest'}
              onChange={handleSortChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Right side: Price Range Filter & Actions */}
        <form
          onSubmit={handleApplyPrice}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 w-24">
              <label
                htmlFor="filter-min-price"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Min (₹)
              </label>
              <input
                id="filter-min-price"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <span className="self-end pb-2 text-gray-400 dark:text-gray-500">-</span>

            <div className="flex flex-col gap-1 w-24">
              <label
                htmlFor="filter-max-price"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Max (₹)
              </label>
              <input
                id="filter-max-price"
                type="number"
                min="0"
                step="any"
                placeholder="₹"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              className="mt-auto rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Apply
            </button>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reset Filters
            </button>
          )}
        </form>
      </div>

      {priceError && (
        <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {priceError}
        </div>
      )}

      {/* Item count readout */}
      {totalProducts !== undefined && (
        <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-gray-200">{totalProducts}</span>{' '}
          {totalProducts === 1 ? 'product' : 'products'}
        </div>
      )}
    </div>
  );
}
