/**
 * stompClient.js — WebSocket / STOMP Foundation
 *
 * Provides a singleton STOMP client backed by SockJS that:
 *   1. Connects to the backend WebSocket endpoint
 *   2. Sends the JWT on the STOMP CONNECT frame (required by StompChannelInterceptor)
 *   3. Exposes reusable subscribe helpers for order tracking and notifications
 *
 * Backend WebSocket configuration (from forensic audit):
 *   Endpoint : /ws-tracker  (SockJS enabled)
 *   Broker   : /topic (broadcast), /queue (user), /user (user-destination prefix)
 *   Auth     : JWT required in STOMP CONNECT header "Authorization: Bearer <token>"
 *
 * Subscription paths:
 *   /topic/orders/{orderId}           — Order status & driver location updates
 *   /user/queue/notifications          — Private notifications per user
 *
 * Usage:
 *   import { connect, disconnect, subscribeToOrder, subscribeToNotifications } from './stompClient';
 *
 *   connect(token, {
 *     onConnect: () => { ... },
 *     onError:   (e) => { ... },
 *   });
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ── Singleton STOMP client ─────────────────────────────────────────────────
let stompClient = null;

/**
 * connect — Creates and activates a STOMP client.
 * If already connected, returns immediately.
 *
 * @param {string} token        - JWT Bearer token from auth store
 * @param {Object} callbacks
 * @param {Function} callbacks.onConnect  - Called when STOMP session is established
 * @param {Function} callbacks.onError    - Called on STOMP / SockJS errors
 * @param {Function} callbacks.onDisconnect - Called on clean disconnection
 */
export function connect(token, { onConnect, onError, onDisconnect } = {}) {
  if (!token) {
    return;
  }
  if (stompClient?.connected) {
    onConnect?.();
    return;
  }

  stompClient = new Client({
    // SockJS transport factory — connects to the backend SockJS endpoint
    webSocketFactory: () =>
      new SockJS(import.meta.env.VITE_WS_URL),

    // STOMP CONNECT frame headers — JWT is REQUIRED by StompChannelInterceptor
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    // Reconnect delay: 5 seconds on unexpected disconnection
    reconnectDelay: 5000,

    // Debug logging (disable in production builds)
    debug: (msg) => {
      if (import.meta.env.DEV) {
        console.debug('[STOMP]', msg);
      }
    },

    onConnect: (frame) => {
      console.info('[STOMP] Connected:', frame.headers?.server ?? 'OK');
      onConnect?.(frame);
    },

    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers?.message, frame.body);
      onError?.(frame);
    },

    onDisconnect: () => {
      console.info('[STOMP] Disconnected');
      onDisconnect?.();
    },

    onWebSocketClose: (evt) => {
      console.warn('[STOMP] WebSocket closed:', evt?.code, evt?.reason);
    },
  });

  stompClient.activate();
}

/**
 * disconnect — Gracefully deactivates the STOMP client.
 */
export function disconnect() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

/**
 * subscribeToOrder — Subscribes to order status + driver location updates.
 *
 * Topic: /topic/orders/{orderId}
 * Authorisation: Backend verifies subscriber is the order owner, assigned driver, or ADMIN.
 *
 * @param {string}   orderId
 * @param {Function} callback  - Receives the parsed JSON payload
 * @returns {Object} STOMP subscription object (call .unsubscribe() to clean up)
 */
export function subscribeToOrder(orderId, callback) {
  if (!stompClient?.connected) {
    console.warn('[STOMP] subscribeToOrder called before connection is ready');
    return null;
  }

  return stompClient.subscribe(`/topic/orders/${orderId}`, (message) => {
    try {
      const payload = JSON.parse(message.body);
      callback(payload);
    } catch {
      console.error('[STOMP] Failed to parse order message:', message.body);
    }
  });
}

/**
 * subscribeToNotifications — Subscribes to user-specific notification queue.
 *
 * Topic: /user/queue/notifications
 * The STOMP broker prepends the authenticated user's identity automatically.
 *
 * @param {Function} callback  - Receives the parsed JSON notification payload
 * @returns {Object} STOMP subscription object
 */
export function subscribeToNotifications(callback) {
  if (!stompClient?.connected) {
    console.warn('[STOMP] subscribeToNotifications called before connection is ready');
    return null;
  }

  return stompClient.subscribe('/user/queue/notifications', (message) => {
    try {
      const payload = JSON.parse(message.body);
      callback(payload);
    } catch {
      console.error('[STOMP] Failed to parse notification message:', message.body);
    }
  });
}

/**
 * isConnected — Returns true if the STOMP client is currently connected.
 */
export function isConnected() {
  return !!stompClient?.connected;
}
