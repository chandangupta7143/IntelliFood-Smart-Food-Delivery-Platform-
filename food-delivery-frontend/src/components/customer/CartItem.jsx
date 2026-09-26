import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import useCartStore from '../../store/cartStore';

export default function CartItem({ item, className = '' }) {
  const { updateQuantity, removeItem } = useCartStore();

  if (!item) return null;

  const itemTotal = item.price * item.quantity;

  return (
    <div className={`flex items-center justify-between p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gray-200 transition gap-3 ${className}`}>
      {/* Emoji & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
          {item.emoji || '🍽️'}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
            {item.name}
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-500">
            ₹{item.price} each
          </p>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center bg-gray-100 rounded-xl p-0.5 shrink-0">
        <button
          type="button"
          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
          className="p-1 hover:bg-white text-gray-600 rounded-lg transition"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center text-xs font-bold text-gray-800 select-none">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
          className="p-1 hover:bg-white text-gray-600 rounded-lg transition"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Item Total */}
      <div className="text-right shrink-0 min-w-[60px]">
        <div className="text-xs sm:text-sm font-extrabold text-gray-900">
          ₹{itemTotal}
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => removeItem(item.itemId)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
