import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Bell,
  User,
  LogOut,
  MapPin,
  Clock,
  Home,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useNotificationStore from '../store/notificationStore';
import SearchBar from '../components/customer/SearchBar';
import HealthBadge from '../components/HealthBadge';
import BrandLogo from '../components/common/BrandLogo';
import LocationModal from '../components/common/LocationModal';
import useLocationStore from '../store/locationStore';
import { connect, subscribeToNotifications } from '../websocket/stompClient';
import { markAllAsRead, getNotifications } from '../api/notificationApi';

export default function CustomerLayout({ children }) {
  const locationStore = useLocationStore();
  const { user, token, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const {
    unreadCount,
    liveNotifications,
    addLiveNotification,
    setUnreadCount,
    clearUnread,
  } = useNotificationStore();

  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Sync initial notifications unread count on mount
  useEffect(() => {
    if (!token) return;
    getNotifications({ page: 0, size: 5 })
      .then((res) => {
        if (res?.totalElements !== undefined) {
          // If total elements exists, count unread if present, or count
          const unread = res.content ? res.content.filter((n) => !n.isRead).length : 0;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [token, setUnreadCount]);

  // Connect STOMP WebSocket for notifications
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
      if (typeof unsub === 'function') unsub();
      else if (unsub && typeof unsub.unsubscribe === 'function') unsub.unsubscribe();
    };
  }, [token, addLiveNotification]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (q) => {
    if (q) {
      navigate(`/customer/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/customer/search');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      clearUnread();
    } catch {
      clearUnread();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Location */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <BrandLogo to="/customer" size="sm" />

              {/* Interactive Location Picker Button */}
              <button
                type="button"
                onClick={() => locationStore.openLocationModal()}
                className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition cursor-pointer group shadow-2xs"
                title="Click to change State, City or Village"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-bold text-gray-900">{locationStore.city}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600 truncate max-w-[100px] sm:max-w-[130px]">{locationStore.village}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition shrink-0" />
              </button>
            </div>

            {/* Global SearchBar in Navbar (hidden on small mobile, accessible via bottom nav) */}
            <div className="hidden sm:flex flex-1 justify-center max-w-md mx-auto">
              <SearchBar
                variant="navbar"
                onSearch={handleSearchSubmit}
                placeholder="Search food or restaurants..."
              />
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden xl:block">
                <HealthBadge />
              </div>

              {/* Orders Link */}
              <Link
                to="/customer/orders"
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition"
              >
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Orders</span>
              </Link>

              {/* Notification Icon & Dropdown */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                  className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Card */}
                {showNotificationMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto px-2 py-1 divide-y divide-gray-50">
                      {liveNotifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No recent notifications
                        </div>
                      ) : (
                        liveNotifications.slice(0, 5).map((n, i) => (
                          <div key={n.id || i} className="p-3 text-xs hover:bg-gray-50 rounded-xl transition">
                            <p className="font-bold text-gray-800">{n.title}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 pt-2 border-t border-gray-100 text-center">
                      <Link
                        to="/customer/notifications"
                        onClick={() => setShowNotificationMenu(false)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 block py-1"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button with Count Badge */}
              <Link
                to="/customer/cart"
                className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="bg-white text-orange-600 font-extrabold px-1.5 py-0.2 rounded-full text-[11px] min-w-[18px] text-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Avatar Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-sm truncate">{user?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold">
                        {user?.role || 'USER'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/customer/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        Order History
                      </Link>
                      <Link
                        to="/customer/notifications"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      >
                        <Bell className="w-4 h-4 text-gray-400" />
                        Notifications
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on <md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-2 flex items-center justify-between shadow-lg">
        <Link
          to="/customer"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            location.pathname === '/customer' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/customer/search"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            location.pathname === '/customer/search' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Link>

        <Link
          to="/customer/cart"
          className={`relative flex flex-col items-center gap-1 text-[11px] font-semibold ${
            location.pathname === '/customer/cart' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>

        <Link
          to="/customer/orders"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            location.pathname.startsWith('/customer/orders') ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Orders</span>
        </Link>

        <Link
          to="/customer/notifications"
          className={`relative flex flex-col items-center gap-1 text-[11px] font-semibold ${
            location.pathname === '/customer/notifications' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Location Selection Modal */}
      <LocationModal
        isOpen={locationStore.isLocationModalOpen}
        onClose={locationStore.closeLocationModal}
      />
    </div>
  );
}
