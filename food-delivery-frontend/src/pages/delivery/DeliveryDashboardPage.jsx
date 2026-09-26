import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Truck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Navigation,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import DeliveryLayout from '../../layouts/DeliveryLayout';
import AvailabilityToggle from '../../components/delivery/AvailabilityToggle';
import DeliveryStats from '../../components/delivery/DeliveryStats';
import DeliveryOrderCard from '../../components/delivery/DeliveryOrderCard';
import LocationSharingControl from '../../components/delivery/LocationSharingControl';
import {
  getAssignedOrder,
  acceptOrder,
  rejectOrder,
} from '../../api/deliveryApi';
import useAuthStore from '../../store/authStore';

export default function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Polling partner state every 5 seconds for rapid assignment detection
  const {
    data: partner,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assigned-order'],
    queryFn: getAssignedOrder,
    refetchInterval: (query) => (query?.state?.data?.status === 'OFFLINE' ? false : 5000),
  });

  const handleAcceptOffer = async (orderId) => {
    setIsAccepting(true);
    setActionError('');
    try {
      await acceptOrder(orderId);
      await queryClient.invalidateQueries({ queryKey: ['assigned-order'] });
      // Navigate to the active delivery experience
      navigate('/delivery/active');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept order assignment');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectOffer = async (orderId) => {
    setIsRejecting(true);
    setActionError('');
    try {
      await rejectOrder(orderId);
      await queryClient.invalidateQueries({ queryKey: ['assigned-order'] });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to decline order assignment');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <DeliveryLayout partnerStatus={partner?.status || 'ONLINE'}>
      <div className="space-y-6">
        {/* Top Header Card: Greeting & Availability Toggle */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Welcome, {user?.name || 'Partner'}!
              </h1>
              <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                Driver Mode
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Vehicle Type: <strong className="text-gray-700">{partner?.vehicleType || 'MOTORCYCLE'}</strong> | Zone: <strong className="text-gray-700">Pune Metro</strong>
            </p>
          </div>

          {/* Availability Toggle Component */}
          <div className="shrink-0">
            <AvailabilityToggle
              initialStatus={partner?.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'}
              onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['assigned-order'] })}
            />
          </div>
        </div>

        {/* Global Action Error Banner */}
        {actionError && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Status-Driven Hero Section */}

        {/* 1. If Driver has an incoming order offer (status === 'BUSY') */}
        {partner?.status === 'BUSY' && partner?.currentOrderId && (
          <div className="space-y-3">
            <DeliveryOrderCard
              orderId={partner.currentOrderId}
              consecutiveRejections={partner.consecutiveRejections || 0}
              onAccept={handleAcceptOffer}
              onReject={handleRejectOffer}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
            />
          </div>
        )}

        {/* 2. If Driver is currently on an active delivery (status === 'ON_DELIVERY') */}
        {partner?.status === 'ON_DELIVERY' && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Truck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-blue-200 block">
                  Active Delivery In Progress
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  Order #{partner.currentOrderId ? partner.currentOrderId.slice(-8).toUpperCase() : 'ACTIVE'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Pickup and drop-off instructions are ready for navigation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/delivery/active')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition shrink-0"
            >
              <span>View Trip & Navigate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. If Driver is Suspended */}
        {partner?.status === 'SUSPENDED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base">Account Suspended by Auto-Dispatcher</h3>
              <p className="text-xs text-rose-600">
                You reached 3 consecutive order rejections or timeouts. In accordance with system dispatch policy, your profile is temporarily paused. Contact administrative dispatch to unsuspend your profile.
              </p>
            </div>
          </div>
        )}

        {/* 4. If Driver is Online with no active order */}
        {partner?.status === 'ONLINE' && (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-30" />
              <Radio className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-gray-900 text-base">You are Online & Ready</h3>
              <p className="text-xs text-gray-500 mt-1">
                The smart geospatial assignment engine is searching for nearby restaurant pickup orders in your zone. Keep GPS streaming active for priority matching.
              </p>
            </div>
          </div>
        )}

        {/* 5. If Driver is Offline */}
        {partner?.status === 'OFFLINE' && (
          <div className="bg-gray-100 rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              You are currently Off Duty
            </p>
            <p className="text-xs text-gray-500">
              Toggle your availability switch to ONLINE at the top right to start receiving dispatch assignments.
            </p>
          </div>
        )}

        {/* Driver Performance Metrics */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Performance Overview
          </h2>
          <DeliveryStats partner={partner} />
        </div>

        {/* GPS Location Stream Control */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Real-time Telemetry & GPS
          </h2>
          <LocationSharingControl
            partner={partner}
            onLocationUpdated={() => queryClient.invalidateQueries({ queryKey: ['assigned-order'] })}
          />
        </div>
      </div>
    </DeliveryLayout>
  );
}
