import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/context/useAuth.ts';
import { useCart } from '../features/cart/context/useCart.ts';

const CURRENT_YEAR = new Date().getFullYear();

export default function RootLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBounced, setCartBounced] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const prevCountRef = useRef(itemCount);

  // Monitor scroll state for glowing navbar border & back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowBackToTop(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger bounce & cart shake animation whenever itemCount increases
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setCartBounced(true);
      const timer = setTimeout(() => setCartBounced(false), 650);
      prevCountRef.current = itemCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  const handleCopyCoupon = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('WELCOME10').catch(() => {});
    }
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2200);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
      isActive
        ? 'text-white bg-indigo-600/90 shadow-[0_0_15px_rgba(99,102,241,0.4)] backdrop-blur-xs'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'text-indigo-600 bg-indigo-50 font-bold dark:text-indigo-400 dark:bg-indigo-950/60'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100 transition-colors">
      {/* 1. Shimmering Announcement Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-700 animate-sweep-8s px-4 py-2.5 text-center text-xs font-semibold text-white tracking-wide shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-soft-pulse" />
            <span>Special Offer: Use code</span>
          </span>

          {/* Copyable dashed pill */}
          <button
            type="button"
            onClick={handleCopyCoupon}
            className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/70 bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-white backdrop-blur-xs transition-all duration-200 hover:bg-white/20 hover:border-white hover:scale-105 active:scale-95"
            title="Click to copy coupon code"
          >
            <span>WELCOME10</span>
            {copiedCoupon ? (
              <span className="inline-flex items-center text-[10px] text-emerald-300 font-sans font-extrabold animate-in fade-in">
                ✓ Copied!
              </span>
            ) : (
              <svg className="h-3 w-3 text-white/80 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          <span>for 10% off your order!</span>
        </div>
      </div>

      {/* 2. Glassmorphism Sticky Navbar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-300 ${
          isScrolled
            ? 'border-b border-purple-500/30 bg-white/85 shadow-[0_4px_25px_rgba(147,51,234,0.12)] dark:bg-gray-950/85 dark:border-purple-500/25'
            : 'border-b border-gray-200/80 bg-white/90 dark:border-gray-800/80 dark:bg-gray-900/90 shadow-xs'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/products"
              className="group flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-gray-900 transition-all dark:text-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-md transition-transform duration-300 ease-out group-hover:rotate-6 group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-110 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
                MiniStore
              </span>
            </Link>

            {/* Desktop Navigation with Sliding Pill Style */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800/60">
              <NavLink to="/products" className={navLinkClass}>
                Catalogue
              </NavLink>

              {isAuthenticated && (
                <NavLink to="/orders" className={navLinkClass}>
                  My Orders
                </NavLink>
              )}

              {isAuthenticated && user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-purple-700 bg-purple-100/90 shadow-xs dark:text-purple-300 dark:bg-purple-950/80'
                        : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/60 dark:text-purple-400 dark:hover:bg-purple-950/40'
                    }`
                  }
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Admin</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Section: Cart, User Avatar & Auth Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Link with Shake & Bounce Animations */}
            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-white hover:text-purple-600 hover:shadow-[0_0_15px_rgba(147,51,234,0.25)] focus:outline-none dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:border-purple-500/50 dark:hover:bg-gray-800 dark:hover:text-purple-400"
              aria-label={
                itemCount > 0
                  ? `Shopping cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                  : 'Shopping cart'
              }
            >
              <div className="relative">
                <svg
                  className={`h-5 w-5 transition-transform duration-200 ${
                    cartBounced ? 'animate-cart-shake text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span
                    className={`absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-1 text-[10px] font-black leading-none text-white shadow-md ${
                      cartBounced ? 'animate-badge-pop ring-2 ring-purple-300' : ''
                    }`}
                    aria-hidden="true"
                    data-testid="cart-badge"
                  >
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">Cart</span>
            </Link>

            {/* Desktop Auth Controls with Initials Avatar */}
            <div className="hidden sm:flex items-center space-x-3 text-sm">
              {isLoading ? (
                <div className="h-9 w-24 animate-shimmer rounded-xl bg-gray-200 dark:bg-gray-800" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {/* User Initials Avatar */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-extrabold text-white shadow-xs">
                      {userInitials}
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                      {user.name}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                        Staff
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-gray-100 hover:text-gray-900 hover:shadow-[0_0_12px_rgba(147,51,234,0.2)] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(147,51,234,0.4)] focus:outline-none"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex md:hidden items-center justify-center rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 shadow-xl dark:border-gray-800 dark:bg-gray-900/95 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <NavLink
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <span>Product Catalogue</span>
                <span className="text-xs text-gray-400">&rarr;</span>
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <span>My Orders</span>
                  <span className="text-xs text-gray-400">&rarr;</span>
                </NavLink>
              )}

              {isAuthenticated && user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Admin Portal</span>
                  <span className="text-xs text-purple-400">&rarr;</span>
                </NavLink>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              {isLoading ? (
                <div className="h-9 w-full animate-shimmer rounded-xl bg-gray-200 dark:bg-gray-800" />
              ) : isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {userInitials}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    {user.role === 'ADMIN' && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-gray-300 py-2.5 text-center text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-gray-300 py-2.5 text-center text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-indigo-600 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating Back-to-Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95 focus:outline-none"
          aria-label="Scroll back to top"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Tidy & Well-Organized Footer */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Column 1: Brand & Value Prop */}
            <div className="space-y-4">
              <Link to="/products" className="flex items-center gap-2 text-lg font-extrabold text-gray-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span>MiniStore</span>
              </Link>
              <p className="text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                Premium everyday lifestyle and technology goods curated for modern living. Honest pricing, integer-accurate checkout, and fast fulfillment.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Verified SSL Encrypted Checkout</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                Store Navigation
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                <li>
                  <Link to="/products" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    Shopping Cart
                  </Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link to="/orders" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                      Order History
                    </Link>
                  </li>
                )}
                {isAuthenticated && user?.role === 'ADMIN' && (
                  <li>
                    <Link to="/admin/products" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
                      Admin Portal
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Trust & Assurance */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                Our Guarantee
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">&check;</span>
                  <span>100% Genuine Inventory Guarantee</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">&check;</span>
                  <span>Transactional Stock Deduction</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">&check;</span>
                  <span>Real-time Order Status Updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">&check;</span>
                  <span>Promotional Coupon Discounts</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter / Demo Coupons */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                Promotional Offers
              </h4>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Try these verified demo coupon codes during checkout:
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">WELCOME10</code>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">10% off (&ge; ₹999)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">FLAT500</code>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">₹500 off (&ge; ₹2,499)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <div>
              Mini Online Store &copy; {CURRENT_YEAR}. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>System Status: Healthy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
