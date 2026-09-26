import axiosClient from './axiosClient';

// --- Dashboard ---
export async function getDashboardStats() {
  const res = await axiosClient.get('/api/admin/dashboard/stats');
  return res.data.data;
}

// --- Orders ---
export async function getAdminOrders(params = { page: 0, size: 20 }) {
  const res = await axiosClient.get('/api/admin/orders', { params });
  return res.data.data;
}

export async function getAdminOrderById(id) {
  const res = await axiosClient.get(`/api/orders/${id}`);
  return res.data.data;
}

export async function adminReviewFraud(id, payload) {
  const res = await axiosClient.patch(`/api/admin/orders/${id}/fraud-review`, payload);
  return res.data.data;
}

export async function adminForceCancelOrder(id) {
  const res = await axiosClient.patch(`/api/admin/orders/${id}/force-cancel`);
  return res.data.data;
}

export async function adminUpdateOrderStatus(id, status) {
  const res = await axiosClient.patch(`/api/vendor/orders/${id}/status`, { status });
  return res.data.data;
}

// --- Delivery ---
export async function getAdminDrivers(params = { page: 0, size: 20 }) {
  const res = await axiosClient.get('/api/admin/delivery/drivers', { params });
  return res.data.data;
}

export async function adminForceAssignDriver(orderId, driverId) {
  const res = await axiosClient.post(`/api/admin/delivery/assign?orderId=${encodeURIComponent(orderId)}`, { driverId });
  return res.data.data;
}

export async function adminSuspendDriver(driverId) {
  const res = await axiosClient.patch(`/api/admin/delivery/${driverId}/suspend`);
  return res.data.data;
}

export async function adminUnsuspendDriver(driverId) {
  const res = await axiosClient.patch(`/api/admin/delivery/${driverId}/unsuspend`);
  return res.data.data;
}

// --- Fraud ---
export async function getAdminFraudQueue() {
  const res = await axiosClient.get('/api/admin/fraud/queue');
  return res.data.data;
}

export async function adminApproveFraudCase(orderId, reason) {
  const res = await axiosClient.post(`/api/admin/fraud/cases/${orderId}/approve`, { reason });
  return res.data.data;
}

export async function adminRejectFraudCase(orderId, reason) {
  const res = await axiosClient.post(`/api/admin/fraud/cases/${orderId}/reject`, { reason });
  return res.data.data;
}

export async function adminRestrictUser(userId, payload) {
  const res = await axiosClient.post(`/api/admin/fraud/users/${userId}/restrict`, payload);
  return res.data;
}

export async function getDailyFraudMetrics(date) {
  const params = date ? { date } : {};
  const res = await axiosClient.get('/api/admin/fraud/analytics/daily', { params });
  return res.data.data;
}

// --- Surge Pricing ---
export async function getAdminSurgeStatus() {
  const res = await axiosClient.get('/api/admin/surge/status');
  return res.data.data;
}

export async function adminCreateSurgeOverride(payload) {
  const res = await axiosClient.post('/api/admin/surge/overrides', payload);
  return res.data.data;
}

export async function adminDeleteSurgeOverride(overrideId) {
  const res = await axiosClient.delete(`/api/admin/surge/overrides/${overrideId}`);
  return res.data;
}

export async function adminSetEmergencySurgeDisable(disable, zoneName) {
  const params = { disable };
  if (zoneName) params.zoneName = zoneName;
  const res = await axiosClient.post('/api/admin/surge/emergency-disable', null, { params });
  return res.data;
}

export async function testPricingQuote(payload) {
  const res = await axiosClient.post('/api/pricing/quote', payload);
  return res.data.data;
}

// --- Restaurants ---
export async function getAdminRestaurants(params = { page: 0, size: 20 }) {
  const res = await axiosClient.get('/api/admin/restaurants', { params });
  return res.data.data;
}

export async function getAdminRestaurantById(id) {
  const res = await axiosClient.get(`/api/admin/restaurants/${id}`);
  return res.data.data;
}

export async function adminCreateRestaurant(payload) {
  const res = await axiosClient.post('/api/admin/restaurants', payload);
  return res.data.data;
}

export async function adminUpdateRestaurant(id, payload) {
  const res = await axiosClient.put(`/api/admin/restaurants/${id}`, payload);
  return res.data.data;
}

export async function adminActivateRestaurant(id) {
  const res = await axiosClient.patch(`/api/admin/restaurants/${id}/activate`);
  return res.data;
}

export async function adminDeactivateRestaurant(id) {
  const res = await axiosClient.patch(`/api/admin/restaurants/${id}/deactivate`);
  return res.data;
}

export async function adminVerifyRestaurant(id) {
  const res = await axiosClient.patch(`/api/admin/restaurants/${id}/verify`);
  return res.data;
}

export async function adminDeleteRestaurant(id) {
  const res = await axiosClient.delete(`/api/admin/restaurants/${id}`);
  return res.data;
}

// --- System ---
export async function getAdminSystemStatus() {
  const res = await axiosClient.get('/api/admin/system/status');
  return res.data.data;
}
