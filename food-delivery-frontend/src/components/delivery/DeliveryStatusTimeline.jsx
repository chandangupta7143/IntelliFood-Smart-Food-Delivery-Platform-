import React, { useState } from 'react';
import { CheckCircle2, Clock, Truck, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { updateDeliveryOrderStatus } from '../../api/deliveryApi';

/**
 * DeliveryStatusTimeline
 *
 * Visualizes the driver's active delivery workflow:
 * 1. READY_FOR_PICKUP (Driver arriving at merchant / food ready)
 * 2. OUT_FOR_DELIVERY (Picked up & navigating to customer)
 * 3. DELIVERED (Order complete)
 *
 * Includes locked transition buttons calling PATCH /api/vendor/orders/{orderId}/status
 */
export default function DeliveryStatusTimeline({
  orderId,
  currentStatus = 'READY_FOR_PICKUP',
  onStatusTransitioned,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const steps = [
    {
      id: 'READY_FOR_PICKUP',
      label: 'Pickup from Kitchen',
      description: 'Collect order from restaurant partner',
      icon: Clock,
    },
    {
      id: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      description: 'En route to customer location',
      icon: Truck,
    },
    {
      id: 'DELIVERED',
      label: 'Delivered',
      description: 'Food handed over to customer',
      icon: CheckCircle2,
    },
  ];

  // Helper to determine step index
  const getStepIndex = (status) => {
    if (status === 'DELIVERED') return 2;
    if (status === 'OUT_FOR_DELIVERY') return 1;
    return 0;
  };

  const currentIndex = getStepIndex(currentStatus);

  const handleTransition = async (nextStatus) => {
    setIsUpdating(true);
    setErrorMsg('');
    try {
      const updatedOrder = await updateDeliveryOrderStatus(orderId, nextStatus);
      if (onStatusTransitioned) {
        onStatusTransitioned(updatedOrder);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Status transition failed';
      setErrorMsg(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Delivery Progress</h4>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
          {currentStatus}
        </span>
      </div>

      {/* Stepper Display */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex || currentStatus === 'DELIVERED';
          const isCurrent = idx === currentIndex && currentStatus !== 'DELIVERED';
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Dot / Icon */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ring-4 ring-white ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-orange-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm font-bold ${isCurrent ? 'text-orange-600' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Transition Buttons */}
      <div className="pt-2">
        {currentStatus !== 'OUT_FOR_DELIVERY' && currentStatus !== 'DELIVERED' && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleTransition('OUT_FOR_DELIVERY')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
          >
            <span>{isUpdating ? 'Updating Order...' : 'Confirm Food Pickup (Start Trip)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {currentStatus === 'OUT_FOR_DELIVERY' && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleTransition('DELIVERED')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isUpdating ? 'Confirming Drop-off...' : 'Confirm Delivery to Customer'}</span>
          </button>
        )}

        {currentStatus === 'DELIVERED' && (
          <div className="text-center py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Delivery successfully completed! You are ready for next orders.</span>
          </div>
        )}
      </div>
    </div>
  );
}
