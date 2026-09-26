import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, ShieldAlert, Package, Radio } from 'lucide-react';
import DeliveryLayout from '../../layouts/DeliveryLayout';
import EmptyState from '../../components/common/EmptyState';
import { NotificationSkeleton } from '../../components/common/LoadingSkeleton';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notificationApi';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { connect, subscribeToNotifications } from '../../websocket/stompClient';

export default function DeliveryNotificationsPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const { clearUnread, decrementUnread, addLiveNotification } = useNotificationStore();

  const {
    data: notifPage,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['delivery-notifications'],
    queryFn: () => getNotifications({ page: 0, size: 20 }),
    staleTime: 15000,
  });

  const notifications = notifPage?.content || [];

  // WebSocket Live Subscription
  useEffect(() => {
    if (!token) return;
    let unsub = null;
    connect(token, {
      onConnect: () => {
        unsub = subscribeToNotifications((payload) => {
          addLiveNotification(payload);
          queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
        });
      },
    });

    return () => {
      if (unsub?.unsubscribe) unsub.unsubscribe();
    };
  }, [token, addLiveNotification, queryClient]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      clearUnread();
      queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
    } catch {
      clearUnread();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
    } catch {}
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-500" />
              <span>Dispatch & Order Alerts</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Live broadcast feed for order offers, reassignment alerts, and system notices
            </p>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-2 rounded-xl transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon="🔔"
                title="No Notifications Yet"
                description="You will receive alerts here when orders are matched to your location or if system dispatch notifies you."
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                    !n.isRead ? 'bg-orange-50/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        !n.isRead ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {n.title || 'Dispatch Alert'}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                      {n.createdAt && (
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg transition"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeliveryLayout>
  );
}
