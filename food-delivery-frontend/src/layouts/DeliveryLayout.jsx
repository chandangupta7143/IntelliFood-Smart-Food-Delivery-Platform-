import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Bell,
  History,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import BrandLogo from '../components/common/BrandLogo';
import { connect, subscribeToNotifications } from '../websocket/stompClient';

/**
 * DeliveryLayout
 *
 * Master layout for Delivery Partner portal.
 * Provides top navbar, active duty status badge, quick links, and mobile bottom bar.
 */
export default function DeliveryLayout({ children, partnerStatus = 'ONLINE' }) {
  const { user, token, logout } = useAuthStore();
  const { unreadCount, addLiveNotification } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Subscribe to STOMP notifications for driver
  useEffect(() => {
    if (!token) return;
    let unsub = null;
    connect(token, {
      onConnect: () => {
        unsub = subscribeToNotifications((payload) => {
          addLiveNotification(payload);
        });
      },
    });

    return () => {
      if (unsub?.unsubscribe) unsub.unsubscribe();
    };
  }, [token, addLiveNotification]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { label: 'Dashboard', path: '/delivery', icon: LayoutDashboard },
    { label: 'Active Delivery', path: '/delivery/active', icon: Truck },
    { label: 'Notifications', path: '/delivery/notifications', icon: Bell, badge: unreadCount },
    { label: 'Delivery History', path: '/delivery/history', icon: History },
  ];

  const getStatusBadge = () => {
    switch (partnerStatus) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ON DUTY
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            OFFER PENDING
          </span>
        );
      case 'ON_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            ON TRIP
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            SUSPENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            OFF DUTY
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Delivery Partner Subtitle */}
            <div className="flex items-center gap-4">
              <BrandLogo size="sm" to="/delivery" subtitle="Delivery Partner" />
              <div className="hidden sm:block">{getStatusBadge()}</div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge > 0 && (
                      <span className="w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right User Actions */}
            <div className="flex items-center gap-3">
              <div className="sm:hidden">{getStatusBadge()}</div>

              {/* Driver Info */}
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'D'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none truncate max-w-[120px]">
                    {user?.name || 'Driver'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Verified Partner</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge > 0 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Mobile Navigation (Always visible on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-bold relative ${
                isActive ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="mt-0.5">{link.label.split(' ')[0]}</span>
              {link.badge > 0 && (
                <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
