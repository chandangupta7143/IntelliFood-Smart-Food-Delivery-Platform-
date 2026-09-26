import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { getDashboardStats, getAdminOrders } from '../../api/adminApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bike,
  Store,
  Zap,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isFetching: statsFetching
  } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 15000,
  });

  const {
    data: recentOrdersData,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['adminRecentOrders'],
    queryFn: () => getAdminOrders({ page: 0, size: 5 }),
    refetchInterval: 15000,
  });

  if (statsLoading && !stats) {
    return (
      <AdminLayout>
        <div className="p-8">
          <LoadingSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (statsError) {
    return (
      <AdminLayout>
        <div className="p-8">
          <ErrorState message={statsError.message || 'Failed to load operational statistics'} onRetry={refetchStats} />
        </div>
      </AdminLayout>
    );
  }

  const recentOrders = recentOrdersData?.content || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Operations Overview</h1>
            <p className="text-sm text-slate-400">Live platform telemetry and dispatch metrics</p>
          </div>
          <button
            onClick={() => refetchStats()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={statsFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Operational Attention Banners */}
        {stats?.pendingReviewOrders > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-400 shrink-0" size={22} />
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  {stats.pendingReviewOrders} Order(s) Awaiting Fraud Clearance
                </p>
                <p className="text-xs text-amber-400/80">Automated fraud engine flagged transactions for review</p>
              </div>
            </div>
            <Link
              to="/admin/fraud"
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition"
            >
              Open Queue
            </Link>
          </div>
        )}

        {stats?.surgeEmergencyDisabled && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-rose-400 shrink-0" size={22} />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  Emergency Surge Pricing Killswitch Active
                </p>
                <p className="text-xs text-rose-400/80">Dynamic surge algorithms are suspended across all zones</p>
              </div>
            </div>
            <Link
              to="/admin/pricing"
              className="px-3 py-1 bg-rose-500 text-white font-bold text-xs rounded-lg hover:bg-rose-400 transition"
            >
              Manage Surge
            </Link>
          </div>
        )}

        {/* Core KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
              <ShoppingBag size={18} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalOrders ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Platform lifetime volume</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active In-Flight</span>
              <RefreshCw size={18} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats?.activeOrders ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Kitchen / Delivery transit</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Delivered</span>
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats?.deliveredOrders ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Completed fulfillments</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Revenue Collected</span>
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">₹{stats?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
            <div className="text-xs text-slate-500 mt-1">Completed order gross value</div>
          </div>
        </div>

        {/* Secondary Fleet & Catalog Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Fleet Drivers</p>
              <p className="text-lg font-bold text-white mt-1">
                {stats?.onlineDrivers ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalDrivers ?? 0} total</span>
              </p>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sky-400">
              <Bike size={20} />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Restaurants</p>
              <p className="text-lg font-bold text-white mt-1">
                {stats?.activeRestaurants ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalRestaurants ?? 0} registered</span>
              </p>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-indigo-400">
              <Store size={20} />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Cancelled / Rejected</p>
              <p className="text-lg font-bold text-slate-300 mt-1">
                {stats?.cancelledOrders ?? 0}
              </p>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-rose-400">
              <XCircle size={20} />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Surge Engine</p>
              <p className="text-lg font-bold mt-1">
                {stats?.surgeEmergencyDisabled ? (
                  <span className="text-rose-400">DISABLED</span>
                ) : (
                  <span className="text-emerald-400">ONLINE</span>
                )}
              </p>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-amber-400">
              <Zap size={20} />
            </div>
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/orders"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition flex items-center justify-between text-xs font-semibold text-slate-200"
          >
            <span>All Orders</span>
            <ArrowUpRight size={14} className="text-slate-400" />
          </Link>
          <Link
            to="/admin/delivery"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition flex items-center justify-between text-xs font-semibold text-slate-200"
          >
            <span>Fleet Management</span>
            <ArrowUpRight size={14} className="text-slate-400" />
          </Link>
          <Link
            to="/admin/fraud"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition flex items-center justify-between text-xs font-semibold text-slate-200"
          >
            <span>Fraud Queue</span>
            <ArrowUpRight size={14} className="text-slate-400" />
          </Link>
          <Link
            to="/admin/system"
            className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800 transition flex items-center justify-between text-xs font-semibold text-slate-200"
          >
            <span>Diagnostics</span>
            <ArrowUpRight size={14} className="text-slate-400" />
          </Link>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent System Orders</h2>
            <Link to="/admin/orders" className="text-xs text-amber-400 hover:underline font-semibold">
              View All Orders →
            </Link>
          </div>
          {ordersLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Loading recent order activity...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No orders recorded in database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {recentOrders.map((order) => (
                    <tr key={order.id || order.orderId} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-200">
                        #{(order.id || order.orderId).slice(-6)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {order.userId?.slice(-6) || 'Guest'}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        ₹{order.pricing?.finalPayable ?? 0}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {order.paymentMethod} ({order.paymentStatus})
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/orders?highlight=${order.id || order.orderId}`}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs transition"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
