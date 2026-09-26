import React from 'react';
import { Bell, Package, Tag, Check, Trash2 } from 'lucide-react';

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  className = '',
}) {
  if (!notification) return null;

  const { id, title, message, type, isRead, createdAt } = notification;

  const getIcon = () => {
    switch (type) {
      case 'ORDER_UPDATE':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'PROMOTION':
        return <Tag className="w-4 h-4 text-pink-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const timeFormatted = createdAt
    ? new Date(createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <div
      className={`group flex items-start justify-between p-4 rounded-2xl border transition-all duration-150 gap-3 ${
        isRead
          ? 'bg-white border-gray-100 text-gray-600'
          : 'bg-orange-50/40 border-orange-200/80 text-gray-900 shadow-xs'
      } ${className}`}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isRead ? 'bg-gray-100' : 'bg-white shadow-xs border border-orange-100'
        }`}
      >
        {getIcon()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`text-xs sm:text-sm font-bold truncate ${
              isRead ? 'text-gray-700' : 'text-gray-900'
            }`}
          >
            {title}
          </h4>
          {!isRead && (
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {message}
        </p>
        <span className="text-[10px] text-gray-400 mt-2 block font-medium">
          {timeFormatted}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {!isRead && onMarkRead && (
          <button
            type="button"
            onClick={() => onMarkRead(id)}
            title="Mark as read"
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            title="Delete notification"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
