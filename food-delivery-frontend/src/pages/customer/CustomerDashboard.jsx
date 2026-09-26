/**
 * CustomerDashboard.jsx — Foundation placeholder
 *
 * This is the root of the Customer portal.
 * Full UI (restaurant discovery, cart, checkout, tracking, etc.)
 * will be built in the next phase.
 *
 * For now it proves that:
 *   1. Authentication works
 *   2. Role-based routing lands the correct user here
 *   3. Logout is wired up
 *   4. Backend health check is reachable from within the authenticated context
 */

import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import HealthBadge from '../../components/HealthBadge';

export default function CustomerDashboard() {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="font-bold text-gray-800 text-lg">Food Delivery</span>
          </div>
          <div className="flex items-center gap-4">
            <HealthBadge />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-500 mb-8">
          Customer portal foundation is ready. Full feature UI coming in the next phase.
        </p>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow">
          <ShoppingBag className="w-5 h-5" />
          Ready to order food
        </div>
      </main>
    </div>
  );
}
