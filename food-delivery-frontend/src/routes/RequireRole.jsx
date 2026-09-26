/**
 * RequireRole.jsx
 *
 * Role-based route guard.  Use AFTER RequireAuth — assumes user is already
 * authenticated (token exists).
 *
 * Behaviour:
 *   - If the authenticated user's role is NOT in the allowedRoles list,
 *     renders a 403 Forbidden page (does NOT redirect — 403 ≠ 401).
 *   - ADMIN is permitted wherever DELIVERY_PARTNER is permitted by default,
 *     because the backend also grants /api/delivery/** to ADMIN.
 *
 * Usage:
 *   <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
 *     <Route path="dashboard" element={<AdminDashboard />} />
 *   </Route>
 */

import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_PORTAL = {
  USER: { path: '/customer', label: 'Customer Portal (Food & Orders)' },
  DELIVERY_PARTNER: { path: '/delivery', label: 'Delivery Partner Portal' },
  RESTAURANT_OWNER: { path: '/restaurant', label: 'Restaurant Owner Portal' },
  ADMIN: { path: '/admin', label: 'Admin Dashboard' },
};

export default function RequireRole({ allowedRoles = [] }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) {
    // No user — RequireAuth should have caught this, but guard defensively
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const portal = ROLE_PORTAL[user.role] || { path: '/customer', label: 'Home' };

    const handleSwitchAccount = () => {
      logout();
      navigate('/login');
    };

    // Authenticated but wrong role — show friendly recovery message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100 max-w-md w-full">
          <div className="text-5xl mb-4">🍽️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Wrong Portal</h1>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            You are logged in as a normal <span className="font-bold text-orange-600">{user.role}</span>. This page is reserved for restaurant kitchen owners or administrators.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 block mb-1">
              Your Account
            </span>
            <p className="text-sm font-semibold text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Role: {user.role}</p>
          </div>

          <div className="space-y-3">
            <Link
              to={portal.path}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition"
            >
              <span>Go to {portal.label}</span>
            </Link>

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
            >
              Switch Account / Sign In with Another Role
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
