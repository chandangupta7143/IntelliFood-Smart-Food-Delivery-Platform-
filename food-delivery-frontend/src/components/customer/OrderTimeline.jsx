import React from 'react';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

const STANDARD_STEPS = [
  { status: 'CREATED', label: 'Order Placed', desc: 'We have received your order' },
  { status: 'RESTAURANT_ACCEPTED', label: 'Restaurant Confirmed', desc: 'Kitchen has accepted your order' },
  { status: 'PREPARING', label: 'Preparing Food', desc: 'Chef is cooking your fresh meal' },
  { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Driver is arriving at the restaurant' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Driver is on the way to your door' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your food!' },
];

export default function OrderTimeline({ events = [], currentStatus = 'CREATED', className = '' }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className={`p-5 rounded-2xl bg-gray-50 border border-gray-200 text-center ${className}`}>
        <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h4 className="font-bold text-gray-800 text-sm">Order Cancelled</h4>
        <p className="text-xs text-gray-500 mt-1">This order has been cancelled.</p>
      </div>
    );
  }

  if (currentStatus === 'REJECTED') {
    return (
      <div className={`p-5 rounded-2xl bg-red-50 border border-red-200 text-center ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h4 className="font-bold text-red-800 text-sm">Order Rejected</h4>
        <p className="text-xs text-red-600 mt-1">This order was flagged by security rules and rejected.</p>
      </div>
    );
  }

  // Check if PENDING_REVIEW occurred
  const isPendingReview = currentStatus === 'PENDING_REVIEW' || events.some((e) => e.status === 'PENDING_REVIEW');
  const steps = [...STANDARD_STEPS];
  if (isPendingReview) {
    steps.splice(1, 0, {
      status: 'PENDING_REVIEW',
      label: 'Security Review',
      desc: 'Order is undergoing verification',
    });
  }

  const currentIndex = steps.findIndex((s) => s.status === currentStatus);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < activeIdx || currentStatus === 'DELIVERED';
        const isCurrent = idx === activeIdx && currentStatus !== 'DELIVERED';
        const isPending = idx > activeIdx;

        const event = events.find((e) => e.status === step.status);
        const timeStr = event?.timestamp
          ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;

        return (
          <div key={step.status} className="relative flex items-start gap-4">
            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 -bottom-6 w-0.5 transition-colors duration-300 ${
                  idx < activeIdx ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Step Icon */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : isCurrent ? (
                <Clock className="w-4 h-4" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <h5
                  className={`text-sm font-bold ${
                    isCurrent
                      ? 'text-orange-600'
                      : isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </h5>
                {timeStr && (
                  <span className="text-[11px] font-semibold text-gray-400">
                    {timeStr}
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isCurrent ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {event?.description || step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
