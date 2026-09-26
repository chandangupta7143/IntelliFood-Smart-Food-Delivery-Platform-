import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import SearchBar from '../../components/customer/SearchBar';
import RestaurantGrid from '../../components/customer/RestaurantGrid';
import { search } from '../../api/searchApi';

const CUISINES = ['Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [searchMode, setSearchMode] = useState('TEXT_SEARCH');
  const [page, setPage] = useState(0);

  // Sync state if URL param changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  const handleSearchSubmit = (newQuery) => {
    setQuery(newQuery);
    setPage(0);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
  };

  const payload = {
    query: query.trim(),
    searchMode: query.trim() ? 'TEXT_SEARCH' : 'DISCOVERY',
    cuisines: selectedCuisine ? [selectedCuisine] : undefined,
    isVegetarian: isVegetarian ? true : undefined,
    latitude: 18.5204, // Default Pune coords
    longitude: 73.8567,
    radiusInKm: 15.0,
    page,
    size: 12,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', query, selectedCuisine, isVegetarian, page],
    queryFn: () => search(payload),
    enabled: true, // Always fetch, fallback to discovery if empty query
    staleTime: 60 * 1000,
  });

  const searchResults = data?.content || [];
  const totalElements = data?.totalElements || 0;

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Search Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Search Food & Restaurants
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Powered by geospatial discovery and text search
          </p>
          <SearchBar
            variant="page"
            defaultValue={query}
            onSearch={handleSearchSubmit}
            placeholder="Search Chicken Biryani, Pizza, Italian..."
          />
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pure Veg Pill */}
            <button
              type="button"
              onClick={() => {
                setIsVegetarian(!isVegetarian);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${
                isVegetarian
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isVegetarian ? 'bg-white' : 'bg-emerald-600'}`} />
              Pure Veg
            </button>

            {/* Cuisine Chips */}
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedCuisine(selectedCuisine === c ? '' : c);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  selectedCuisine === c
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-400">
            {query && <span>Results for &ldquo;{query}&rdquo;</span>}
          </div>
        </div>

        {/* Results Section */}
        <div className="pt-2">
          <RestaurantGrid
            restaurants={searchResults}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            emptyTitle={query ? `No restaurants found for "${query}"` : 'No restaurants in this category'}
            emptyMessage="Try searching for a different dish name or reset your filters."
          />
        </div>
      </div>
    </CustomerLayout>
  );
}
