import React from 'react';
import RestaurantCard from './RestaurantCard';
import { RestaurantCardSkeleton } from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

export default function RestaurantGrid({
  restaurants = [],
  isLoading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No restaurants found',
  emptyMessage = 'Try adjusting your search criteria or filters to find available restaurants.',
  onRecommendationClick = null,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load restaurants"
        message={error.response?.data?.message || error.message || 'Unable to connect to the restaurant service.'}
        onRetry={onRetry}
      />
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <EmptyState
        icon="🍽️"
        title={emptyTitle}
        description={emptyMessage}
      />
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onRecommendationClick={onRecommendationClick}
        />
      ))}
    </div>
  );
}
