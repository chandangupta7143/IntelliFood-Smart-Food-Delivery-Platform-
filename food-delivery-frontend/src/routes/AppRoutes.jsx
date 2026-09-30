/**
 * AppRoutes.jsx
 *
 * Central routing configuration for the Food Delivery Platform.
 *
 * Customer Routes:
 *   /customer                             → CustomerHomePage
 *   /customer/restaurants                 → RestaurantListPage
 *   /customer/restaurants/:restaurantId   → RestaurantDetailsPage
 *   /customer/search                      → SearchPage
 *   /customer/cart                        → CartPage
 *   /customer/checkout                    → CheckoutPage
 *   /customer/orders                      → OrdersPage
 *   /customer/orders/:orderId             → OrderDetailsPage
 *   /customer/orders/:orderId/tracking    → OrderTrackingPage
 *   /customer/notifications               → NotificationsPage
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import RequireAuth from './RequireAuth';
import RequireRole from './RequireRole';
import RootRedirect from './RootRedirect';

// ── Auth pages ────────────────────────────────────────────────────────────
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import RestaurantRegisterPage from '../pages/auth/RestaurantRegisterPage';
import DeliveryRegisterPage from '../pages/auth/DeliveryRegisterPage';

// ── Customer Portal pages ────────────────────────────────────────────────
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import RestaurantListPage from '../pages/customer/RestaurantListPage';
import RestaurantDetailsPage from '../pages/customer/RestaurantDetailsPage';
import SearchPage from '../pages/customer/SearchPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import OrdersPage from '../pages/customer/OrdersPage';
import OrderDetailsPage from '../pages/customer/OrderDetailsPage';
import OrderTrackingPage from '../pages/customer/OrderTrackingPage';
import NotificationsPage from '../pages/customer/NotificationsPage';

// ── Restaurant Owner Portal pages ────────────────────────────────────────
import RestaurantDashboardPage from '../pages/restaurant/RestaurantDashboardPage';
import RestaurantOrdersPage from '../pages/restaurant/RestaurantOrdersPage';
import RestaurantMenuPage from '../pages/restaurant/RestaurantMenuPage';
import RestaurantProfilePage from '../pages/restaurant/RestaurantProfilePage';
import RestaurantNotificationsPage from '../pages/restaurant/RestaurantNotificationsPage';

// ── Delivery Partner Portal pages ─────────────────────────────────────────
import DeliveryDashboardPage from '../pages/delivery/DeliveryDashboardPage';
import ActiveDeliveryPage from '../pages/delivery/ActiveDeliveryPage';
import DeliveryHistoryPage from '../pages/delivery/DeliveryHistoryPage';
import DeliveryNotificationsPage from '../pages/delivery/DeliveryNotificationsPage';

// ── Admin Portal pages ───────────────────────────────────────────────────
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminRestaurantsPage from '../pages/admin/AdminRestaurantsPage';
import AdminDeliveryPage from '../pages/admin/AdminDeliveryPage';
import AdminFraudPage from '../pages/admin/AdminFraudPage';
import AdminPricingPage from '../pages/admin/AdminPricingPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminSystemPage from '../pages/admin/AdminSystemPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/restaurant-owner" element={<RestaurantRegisterPage />} />
      <Route path="/register/delivery-partner" element={<DeliveryRegisterPage />} />

      {/* ── Customer portal (ROLE_USER only) ──────────────────────────── */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['USER']} />}>
          <Route path="/customer" element={<CustomerHomePage />} />
          <Route path="/customer/restaurants" element={<RestaurantListPage />} />
          <Route path="/customer/restaurants/:restaurantId" element={<RestaurantDetailsPage />} />
          <Route path="/customer/search" element={<SearchPage />} />
          <Route path="/customer/cart" element={<CartPage />} />
          <Route path="/customer/checkout" element={<CheckoutPage />} />
          <Route path="/customer/orders" element={<OrdersPage />} />
          <Route path="/customer/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/customer/orders/:orderId/tracking" element={<OrderTrackingPage />} />
          <Route path="/customer/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* ── Restaurant Owner portal (RESTAURANT_OWNER + ADMIN) ────────── */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['RESTAURANT_OWNER', 'ADMIN']} />}>
          <Route path="/restaurant" element={<RestaurantDashboardPage />} />
          <Route path="/restaurant/orders" element={<RestaurantOrdersPage />} />
          <Route path="/restaurant/menu" element={<RestaurantMenuPage />} />
          <Route path="/restaurant/profile" element={<RestaurantProfilePage />} />
          <Route path="/restaurant/notifications" element={<RestaurantNotificationsPage />} />
        </Route>
      </Route>

      {/* ── Delivery partner portal (DELIVERY_PARTNER + ADMIN) ────────── */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['DELIVERY_PARTNER', 'ADMIN']} />}>
          <Route path="/delivery" element={<DeliveryDashboardPage />} />
          <Route path="/delivery/active" element={<ActiveDeliveryPage />} />
          <Route path="/delivery/history" element={<DeliveryHistoryPage />} />
          <Route path="/delivery/notifications" element={<DeliveryNotificationsPage />} />
        </Route>
      </Route>

      {/* ── Admin portal (ADMIN only) ──────────────────────────────────── */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
          <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
          <Route path="/admin/fraud" element={<AdminFraudPage />} />
          <Route path="/admin/pricing" element={<AdminPricingPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/system" element={<AdminSystemPage />} />
        </Route>
      </Route>

      {/* ── Catch-all: redirect unknown paths to root ──────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
