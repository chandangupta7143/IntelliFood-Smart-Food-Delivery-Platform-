/**
 * HomePage.jsx
 *
 * Ultra-Premium, Food-Focused Homepage for IntelliFood
 * Visual Theme: Deep Black + Electric Blue + Crisp White
 * Focus: Delicious Food Items / Dishes (NO fake restaurant listings)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Menu as MenuIcon,
  ShieldCheck,
  Utensils,
  ChefHat,
  ShoppingBag,
  Navigation,
  Truck,
  Lock,
  CheckCircle2,
  User,
  LogOut,
  Compass,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
  Flame,
  Coffee,
  Heart
} from 'lucide-react';

import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

// Role → portal path mapping for authenticated users
const ROLE_PORTAL = {
  USER: '/customer',
  DELIVERY_PARTNER: '/delivery',
  RESTAURANT_OWNER: '/restaurant',
  ADMIN: '/admin',
};

// Curated high-resolution imagery and metadata for authentic dishes
const FOOD_CATALOG = [
  {
    id: 'item_1',
    name: 'Chicken Biryani',
    description: 'Aromatic long-grain basmati rice cooked with tender spiced chicken, saffron, and whole spices.',
    price: 250,
    category: 'Biryani & Rice',
    isVeg: false,
    prepTime: '20 min',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_hyd_biryani',
    name: 'Special Hyderabadi Dum Biryani',
    description: 'Slow-cooked mutton and marinated spiced cuts in a sealed handi with caramelized onions and fresh mint.',
    price: 360,
    category: 'Biryani & Rice',
    isVeg: false,
    prepTime: '25 min',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_2',
    name: 'Paneer Butter Masala',
    description: 'Fresh artisanal cottage cheese cubes simmered in a rich, buttery makhani cashew-tomato gravy.',
    price: 180,
    category: 'Curries & Gravies',
    isVeg: true,
    prepTime: '15 min',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_butter_chicken',
    name: 'Butter Chicken Masala',
    description: 'Smokey tandoori grilled chicken pieces steeped in a velvety tomato, cream, and fenugreek reduction.',
    price: 320,
    category: 'Curries & Gravies',
    isVeg: false,
    prepTime: '20 min',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_3',
    name: 'Garlic Naan',
    description: 'Traditional leavened tandoori flatbread brushed with roasted garlic butter and freshly chopped coriander.',
    price: 40,
    category: 'Breads & Rolls',
    isVeg: true,
    prepTime: '10 min',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',
    popular: false,
  },
  {
    id: 'item_chicken_roll',
    name: 'Crispy Chicken Roll',
    description: 'Juicy spiced chicken kebab pieces wrapped in a flaky handmade paratha with sliced red onions and mint chutney.',
    price: 150,
    category: 'Breads & Rolls',
    isVeg: false,
    prepTime: '12 min',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_4',
    name: 'Chocolate Brownie',
    description: 'Dense, warm fudgy dark chocolate brownie topped with toasted walnut crunch and a molten center.',
    price: 120,
    category: 'Desserts',
    isVeg: true,
    prepTime: '8 min',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_5',
    name: 'Mango Shake',
    description: 'Thick and chilled milkshake prepared with fresh sweet Alphonso mango pulp and condensed cream.',
    price: 90,
    category: 'Beverages',
    isVeg: true,
    prepTime: '5 min',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=700&q=80',
    popular: false,
  },
  {
    id: 'item_margherita',
    name: 'Woodfired Margherita Pizza',
    description: 'Hand-tossed sourdough pizza topped with crushed San Marzano tomatoes, fresh mozzarella, and basil leaves.',
    price: 220,
    category: 'Pizzas',
    isVeg: true,
    prepTime: '18 min',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=700&q=80',
    popular: true,
  },
  {
    id: 'item_paneer_tikka',
    name: 'Tandoori Paneer Tikka',
    description: 'Clay-oven charred cottage cheese cubes marinated in yogurt and crushed spices, served with tangy bell peppers.',
    price: 210,
    category: 'Starters',
    isVeg: true,
    prepTime: '15 min',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80',
    popular: false,
  },
  {
    id: 'item_dal_makhani',
    name: 'Dal Makhani',
    description: 'Whole black lentils slow-simmered overnight with unsalted butter, vine-ripened tomatoes, and fresh dairy cream.',
    price: 190,
    category: 'Curries & Gravies',
    isVeg: true,
    prepTime: '15 min',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80',
    popular: false,
  },
  {
    id: 'item_spring_rolls',
    name: 'Crispy Veg Spring Rolls',
    description: 'Delicate fried golden wrappers stuffed with shredded wok-tossed cabbage, carrots, and glass noodles.',
    price: 140,
    category: 'Starters',
    isVeg: true,
    prepTime: '12 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    popular: false,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const cartStore = useCartStore();
  const isAuthenticated = !!token && !!user;

  // Component State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dishes, setDishes] = useState(FOOD_CATALOG);
  const [primaryRestaurantId, setPrimaryRestaurantId] = useState('6a3673558e02e33fdf59412c');
  const [addedItemNotification, setAddedItemNotification] = useState(null);

  // Fetch real menu items from backend to ensure live sync with MongoDB
  useEffect(() => {
    let isMounted = true;
    async function loadBackendDishes() {
      try {
        // Find default or active restaurant
        const restRes = await axiosClient.get('/api/restaurants', { params: { page: 0, size: 5 } });
        const rests = restRes.data?.data?.content || [];
        if (rests.length > 0) {
          const target = rests[0];
          if (isMounted) setPrimaryRestaurantId(target.id);

          // Get dishes for this restaurant
          const menuRes = await axiosClient.get(`/api/restaurants/${target.id}/menu`);
          const backendItems = menuRes.data?.data || [];

          if (backendItems.length > 0 && isMounted) {
            // Merge backend items with curated imagery
            const merged = FOOD_CATALOG.map((catItem) => {
              const matched = backendItems.find(
                (b) => b.name?.toLowerCase().trim() === catItem.name?.toLowerCase().trim()
              );
              if (matched) {
                return {
                  ...catItem,
                  id: matched.id,
                  price: matched.price,
                  isVeg: matched.vegetarian ?? catItem.isVeg,
                  restaurantId: target.id,
                };
              }
              return { ...catItem, restaurantId: target.id };
            });
            setDishes(merged);
          }
        }
      } catch (err) {
        // Fallback to rich catalog cleanly
        console.warn('Backend dish sync fallback:', err.message);
      }
    }
    loadBackendDishes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const cats = new Set(dishes.map((d) => d.category));
    return ['ALL', ...Array.from(cats)];
  }, [dishes]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesCat =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'VEG_ONLY' && dish.isVeg) ||
        (selectedCategory === 'NON_VEG' && !dish.isVeg) ||
        dish.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCat;

      const nameMatch = dish.name.toLowerCase().includes(q);
      const descMatch = dish.description.toLowerCase().includes(q);
      const catMatch = dish.category.toLowerCase().includes(q);

      return matchesCat && (nameMatch || descMatch || catMatch);
    });
  }, [dishes, searchQuery, selectedCategory]);

  const scrollToDishes = () => {
    const el = document.getElementById('food-menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderDish = (dish) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Add to cart directly
    const targetRestId = dish.restaurantId || primaryRestaurantId;
    cartStore.addItem(
      {
        itemId: dish.id,
        name: dish.name,
        price: dish.price,
      },
      targetRestId,
      'IntelliFood Kitchen'
    );

    // Show feedback and navigate to cart
    setAddedItemNotification(`Added "${dish.name}" to cart!`);
    setTimeout(() => setAddedItemNotification(null), 3000);
    navigate('/customer/cart');
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* AMBIENT BLACK + BLUE BACKGROUND GLOWS                       */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top center sapphire glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full" />
        {/* Mid right deep blue glow */}
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-blue-700/10 blur-[140px] rounded-full" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#151c2e0a_1px,transparent_1px),linear-gradient(to_bottom,#151c2e0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating Notification Toast */}
      {addedItemNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-3 text-sm font-semibold border border-blue-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{addedItemNotification}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. BLACK + BLUE NAVBAR                                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#090b12]/90 backdrop-blur-md border-b border-blue-950/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] group-hover:bg-blue-500 transition-colors">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Intelli<span className="text-blue-500">Food</span>
              </span>
              <span className="text-[10px] font-bold text-blue-400/80 tracking-widest uppercase">
                Premium Food Delivery
              </span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
            >
              Home
            </Link>
            <button
              onClick={scrollToDishes}
              className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              Dishes & Menu
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <Link
              to={isAuthenticated ? '/customer/cart' : '/login'}
              className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span>Cart</span>
            </Link>
          </nav>

          {/* Desktop Right Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={ROLE_PORTAL[user.role] || '/customer'}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white bg-[#101422] hover:bg-[#151c30] px-4 py-2 rounded-xl border border-blue-900/50 shadow-xs transition-all"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>{user.name || 'Portal'}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-950/70 bg-[#090b12] px-4 pt-3 pb-6 shadow-2xl">
            <nav className="flex flex-col gap-3 py-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-white hover:bg-slate-800 rounded-lg"
              >
                Home
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToDishes();
                }}
                className="text-left px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Dishes & Menu
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToHowItWorks();
                }}
                className="text-left px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                How It Works
              </button>
              <Link
                to={isAuthenticated ? '/customer/cart' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>My Cart</span>
              </Link>
            </nav>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={ROLE_PORTAL[user.role] || '/customer'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl"
                  >
                    Go to Portal ({user.name})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-center py-2.5 text-sm font-medium text-red-400 bg-red-950/30 rounded-xl"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-slate-200 bg-slate-900 rounded-xl border border-slate-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION (BLACK & BLUE THEME)                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-16 md:pt-20 md:pb-24 border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 shadow-[0_0_15px_rgba(37,99,235,0.2)] mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Real Kitchens • Handcrafted Dishes • Fast Delivery</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Good Food.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-sky-300">
                  Delivered Smarter.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Discover mouth-watering dishes, explore handcrafted menus, place your order, and track
                your hot meal to your doorstep — all in one seamless experience.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={scrollToDishes}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollToDishes}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0f1422] hover:bg-[#141b30] text-slate-200 hover:text-white border border-blue-900/60 font-semibold text-base transition-all cursor-pointer"
                >
                  Explore Dishes
                </button>
              </div>

              {/* Platform Assurances */}
              <div className="mt-12 pt-8 border-t border-slate-800/80 w-full grid grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/50 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200">
                    Verified Quality
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/50 text-blue-400 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200">
                    Live GPS Tracking
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/50 text-blue-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200">
                    Secure Checkout
                  </div>
                </div>
              </div>
            </div>

            {/* Right Culinary Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Food Photo Frame */}
                <div className="relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#0c101a] p-3 shadow-[0_0_40px_rgba(37,99,235,0.2)]">
                  <img
                    src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80"
                    alt="Authentic Dum Biryani Dish"
                    className="w-full h-80 sm:h-96 object-cover rounded-xl"
                  />
                  {/* Subtle inner overlay */}
                  <div className="absolute inset-x-3 bottom-3 p-4 bg-gradient-to-t from-black via-black/60 to-transparent rounded-b-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>Chef Special</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          Chicken Biryani
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-blue-400">
                          ₹250
                        </span>
                        <div className="text-[10px] text-slate-400">Freshly Cooked</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Live Dispatch Card */}
                <div className="absolute -bottom-6 -left-6 sm:-left-8 bg-[#0d121f] border border-blue-900/60 rounded-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hidden sm:block max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Order Status</div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Out for Delivery
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 text-xs text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                    <span>Assigned Courier</span>
                    <span className="font-semibold text-blue-400">Arriving in 20 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. SEARCH & DISCOVERY BAR (BLACK & BLUE)                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-10 bg-[#090c14] border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0f1422] border border-blue-900/40 rounded-2xl p-4 sm:p-6 shadow-xl max-w-4xl mx-auto">
            <div className="text-center sm:text-left mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>What are you craving today?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Search dishes, curries, biryanis, breads, desserts, and shakes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chicken biryani, paneer butter masala, garlic naan..."
                  className="w-full pl-11 pr-10 py-3.5 bg-[#090b12] border border-blue-950 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={scrollToDishes}
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-colors shrink-0 cursor-pointer"
              >
                Find Food
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. FOOD CATEGORY CHIPS (BLACK & BLUE)                       */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-8 bg-[#080a0f] border-b border-blue-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400'
                      : 'bg-[#0f1422] text-slate-300 border border-slate-800 hover:border-blue-800 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? '🍽️ All Dishes' : cat}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'VEG_ONLY' ? 'ALL' : 'VEG_ONLY')}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'VEG_ONLY'
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400'
                  : 'bg-[#0f1422] text-emerald-400 border border-emerald-950 hover:border-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Veg Only</span>
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'NON_VEG'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400'
                  : 'bg-[#0f1422] text-red-400 border border-red-950 hover:border-red-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. FOOD MENU ITEMS (FOOD-FOCUSED, NO RESTAURANTS)          */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="food-menu-section" className="relative z-10 py-16 bg-[#090c14] border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Verified Kitchen Menu</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-1.5 tracking-tight">
                Explore Popular Dishes
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Showing {filteredDishes.length} prepared food dish
                {filteredDishes.length === 1 ? '' : 'es'} ready for immediate preparation
              </p>
            </div>

            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 self-start sm:self-auto cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredDishes.length === 0 && (
            <div className="border border-dashed border-slate-800 bg-[#0d101a] rounded-2xl p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-blue-950/70 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-900/60">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No food items match your criteria
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Try searching for a different dish or clear your active category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Food Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="border border-slate-800/80 rounded-2xl overflow-hidden bg-[#0d101a] hover:border-blue-500/60 hover:shadow-[0_4px_30px_rgba(37,99,235,0.2)] transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Food Image with Veg Indicator & Category */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d101a] via-transparent to-transparent opacity-80" />

                  {/* Top Floating Tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {/* Category pill */}
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-black/75 text-blue-300 border border-blue-900/50 backdrop-blur-xs">
                      {dish.category}
                    </span>

                    {/* Veg/Non-Veg Tag */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center bg-black/80 border ${
                        dish.isVeg ? 'border-emerald-500' : 'border-red-500'
                      }`}
                      title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Prep Time */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{dish.prepTime || '15 min'}</span>
                  </div>
                </div>

                {/* Dish Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Price</span>
                      <div className="text-xl font-extrabold text-blue-400">
                        ₹{dish.price}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOrderDish(dish)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. HOW INTELLIFOOD WORKS (PRODUCT FLOW)                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works-section" className="relative z-10 py-20 bg-[#080a0f] border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Simple & Dependable
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1.5 tracking-tight">
              How IntelliFood Works
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Three transparent steps connecting your order directly to active kitchen preparation
              and dedicated couriers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Discover */}
            <div className="bg-[#0c0f18] border border-blue-950/70 rounded-2xl p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-black text-lg mb-6 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  01
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Discover Dishes</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Browse authentic food items, check ingredients, inspect transparent prices, and
                  choose dishes freshly prepared in real kitchens.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-blue-400 flex items-center gap-1">
                <span>Verified culinary menu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 2: Order */}
            <div className="bg-[#0c0f18] border border-blue-950/70 rounded-2xl p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-black text-lg mb-6 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  02
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Place Order</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Confirm your food with cryptographically signed quote tokens, guaranteeing zero
                  hidden fees and idempotent checkout safety.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-blue-400 flex items-center gap-1">
                <span>Tamper-evident pricing tokens</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 3: Track */}
            <div className="bg-[#0c0f18] border border-blue-950/70 rounded-2xl p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-black text-lg mb-6 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  03
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center mb-4">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Live Doorstep Tracking</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Follow your hot meal in real time as the kitchen cooks, hands off to the verified
                  courier, and arrives at your door.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-blue-400 flex items-center gap-1">
                <span>WebSocket / STOMP telemetry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 7. TRUST / PLATFORM INTEGRITY (BLACK & BLUE)                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-[#090c14] border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1.5 tracking-tight">
              Everything You Need for a Better Delivery Experience
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Built on verified real-world operational standards with complete transparency across
              every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Fresh Kitchen Preparation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dishes are accepted and prepared by dedicated restaurant partners using real-time
                kitchen status progression.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Idempotent Secure Ordering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every transaction uses idempotency keys and cryptographically verified pricing quote
                tokens to protect against duplicate charges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Real-Time Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persistent WebSocket STOMP channel feeds live status updates straight to your screen
                the moment your food is handed over.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Dedicated Courier Fleet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Geospatial sweep matching ready orders with verified couriers in proximity for
                rapid pick-up and dispatch.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Definitive Order Custody</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear responsibility handoffs ensure your food is strictly tracked between customer,
                kitchen, and courier.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 border border-slate-800/80 rounded-2xl bg-[#0c0f18] hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/60 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">System Transparency</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero fake discounts, zero inflated reviews. Only authentic dishes, live menus, and
                verified order lifecycles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 8. FINAL CTA (BLACK & BLUE GLOW)                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-[#080a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-950/80 via-[#0e1424] to-[#0a0d17] border border-blue-900/50 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-[0_0_50px_rgba(37,99,235,0.25)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Ambient blue background flare */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-xl text-center md:text-left">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Start Eating Smarter
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1.5 tracking-tight">
                Ready to find your next meal?
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Explore delicious dishes and place your first order with IntelliFood today.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto shrink-0">
              <button
                onClick={scrollToDishes}
                className="px-7 py-3.5 bg-white hover:bg-slate-200 text-gray-950 font-bold text-sm rounded-xl shadow-lg transition-colors cursor-pointer text-center"
              >
                Browse Dishes
              </button>
              <Link
                to="/register"
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors text-center"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 9. PROFESSIONAL DARK FOOTER                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto relative z-10 bg-[#05070c] text-slate-400 border-t border-blue-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1: Brand */}
            <div className="lg:col-span-2 flex flex-col items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  Intelli<span className="text-blue-500">Food</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Smart food delivery experience. Connecting food lovers with verified kitchens through
                dependable logistics, live telemetry, and transparent order handoffs.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>System Operational • REST & STOMP Active</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/" className="hover:text-blue-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <button
                    onClick={scrollToDishes}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                  >
                    Dishes & Menu
                  </button>
                </li>
                <li>
                  <button
                    onClick={scrollToHowItWorks}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <Link
                    to={isAuthenticated ? '/customer/cart' : '/login'}
                    className="hover:text-blue-400 transition-colors"
                  >
                    My Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Partner Portals */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Portals
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link
                    to="/register/restaurant-owner"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Restaurant Partner
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register/delivery-partner"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Delivery Partner
                  </Link>
                </li>
                <li>
                  <Link to="/customer" className="hover:text-blue-400 transition-colors">
                    Customer Portal
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-blue-400 transition-colors">
                    Admin Operations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Account */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Account
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/login" className="hover:text-blue-400 transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-400 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>&copy; 2026 IntelliFood. All rights reserved.</div>
            <div className="text-slate-500">
              Obsidian & Electric Blue Food Marketplace Design System
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
