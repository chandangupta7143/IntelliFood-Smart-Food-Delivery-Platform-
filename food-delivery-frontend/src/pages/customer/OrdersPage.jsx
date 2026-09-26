import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import { OrderRowSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { getMyOrders } from '../../api/orderApi';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'my-orders', page],
    queryFn: () => getMyOrders({ page, size: 10 }),
    staleTime: 30 * 1000,
  });

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const renderItemsSummary = (items) => {
    if (!items || items.length === 0) return 'Meal Order';
    const firstItem = items[0];
    const firstName = firstItem.name || 'Dish';
    if (items.length === 1) {
      return `${firstName} × ${firstItem.quantity || 1}`;
    }
    return `${firstName} × ${firstItem.quantity || 1} + ${items.length - 1} more`;
  };

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-orange-500" />
              Your Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {totalElements > 0
                ? `You have placed ${totalElements} orders with IntelliFood`
                : 'Track, view details, and review your past meals'}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <OrderRowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load orders"
            message={error.response?.data?.message || 'Could not connect to the order service.'}
            onRetry={refetch}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No orders yet"
            description="You haven't placed any food delivery orders yet. Explore top restaurants near you to make your first order!"
            action={{
              label: 'Discover Food',
              onClick: () => navigate('/customer/restaurants'),
            }}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderId = order.id || order.orderId;
              const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recently';

              const orderStatus = order.status || order.orderStatus || 'CREATED';
              const orderTotal = order.pricing?.finalPayable || order.totalAmount || order.finalAmount || 0;
              const isActive = [
                'CREATED',
                'PENDING_REVIEW',
                'RESTAURANT_ACCEPTED',
                'PREPARING',
                'READY_FOR_PICKUP',
                'OUT_FOR_DELIVERY',
              ].includes(orderStatus);

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all duration-150 space-y-4"
                >
                  {/* Row 1: Order ID, Date, and Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-400 block">
                        ORDER #{order.orderNumber || orderId?.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{formattedDate}</span>
                    </div>

                    <OrderStatusBadge status={orderStatus} />
                  </div>

                  {/* Row 2: Items Summary & Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      {order.restaurantName && (
                        <p className="text-xs font-bold text-orange-600">
                          {order.restaurantName}
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-900">
                        {renderItemsSummary(order.items)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.deliveryAddress || 'Delivered to your address'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block">Total Amount</span>
                      <span className="text-base font-black text-gray-900">
                        ₹{orderTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                      to={`/customer/orders/${orderId}`}
                      className="text-xs font-bold text-gray-700 hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 transition"
                    >
                      View Details
                    </Link>

                    {isActive && (
                      <Link
                        to={`/customer/orders/${orderId}/tracking`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl shadow-xs transition"
                      >
                        <Compass className="w-3.5 h-3.5 animate-spin" />
                        Track Order
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
