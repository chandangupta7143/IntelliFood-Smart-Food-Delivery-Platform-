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

/** Get nearby restaurants using H3 geo-index.
 * @param {{ lat: number, lng: number, radiusKm?: number }} params */
export async function getNearbyRestaurants(params) {
  const res = await axiosClient.get('/api/restaurants/nearby', { params });
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
