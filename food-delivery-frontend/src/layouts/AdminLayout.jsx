import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { connect } from '../websocket/stompClient';
import BrandLogo from '../components/common/BrandLogo';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  ShieldAlert,
  Zap,
  Bell,
  Activity,
  LogOut,
  Menu,
  X,
  Radio,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { path: '/admin/delivery', label: 'Delivery Fleet', icon: Bike },
  { path: '/admin/fraud', label: 'Fraud Review', icon: ShieldAlert },
  { path: '/admin/pricing', label: 'Surge Control', icon: Zap },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/system', label: 'System Health', icon: Activity },
];

export default function AdminLayout({ children }) {
  const { user, token, logout } = useAuthStore();
  const { unreadCount, addLiveNotification } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    let unsub;
    connect(token, {
      onConnect: (client) => {
        setWsConnected(true);
        try {
          unsub = client.subscribe('/user/queue/notifications', (msg) => {
            try {
              const body = JSON.parse(msg.body);
              addLiveNotification(body);
            } catch (e) {
              console.error('Error parsing admin live notification:', e);
            }
          });
        } catch (err) {
          console.warn('Admin STOMP subscription warning:', err);
        }
      },
      onDisconnect: () => setWsConnected(false),
      onError: () => setWsConnected(false),
    });

    return () => {
      if (unsub && typeof unsub.unsubscribe === 'function') {
        unsub.unsubscribe();
      }
    };
  }, [token, addLiveNotification]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Operations Header */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8 w-auto" />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Operations Center</span>
              <span className="text-sm font-bold text-white tracking-tight">IntelliFood Admin</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium">
            <Radio size={14} className={wsConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
            <span className={wsConnected ? 'text-emerald-400' : 'text-slate-400'}>
              {wsConnected ? 'STOMP Active' : 'STOMP Polling'}
            </span>
          </div>

          {/* Quick Notifications Link */}
          <Link
            to="/admin/notifications"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Admin Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-amber-500 rounded-full ring-2 ring-slate-950" />
            )}
          </Link>

          {/* Admin User info & logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-slate-200">{user?.name || 'System Admin'}</span>
              <span className="text-xs text-amber-400 font-mono">ROLE_ADMIN</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace with persistent sidebar on md+ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800 p-4 shrink-0">
          <nav className="space-y-1.5 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? 'text-amber-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight size={16} className="text-amber-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Cluster:</span>
              <span className="text-slate-400 font-mono">Local Prod</span>
            </div>
            <div className="flex justify-between">
              <span>Engine:</span>
              <span className="text-slate-400 font-mono">Spring 3.2.4</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-950/95 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <BrandLogo className="h-8 w-auto" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-2 py-6 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                      active
                        ? 'bg-amber-500/15 text-amber-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-amber-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-400 rounded-lg font-semibold hover:bg-rose-500/20 transition"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-2 shrink-0">
        {[
          { path: '/admin', label: 'Dash', icon: LayoutDashboard, exact: true },
          { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
          { path: '/admin/delivery', label: 'Fleet', icon: Bike },
          { path: '/admin/fraud', label: 'Fraud', icon: ShieldAlert },
          { path: '/admin/system', label: 'System', icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg text-xs font-medium transition ${
                active ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
