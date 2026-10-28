import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext.tsx';
import ProtectedRoute from './features/auth/components/ProtectedRoute.tsx';
import RootLayout from './layouts/RootLayout.tsx';
import LoginPage from './features/auth/pages/LoginPage.tsx';
import RegisterPage from './features/auth/pages/RegisterPage.tsx';
import ProductsPage from './features/products/pages/ProductsPage.tsx';
import CartPage from './features/cart/pages/CartPage.tsx';
import CheckoutPage from './features/checkout/pages/CheckoutPage.tsx';
import OrdersPage from './features/orders/pages/OrdersPage.tsx';
import OrderDetailsPage from './features/orders/pages/OrderDetailsPage.tsx';
import AdminLayout from './features/admin/components/AdminLayout.tsx';
import AdminProductsPage from './features/admin/pages/AdminProductsPage.tsx';
import AdminOrdersPage from './features/admin/pages/AdminOrdersPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate to="/products" replace />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
