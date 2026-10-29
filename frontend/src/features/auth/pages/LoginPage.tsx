import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.ts';
import { ApiError } from '../../../api/client.ts';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const destination =
      (location.state as { from?: { pathname: string } })?.from?.pathname || '/products';
    return <Navigate to={destination} replace />;
  }

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });

      // After successful login, navigate to product catalogue or previous attempted route
      const destination =
        (location.state as { from?: { pathname: string } })?.from?.pathname || '/products';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Login failed. Please check your credentials.');
        if (err.errors) {
          const fieldErrors: { email?: string; password?: string } = {};
          err.errors.forEach((fe) => {
            if (fe.field === 'email') fieldErrors.email = fe.message;
            if (fe.field === 'password') fieldErrors.password = fe.message;
          });
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      } else {
        setErrorMessage('An unexpected network error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-200/90 bg-white p-8 sm:p-10 shadow-xl dark:border-gray-800 dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Sign in to access your orders and saved cart items
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          >
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 shadow-xs transition focus:outline-none dark:text-gray-100 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 shadow-xs transition focus:outline-none dark:text-gray-100 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full min-h-[48px] items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing In...</span>
                </span>
              ) : (
                'Sign In to Account'
              )}
            </button>
          </div>

          <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Create one now &rarr;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
