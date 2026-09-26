import React, { useState } from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function MenuItemCard({
  item,
  restaurantId,
  restaurantName,
  className = '',
}) {
  const { items, restaurantId: cartRestaurantId, restaurantName: cartRestaurantName, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  if (!item) return null;

  const cartItem = items.find((i) => i.itemId === item.itemId);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAddClick = () => {
    // Check if cart has items from another restaurant
    if (cartRestaurantId && cartRestaurantId !== restaurantId && items.length > 0) {
      setShowReplaceModal(true);
      return;
    }
    addItem(item, restaurantId, restaurantName);
  };

  const handleConfirmReplace = () => {
    clearCart();
    addItem(item, restaurantId, restaurantName);
    setShowReplaceModal(false);
  };

  return (
    <>
      <div className={`flex items-start justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-150 gap-4 ${className}`}>
        {/* Left item details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Veg / Non-veg marker */}
            <span
              className={`w-3.5 h-3.5 border-2 rounded-xs flex items-center justify-center shrink-0 ${
                item.isVeg ? 'border-emerald-600' : 'border-red-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              />
            </span>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1">
              {item.name}
            </h4>
          </div>

          <div className="font-extrabold text-orange-600 text-sm mb-2">
            ₹{item.price}
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Right visual & Quantity control */}
        <div className="flex flex-col items-center shrink-0 gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-3xl sm:text-4xl shadow-xs select-none">
            {item.emoji || '🍽️'}
          </div>

          {quantity > 0 ? (
            <div className="flex items-center bg-orange-500 text-white rounded-xl shadow-sm overflow-hidden px-1 py-0.5">
              <button
                type="button"
                onClick={() => updateQuantity(item.itemId, quantity - 1)}
                className="p-1 hover:bg-orange-600 active:bg-orange-700 rounded-lg transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => addItem(item, restaurantId, restaurantName)}
                className="p-1 hover:bg-orange-600 active:bg-orange-700 rounded-lg transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddClick}
              className="px-4 py-1.5 bg-white hover:bg-orange-50 active:bg-orange-100 border border-orange-400 text-orange-600 font-bold text-xs rounded-xl shadow-xs hover:shadow transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          )}
        </div>
      </div>

      {/* Replace Cart Confirmation Modal */}
      <Modal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="Replace cart items?"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-600">
            Your cart contains items from <strong>{cartRestaurantName || 'another restaurant'}</strong>.
            Do you want to discard them and add items from <strong>{restaurantName}</strong>?
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowReplaceModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirmReplace}
            >
              Replace Cart
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
