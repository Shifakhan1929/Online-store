import { useState, type FormEvent } from 'react';

export interface CouponSectionProps {
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  error?: string | null;
  isDisabled?: boolean;
}

const AVAILABLE_SUGGESTIONS = ['WELCOME10', 'FLAT500', 'MEGA20'];

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
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Promotional Coupon
        </h4>
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          Instant Savings
        </span>
      </div>

      {appliedCoupon ? (
        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <svg
                className="h-4 w-4"
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
            </div>
            <div>
              <span className="font-mono text-xs font-black tracking-wide text-indigo-900 dark:text-indigo-200">
                {appliedCoupon}
              </span>
              <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                Coupon applied & ready for checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveCoupon}
            disabled={isDisabled}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-3.5">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (localValidationMsg) setLocalValidationMsg(null);
                }}
                disabled={isDisabled}
                placeholder="Enter code (e.g. WELCOME10)"
                className="w-full min-h-[42px] rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-mono uppercase text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={isDisabled || !inputCode.trim()}
                className="min-h-[42px] shrink-0 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Quick-tap coupon code chips */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-1">Try:</span>
            {AVAILABLE_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setInputCode(sug)}
                className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-[11px] font-semibold text-gray-700 transition hover:bg-indigo-100 hover:text-indigo-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {displayedError && (
        <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {displayedError}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
        Discounts and minimum purchase requirements are calculated authoritatively by the server.
      </p>
    </div>
  );
}
