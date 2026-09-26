import React from 'react';
import { Zap, ShieldCheck, Info } from 'lucide-react';
import QuoteTimer from './QuoteTimer';

export default function PricingBreakdown({
  subtotal = 0,
  deliveryFee = 40,
  baseFee = 40,
  surgeMultiplier = 1.0,
  platformFee = 10,
  total = 0,
  quoteToken = null,
  expiresAt = null,
  onQuoteExpire = null,
  className = '',
}) {
  const calculatedSurgeFee = surgeMultiplier > 1.0
    ? Math.max(0, Math.round(deliveryFee - (baseFee || 40)))
    : 0;

  const finalTotal = total || (subtotal + deliveryFee + platformFee);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h4 className="font-bold text-gray-900 text-sm">
          Bill Details
        </h4>
        {expiresAt && (
          <QuoteTimer expiresAt={expiresAt} onExpire={onQuoteExpire} />
        )}
      </div>

      <div className="space-y-2.5 text-xs text-gray-600">
        {/* Item Total */}
        <div className="flex justify-between items-center">
          <span>Item Total</span>
          <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Delivery Fee */}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            Delivery Fee
            {surgeMultiplier > 1.0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm font-semibold">
                {surgeMultiplier.toFixed(1)}x Surge
              </span>
            )}
          </span>
          <span className="font-semibold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
        </div>

        {/* Surge Fee Note if applied */}
        {surgeMultiplier > 1.0 && (
          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100">
            <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>High demand in your area. Surge fee of ₹{calculatedSurgeFee} included in delivery.</span>
          </div>
        )}

        {/* Platform Fee */}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            Platform Fee
            <Info className="w-3 h-3 text-gray-400" />
          </span>
          <span className="font-semibold text-gray-900">₹{platformFee.toFixed(2)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
        <div>
          <span className="text-sm font-extrabold text-gray-900 block">
            To Pay
          </span>
          <span className="text-[11px] text-gray-400">
            Inclusive of all taxes
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-orange-600">
            ₹{finalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {quoteToken && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>Surge rate cryptographically verified via HMAC-SHA256</span>
        </div>
      )}
    </div>
  );
}
