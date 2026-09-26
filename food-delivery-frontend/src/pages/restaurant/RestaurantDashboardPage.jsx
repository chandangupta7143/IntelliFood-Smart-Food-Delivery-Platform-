import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Store,
  RefreshCw
} from 'lucide-react';
import RestaurantLayout from '../../layouts/RestaurantLayout';
import { getOwnerDashboardStats, getOwnerOrders, updateOwnerOrderStatus } from '../../api/restaurantOwnerApi';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function RestaurantDashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['ownerStats'],
    queryFn: getOwnerDashboardStats,
    refetchInterval: 15000,
  });

  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['ownerRecentOrders'],
    queryFn: () => getOwnerOrders({ page: 0, size: 5 }),
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOwnerOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerStats'] });
      queryClient.invalidateQueries({ queryKey: ['ownerRecentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['ownerOrders'] });
    }
  });

  const handleQuickAdvance = (order) => {
    let nextStatus = '';
    if (order.status === 'CREATED') nextStatus = 'RESTAURANT_ACCEPTED';
    else if (order.status === 'RESTAURANT_ACCEPTED') nextStatus = 'PREPARING';
    else if (order.status === 'PREPARING') nextStatus = 'READY_FOR_PICKUP';

    if (nextStatus) {
      statusMutation.mutate({ orderId: order.id || order.orderId, status: nextStatus });
    }
  };

  const getActionLabel = (status) => {
    if (status === 'CREATED') return 'Accept Order';
    if (status === 'RESTAURANT_ACCEPTED') return 'Start Preparing';
    if (status === 'PREPARING') return 'Ready for Pickup';
    return null;
  };

  const orders = recentOrdersData?.content || [];

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Store className="w-7 h-7 text-orange-600" />
              {stats?.restaurantName || 'Restaurant Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Live kitchen operations, incoming customer orders, and catalog management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetchStats(); }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </button>
            <Link
              to="/restaurant/menu"
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Dish
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">New Orders</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-gray-900">{stats?.pendingOrders ?? 0}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting acceptance</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">In Kitchen</span>
              <ChefHat className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats?.preparingOrders ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Accepted & Cooking</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Ready Pickup</span>
              <Clock className="w-4 h-4 text-pink-500" />
            </div>
            <div className="text-2xl font-black text-pink-600">{stats?.readyOrders ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Waiting for driver</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-black text-green-600">{stats?.completedOrders ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Delivered to customers</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Dishes</span>
              <ShoppingBag className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-gray-900">{stats?.totalMenuItems ?? 0}</div>
            <Link to="/restaurant/menu" className="text-xs text-orange-600 hover:underline font-medium mt-1 inline-block">
              Manage menu →
            </Link>
          </div>
        </div>

        {/* Live Orders Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Kitchen Queue</h2>
              <p className="text-xs text-gray-500 mt-0.5">Most recent incoming customer orders</p>
            </div>
            <Link
              to="/restaurant/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center"
            >
              View all orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-gray-700">No active kitchen orders</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                When customers place an order for your dishes, they will appear here with live sound and status controls.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Items</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Kitchen Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {orders.map((order) => {
                    const actionLabel = getActionLabel(order.status);
                    return (
                      <tr key={order.id || order.orderId} className="hover:bg-gray-50/75 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-gray-900">
                            #{order.orderNumber || (order.id || '').slice(-6)}
                          </span>
                          <div className="text-[11px] text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-800 max-w-xs truncate">
                            {order.items?.map((it) => `${it.name} x${it.quantity}`).join(', ') || 'Dishes'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-gray-900">
                          ₹{order.pricing?.totalAmount || order.totalAmount || 0}
                        </td>
                        <td className="px-5 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          {actionLabel ? (
                            <button
                              onClick={() => handleQuickAdvance(order)}
                              disabled={statusMutation.isPending}
                              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                            >
                              {actionLabel}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">In Transit / Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RestaurantLayout>
  );
}
