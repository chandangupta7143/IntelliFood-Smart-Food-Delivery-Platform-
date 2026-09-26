/**
 * orderApi.js
 *
 * Backend endpoints under /api/orders:
 *   POST   /api/orders                  → Create order (requires Idempotency-Key header)
 *   GET    /api/orders                  → List current user's orders (paginated: page, size)
 *   GET    /api/orders/{id}             → Get order by ID
 *   PATCH  /api/orders/{id}/cancel      → Cancel order
 */

import axiosClient from './axiosClient';

/**
 * createOrder — POST /api/orders
 *
 * @param {{
 *   restaurantId: string,
 *   items: Array<{ itemId: string, quantity: number }>,
 *   deliveryAddress: string,
 *   deliveryLatitude: number,
 *   deliveryLongitude: number,
 *   paymentMethod: string,
 *   orderSource: string,
 *   quoteToken?: string,
 *   surgeMultiplier?: number,
 *   recommendationEventId?: string,
 * }} payload
 * @param {string} idempotencyKey
 */
export async function createOrder(payload, idempotencyKey) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  const res = await axiosClient.post('/api/orders', payload, { headers });
  return res.data.data;
}

/** Get paginated orders for the authenticated user.
 * @param {{ page?: number, size?: number }} params */
export async function getMyOrders(params = { page: 0, size: 10 }) {
  const res = await axiosClient.get('/api/orders', { params });
  return res.data.data;
}

/** Get a single order by ID.
 * @param {string} orderId */
export async function getOrderById(orderId) {
  const res = await axiosClient.get(`/api/orders/${orderId}`);
  return res.data.data;
}

/** Cancel an order (PATCH /api/orders/{id}/cancel).
 * @param {string} orderId */
export async function cancelOrder(orderId) {
  const res = await axiosClient.patch(`/api/orders/${orderId}/cancel`);
  return res.data.data;
}

/** Report an operational issue or escalation for an order (POST /api/orders/{id}/issues).
 * @param {string} orderId
 * @param {{ category: string, description: string }} payload */
export async function reportOrderIssue(orderId, payload) {
  const res = await axiosClient.post(`/api/orders/${orderId}/issues`, payload);
  return res.data.data;
}

/** Get issues reported for an order (GET /api/orders/{id}/issues).
 * @param {string} orderId */
export async function getOrderIssues(orderId) {
  const res = await axiosClient.get(`/api/orders/${orderId}/issues`);
  return res.data.data;
}
