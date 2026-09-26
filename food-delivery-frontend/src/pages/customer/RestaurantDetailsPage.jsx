import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Clock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Info,
} from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import MenuItemCard from '../../components/customer/MenuItemCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getRestaurantById, getRestaurantMenu } from '../../api/restaurantApi';
import useCartStore from '../../store/cartStore';

export default function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const [activeCategory, setActiveCategory] = useState('All');

  const { items, restaurantId: cartRestaurantId, getSubtotal, getItemCount } = useCartStore();

  const { data: restaurant, isLoading, error, refetch } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => getRestaurantById(restaurantId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawMenu = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ['restaurantMenu', restaurantId],
    queryFn: () => getRestaurantMenu(restaurantId),
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading || isMenuLoading) {
    return (
      <CustomerLayout>
        <LoadingSkeleton text="Loading restaurant and fresh menu..." />
      </CustomerLayout>
    );
  }

  if (error || !restaurant) {
    return (
      <CustomerLayout>
        <ErrorState
          title="Restaurant not found"
          message={error?.response?.data?.message || 'We could not find the requested restaurant.'}
          onRetry={refetch}
        />
      </CustomerLayout>
    );
  }

  const {
    name = 'Restaurant',
    cuisineType,
    cuisine,
    rating = 4.0,
    ratingCount = 0,
    priceRange = 'MID_RANGE',
    avgDeliveryTimeMinutes = 30,
    isVegetarian = false,
    isVerified = false,
    isActive = true,
    address,
    operatingHours,
  } = restaurant;

  const displayCuisine = cuisineType || cuisine || 'Multi-Cuisine';

  // Normalize real MongoDB menu items
  const normalizedMenu = rawMenu.map((item) => ({
    ...item,
    itemId: item.id || item.itemId,
    isVeg: item.isVegetarian ?? item.isVeg ?? false,
  }));

  const menuCategories = ['All', ...new Set(normalizedMenu.map((i) => i.category || 'Main Course'))];

  const filteredMenuItems = activeCategory === 'All'
    ? normalizedMenu
    : normalizedMenu.filter((i) => i.category === activeCategory);

  const isCartFromThisRestaurant = cartRestaurantId === restaurantId && items.length > 0;
  const subtotal = getSubtotal();
  const cartItemCount = getItemCount();

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-24">
        {/* Restaurant Hero Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {isVegetarian && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    PURE VEG
                  </span>
                )}
                {isVerified && (
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    VERIFIED PARTNER
                  </span>
                )}
                {!isActive && (
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg">
                    CURRENTLY CLOSED
                  </span>
                )}
              </div>

              {/* Title & Cuisine */}
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900">
                {name}
              </h1>

              <p className="text-sm font-medium text-gray-500">
                {displayCuisine} • Price Tier: {priceRange}
              </p>

              {/* Location & Timings */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                {address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      {address.city ? `${address.street || ''}, ${address.city}` : (typeof address === 'string' ? address : 'Pune')}
                    </span>
                  </div>
                )}
                {operatingHours && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {operatingHours.openTime || '09:00'} - {operatingHours.closeTime || '22:00'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating & Delivery Meta Box */}
            <div className="flex sm:flex-col gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 justify-between sm:justify-center">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-2xl">
                <Star className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                <div>
                  <span className="text-base font-extrabold block leading-none">
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {ratingCount}+ ratings
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-orange-50 text-orange-800 border border-orange-200 px-3 py-2 rounded-2xl">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <span className="text-base font-extrabold block leading-none">
                    {avgDeliveryTimeMinutes || 30}m
                  </span>
                  <span className="text-[10px] text-orange-700 font-semibold">
                    Delivery Time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Menu
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {filteredMenuItems.length} dishes available
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {menuCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          {filteredMenuItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
              <p className="text-sm font-bold text-gray-700">No dishes in this category</p>
              <p className="text-xs text-gray-400 mt-1">Check another category or check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenuItems.map((item) => (
                <MenuItemCard
                  key={item.itemId}
                  item={item}
                  restaurantId={restaurantId}
                  restaurantName={name}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sticky Cart Summary Bar (Floating at bottom) */}
        {isCartFromThisRestaurant && (
          <div className="fixed bottom-16 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-orange-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-orange-500 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                  {cartItemCount}
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-100">
                    Your Cart
                  </p>
                  <p className="text-sm font-black">
                    ₹{subtotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <Link
                to="/customer/cart"
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-orange-50 transition shadow-sm"
              >
                <span>View Cart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
