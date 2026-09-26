/**
 * authApi.js
 *
 * Wrappers for the three authentication endpoints exposed by the backend.
 *
 * Backend contract (from forensic audit):
 *   POST /api/auth/register  → AuthResponse  (HTTP 201)
 *   POST /api/auth/login     → AuthResponse  (HTTP 200)
 *   GET  /api/auth/me        → AuthResponse  (HTTP 200, token field is null)
 *
 * AuthResponse shape:
 *   { token, userId, name, email, role }
 *
 * All responses are wrapped in the platform envelope:
 *   { success, message, data: AuthResponse, timestamp }
 *
 * These functions return the inner `data` object so callers
 * only deal with AuthResponse.
 */

import axiosClient from './axiosClient';

/**
 * Register a new customer account.
 *
 * NOTE: The backend hardcodes ROLE_USER on registration.
 *       Delivery Partner and Admin roles cannot be created via this endpoint.
 *
 * @param {{ name: string, email: string, password: string, phone: string }} payload
 * @returns {Promise<{ token: string, userId: string, name: string, email: string, role: string }>}
 */
export async function register(payload) {
  const response = await axiosClient.post('/api/auth/register', payload);
  // Unwrap the platform envelope — callers only see the AuthResponse
  return response.data.data;
}

/**
 * Authenticate with email + password and receive a JWT.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string, userId: string, name: string, email: string, role: string }>}
 */
export async function login(payload) {
  const response = await axiosClient.post('/api/auth/login', payload);
  return response.data.data;
}

/**
 * Retrieve the currently authenticated user's profile.
 * Uses the JWT already attached by the Axios request interceptor.
 * The returned `token` field from the backend is null for this endpoint.
 *
 * @returns {Promise<{ token: null, userId: string, name: string, email: string, role: string }>}
 */
export async function getMe() {
  const response = await axiosClient.get('/api/auth/me');
  return response.data.data;
}
