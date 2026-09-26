import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Compass,
  Navigation,
  MapPin,
  Clock,
  Radio,
  Truck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import OrderTimeline from '../../components/customer/OrderTimeline';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getOrderTimeline, getDriverLocation } from '../../api/trackingApi';
import { getOrderById } from '../../api/orderApi';
import { connect, subscribeToOrder } from '../../websocket/stompClient';
import useAuthStore from '../../store/authStore';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const [isWsConnected, setIsWsConnected] = useState(false);
  const [liveToast, setLiveToast] = useState(null);

  // 1. Order details query
  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    staleTime: 15 * 1000,
  });

  // 2. REST Timeline query
  const {
    data: timelineEvents,
    isLoading: isTimelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => getOrderTimeline(orderId),
    staleTime: 15 * 1000,
  });

  // 3. REST Driver Location query
  const {
    data: driverLocation,
    refetch: refetchDriverLocation,
  } = useQuery({
    queryKey: ['driverLocation', orderId],
    queryFn: () => getDriverLocation(orderId),
    staleTime: 5 * 1000,
  });

  // 4. WebSocket STOMP Live Subscription
  useEffect(() => {
    if (!token || !orderId) return;
    let subscription = null;

    connect(token, {
      onConnect: () => {
        setIsWsConnected(true);
        subscription = subscribeToOrder(orderId, (payload) => {
          // Trigger React Query invalidation
          queryClient.invalidateQueries({ queryKey: ['tracking', orderId] });
          queryClient.invalidateQueries({ queryKey: ['driverLocation', orderId] });
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });

          setLiveToast(
            payload?.status
              ? `Status updated to ${payload.status}`
              : 'Live driver location received'
          );

          setTimeout(() => setLiveToast(null), 4000);
        });
      },
      onError: () => setIsWsConnected(false),
      onDisconnect: () => setIsWsConnected(false),
    });

    return () => {
      if (typeof subscription === 'function') subscription();
      else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [orderId, token, queryClient]);

  if (isTimelineLoading && !order) {
    return (
      <CustomerLayout>
        <LoadingSkeleton text="Connecting to live tracking telemetry..." />
      </CustomerLayout>
    );
  }

  const currentStatus = order?.status || order?.orderStatus || 'CREATED';
  const hasDriver = !!driverLocation && driverLocation.latitude !== undefined;

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Back Link */}
        <Link
          to={`/customer/orders/${orderId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to order details
        </Link>

        {/* Live Notification Toast */}
        {liveToast && (
          <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-600 animate-ping" />
              <span>{liveToast}</span>
            </div>
            <span className="text-[10px] text-orange-500 font-mono">LIVE STOMP</span>
          </div>
        )}

        {/* Header with WS connection status badge */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Live Order Tracking
              </h1>
              <OrderStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">
              ORDER #{order?.orderNumber || orderId?.substring(0, 8).toUpperCase()}
            </p>
          </div>

          {/* STOMP Telemetry Pill */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-semibold text-gray-700">
              {isWsConnected ? 'Telemetry Online' : 'Connecting to Socket...'}
            </span>
          </div>
        </div>

        {/* 2-Column Tracking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Progression Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
              Live Order Milestones
            </h3>
            <OrderTimeline
              events={Array.isArray(timelineEvents) ? timelineEvents : []}
              currentStatus={currentStatus}
            />
          </div>

          {/* Right: Driver Telemetry / Geolocation Box */}
          <div className="space-y-6">
            {/* Driver Status Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Driver Geolocation
                </h3>
                {hasDriver && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 animate-pulse" />
                    GPS Connected
                  </span>
                )}
              </div>

              {hasDriver ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        Delivery Partner En Route
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Dispatched via H3 progressive sweep
                      </p>
                    </div>
                  </div>

                  {/* Coordinates Info */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-gray-400 text-[10px] block">LATITUDE</span>
                      <span className="font-bold text-gray-800">
                        {driverLocation.latitude?.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">LONGITUDE</span>
                      <span className="font-bold text-gray-800">
                        {driverLocation.longitude?.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-2xl text-center space-y-2">
                  <Truck className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-700">
                    Driver Assignment in Progress
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    The backend dispatch engine is scanning nearby delivery partners within the 3km-8km radius.
                  </p>
                </div>
              )}

              {/* Clean Map Placeholder */}
              <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                <MapPin className="w-8 h-8 text-orange-500 mb-1 animate-bounce" />
                <p className="text-xs font-bold text-gray-700">
                  Geospatial Map Visualization
                </p>
                <p className="text-[10px] text-gray-400">
                  Plug-and-play slot for Mapbox / Google Maps tile renderer
                </p>
              </div>
            </div>

            {/* Delivery Destination */}
            {order?.deliveryAddress && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-start gap-3 text-xs text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 block">Deliver to</span>
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
