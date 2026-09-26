/**
 * AdminDashboard.jsx — Foundation placeholder
 *
 * Root of the Admin portal.
 * Full UI (fraud queue, surge controls, analytics, etc.)
 * will be built in the next phase.
 */

import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import HealthBadge from '../../components/HealthBadge';

export default function AdminDashboard() {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-gray-800 text-lg">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <HealthBadge />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
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

      <main className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛡️</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Control Center
        </h1>
        <p className="text-gray-500 mb-8">
          Foundation ready. Fraud queue, surge pricing controls, and analytics coming in the next phase.
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium shadow">
          <ShieldCheck className="w-5 h-5" />
          System operational
        </div>
      </main>
    </div>
  );
}
