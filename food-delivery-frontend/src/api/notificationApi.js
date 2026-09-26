/**
 * notificationApi.js
 *
 * Backend endpoints under /api/notifications:
 *   GET    /api/notifications            → Paginated list of notifications
 *   PATCH  /api/notifications/{id}/read  → Mark single notification as read
 *   PATCH  /api/notifications/read-all   → Mark all notifications as read
 *   DELETE /api/notifications/{id}       → Delete / archive a notification
 */

import axiosClient from './axiosClient';

/** Get paginated notifications for the authenticated user.
 * @param {{ page?: number, size?: number }} params */
export async function getNotifications(params = {}) {
  const res = await axiosClient.get('/api/notifications', { params });
  return res.data.data;
}

/** Mark a single notification as read (PATCH).
 * @param {string} notificationId */
export async function markAsRead(notificationId) {
  const res = await axiosClient.patch(`/api/notifications/${notificationId}/read`);
  return res.data.data;
}

/** Mark all notifications as read (PATCH). */
export async function markAllAsRead() {
  const res = await axiosClient.patch('/api/notifications/read-all');
  return res.data.data;
}

/** Delete a notification (DELETE).
 * @param {string} notificationId */
export async function deleteNotification(notificationId) {
  const res = await axiosClient.delete(`/api/notifications/${notificationId}`);
  return res.data.data;
}
