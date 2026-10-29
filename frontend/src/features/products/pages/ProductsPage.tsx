import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth.ts';
import { useCart } from '../../cart/context/useCart.ts';
import { fetchProducts } from '../api/productsApi.ts';
import { addItemToCart } from '../../cart/api/cartApi.ts';
import ProductCard from '../components/ProductCard.tsx';
import ProductFilters from '../components/ProductFilters.tsx';
import type { Product, Pagination } from '../../../types/index.ts';
import type { ProductFiltersState, ProductSortOption } from '../types.ts';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { setCartCount } = useCart();

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

  // Cart action state
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cartSuccessFeedback, setCartSuccessFeedback] = useState<string | null>(null);
  const [cartErrorFeedback, setCartErrorFeedback] = useState<string | null>(null);

  // Hero parallax & spotlight state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });

    // Parallax tilt clamped to max 3-4 degrees
    const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 7;
    const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * 7;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleHeroMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  // Read current filters from URL search params
  const currentCategory = searchParams.get('category') || undefined;
  const currentMinPrice = searchParams.get('minPrice') || undefined;
  const currentMaxPrice = searchParams.get('maxPrice') || undefined;
  const currentSort = (searchParams.get('sort') as ProductSortOption) || 'newest';
  const currentPage = Number(searchParams.get('page')) || 1;

  const filters: ProductFiltersState = useMemo(
    () => ({
      category: currentCategory,
      minPrice: currentMinPrice,
      maxPrice: currentMaxPrice,
      sort: currentSort,
      page: currentPage,
      limit: 12,
    }),
    [currentCategory, currentMinPrice, currentMaxPrice, currentSort, currentPage]
  );

  // Load products effect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function executeFetch() {
      try {
        const data = await fetchProducts(filters);
        if (isMounted) {
          setProducts(data.products || []);
          setPagination(
            data.pagination || {
              page: 1,
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
          const msg = err instanceof Error ? err.message : 'Failed to load products';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    fetchProducts(filters)
      .then((data) => {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 12,
            totalProducts: 0,
            total: 0,
            totalPages: 0,
          }
        );
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load products');
        setIsLoading(false);
      });
  };

  // Update query params in URL
  const updateFilters = (updated: Partial<ProductFiltersState>) => {
    setIsLoading(true);
    setErrorMessage(null);
    const nextParams = new URLSearchParams(searchParams);

    if (updated.category !== undefined) {
      if (updated.category) {
        nextParams.set('category', updated.category);
      } else {
        nextParams.delete('category');
      }
    }

    if (updated.minPrice !== undefined) {
      if (updated.minPrice) {
        nextParams.set('minPrice', updated.minPrice);
      } else {
        nextParams.delete('minPrice');
      }
    }

    if (updated.maxPrice !== undefined) {
      if (updated.maxPrice) {
        nextParams.set('maxPrice', updated.maxPrice);
      } else {
        nextParams.delete('maxPrice');
      }
    }

    if (updated.sort !== undefined) {
      if (updated.sort && updated.sort !== 'newest') {
        nextParams.set('sort', updated.sort);
      } else {
        nextParams.delete('sort');
      }
    }

    if (updated.page !== undefined) {
      if (updated.page > 1) {
        nextParams.set('page', String(updated.page));
      } else {
        nextParams.delete('page');
      }
    }

    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: location, message: 'Please log in to add items to your cart' },
      });
      return;
    }

    setAddingProductId(product.id);
    setCartErrorFeedback(null);
    setCartSuccessFeedback(null);

    try {
      const result = await addItemToCart(product.id, 1);
      setCartCount(result.cart.totalQuantity);
      setRecentlyAddedId(product.id);
      setCartSuccessFeedback(`"${product.name}" added to cart!`);

      setTimeout(() => {
        setRecentlyAddedId(null);
      }, 2500);

      setTimeout(() => {
        setCartSuccessFeedback(null);
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add product to cart';
      setCartErrorFeedback(msg);
      setTimeout(() => {
        setCartErrorFeedback(null);
      }, 5000);
    } finally {
      setAddingProductId(null);
    }
  };

  // Derive all unique categories from products
  const availableCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  const totalCount = pagination.totalProducts ?? pagination.total ?? products.length;

  const MARQUEE_ITEMS = [
    '⚡ Lightning Delivery',
    '🎧 Premium Electronics',
    '🏠 Artisanal Homeware',
    '🏷️ Instant Coupons',
    '✨ Verified Quality',
    '🛡️ 100% Secure Checkout',
    '👜 Luxury Accessories',
    '🔄 Easy 30-Day Returns',
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero / Promotional Banner */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white shadow-2xl border border-indigo-500/20"
      >
        {/* Dynamic Spotlight Glow following cursor */}
        <div
          style={{
            background: `radial-gradient(circle 380px at ${mousePos.x}% ${mousePos.y}%, rgba(168, 85, 247, 0.25), transparent 75%)`,
          }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        />

        {/* Aurora Drifting Glowing Blobs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl animate-drift-1" />
        <div className="pointer-events-none absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl animate-drift-2" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-purple-600/30 blur-3xl animate-drift-3" />

        {/* Faint Dot Grid Pattern fading out to edges */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

        {/* 2-Column Hero Grid: Left Content, Right 3D Showcase */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 lg:px-14 items-center">
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Sparkle badge with animated glowing border */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-md shadow-lg animate-border-glow mb-5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-soft-pulse" />
              <span className="text-white">Curated Autumn &bull; Winter Collection</span>
              <span className="text-amber-300">✨</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
              Elevate Your Everyday{' '}
              <span className="inline-block bg-gradient-to-r from-indigo-300 via-pink-400 to-purple-300 bg-clip-text text-transparent animate-gradient-x">
                Lifestyle.
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-xl">
              Explore authentic electronics, artisanal homeware, and everyday accessories. Enjoy integer-accurate pricing, instant coupon discounts, and lightning-fast fulfillment.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {/* Primary Explore button with hover lift, shine sweep & bouncing chevron */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('catalogue-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-950 shadow-lg transition-all duration-300 hover:bg-indigo-50 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-95"
              >
                <span className="relative z-10">Explore Catalogue</span>
                <svg className="relative z-10 h-4 w-4 animate-bounce-subtle text-indigo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              </button>

              {/* Secondary Ghost Button */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('catalogue-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 backdrop-blur-xs px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/15 hover:border-white/40 hover:scale-105 active:scale-95"
              >
                <span>View Deals</span>
                <span className="text-amber-300">🏷️</span>
              </button>

              {/* Verified in-stock guarantee with animated green checkmark */}
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200 ml-1">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Verified 100% In-Stock Guarantee</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 w-full max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">10K+</div>
                <div className="text-xs text-indigo-200/80 font-medium">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">500+</div>
                <div className="text-xs text-indigo-200/80 font-medium">Curated Products</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">24h</div>
                <div className="text-xs text-indigo-200/80 font-medium">Fast Delivery</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating Showcase */}
          <div className="lg:col-span-5 hidden lg:flex relative items-center justify-center min-h-[460px]">
            {/* Parallax Tilt Wrapper */}
            <div
              style={{
                transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Soft purple glow behind cards */}
              <div className="absolute h-64 w-64 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />

              {/* Floating Glass Chips */}
              <div className="absolute top-2 left-2 z-40 animate-float-chip rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md">
                ⚡ Fast Delivery
              </div>
              <div
                style={{ animationDelay: '1.2s' }}
                className="absolute top-6 -right-2 z-40 animate-float-chip rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-xl backdrop-blur-md"
              >
                🏷️ 10% OFF
              </div>
              <div
                style={{ animationDelay: '2.4s' }}
                className="absolute -bottom-2 right-8 z-40 animate-float-chip rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-md"
              >
                ★ 4.9 Rated
              </div>

              {/* Card 1: Wireless Headphones (Center elevated) */}
              <div className="relative z-20 w-64 rounded-2xl border border-white/20 bg-gray-950/85 p-3.5 shadow-2xl backdrop-blur-xl animate-float-1 transition-all duration-300 hover:scale-105">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-gray-900">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
                    alt="Wireless NC Headphones"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 right-2 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    In Stock
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300">Audio</span>
                    <span className="text-amber-400 font-bold">★ 4.9</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-white truncate">
                    Wireless NC Headphones
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-white">₹14,999</span>
                    <span className="text-[10px] text-gray-400">Free Shipping</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Smart Watch (Offset Right) */}
              <div className="absolute -right-4 top-20 z-30 w-52 rounded-2xl border border-white/20 bg-gray-950/90 p-3 shadow-2xl backdrop-blur-xl animate-float-2 transition-all duration-300 hover:scale-105">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-gray-900">
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
                    alt="Smart Fitness Watch"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-pink-300">Wearable</div>
                  <div className="text-xs font-bold text-white truncate">Smart Fitness Watch</div>
                  <div className="mt-1 text-sm font-extrabold text-white">₹8,499</div>
                </div>
              </div>

              {/* Card 3: Leather Backpack (Offset Left) */}
              <div className="absolute -left-6 bottom-6 z-10 w-52 rounded-2xl border border-white/15 bg-gray-950/80 p-3 shadow-2xl backdrop-blur-xl animate-float-3 transition-all duration-300 hover:scale-105">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-gray-900">
                  <img
                    src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
                    alt="Leather Backpack"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-purple-300">Accessories</div>
                  <div className="text-xs font-bold text-white truncate">Leather Backpack</div>
                  <div className="mt-1 text-sm font-extrabold text-white">₹4,999</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Mouse Indicator */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('catalogue-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          aria-label="Scroll down to catalogue"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors cursor-pointer group pb-1"
        >
          <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-200/70">Scroll</span>
          <div className="w-4 h-7 rounded-full border-2 border-white/30 flex items-start justify-center p-0.5 group-hover:border-white/80 transition-colors">
            <div className="w-1 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </button>
      </section>

      {/* Infinite Auto-Scrolling Marquee */}
      <div className="relative mb-10 overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" />

        <div className="animate-marquee flex gap-6 text-xs sm:text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 shadow-xs backdrop-blur-xs transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
            >
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Feedback Toasts */}
      {cartSuccessFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-900 dark:bg-gray-900 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Item Added to Cart</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{cartSuccessFeedback}</div>
          </div>
          <button
            type="button"
            onClick={() => setCartSuccessFeedback(null)}
            className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      )}

      {cartErrorFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-2xl dark:border-red-900 dark:bg-gray-900 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Notice</div>
            <div className="text-xs text-red-600 dark:text-red-400">{cartErrorFeedback}</div>
          </div>
          <button
            type="button"
            onClick={() => setCartErrorFeedback(null)}
            className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Catalogue Anchor Section */}
      <div id="catalogue-section" className="mb-6 scroll-mt-24">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="relative inline-block">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                Catalogue Items
              </h2>
              <div className="mt-1 h-1 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            </div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Filtered items with real-time stock and instant checkout readiness.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="mb-8">
        <ProductFilters
          filters={filters}
          availableCategories={availableCategories}
          onChange={updateFilters}
          onReset={handleResetFilters}
          totalProducts={totalCount}
        />
      </div>

      {/* Content Area */}
      {errorMessage ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mb-3.5 rounded-2xl bg-red-100 p-3.5 text-red-600 shadow-xs dark:bg-red-950/70 dark:text-red-400">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Failed to Load Products
          </h2>
          <p className="mt-1.5 max-w-md text-xs text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        /* Shimmer Skeleton Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="aspect-4/3 w-full rounded-xl animate-shimmer" />
              <div className="mt-4 h-4 w-3/4 rounded-md animate-shimmer" />
              <div className="mt-2.5 h-3 w-full rounded-md animate-shimmer" />
              <div className="mt-1.5 h-3 w-2/3 rounded-md animate-shimmer" />
              <div className="mt-6 flex items-center justify-between pt-2">
                <div className="h-6 w-20 rounded-md animate-shimmer" />
                <div className="h-10 w-28 rounded-xl animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="my-16 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg
              className="h-8 w-8 stroke-[1.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            No products found
          </h2>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            We couldn't find any items matching your selected criteria. Try adjusting or clearing your active filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdding={addingProductId === product.id}
                isAdded={recentlyAddedId === product.id}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200/80 pt-8 sm:flex-row dark:border-gray-800">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Page <span className="font-bold text-gray-900 dark:text-white">{pagination.page}</span> of{' '}
                <span className="font-bold text-gray-900 dark:text-white">{pagination.totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="min-h-[38px] rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  &larr; Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - pagination.page) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-1 text-xs text-gray-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`min-h-[38px] min-w-9 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                              pagination.page === p
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="min-h-[38px] rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
