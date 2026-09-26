/**
 * pricingApi.js
 *
 * Surge pricing endpoint: POST /api/pricing/quote
 *
 * ⚠️  CRITICAL BACKEND COUPLING — READ BEFORE MODIFYING ⚠️
 *
 * The backend's SurgePricingServiceImpl encodes cartId as fields[0] in
 * the HMAC token payload.  OrderServiceImpl then verifies fields[0] against
 * user.getId().  Therefore:
 *
 *   cartId MUST equal the authenticated user's userId, NOT a random UUID.
 *
 * This function accepts restaurantId + delivery coordinates and reads userId
 * from the auth store to enforce this constraint automatically.
 *
 * Token TTL: 120 seconds.  The UI must call POST /api/orders within that window.
 *
 * Request shape:
 *   {
 *     cartId:            string  (= auth_user.userId)
 *     restaurantId:      string
 *     deliveryLatitude:  number
 *     deliveryLongitude: number
 *   }
 *
 * Response (inside data envelope):
 *   {
 *     quoteToken:      string   (HMAC-signed, 120s TTL)  ← backend field name
 *     surgeMultiplier: number
 *     deliveryFee:     number
 *     baseFee:         number
 *     expiresAt:       number   (epoch seconds)
 *   }
 */

import axiosClient from './axiosClient';

/**
 * getPricingQuote — Fetches a surge pricing quote for the current cart.
 *
 * @param {{
 *   userId:            string,
 *   restaurantId:      string,
 *   deliveryLatitude:  number,
 *   deliveryLongitude: number,
 * }} params
 */
export async function getPricingQuote({ userId, restaurantId, deliveryLatitude, deliveryLongitude }) {
  const payload = {
    cartId: userId,          // MUST be userId — backend HMAC coupling
    restaurantId,
    deliveryLatitude,
    deliveryLongitude,
  };

  const res = await axiosClient.post('/api/pricing/quote', payload);
  return res.data.data;
}
