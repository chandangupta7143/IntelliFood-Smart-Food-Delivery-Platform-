import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, ShieldCheck, MapPin } from 'lucide-react';

const CUISINE_EMOJI_MAP = {
  INDIAN: '🍛',
  CHINESE: '🥢',
  ITALIAN: '🍕',
  MEXICAN: '🌮',
  AMERICAN: '🍔',
  JAPANESE: '🍱',
  ASIAN: '🍜',
  DESSERTS: '🍰',
  BEVERAGES: '🥤',
};

const PRICE_RANGE_MAP = {
  1: '₹',
  2: '₹₹',
  3: '₹₹₹',
  4: '₹₹₹₹',
  BUDGET: '₹',
  MID_RANGE: '₹₹',
  PREMIUM: '₹₹₹',
};

export default function RestaurantCard({
  restaurant,
  onRecommendationClick = null,
  className = '',
}) {
  if (!restaurant) return null;

  const {
    id,
    name = 'Unnamed Restaurant',
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
    matchScore,
    recommendationReason,
  } = restaurant;

  const displayCuisine = cuisineType || cuisine || 'Multi-Cuisine';
  const cuisineUpper = displayCuisine.toUpperCase();
  const emoji = CUISINE_EMOJI_MAP[cuisineUpper] || '🍽️';
  const priceSymbol = PRICE_RANGE_MAP[priceRange] || '₹₹';

  const handleClick = () => {
    if (onRecommendationClick) {
      onRecommendationClick(restaurant);
    }
  };

  return (
    <Link
      to={`/customer/restaurants/${id}`}
      onClick={handleClick}
      className={`group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden relative ${
        !isActive ? 'opacity-75' : ''
      } ${className}`}
    >
      {/* Banner / Visual Top */}
      <div className="h-36 bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 relative flex items-center justify-center overflow-hidden">
        <span className="text-6xl drop-shadow-md select-none group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </span>

        {/* Veg badge */}
        {isVegetarian && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-md flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            PURE VEG
          </span>
        )}

        {/* Verified badge */}
        {isVerified && (
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-md flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        )}

        {/* Closed overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md">
              Closed Now
            </span>
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Recommendation Reason if available */}
          {recommendationReason && (
            <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 text-[11px] font-semibold rounded-md border border-orange-100">
              ✨ {recommendationReason}
              {matchScore && <span>({Math.round(matchScore * 100)}% match)</span>}
            </div>
          )}

          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition line-clamp-1">
              {name}
            </h3>
            {/* Rating Pill */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shrink-0">
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium mb-3">
            {displayCuisine} • {priceSymbol}
          </p>

          {address && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-3 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {address.city ? `${address.street || ''}, ${address.city}` : (typeof address === 'string' ? address : 'Pune')}
            </p>
          )}
        </div>

        {/* Footer info: Delivery time and reviews */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{avgDeliveryTimeMinutes || 30} mins</span>
          </div>
          {ratingCount > 0 && (
            <span className="text-gray-400">
              {ratingCount}+ ratings
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
