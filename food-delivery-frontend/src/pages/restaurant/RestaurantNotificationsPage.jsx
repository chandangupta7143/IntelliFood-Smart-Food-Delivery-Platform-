import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import RestaurantLayout from '../../layouts/RestaurantLayout';
import { getNotifications, markAllAsRead } from '../../api/notificationApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function RestaurantNotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return (
    <RestaurantLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7 text-orange-600" />
              Kitchen Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time order alerts, delivery updates, and platform notices
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8"><LoadingSkeleton /></div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">No notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                When new customer orders arrive or status changes occur, they will be listed here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    notif.isRead ? 'bg-white' : 'bg-orange-50/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{notif.title}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RestaurantLayout>
  );
}
