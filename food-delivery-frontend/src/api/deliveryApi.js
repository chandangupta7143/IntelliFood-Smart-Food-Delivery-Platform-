/**
 * deliveryApi.js
 *
 * Backend endpoints under /api/delivery (ROLE_DELIVERY_PARTNER + ROLE_ADMIN):
 *   PATCH /api/delivery/availability       → Update status ("ONLINE" | "OFFLINE")
 *   POST  /api/delivery/location           → Push current GPS fix (latitude, longitude)
 *   GET   /api/delivery/assigned-order     → Retrieve assigned delivery / partner state
 *   POST  /api/delivery/orders/{id}/accept → Accept an assigned order
 *   POST  /api/delivery/orders/{id}/reject → Reject an assigned order
 *
 * Order status transition:
 *   PATCH /api/vendor/orders/{id}/status   → Update order status (OUT_FOR_DELIVERY, DELIVERED)
 */

import axiosClient from './axiosClient';

/** Update delivery partner availability (PATCH /api/delivery/availability).
 * @param {'ONLINE' | 'OFFLINE'} status */
export async function updateAvailability(status) {
  const res = await axiosClient.patch('/api/delivery/availability', { status });
  return res.data.data;
}

/** Push live GPS coordinates (POST /api/delivery/location).
 * @param {{ latitude: number, longitude: number }} coords */
export async function updateLocation(coords) {
  const res = await axiosClient.post('/api/delivery/location', {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
  });
  return res.data.data;
}

/** Get assigned order / current partner status (GET /api/delivery/assigned-order). */
export async function getAssignedOrder() {
  const res = await axiosClient.get('/api/delivery/assigned-order');
  return res.data.data;
}

/** Accept an order assignment (POST /api/delivery/orders/{orderId}/accept).
 * @param {string} orderId */
export async function acceptOrder(orderId) {
  const res = await axiosClient.post(`/api/delivery/orders/${orderId}/accept`);
  return res.data.data;
}

/** Reject an order assignment (POST /api/delivery/orders/{orderId}/reject).
 * @param {string} orderId */
export async function rejectOrder(orderId) {
  const res = await axiosClient.post(`/api/delivery/orders/${orderId}/reject`);
  return res.data.data;
}

/** Transition order status (PATCH /api/vendor/orders/{id}/status).
 * @param {string} orderId
 * @param {'OUT_FOR_DELIVERY' | 'DELIVERED'} status */
export async function updateDeliveryOrderStatus(orderId, status) {
  const res = await axiosClient.patch(`/api/vendor/orders/${orderId}/status`, { status });
  return res.data.data;
}
