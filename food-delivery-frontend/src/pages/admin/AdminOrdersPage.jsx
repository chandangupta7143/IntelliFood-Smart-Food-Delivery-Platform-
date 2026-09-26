import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminOrders,
  getAdminOrderById,
  adminForceCancelOrder,
  adminUpdateOrderStatus,
  adminReviewFraud
} from '../../api/adminApi';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  MapPin,
  Check
} from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'PENDING_REVIEW', label: 'Fraud Hold' },
  { key: 'CREATED', label: 'Created' },
  { key: 'PREPARING', label: 'Kitchen' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'OUT_FOR_DELIVERY', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [reviewReason, setReviewReason] = useState('');

  // Fetch paginated orders
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminOrders', selectedStatus, page],
    queryFn: () => getAdminOrders({
      page,
      size: 15,
      ...(selectedStatus ? { status: selectedStatus } : {})
    }),
    refetchInterval: 15000,
  });

  // Force Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (orderId) => adminForceCancelOrder(orderId),
    onSuccess: (updatedOrder) => {
      setActionSuccess('Order force-cancelled successfully.');
      setActiveModalOrder(updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || 'Failed to force-cancel order.');
    }
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => adminUpdateOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      setActionSuccess('Order status transitioned successfully.');
      setActiveModalOrder(updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || 'Failed to transition order status.');
    }
  });

  // Fraud Review mutation
  const fraudMutation = useMutation({
    mutationFn: ({ orderId, approved, reason }) => adminReviewFraud(orderId, { approved, reason }),
    onSuccess: (updatedOrder) => {
      setActionSuccess('Fraud review decision submitted.');
      setActiveModalOrder(updatedOrder);
      setReviewReason('');
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminFraudQueue'] });
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || 'Failed to record fraud review decision.');
    }
  });

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;
  const totalElements = ordersData?.totalElements || 0;

  // Filter client-side for search term by ID
  const filteredOrders = searchTerm
    ? orders.filter(o => (o.id || o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : orders;

  const openOrderDetails = async (order) => {
    setActionError('');
    setActionSuccess('');
    setReviewReason('');
    try {
      // Fetch fresh full order details
      const fresh = await getAdminOrderById(order.id || order.orderId);
      setActiveModalOrder(fresh);
    } catch {
      setActiveModalOrder(order);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Order Operations & Dispatch</h1>
            <p className="text-sm text-slate-400">
              Audit, inspect, and manage real transactions across the platform ({totalElements} total)
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Status Filtering Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800">
          {STATUS_TABS.map((tab) => {
            const active = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(0);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Meta Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-xs text-slate-400 self-end sm:self-auto">
            Showing <span className="font-semibold text-white">{filteredOrders.length}</span> of{' '}
            <span className="font-semibold text-white">{totalElements}</span> orders
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error.message || 'Failed to load order list'} onRetry={refetch} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders found"
            description={selectedStatus ? `No orders with status ${selectedStatus}` : 'No orders recorded yet.'}
          />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Restaurant ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payable</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredOrders.map((order) => {
                    const orderId = order.id || order.orderId;
                    const isHighlighted = highlightId && orderId.includes(highlightId);
                    return (
                      <tr
                        key={orderId}
                        className={`hover:bg-slate-900/50 transition ${isHighlighted ? 'bg-amber-500/10' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-100">
                          #{orderId.slice(-6)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {order.userId ? order.userId.slice(-6) : 'Guest'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {order.restaurantId ? order.restaurantId.slice(-6) : '--'}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 font-bold text-white">
                          ₹{order.pricing?.finalPayable ?? 0}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {order.paymentMethod}
                          <span
                            className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {order.deliveryPartnerId ? order.deliveryPartnerId.slice(-6) : (
                            <span className="text-slate-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Page <span className="text-white font-semibold">{page + 1}</span> of{' '}
                  <span className="text-white font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Details & Operations Modal */}
        {activeModalOrder && (
          <Modal
            isOpen={!!activeModalOrder}
            onClose={() => setActiveModalOrder(null)}
            title={`Order Audit #${(activeModalOrder.id || activeModalOrder.orderId).slice(-8)}`}
            size="lg"
          >
            <div className="space-y-5 text-xs text-slate-300">
              {/* Alert Feedback */}
              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                  {actionSuccess}
                </div>
              )}

              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Current Status:</span>
                  <OrderStatusBadge status={activeModalOrder.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Payment:</span>
                  <span className="font-bold text-white">
                    {activeModalOrder.paymentMethod} ({activeModalOrder.paymentStatus})
                  </span>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">
                  Ordered Items ({activeModalOrder.items?.length || 0})
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-2.5">Item ID</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeModalOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-slate-200">{item.itemId}</td>
                          <td className="p-2.5 text-slate-300">{item.quantity}</td>
                          <td className="p-2.5 text-slate-400">₹{item.priceAtOrder ?? '--'}</td>
                          <td className="p-2.5 text-right font-semibold text-white">
                            ₹{(item.priceAtOrder || 0) * item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span className="text-slate-200">₹{activeModalOrder.pricing?.itemsSubtotal ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="text-slate-200">₹{activeModalOrder.pricing?.deliveryFee ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform Fee:</span>
                  <span className="text-slate-200">₹{activeModalOrder.pricing?.platformFee ?? 0}</span>
                </div>
                {activeModalOrder.pricing?.surgeMultiplier > 1 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Surge Surcharge ({activeModalOrder.pricing.surgeMultiplier}x):</span>
                    <span>+₹{activeModalOrder.pricing.surgeAmount ?? 0}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Payable:</span>
                  <span className="text-amber-400">₹{activeModalOrder.pricing?.finalPayable ?? 0}</span>
                </div>
              </div>

              {/* Delivery Address & Coordinates */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <MapPin size={14} className="text-amber-400" />
                  <span>Delivery Destination</span>
                </div>
                <p className="text-slate-200">{activeModalOrder.deliveryAddress || 'Address on file'}</p>
                {activeModalOrder.deliveryLatitude && (
                  <p className="text-slate-500 font-mono text-[10px]">
                    Lat: {activeModalOrder.deliveryLatitude}, Lng: {activeModalOrder.deliveryLongitude}
                  </p>
                )}
              </div>

              {/* Status History Timeline */}
              {activeModalOrder.statusHistory?.length > 0 && (
                <div>
                  <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">
                    Status History Log ({activeModalOrder.statusHistory.length} events)
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeModalOrder.statusHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-900/40 rounded border border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-500" />
                          <span className="font-semibold text-slate-200">{hist.status}</span>
                          <span className="text-slate-500">by {hist.actorType || hist.actorId}</span>
                        </div>
                        <span className="text-slate-500 font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Review Action Panel (if in PENDING_REVIEW) */}
              {activeModalOrder.status === 'PENDING_REVIEW' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldAlert size={16} />
                    <span>Fraud Clearance Required</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter mandatory audit review reason (min 10 characters)..."
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={reviewReason.trim().length < 10 || fraudMutation.isPending}
                      onClick={() =>
                        fraudMutation.mutate({
                          orderId: activeModalOrder.id || activeModalOrder.orderId,
                          approved: true,
                          reason: reviewReason
                        })
                      }
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition disabled:opacity-40"
                    >
                      Approve Order (Clear Hold)
                    </button>
                    <button
                      disabled={reviewReason.trim().length < 10 || fraudMutation.isPending}
                      onClick={() =>
                        fraudMutation.mutate({
                          orderId: activeModalOrder.id || activeModalOrder.orderId,
                          approved: false,
                          reason: reviewReason
                        })
                      }
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs transition disabled:opacity-40"
                    >
                      Reject Order (Fraud)
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Operational Override Controls */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Advance Status:</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        statusMutation.mutate({
                          orderId: activeModalOrder.id || activeModalOrder.orderId,
                          status: e.target.value
                        });
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>
                      Select status...
                    </option>
                    <option value="RESTAURANT_ACCEPTED">RESTAURANT_ACCEPTED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>

                {activeModalOrder.status !== 'DELIVERED' && activeModalOrder.status !== 'CANCELLED' && (
                  <button
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to FORCE CANCEL this order?')) {
                        cancelMutation.mutate(activeModalOrder.id || activeModalOrder.orderId);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold transition"
                  >
                    <AlertOctagon size={14} />
                    <span>Force Cancel Order</span>
                  </button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
