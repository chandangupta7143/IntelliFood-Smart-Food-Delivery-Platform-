import React from 'react';
import { Star, CheckCircle, Clock, TrendingUp, ShieldAlert, Award } from 'lucide-react';

/**
 * DeliveryStats
 *
 * Renders key metrics and performance indicators for the delivery partner.
 *
 * @param {object} partner - DeliveryPartnerResponse object
 */
export default function DeliveryStats({ partner }) {
  if (!partner) return null;

  const stats = [
    {
      label: 'Rating',
      value: partner.rating ? partner.rating.toFixed(1) : 'New Partner',
      icon: Star,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      subtext: partner.rating ? 'Verified Score' : 'Awaiting Reviews',
    },
    {
      label: "Today's Deliveries",
      value: partner.dailyDeliveryCount || 0,
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      subtext: 'Completed Trips',
    },
    {
      label: 'Acceptance Rate',
      value: partner.totalAssignments > 0
        ? `${Math.round(((partner.totalAccepted || 0) / partner.totalAssignments) * 100)}%`
        : '100%',
      icon: TrendingUp,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      subtext: `${partner.totalAccepted || 0} accepted / ${partner.totalAssignments || 0} offered`,
    },
    {
      label: 'Avg Delivery Time',
      value: partner.averageDeliveryTimeMinutes ? `${Math.round(partner.averageDeliveryTimeMinutes)}m` : '--',
      icon: Clock,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      subtext: partner.averageDeliveryTimeMinutes ? 'Kitchen to Customer' : 'No recorded trips',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`p-2 rounded-xl ${item.bgColor} ${item.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {item.value}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">{item.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary Pill Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-gray-700">Driver Reliability Profile</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div>
            Total Assignments: <strong className="text-gray-900">{partner.totalAssignments || 0}</strong>
          </div>
          <span className="text-gray-300">|</span>
          <div>
            Accepted: <strong className="text-emerald-600">{partner.totalAccepted || 0}</strong>
          </div>
          <span className="text-gray-300">|</span>
          <div>
            Rejected: <strong className="text-rose-600">{partner.totalRejected || 0}</strong>
          </div>
          <span className="text-gray-300">|</span>
          <div>
            Timeouts: <strong className="text-amber-600">{partner.totalTimeouts || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
