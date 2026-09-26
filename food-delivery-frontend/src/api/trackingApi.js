/**
 * trackingApi.js
 *
 * Backend endpoints under /api/tracking:
 *   GET /api/tracking/orders/{orderId}/timeline        → Order event timeline
 *   GET /api/tracking/orders/{orderId}/driver-location → Latest driver GPS fix
 */

import axiosClient from './axiosClient';

/** Get the event timeline for an order.
 * @param {string} orderId */
export async function getOrderTimeline(orderId) {
  const res = await axiosClient.get(`/api/tracking/orders/${orderId}/timeline`);
  return res.data.data;
}

/** Get the driver's last known location.
 * @param {string} orderId */
export async function getDriverLocation(orderId) {
  const res = await axiosClient.get(`/api/tracking/orders/${orderId}/driver-location`);
  return res.data.data;
}
