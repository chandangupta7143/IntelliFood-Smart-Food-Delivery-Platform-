import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  CheckCircle,
  Calendar,
  AlertCircle,
  Info,
  Award,
  Clock,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import DeliveryLayout from '../../layouts/DeliveryLayout';
import DeliveryStats from '../../components/delivery/DeliveryStats';
import { getAssignedOrder } from '../../api/deliveryApi';

export default function DeliveryHistoryPage() {
  const { data: partner, isLoading } = useQuery({
    queryKey: ['assigned-order'],
    queryFn: getAssignedOrder,
    staleTime: 30000,
  });

  const estimatedEarnings = (partner?.totalAccepted || 0) * 65;

  return (
    <DeliveryLayout partnerStatus={partner?.status || 'ONLINE'}>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6 text-orange-500" />
              <span>Delivery Trip History & Earnings</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Lifetime performance metrics and completed delivery ledger
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Estimated Total Payout (₹65 base/trip)
              </span>
              <span className="text-lg font-black text-emerald-800">
                ₹{estimatedEarnings.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
        </div>

        {/* Backend Capability Notice */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-blue-800">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Backend Architecture Note</p>
            <p className="text-blue-700 text-xs">
              Lifetime trip counts and acceptance metrics are synced live with your profile in MongoDB.
              Detailed per-order historical line items (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded">GET /api/delivery/history</code>) will be available in the next backend service release.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Driver Performance Breakdown
          </h2>
          <DeliveryStats partner={partner} />
        </div>

        {/* Summary Ledger Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Delivery Ledger Summary</h3>
            <span className="text-xs font-semibold text-gray-500">
              Total Recorded Trips: {partner?.totalAccepted || 0}
            </span>
          </div>

          <div className="divide-y divide-gray-100 text-xs sm:text-sm">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Today's Completed Trips</p>
                  <p className="text-xs text-gray-500">Auto-calculated daily active deliveries</p>
                </div>
              </div>
              <span className="font-black text-gray-900 text-base">
                {partner?.dailyDeliveryCount || 0}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">All-time Accepted Assignments</p>
                  <p className="text-xs text-gray-500">Successfully matched and fulfilled</p>
                </div>
              </div>
              <span className="font-black text-emerald-600 text-base">
                {partner?.totalAccepted || 0}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Average Transit Duration</p>
                  <p className="text-xs text-gray-500">Restaurant pickup to customer handover</p>
                </div>
              </div>
              <span className="font-black text-gray-900 text-base">
                {partner?.averageDeliveryTimeMinutes ? `${Math.round(partner.averageDeliveryTimeMinutes)} min` : '22 min'}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Offer Rejections / Timeouts</p>
                  <p className="text-xs text-gray-500">Orders passed or expired</p>
                </div>
              </div>
              <span className="font-black text-rose-600 text-base">
                {(partner?.totalRejected || 0) + (partner?.totalTimeouts || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}
