/**
 * recommendationApi.js
 *
 * Backend endpoints under /api/recommendations:
 *   POST /api/recommendations/discover    → RecommendationQueryRequest (deliveryLatitude, deliveryLongitude, page, size)
 *   POST /api/recommendations/event/click → @RequestParam eventId, @RequestParam restaurantId
 */

import axiosClient from './axiosClient';

/** Fetch personalised recommendations for the authenticated user (POST).
 * @param {object} payload */
export async function getRecommendations(payload = {}) {
  const body = {
    deliveryLatitude: payload.deliveryLatitude ?? 18.5204,
    deliveryLongitude: payload.deliveryLongitude ?? 73.8567,
    page: payload.page ?? 0,
    size: payload.size ?? 10,
  };
  const res = await axiosClient.post('/api/recommendations/discover', body);
  return res.data.data;
}

/** Track a recommendation click (POST /api/recommendations/event/click).
 * @param {{ eventId?: string, restaurantId: string }} payload */
export async function trackClick(payload = {}) {
  const res = await axiosClient.post('/api/recommendations/event/click', null, {
    params: {
      eventId: payload.eventId || 'default_event',
      restaurantId: payload.restaurantId,
    },
  });
  return res.data.data;
}
