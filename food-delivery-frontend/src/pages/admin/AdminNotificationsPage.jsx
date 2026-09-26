import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../api/notificationApi';
import useNotificationStore from '../../store/notificationStore';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Radio,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const { unreadCount, decrementUnread, clearUnread } = useNotificationStore();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [page, setPage] = useState(0);

  // Fetch paginated notifications
  const {
    data: notifData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminNotifications', page],
    queryFn: () => getNotifications({ page, size: 25 }),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      decrementUnread();
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      clearUnread();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    }
  });

  const notifications = notifData?.content || [];
  const filteredNotifications = filter === 'UNREAD'
    ? notifications.filter((n) => !n.isRead && !n.read)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRAUD_ALERT':
      case 'CRITICAL':
        return <AlertTriangle className="text-rose-400" size={18} />;
      case 'SYSTEM':
      case 'DISPATCH_ALERT':
        return <Radio className="text-amber-400" size={18} />;
      case 'ORDER_UPDATE':
        return <CheckCircle className="text-blue-400" size={18} />;
      default:
        return <Info className="text-emerald-400" size={18} />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="text-amber-400" size={26} />
              <h1 className="text-2xl font-bold text-white tracking-tight">System & Operations Alerts</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Live broadcast queue, dispatch warnings, and platform health notifications
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || notifications.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            >
              <CheckCheck size={14} className="text-emerald-400" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin text-amber-400' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Broadcasts ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'UNREAD'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Notifications Stream Container */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                message={error.message || 'Failed to load notifications stream'}
                onRetry={refetch}
              />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon="🔔"
                title="No Notifications Found"
                description={
                  filter === 'UNREAD'
                    ? 'All alerts have been read and acknowledged.'
                    : 'Your operations event log is currently clear.'
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-700/60">
              {filteredNotifications.map((n) => {
                const isUnread = !n.isRead && !n.read;
                return (
                  <div
                    key={n.id}
                    className={`p-4 transition flex items-start gap-4 ${
                      isUnread ? 'bg-slate-800/90 border-l-4 border-l-amber-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {n.title || 'System Alert'}
                          </h4>
                          {isUnread && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                              NEW
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 rounded border border-slate-800">
                            {n.type || 'EVENT'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                          <Clock size={12} />
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed break-words">
                        {n.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {isUnread && (
                        <button
                          onClick={() => markReadMutation.mutate(n.id)}
                          disabled={markReadMutation.isPending}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700 transition"
                          title="Mark as Read"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(n.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                        title="Delete Alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
