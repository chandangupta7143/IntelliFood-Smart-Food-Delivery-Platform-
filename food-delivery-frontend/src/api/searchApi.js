/**
 * searchApi.js
 *
 * Backend endpoint: POST /api/search
 *
 * Request body (AdvancedSearchRequest):
 *   latitude: number (required)
 *   longitude: number (required)
 *   searchMode: 'DISCOVERY' | 'TEXT_SEARCH' (required)
 *   query?: string
 *   radiusInKm?: number
 *   cuisines?: string[]
 *   minRating?: number
 *   maxDeliveryTime?: number
 *   priceRanges?: number[]
 *   isVegetarian?: boolean
 *   sortBy?: string
 *   page?: number
 *   size?: number
 */

import axiosClient from './axiosClient';

/** Advanced search with backend-required defaults.
 * @param {object} payload */
export async function search(payload = {}) {
  const requestBody = {
    latitude: payload.latitude ?? 18.5204,
    longitude: payload.longitude ?? 73.8567,
    searchMode: payload.searchMode || (payload.query?.trim() ? 'TEXT_SEARCH' : 'DISCOVERY'),
    radiusInKm: payload.radiusInKm ?? 10.0,
    page: payload.page ?? 0,
    size: payload.size ?? 20,
    ...(payload.query && { query: payload.query }),
    ...(payload.cuisines?.length && { cuisines: payload.cuisines }),
    ...(payload.minRating && { minRating: payload.minRating }),
    ...(payload.maxDeliveryTime && { maxDeliveryTime: payload.maxDeliveryTime }),
    ...(payload.priceRanges?.length && { priceRanges: payload.priceRanges }),
    ...(payload.isVegetarian !== undefined && { isVegetarian: payload.isVegetarian }),
    ...(payload.sortBy && { sortBy: payload.sortBy }),
  };

  const res = await axiosClient.post('/api/search', requestBody);
  return res.data.data;
}
