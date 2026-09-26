import axiosClient from './axiosClient';

// --- Profile & Status ---
export async function getOwnerRestaurant() {
  const res = await axiosClient.get('/api/restaurant-owner/restaurant');
  return res.data.data;
}

export async function updateOwnerRestaurant(data) {
  const res = await axiosClient.put('/api/restaurant-owner/restaurant', data);
  return res.data.data;
}

export async function toggleRestaurantStatus(isOpen) {
  const res = await axiosClient.patch(`/api/restaurant-owner/restaurant/status?isOpen=${isOpen}`);
  return res.data.data;
}

// --- Menu CRUD ---
export async function getOwnerMenu() {
  const res = await axiosClient.get('/api/restaurant-owner/menu');
  return res.data.data;
}

export async function createMenuItem(data) {
  const res = await axiosClient.post('/api/restaurant-owner/menu', data);
  return res.data.data;
}

export async function updateMenuItem(itemId, data) {
  const res = await axiosClient.put(`/api/restaurant-owner/menu/${itemId}`, data);
  return res.data.data;
}

export async function deleteMenuItem(itemId) {
  const res = await axiosClient.delete(`/api/restaurant-owner/menu/${itemId}`);
  return res.data.data;
}

export async function toggleMenuItemAvailability(itemId, available) {
  const res = await axiosClient.patch(`/api/restaurant-owner/menu/${itemId}/availability?available=${available}`);
  return res.data.data;
}

// --- Orders ---
export async function getOwnerOrders(params = {}) {
  const res = await axiosClient.get('/api/restaurant-owner/orders', { params });
  return res.data.data;
}

export async function getOwnerOrderById(orderId) {
  const res = await axiosClient.get(`/api/restaurant-owner/orders/${orderId}`);
  return res.data.data;
}

export async function updateOwnerOrderStatus(orderId, status) {
  const res = await axiosClient.patch(`/api/restaurant-owner/orders/${orderId}/status`, { status });
  return res.data.data;
}

// --- Dashboard Stats ---
export async function getOwnerDashboardStats() {
  const res = await axiosClient.get('/api/restaurant-owner/dashboard/stats');
  return res.data.data;
}
