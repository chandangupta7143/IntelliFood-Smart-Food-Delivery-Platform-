import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  Bike,
  HelpCircle,
} from 'lucide-react';
import RestaurantLayout from '../../layouts/RestaurantLayout';
import { getOwnerOrders, updateOwnerOrderStatus } from '../../api/restaurantOwnerApi';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import OrderIssueModal from '../../components/common/OrderIssueModal';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'CREATED', label: 'New Orders' },
  { key: 'RESTAURANT_ACCEPTED', label: 'Accepted' },
  { key: 'PREPARING', label: 'In Kitchen' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'DELIVERED', label: 'Completed' },
];

export default function RestaurantOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [issueModalOrder, setIssueModalOrder] = useState(null);

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['ownerOrders', selectedStatus, page],
    queryFn: () => getOwnerOrders({
      page,
      size: 15,
      ...(selectedStatus ? { status: selectedStatus } : {})
    }),
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOwnerOrderStatus(orderId, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['ownerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['ownerStats'] });
      if (activeModalOrder && (activeModalOrder.id === updated.id || activeModalOrder.orderId === updated.id)) {
        setActiveModalOrder(updated);
      }
    }
  });

  const handleStatusChange = (orderId, targetStatus) => {
    statusMutation.mutate({ orderId, status: targetStatus });
  };

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 1;

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-orange-600" />
              Kitchen Order Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Process customer food orders through preparation milestones
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Orders
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border-b border-gray-200 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50/50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders List / Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <LoadingSkeleton />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center">
              <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">No orders found in this category</h3>
              <p className="text-xs text-gray-500 mt-1">
                When customer orders enter this status stage, they will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Placed At</th>
                    <th className="px-5 py-3.5">Food Items</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-right">Kitchen Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {orders.map((order) => {
                    const orderId = order.id || order.orderId;
                    return (
                      <tr key={orderId} className="hover:bg-gray-50/75 transition-colors">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setActiveModalOrder(order)}
                            className="font-mono text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                          >
                            #{order.orderNumber || orderId.slice(-6)}
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <div className="text-[10px] text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-900 font-semibold max-w-sm truncate">
                            {order.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'Dishes'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-gray-900">
                          ₹{order.pricing?.totalAmount || order.totalAmount || 0}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <OrderStatusBadge status={order.status} />
                            {order.responsibleParty && (
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                Custody: {order.responsibleParty}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {order.status === 'CREATED' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(orderId, 'RESTAURANT_ACCEPTED')}
                                disabled={statusMutation.isPending}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(orderId, 'REJECTED')}
                                disabled={statusMutation.isPending}
                                className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {order.status === 'RESTAURANT_ACCEPTED' && (
                            <button
                              onClick={() => handleStatusChange(orderId, 'PREPARING')}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                            >
                              Start Cooking
                            </button>
                          )}

                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => handleStatusChange(orderId, 'READY_FOR_PICKUP')}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                            >
                              Food is Ready
                            </button>
                          )}

                          {order.status === 'READY_FOR_PICKUP' && (
                            <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">
                              Driver Assignment Active
                            </span>
                          )}

                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">
                              In Transit by Driver
                            </span>
                          )}

                          {order.status === 'DELIVERED' && (
                            <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-1 rounded-md">
                              ✓ Delivered
                            </span>
                          )}

                          {order.deliveryPartnerId && (
                            <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center justify-end gap-1">
                              <Bike className="w-3 h-3" /> Driver: #{order.deliveryPartnerId.slice(-6)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {activeModalOrder && (
          <Modal
            isOpen={!!activeModalOrder}
            onClose={() => setActiveModalOrder(null)}
            title={`Order #${activeModalOrder.orderNumber || (activeModalOrder.id || '').slice(-6)} Details`}
            size="lg"
          >
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="text-xs text-gray-400">Order Status & Custody</div>
                  <div className="flex items-center gap-2 mt-1">
                    <OrderStatusBadge status={activeModalOrder.status} />
                    {activeModalOrder.responsibleParty && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Custody: {activeModalOrder.responsibleParty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Placed At</div>
                  <div className="text-xs font-bold">{new Date(activeModalOrder.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dishes to Prepare</h4>
                <div className="bg-gray-50 rounded-xl p-3 divide-y divide-gray-200">
                  {activeModalOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice}</div>
                      </div>
                      <div className="font-bold text-gray-900">₹{item.totalPrice}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Driver Info if assigned */}
              {activeModalOrder.deliveryPartnerId && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <Bike className="w-4 h-4 text-blue-600" />
                    <span>Assigned Delivery Partner</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-900">
                    #{activeModalOrder.deliveryPartnerId}
                  </span>
                </div>
              )}

              {/* Delivery Address */}
              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <div className="text-xs font-bold text-orange-800 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address
                </div>
                <div className="text-xs text-gray-700">
                  {typeof activeModalOrder.deliveryAddress === 'string'
                    ? activeModalOrder.deliveryAddress
                    : activeModalOrder.deliveryAddress?.street || 'Customer Address'}
                </div>
              </div>

              {/* Price Summary */}
              <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{activeModalOrder.pricing?.subtotal || activeModalOrder.subtotal || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₹{activeModalOrder.pricing?.deliveryFee || activeModalOrder.deliveryFee || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total Paid:</span>
                  <span className="text-orange-600">₹{activeModalOrder.pricing?.totalAmount || activeModalOrder.totalAmount || 0}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIssueModalOrder(activeModalOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Report Issue to Operations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalOrder(null)}
                  className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Operational Issue Escalation Modal */}
        {issueModalOrder && (
          <OrderIssueModal
            isOpen={!!issueModalOrder}
            onClose={() => setIssueModalOrder(null)}
            orderId={issueModalOrder.id || issueModalOrder.orderId}
            orderNumber={issueModalOrder.orderNumber}
            role="RESTAURANT"
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['ownerOrders'] });
            }}
          />
        )}
      </div>
    </RestaurantLayout>
  );
}
