import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import FilterPanel from '../../components/customer/FilterPanel';
import RestaurantGrid from '../../components/customer/RestaurantGrid';
import { getRestaurants } from '../../api/restaurantApi';
import Modal from '../../components/common/Modal';

export default function RestaurantListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter state from URL
  const initialCuisine = searchParams.get('cuisine') || '';

  const [filters, setFilters] = useState({
    cuisine: initialCuisine,
    vegetarianOnly: false,
    minRating: 0,
    maxDeliveryTime: 0,
    priceRange: null,
    sortBy: 'rating',
  });

  const [page, setPage] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync URL query when cuisine param changes externally
  useEffect(() => {
    const c = searchParams.get('cuisine');
    if (c !== null && c !== filters.cuisine) {
      setFilters((prev) => ({ ...prev, cuisine: c }));
      setPage(0);
    }
  }, [searchParams]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
    // Update URL if cuisine changes
    if (newFilters.cuisine) {
      setSearchParams({ cuisine: newFilters.cuisine });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    const cleared = {
      cuisine: '',
      vegetarianOnly: false,
      minRating: 0,
      maxDeliveryTime: 0,
      priceRange: null,
      sortBy: 'rating',
    };
    setFilters(cleared);
    setPage(0);
    setSearchParams({});
    setShowMobileFilters(false);
  };

  // Build clean backend query object
  const queryParams = {
    page,
    size: 12,
    ...(filters.cuisine && { cuisine: filters.cuisine }),
    ...(filters.vegetarianOnly && { vegetarianOnly: true }),
    ...(filters.minRating > 0 && { minRating: filters.minRating }),
    ...(filters.maxDeliveryTime > 0 && { maxDeliveryTime: filters.maxDeliveryTime }),
    ...(filters.priceRange && { priceRange: filters.priceRange }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['restaurants', 'list', queryParams],
    queryFn: () => getRestaurants(queryParams),
    staleTime: 2 * 60 * 1000,
  });

  const restaurants = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Discover Restaurants
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {totalElements > 0
                ? `Showing ${restaurants.length} of ${totalElements} restaurants`
                : 'Find the best meals in your area'}
            </p>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Filter className="w-4 h-4 text-orange-500" />
            Filters
            {(filters.cuisine || filters.vegetarianOnly || filters.minRating > 0) && (
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>
        </div>

        {/* 2-Column Responsive Layout: Sidebar Filters + Restaurant Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>

          {/* Restaurant Grid & Pagination */}
          <div className="lg:col-span-3 space-y-8">
            <RestaurantGrid
              restaurants={restaurants}
              isLoading={isLoading}
              error={error}
              onRetry={refetch}
              emptyTitle="No restaurants found"
              emptyMessage="We couldn't find any restaurants matching your active filters. Try resetting some filters."
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    // Show first, last, and window around current
                    if (
                      idx === 0 ||
                      idx === totalPages - 1 ||
                      Math.abs(idx - page) <= 1
                    ) {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPage(idx)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                            page === idx
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    }
                    if (idx === 1 && page > 2) {
                      return <span key="ellipsis-start" className="px-1 text-gray-400">…</span>;
                    }
                    if (idx === totalPages - 2 && page < totalPages - 3) {
                      return <span key="ellipsis-end" className="px-1 text-gray-400">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filter Restaurants"
        size="md"
      >
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Apply Filters
          </button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}
