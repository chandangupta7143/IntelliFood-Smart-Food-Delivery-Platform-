import React from 'react';
import { Filter, RotateCcw, Star } from 'lucide-react';
import Button from '../common/Button';

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese'];
const RATINGS = [
  { label: 'Any', value: 0 },
  { label: '3.0+', value: 3.0 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
];
const DELIVERY_TIMES = [
  { label: 'Any', value: 0 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 45 min', value: 45 },
  { label: '≤ 60 min', value: 60 },
];
const PRICE_TIERS = [
  { label: 'Any', value: null },
  { label: '₹', value: 1 },
  { label: '₹₹', value: 2 },
  { label: '₹₹₹', value: 3 },
  { label: '₹₹₹₹', value: 4 },
];

export default function FilterPanel({
  filters = {},
  onChange,
  onClear,
  className = '',
}) {
  const updateFilter = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <Filter className="w-4 h-4 text-orange-500" />
          <span>Filters</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Pure Veg Toggle */}
      <div>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">
            Pure Veg Only
          </span>
          <input
            type="checkbox"
            checked={!!(filters.vegetarianOnly ?? filters.isVegetarian)}
            onChange={(e) => {
              updateFilter('vegetarianOnly', e.target.checked);
              updateFilter('isVegetarian', e.target.checked);
            }}
            className="w-4 h-4 text-orange-500 rounded-md border-gray-300 focus:ring-orange-400 accent-orange-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Cuisine */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Cuisine
        </label>
        <select
          value={filters.cuisine || 'All'}
          onChange={(e) => updateFilter('cuisine', e.target.value === 'All' ? '' : e.target.value)}
          className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Minimum Rating
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {RATINGS.map(({ label, value }) => {
            const isSelected = (filters.minRating || 0) === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => updateFilter('minRating', value)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {value > 0 && <Star className="w-3 h-3 fill-current" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Delivery Time */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Max Delivery Time
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DELIVERY_TIMES.map(({ label, value }) => {
            const isSelected = (filters.maxDeliveryTime || 0) === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => updateFilter('maxDeliveryTime', value)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Price Range
        </label>
        <div className="flex gap-1">
          {PRICE_TIERS.map(({ label, value }) => {
            const isSelected = filters.priceRange === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => updateFilter('priceRange', value)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy || 'rating'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="rating">Rating: High to Low</option>
          <option value="deliveryTime">Delivery Time: Fastest</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>
    </div>
  );
}
