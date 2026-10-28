import { useState, type FormEvent } from 'react';

export interface CouponSectionProps {
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  error?: string | null;
  isDisabled?: boolean;
}

export default function CouponSection({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  error,
  isDisabled = false,
}: CouponSectionProps) {
  const [inputCode, setInputCode] = useState('');
  const [localValidationMsg, setLocalValidationMsg] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalValidationMsg(null);

    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      setLocalValidationMsg('Please enter a coupon code.');
      return;
    }

    onApplyCoupon(trimmed);
    setInputCode('');
  };

  const displayedError = error || localValidationMsg;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
        Have a Coupon Code?
      </h4>

      {appliedCoupon ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <div>
              <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300">
                {appliedCoupon}
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Staged for checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveCoupon}
            disabled={isDisabled}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                if (localValidationMsg) setLocalValidationMsg(null);
              }}
              disabled={isDisabled}
              placeholder="e.g. WELCOME10"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono uppercase text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={isDisabled || !inputCode.trim()}
              className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Apply
            </button>
          </div>
        </form>
      )}

      {displayedError && (
        <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {displayedError}
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
        Discounts and minimum order values are verified and calculated authoritatively by the server.
      </p>
    </div>
  );
}

