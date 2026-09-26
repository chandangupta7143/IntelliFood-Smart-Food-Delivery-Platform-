import React, { useState, useEffect } from 'react';
import { Package, MapPin, Store, Check, X, AlertTriangle, Clock } from 'lucide-react';
import Modal from '../common/Modal';

/**
 * DeliveryOrderCard
 *
 * Renders an incoming delivery offer assignment when partner.status === 'BUSY'
 * or a summary card for active delivery.
 *
 * @param {string} orderId - ID of the assigned order
 * @param {object} orderDetails - Optional full order object if loaded
 * @param {number} consecutiveRejections - Number of current consecutive rejections
 * @param {function} onAccept - Handler for accepting offer
 * @param {function} onReject - Handler for rejecting offer
 * @param {boolean} isAccepting - Loading state
 * @param {boolean} isRejecting - Loading state
 */
export default function DeliveryOrderCard({
  orderId,
  orderDetails,
  consecutiveRejections = 0,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45); // Standard assignment timeout window

  // Countdown timer for incoming offer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    if (onReject) {
      onReject(orderId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-500/80 overflow-hidden relative animate-in fade-in duration-300">
      {/* Top Banner: Incoming Order Offer */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-sm sm:text-base">New Delivery Assignment Offer</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-200" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Order Details Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</span>
            <h4 className="text-lg font-black text-gray-900 font-mono">#{orderId.slice(-8).toUpperCase()}</h4>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Payout</span>
            <p className="text-lg font-black text-emerald-600">₹{(orderDetails?.deliveryFee || 40) + (orderDetails?.surgeMultiplier > 1 ? 25 : 10)}</p>
          </div>
        </div>

        {/* Pickup & Drop Route Information */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 shrink-0 mt-0.5">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
                Pickup Location
              </span>
              <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                {orderDetails?.restaurantName || 'Restaurant Kitchen'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {orderDetails?.restaurantAddress?.street || 'Shivajinagar, FC Road, Pune'}
              </p>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-gray-300 ml-4 h-4" />

          {/* Delivery Drop-off */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Delivery Destination
              </span>
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                {orderDetails?.deliveryAddress || 'Customer Address (Details available on accept)'}
              </p>
              {orderDetails?.items && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {orderDetails.items.length} items in order
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Accept & Reject */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            disabled={isAccepting || isRejecting}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>{isRejecting ? 'Rejecting...' : 'Decline Offer'}</span>
          </button>

          <button
            type="button"
            onClick={() => onAccept(orderId)}
            disabled={isAccepting || isRejecting}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isAccepting ? 'Accepting...' : 'Accept Delivery'}</span>
          </button>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Decline Delivery Offer?"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Backend Assignment Policy Notice:</p>
              <p className="mt-0.5 text-amber-700">
                Current consecutive rejections: <strong>{consecutiveRejections} / 3</strong>.
                Rejecting 3 consecutive orders will automatically set your status to <strong>SUSPENDED</strong>.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Are you sure you want to pass on Order <strong>#{orderId.slice(-6)}</strong>? The system will attempt to offer this to the next nearest driver.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Keep Order
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={isRejecting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
            >
              {isRejecting ? 'Declining...' : 'Yes, Decline'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
