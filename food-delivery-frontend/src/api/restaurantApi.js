/**
 * restaurantApi.js
 *
 * Backend endpoints (GET /api/restaurants/**):
 *   GET /api/restaurants              → paginated list
 *   GET /api/restaurants/nearby       → H3-based geo list
 *   GET /api/restaurants/search       → name/cuisine search
 *   GET /api/restaurants/{id}         → single restaurant
 *
 * All require authentication (JWT attached by axiosClient interceptor).
 */

import axiosClient from './axiosClient';

/** Get all restaurants (paginated).
 * @param {{ page?: number, size?: number }} params */
export async function getRestaurants(params = {}) {
  const res = await axiosClient.get('/api/restaurants', { params });
  return res.data.data;
}

/** Get nearby restaurants within a given radius (km).
 * @param {{ latitude?: number, longitude?: number, lat?: number, lng?: number, radiusKm?: number, cuisine?: string, minRating?: number, priceRange?: number, vegetarianOnly?: boolean, maxDeliveryTime?: number, sortBy?: string, page?: number, size?: number }} params */
export async function getNearbyRestaurants(params = {}) {
  const queryParams = {
    ...params,
    latitude: params.latitude !== undefined ? params.latitude : params.lat,
    longitude: params.longitude !== undefined ? params.longitude : params.lng,
    radiusKm: params.radiusKm !== undefined ? params.radiusKm : 10,
  };
  const res = await axiosClient.get('/api/restaurants/nearby', { params: queryParams });
  return res.data.data;
}

/** Search restaurants by name or cuisine.
 * @param {{ query: string }} params */
export async function searchRestaurants(params) {
  const res = await axiosClient.get('/api/restaurants/search', { params });
  return res.data.data;
}

/** Get a single restaurant by ID.
 * @param {string} id */
export async function getRestaurantById(id) {
  const res = await axiosClient.get(`/api/restaurants/${id}`);
  return res.data.data;
}

/** Get active menu items for a restaurant.
 * @param {string} restaurantId */
export async function getRestaurantMenu(restaurantId) {
  const res = await axiosClient.get(`/api/restaurants/${restaurantId}/menu`);
  return res.data.data;
}
