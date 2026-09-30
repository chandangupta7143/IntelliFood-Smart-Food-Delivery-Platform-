import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import SearchBar from '../../components/customer/SearchBar';
import RestaurantCard from '../../components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getRecommendations, trackClick } from '../../api/recommendationApi';
import { getNearbyRestaurants } from '../../api/restaurantApi';
import useAuthStore from '../../store/authStore';
import useLocationStore from '../../store/locationStore';
import { MapPin } from 'lucide-react';

const QUICK_CATEGORIES = [
  { name: 'Indian', emoji: '🍛' },
  { name: 'Italian', emoji: '🍕' },
  { name: 'Chinese', emoji: '🥢' },
  { name: 'American', emoji: '🍔' },
  { name: 'Mexican', emoji: '🌮' },
  { name: 'Japanese', emoji: '🍱' },
];

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const locationStore = useLocationStore();

  // Recommendations Query based on selected location
  const {
    data: recommendationData,
    isLoading: isRecsLoading,
    error: recsError,
    refetch: refetchRecs,
  } = useQuery({
    queryKey: ['recommendations', locationStore.latitude, locationStore.longitude],
    queryFn: () => getRecommendations({
      deliveryLatitude: locationStore.latitude,
      deliveryLongitude: locationStore.longitude,
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Strict Nearby Restaurants Query (only returns restaurants created within radiusKm)
  const {
    data: restaurantPage,
    isLoading: isRestaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ['restaurants', 'home-feed', locationStore.latitude, locationStore.longitude, locationStore.radiusKm],
    queryFn: () => getNearbyRestaurants({
      latitude: locationStore.latitude,
      longitude: locationStore.longitude,
      radiusKm: locationStore.radiusKm,
      page: 0,
      size: 8,
    }),
    staleTime: 3 * 60 * 1000,
  });

  const recommendedItems = Array.isArray(recommendationData)
    ? recommendationData
    : recommendationData?.recommendations || [];

  const popularRestaurants = restaurantPage?.content || [];

  const handleSearchSubmit = (q) => {
    if (q) {
      navigate(`/customer/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/customer/search');
    }
  };

  const handleRecommendationClick = (restaurant) => {
    // If backend provided an eventId or recommendation token, store it for checkout attribution
    const eventId = restaurant.recommendationEventId || recommendationData?.eventId;
    if (eventId) {
      sessionStorage.setItem('recommendationEventId', eventId);
    }
    // Track the click event with backend
    trackClick({ restaurantId: restaurant.id }).catch(() => {});
  };

  return (
    <CustomerLayout>
      <div className="space-y-10">
        {/* Hero Section */}
        <section className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border border-blue-900/40 text-white p-6 sm:p-10 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-md text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Intelligent Delivery Platform
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Good food. <br className="hidden sm:inline" />
              Smart delivery. <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">Right to your door.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg">
              Welcome back, {user?.name || 'Foodie'}! Explore top-rated restaurants, automated driver dispatch, and dynamic surge pricing.
            </p>

            {/* Active Delivery Location Bar */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => locationStore.openLocationModal()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 transition cursor-pointer group"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>
                  Delivering to: <strong className="text-white">{locationStore.village ? `${locationStore.village}, ` : ''}{locationStore.city}</strong> ({locationStore.radiusKm} km radius)
                </span>
                <span className="text-cyan-300 text-[11px] underline ml-1">Change Location</span>
              </button>
            </div>

            {/* Prominent Hero SearchBar */}
            <div className="pt-2 max-w-xl">
              <SearchBar
                variant="page"
                onSearch={handleSearchSubmit}
                placeholder="Search dishes, restaurants or cuisines..."
              />
            </div>
          </div>

          {/* Background decorative brand logo watermark */}
          <div className="absolute -right-6 -bottom-8 md:right-8 md:-bottom-10 opacity-20 pointer-events-none select-none">
            <img src="/brand-logo.png" alt="IntelliFood" className="w-56 h-56 md:w-72 md:h-72 rounded-3xl object-cover drop-shadow-2xl rotate-6" />
          </div>
        </section>

        {/* Quick Cuisine Filter Chips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Explore Cuisines
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/customer/restaurants?cuisine=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all text-center"
              >
                <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform select-none">
                  {cat.emoji}
                </span>
                <span className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recommended For You Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Recommended For You
              </h2>
            </div>
          </div>

          {isRecsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : recsError ? (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs text-gray-400 text-center">
              Personalized recommendations currently unavailable.
            </div>
          ) : recommendedItems.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <p className="text-xs text-gray-500">Order from our top restaurants to start seeing personalized recommendations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedItems.slice(0, 4).map((rec) => (
                <RestaurantCard
                  key={rec.id || rec.restaurantId}
                  restaurant={rec}
                  onRecommendationClick={handleRecommendationClick}
                />
              ))}
            </div>
          )}
        </section>

        {/* Popular Restaurants Near You */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Restaurants Near You
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                Within {locationStore.radiusKm} km of {locationStore.village || locationStore.city}
              </span>
            </div>
            <Link
              to="/customer/restaurants"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isRestaurantsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : restaurantsError ? (
            <ErrorState
              title="Unable to load restaurants"
              message={restaurantsError.response?.data?.message || 'Please check your connection and retry.'}
              onRetry={refetchRestaurants}
            />
          ) : popularRestaurants.length === 0 ? (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                📍
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">
                  No restaurants created nearby in {locationStore.village ? `${locationStore.village}, ` : ''}{locationStore.city}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We only show restaurants operating within {locationStore.radiusKm} km of your chosen location. If a restaurant is registered in this area, it will immediately appear here!
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => locationStore.openLocationModal()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
                >
                  Change State / City / Village
                </button>
                <button
                  type="button"
                  onClick={() => locationStore.resetToDefault()}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Switch to Pune (Active Demo Hub)
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
