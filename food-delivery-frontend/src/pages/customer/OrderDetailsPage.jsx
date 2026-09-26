import React, { useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  X,
} from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import OrderTimeline from '../../components/customer/OrderTimeline';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import OrderIssueModal from '../../components/common/OrderIssueModal';
import { getOrderById, cancelOrder } from '../../api/orderApi';

const CANCELLABLE_STATUSES = [
  'CREATED',
  'PENDING_REVIEW',
];

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNewOrder = location.state?.isNewOrder;
  const initialOrderData = location.state?.order;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    initialData: initialOrderData,
    staleTime: 15 * 1000,
  });

  if (isLoading && !order) {
    return (
      <CustomerLayout>
        <LoadingSkeleton text="Loading order details..." />
      </CustomerLayout>
    );
  }

  if (error && !order) {
    return (
      <CustomerLayout>
        <ErrorState
          title="Order not found"
          message={error.response?.data?.message || 'Could not find details for this order.'}
          onRetry={refetch}
        />
      </CustomerLayout>
    );
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setCancelError('');
    try {
      await cancelOrder(orderId);
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel order. Kitchen may have already prepared it.');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStatus = order.status || order.orderStatus || 'CREATED';
  const orderTotal = order.pricing?.finalPayable || order.totalAmount || order.finalAmount || 0;
  const subtotal = order.pricing?.subtotal || order.subtotal || (orderTotal > 50 ? orderTotal - 50 : 0);
  const deliveryFee = order.pricing?.deliveryFee || order.deliveryFee || 40;
  const platformFee = order.pricing?.platformFee || 10;
  const surgeFee = order.pricing?.surgeFee || 0;

  const isCancellable = CANCELLABLE_STATUSES.includes(currentStatus);
  const isActive = [
    'CREATED',
    'PENDING_REVIEW',
    'RESTAURANT_ACCEPTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
  ].includes(currentStatus);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Back Link */}
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all orders
        </Link>

        {/* Order Placed Success Banner */}
        {isNewOrder && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-emerald-900">
                🎉 Order Placed Successfully!
              </h3>
              <p className="text-xs text-emerald-700">
                Your order is currently being processed by the restaurant.
              </p>
            </div>
          </div>
        )}

        {/* Top Card: Order Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                #{order.orderNumber || orderId?.substring(0, 8).toUpperCase()}
              </h1>
              <OrderStatusBadge status={currentStatus} />
              {order.responsibleParty && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  order.responsibleParty === 'RESTAURANT' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                  order.responsibleParty === 'DELIVERY_PARTNER' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  order.responsibleParty === 'CUSTOMER' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  order.responsibleParty === 'ADMIN_SUPPORT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <span>Custody:</span>
                  <span className="uppercase">{order.responsibleParty.replace('_', ' ')}</span>
                </span>
              )}
            </div>
            {order.restaurantName && (
              <p className="text-xs font-bold text-orange-600 mt-1">
                {order.restaurantName}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">Placed on {formattedDate}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold text-gray-700 hover:bg-gray-50 border-gray-300"
              onClick={() => setShowIssueModal(true)}
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1" />
              Need Help?
            </Button>

            {isActive && (
              <Link
                to={`/customer/orders/${orderId}/tracking`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Compass className="w-4 h-4 animate-spin" />
                Live Tracking
              </Link>
            )}

            {isCancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold text-red-600 hover:bg-red-50 border-red-200"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Left (Timeline + Items) + Right (Pricing & Delivery) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Timeline & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Order Status Progression
              </h3>
              <OrderTimeline currentStatus={order.orderStatus} />
            </div>

            {/* Items Ordered */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                Items in Order ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-gray-50">
                {order.items?.map((item, idx) => {
                  const itemName = item.name || 'Dish';
                  const itemUnitPrice = item.unitPrice || 0;
                  const itemTotal = item.totalPrice || (itemUnitPrice * (item.quantity || 1));
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none">
                          🍽️
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">
                            {itemName}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            ₹{itemUnitPrice} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900">
                        ₹{itemTotal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Delivery Address */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                Price Breakdown
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-gray-900">
                    ₹{deliveryFee.toFixed(2)}
                  </span>
                </div>
                {surgeFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Surge Fee Included</span>
                    <span className="font-semibold">₹{surgeFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-gray-900">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Final Total</span>
                  <span className="text-orange-600 text-base">
                    ₹{orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                Delivery Details
              </h3>
              <div className="flex items-start gap-2.5 text-xs text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{order.deliveryAddress || 'Address on file'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-2 border-t border-gray-50">
                <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  Payment:{' '}
                  <strong className="text-gray-800 uppercase">
                    {order.paymentMethod || 'UPI'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
        size="sm"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            Are you sure you want to cancel order <strong>#{orderId?.substring(0, 8)}</strong>?
            This action cannot be undone.
          </p>

          {cancelError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {cancelError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="ghost"
              className="flex-1 text-xs"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              className="flex-1 text-xs"
              isLoading={isCancelling}
              onClick={handleCancelOrder}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Support & Issue Escalation Modal */}
      <OrderIssueModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        orderId={orderId}
        orderNumber={order?.orderNumber}
        role="CUSTOMER"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }}
      />
    </CustomerLayout>
  );
}
