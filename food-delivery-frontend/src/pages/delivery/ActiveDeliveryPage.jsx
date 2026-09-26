import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Store,
  Phone,
  Navigation,
  CheckCircle2,
  Package,
  AlertCircle,
  ArrowLeft,
  Clock,
  HelpCircle,
} from 'lucide-react';
import DeliveryLayout from '../../layouts/DeliveryLayout';
import DeliveryStatusTimeline from '../../components/delivery/DeliveryStatusTimeline';
import LocationSharingControl from '../../components/delivery/LocationSharingControl';
import EmptyState from '../../components/common/EmptyState';
import OrderIssueModal from '../../components/common/OrderIssueModal';
import { getAssignedOrder, rejectOrder } from '../../api/deliveryApi';
import { getOrderTimeline } from '../../api/trackingApi';
import { getOrderById } from '../../api/orderApi';

export default function ActiveDeliveryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isCancellingTrip, setIsCancellingTrip] = useState(false);

  // Fetch partner state
  const {
    data: partner,
    isLoading: isPartnerLoading,
  } = useQuery({
    queryKey: ['assigned-order'],
    queryFn: getAssignedOrder,
    refetchInterval: 6000,
  });

  const activeOrderId = partner?.currentOrderId;

  // Fetch full order details
  const {
    data: orderDetails,
  } = useQuery({
    queryKey: ['active-order-details', activeOrderId],
    queryFn: () => getOrderById(activeOrderId),
    enabled: !!activeOrderId,
    refetchInterval: 8000,
  });

  // Fetch timeline / order events for this order
  const {
    data: timelineEvents,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['order-timeline', activeOrderId],
    queryFn: () => getOrderTimeline(activeOrderId),
    enabled: !!activeOrderId,
    refetchInterval: 10000,
  });

  // Determine current status from timeline or default to READY_FOR_PICKUP
  const latestEvent = timelineEvents && timelineEvents.length > 0 ? timelineEvents[timelineEvents.length - 1] : null;
  const currentStatus = latestEvent?.status || (partner?.status === 'ON_DELIVERY' ? (orderDetails?.status || 'READY_FOR_PICKUP') : 'READY_FOR_PICKUP');

  const isPrePickup = currentStatus === 'READY_FOR_PICKUP' || currentStatus === 'PREPARING';

  const handleStatusTransitioned = () => {
    queryClient.invalidateQueries({ queryKey: ['assigned-order'] });
    queryClient.invalidateQueries({ queryKey: ['active-order-details', activeOrderId] });
    queryClient.invalidateQueries({ queryKey: ['order-timeline', activeOrderId] });
  };

  const handleCancelPickup = async () => {
    if (!window.confirm('Cancel this pickup trip? The order will be unassigned and returned to the driver pool.')) {
      return;
    }
    setIsCancellingTrip(true);
    try {
      await rejectOrder(activeOrderId);
      queryClient.invalidateQueries({ queryKey: ['assigned-order'] });
      navigate('/delivery');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel pickup trip');
    } finally {
      setIsCancellingTrip(false);
    }
  };

  // If no active delivery is assigned
  if (!activeOrderId || partner?.status === 'OFFLINE') {
    return (
      <DeliveryLayout partnerStatus={partner?.status || 'ONLINE'}>
        <div className="py-12">
          <EmptyState
            icon="🚚"
            title="No Active Delivery"
            description="You do not currently have an active delivery trip in progress. Check the Dashboard for incoming assignments."
            action={{
              label: 'Go to Dashboard',
              onClick: () => navigate('/delivery'),
            }}
          />
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout partnerStatus={partner?.status || 'ON_DELIVERY'}>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/delivery')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            {isPrePickup && (
              <button
                type="button"
                onClick={handleCancelPickup}
                disabled={isCancellingTrip}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-xl transition"
              >
                <span>{isCancellingTrip ? 'Cancelling...' : 'Cancel Pickup Trip'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowIssueModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Report Issue / Help</span>
            </button>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              TRIP ID: #{activeOrderId.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Hero Card: Route Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Delivery Trip in Progress
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">
                Active Order #{orderDetails?.orderNumber || activeOrderId.slice(-8).toUpperCase()}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-gray-400 block">Trip Earning</span>
              <span className="text-lg font-black text-emerald-600">₹65.00</span>
            </div>
          </div>

          {/* Route Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Pickup Station */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider">
                  <Store className="w-4 h-4" />
                  <span>1. Pickup From Restaurant</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
                  Step 1
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                {orderDetails?.restaurantName || 'Kitchen Partner'}
              </h4>
              <p className="text-xs text-gray-600">
                Order Items to collect: {orderDetails?.items?.length ? orderDetails.items.map(it => `${it.quantity}x ${it.name}`).join(', ') : 'Check order packet'}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(orderDetails?.restaurantName || 'Restaurant')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-white hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-lg transition"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* 2. Customer Destination */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>2. Deliver To Customer</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                  Step 2
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Customer Drop Location</h4>
              <p className="text-xs text-gray-600 font-medium">
                {orderDetails?.deliveryAddress || 'Doorstep Delivery (Contactless preferred)'}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Customer</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Status Transition Control Card */}
        <div>
          <DeliveryStatusTimeline
            orderId={activeOrderId}
            currentStatus={currentStatus}
            onStatusTransitioned={handleStatusTransitioned}
          />
        </div>

        {/* GPS Live Streaming Control */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Trip GPS Broadcasting
          </h3>
          <LocationSharingControl
            partner={partner}
            onLocationUpdated={handleStatusTransitioned}
          />
        </div>

        {/* Operational Issue Escalation Modal */}
        {activeOrderId && (
          <OrderIssueModal
            isOpen={showIssueModal}
            onClose={() => setShowIssueModal(false)}
            orderId={activeOrderId}
            role="DELIVERY_PARTNER"
            onSuccess={() => {
              handleStatusTransitioned();
            }}
          />
        )}
      </div>
    </DeliveryLayout>
  );
}
