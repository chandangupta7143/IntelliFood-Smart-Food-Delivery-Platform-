/**
 * authStore.js — Zustand Authentication Store
 *
 * Client-side auth state management.
 * Persists the JWT and user profile in localStorage.
 *
 * Storage keys (match the backend audit contract):
 *   auth_token  — JWT Bearer token
 *   auth_user   — JSON { userId, name, email, role }
 *
 * IMPORTANT:
 *   This store manages CLIENT state only.
 *   The backend is ALWAYS the final authority on authentication and roles.
 *   Any protected action must be validated server-side.
 */

import { create } from 'zustand';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

const useAuthStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  token: null,
  user: null,   // { userId, name, email, role }

  // ── Computed helpers ─────────────────────────────────────────────────────
  isAuthenticated: () => !!get().token,

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * setAuth — Called after a successful login or register response.
   * Persists token + minimal user info to localStorage.
   *
   * @param {{ token: string, userId: string, name: string, email: string, role: string }} authResponse
   */
  setAuth: (authResponse) => {
    const { token, userId, name, email, role } = authResponse;
    const user = { userId, name, email, role };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({ token, user });
  },

  /**
   * login — Alias for setAuth; used explicitly after POST /api/auth/login.
   */
  login: (authResponse) => {
    get().setAuth(authResponse);
  },

  /**
   * logout — Clears token and user from state and localStorage.
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  /**
   * restoreAuth — Reads persisted credentials from localStorage and
   * rehydrates the store.  Call this once on application mount.
   */
  restoreAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    if (token && raw) {
      try {
        const user = JSON.parse(raw);
        set({ token, user });
      } catch {
        // Corrupted localStorage — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },
}));

// ── Listen for the 401 logout event dispatched by Axios interceptor ───────
// This allows the store to reset even when the logout happens outside React.
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout();
});

export default useAuthStore;
