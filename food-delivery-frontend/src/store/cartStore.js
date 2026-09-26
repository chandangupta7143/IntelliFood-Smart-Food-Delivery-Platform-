/**
 * cartStore.js — Zustand Cart Store
 *
 * Manages the in-memory shopping cart. Cart items represent real dishes
 * fetched from the MongoDB menu_items collection.
 *
 * Cart state is intentionally NOT persisted to localStorage — a stale cart
 * with an expired surge quote token would cause checkout failures anyway.
 */

import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  /** Active restaurant context — all items must belong to the same restaurant */
  restaurantId: null,
  restaurantName: null,
  /** Array of { itemId, name, price, quantity } */
  items: [],

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * addItem — Adds a menu item to the cart.
   * If items from a different restaurant already exist, clears cart first.
   *
   * @param {{ itemId, name, price }} menuItem
   * @param {string} restaurantId
   * @param {string} restaurantName
   */
  addItem: (menuItem, restaurantId, restaurantName) => {
    const { items, restaurantId: currentRestaurantId } = get();

    let updatedItems = items;

    // Different restaurant — clear cart first (like Swiggy/Zomato behaviour)
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
      updatedItems = [];
    }

    const existing = updatedItems.find((i) => i.itemId === menuItem.itemId);

    if (existing) {
      updatedItems = updatedItems.map((i) =>
        i.itemId === menuItem.itemId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      updatedItems = [...updatedItems, { ...menuItem, quantity: 1 }];
    }

    set({ items: updatedItems, restaurantId, restaurantName });
  },

  /**
   * removeItem — Removes an item completely from the cart.
   */
  removeItem: (itemId) => {
    const updated = get().items.filter((i) => i.itemId !== itemId);
    const reset   = updated.length === 0;
    set({
      items: updated,
      restaurantId:   reset ? null : get().restaurantId,
      restaurantName: reset ? null : get().restaurantName,
    });
  },

  /**
   * updateQuantity — Sets an item's quantity. If quantity <= 0, removes the item.
   */
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.itemId === itemId ? { ...i, quantity } : i
      ),
    });
  },

  /**
   * clearCart — Empties the cart entirely.
   */
  clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

  /**
   * getSubtotal — Calculates the sum of (price × quantity) for all items.
   * Does NOT include taxes, platform fee, or delivery fee (those come from backend).
   */
  getSubtotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  /**
   * getItemCount — Total quantity of all items in cart.
   */
  getItemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),

  /**
   * toOrderItems — Converts cart items to the shape the backend expects:
   *   [{ itemId: string, quantity: number }]
   */
  toOrderItems: () =>
    get().items.map(({ itemId, quantity }) => ({ itemId, quantity })),
}));

export default useCartStore;
