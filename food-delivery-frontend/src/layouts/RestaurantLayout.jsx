import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  ChefHat,
  ShoppingBag,
  Menu as MenuIcon,
  Bell,
  LogOut,
  User,
  Power,
  Clock,
  Sparkles
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/common/BrandLogo';
import { getOwnerRestaurant, toggleRestaurantStatus } from '../api/restaurantOwnerApi';

export default function RestaurantLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch restaurant details for open/closed state
  const { data: restaurant } = useQuery({
    queryKey: ['ownerRestaurant'],
    queryFn: getOwnerRestaurant,
    staleTime: 60 * 1000,
  });

  const isOpen = restaurant?.isActive ?? true;

  const statusMutation = useMutation({
    mutationFn: (newStatus) => toggleRestaurantStatus(newStatus),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ownerRestaurant'], updated);
      queryClient.invalidateQueries({ queryKey: ['ownerStats'] });
    }
  });

  const handleToggleStatus = () => {
    statusMutation.mutate(!isOpen);
  };

  const navLinks = [
    { to: '/restaurant', label: 'Dashboard', icon: Store, exact: true },
    { to: '/restaurant/orders', label: 'Kitchen Orders', icon: ShoppingBag },
    { to: '/restaurant/menu', label: 'Menu Catalog', icon: ChefHat },
    { to: '/restaurant/profile', label: 'Restaurant Profile', icon: User },
    { to: '/restaurant/notifications', label: 'Notifications', icon: Bell },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Badge */}
            <div className="flex items-center space-x-3">
              <BrandLogo size="md" to="/restaurant" />
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                <ChefHat className="w-3.5 h-3.5 mr-1 text-orange-600" />
                Restaurant Portal
              </span>
            </div>

            {/* Middle: Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? location.pathname === link.to
                  : location.pathname.startsWith(link.to);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Open/Close Switch & Profile */}
            <div className="flex items-center space-x-3">
              {/* Online/Offline Store toggle button */}
              <button
                onClick={handleToggleStatus}
                disabled={statusMutation.isPending}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                  isOpen
                    ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                }`}
                title="Toggle restaurant accepting orders"
              >
                <Power className={`w-3.5 h-3.5 mr-1.5 ${isOpen ? 'text-green-600' : 'text-red-600'}`} />
                {isOpen ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[120px] truncate">{user?.name || 'Owner'}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/restaurant/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      Settings & Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden border-t border-gray-100 px-2 py-1.5 flex items-center justify-around overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center py-1 px-2.5 rounded-md text-[10px] font-medium ${
                  isActive ? 'text-orange-600 font-bold' : 'text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
