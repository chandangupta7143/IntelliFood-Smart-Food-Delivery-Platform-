/**
 * axiosClient.js
 *
 * Centralised Axios instance for all API communication with the Spring Boot backend.
 *
 * Request interceptor  — Automatically attaches "Authorization: Bearer <JWT>" to
 *                         every outgoing request when a token is present in
 *                         localStorage.  Controllers do NOT need to know anything
 *                         about token management.
 *
 * Response interceptor — On HTTP 401 (Unauthenticated): clears auth storage,
 *                         resets Zustand auth state, and redirects to /login.
 *                         HTTP 403 (Forbidden) is intentionally NOT handled here —
 *                         403 means the user IS authenticated but NOT authorised;
 *                         the individual page / component decides what to show.
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// Base instance
// ---------------------------------------------------------------------------
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. http://localhost:8082
  timeout: 15_000,                             // 15 s hard timeout per request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR — attach JWT
// ---------------------------------------------------------------------------
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR — handle 401
// ---------------------------------------------------------------------------
axiosClient.interceptors.response.use(
  // 2xx — pass straight through
  (response) => response,

  // Non-2xx — inspect status code
  (error) => {
    if (error.response?.status === 401) {
      // Clear persisted auth credentials
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Reset Zustand auth store without importing the store directly
      // (avoids circular-dependency issues); store listens to localStorage changes
      // via its restoreAuth() call on mount, but we also dispatch a custom event
      // so any mounted component can react immediately.
      window.dispatchEvent(new Event('auth:logout'));

      // Redirect to login — only if not on public pages to avoid redirect loops
      const isPublicPage = window.location.pathname === '/' ||
                           window.location.pathname === '/about' ||
                           window.location.pathname.startsWith('/login') ||
                           window.location.pathname.startsWith('/register');
      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }

    // 403: authenticated but not authorised — let the caller handle it
    // All other errors: propagate as-is so callers can inspect them
    return Promise.reject(error);
  },
);

export default axiosClient;
