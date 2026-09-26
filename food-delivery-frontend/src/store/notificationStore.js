/**
 * notificationStore.js — Zustand Notification Store
 *
 * Manages real-time in-memory notification state.
 * Persisted notifications are fetched from the backend via React Query
 * (GET /api/notifications).  This store only holds the live WebSocket
 * notifications that arrive during the current session and the unread badge count.
 */

import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  /** Live notifications received via WebSocket during this session */
  liveNotifications: [],
  /** Total unread count (from backend GET /api/notifications on mount) */
  unreadCount: 0,

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * addLiveNotification — Called by the WebSocket handler when a new
   * notification arrives at /user/queue/notifications.
   */
  addLiveNotification: (notification) => {
    set((state) => ({
      liveNotifications: [notification, ...state.liveNotifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },

  /**
   * setUnreadCount — Synced from the paginated backend response on mount.
   */
  setUnreadCount: (count) => set({ unreadCount: count }),

  /**
   * decrementUnread — Called when user marks a single notification as read.
   */
  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  /**
   * clearUnread — Called when user marks ALL notifications as read.
   */
  clearUnread: () => set({ unreadCount: 0 }),

  /**
   * clearLive — Clear session notifications on logout.
   */
  clearLive: () => set({ liveNotifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
