import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import NotificationItem from '../../components/customer/NotificationItem';
import { NotificationSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notificationApi';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { connect, subscribeToNotifications } from '../../websocket/stompClient';

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    unreadCount,
    setUnreadCount,
    decrementUnread,
    clearUnread,
    addLiveNotification,
  } = useNotificationStore();

  const [page, setPage] = useState(0);

  // REST query for notifications
  const {
    data: notifData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications({ page, size: 20 }),
    staleTime: 30 * 1000,
  });

  const notifications = notifData?.content || [];
  const totalPages = notifData?.totalPages || 0;

  // Sync unread count
  useEffect(() => {
    if (notifications.length > 0) {
      const unread = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications, setUnreadCount]);

  // STOMP WebSocket live updates
  useEffect(() => {
    if (!token) return;
    let unsub = null;

    connect(token, {
      onConnect: () => {
        unsub = subscribeToNotifications((payload) => {
          addLiveNotification(payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });
      },
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      else if (unsub && typeof unsub.unsubscribe === 'function') unsub.unsubscribe();
    };
  }, [token, queryClient, addLiveNotification]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      clearUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      clearUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-3xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                <Bell className="w-7 h-7 text-orange-500" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Order status changes, driver dispatches, and system updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load notifications"
            message={error.response?.data?.message || 'Could not connect to the notifications service.'}
            onRetry={refetch}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications yet"
            description="You are all caught up! Order updates and announcements will appear here."
          />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
