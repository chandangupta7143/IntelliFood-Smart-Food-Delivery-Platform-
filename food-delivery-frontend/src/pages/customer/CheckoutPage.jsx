import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import PricingBreakdown from '../../components/customer/PricingBreakdown';
import Button from '../../components/common/Button';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { getPricingQuote } from '../../api/pricingApi';
import { createOrder } from '../../api/orderApi';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'Instant UPI', desc: 'Google Pay, PhonePe, Paytm', emoji: '📱' },
  { id: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay with cash at your doorstep', emoji: '💵' },
  { id: 'CREDIT_CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay (Test mode)', emoji: '💳' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    restaurantId,
    restaurantName,
    getSubtotal,
    toOrderItems,
    clearCart,
  } = useCartStore();

  // Guard: if cart is empty, redirect
  if (!items || items.length === 0) {
    return <Navigate to="/customer/cart" replace />;
  }

  // Delivery details state
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Flat 402, Sunshine Heights, FC Road, Shivajinagar, Pune'
  );
  const [deliveryLatitude, setDeliveryLatitude] = useState(18.5204);
  const [deliveryLongitude, setDeliveryLongitude] = useState(73.8567);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Surge Quote state
  const [quote, setQuote] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  // Idempotency key - generated ONCE per checkout session
  const idempotencyKeyRef = useRef(null);
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Order submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Fetch initial surge quote on mount or when coordinates change
  const fetchSurgeQuote = async () => {
    if (!restaurantId || !user?.userId) return;

    setIsQuoteLoading(true);
    setQuoteError('');
    setIsQuoteExpired(false);

    try {
      // CRITICAL CONTRACT: cartId MUST equal user.userId for backend HMAC verification
      const quoteData = await getPricingQuote({
        userId: user.userId,
        restaurantId,
        deliveryLatitude: Number(deliveryLatitude),
        deliveryLongitude: Number(deliveryLongitude),
      });

      setQuote(quoteData);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to calculate dynamic pricing quote. Please retry.';
      setQuoteError(msg);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, user?.userId]);

  const handleQuoteExpired = () => {
    setIsQuoteExpired(true);
  };

  // Place Order Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setOrderError('Delivery address is required.');
      return;
    }

    if (!quote || isQuoteExpired) {
      setOrderError('Pricing quote has expired. Please refresh the quote before placing order.');
      return;
    }

    setIsSubmitting(true);
    setOrderError('');

    try {
      const recommendationEventId = sessionStorage.getItem('recommendationEventId');

      const payload = {
        restaurantId,
        items: toOrderItems(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryLatitude: Number(deliveryLatitude),
        deliveryLongitude: Number(deliveryLongitude),
        paymentMethod,
        orderSource: 'WEB',
        quoteToken: quote.quoteToken || quote.surgeToken,
        surgeMultiplier: quote.surgeMultiplier,
        ...(recommendationEventId && { recommendationEventId }),
      };

      const placedOrder = await createOrder(payload, idempotencyKeyRef.current);

      // Only clear cart AFTER confirmed backend success
      clearCart();
      sessionStorage.removeItem('recommendationEventId');

      const orderId = placedOrder.id || placedOrder.orderId;
      navigate(`/customer/orders/${orderId}`, {
        replace: true,
        state: { isNewOrder: true, order: placedOrder },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to create order. Please check your information and try again.';
      setOrderError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = getSubtotal();
  const deliveryFee = quote ? quote.deliveryFee : 40;
  const baseFee = quote ? quote.baseFee : 40;
  const surgeMultiplier = quote ? quote.surgeMultiplier : 1.0;
  const platformFee = 10;
  const total = subtotal + deliveryFee + platformFee;

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Checkout Header */}
        <div className="pb-4 border-b border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Checkout
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Ordering from <strong>{restaurantName}</strong> ({items.length} items)
          </p>
        </div>

        {orderError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="flex-1 font-medium">{orderError}</div>
          </div>
        )}

        {/* 2-Column Grid: Left (Forms) + Right (Pricing & Quote) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Address & Payment (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900 text-base">
                  1. Delivery Address & Coordinates
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street Address
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat number, building, landmark, area"
                  className="w-full p-3 text-xs sm:text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                  required
                />
              </div>

              {/* Coordinates input for H3 geo dispatch & surge validation */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    Latitude (Pune)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={deliveryLatitude}
                    onChange={(e) => setDeliveryLatitude(parseFloat(e.target.value))}
                    className="w-full p-2.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    Longitude (Pune)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={deliveryLongitude}
                    onChange={(e) => setDeliveryLongitude(parseFloat(e.target.value))}
                    className="w-full p-2.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                H3 geospatial index uses these coordinates to match nearby drivers and compute surge.
              </p>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900 text-base">
                  2. Select Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <label
                      key={pm.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none">{pm.emoji}</span>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {pm.label}
                          </p>
                          <p className="text-[11px] text-gray-500">{pm.desc}</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={isSelected}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="w-4 h-4 text-orange-500 accent-orange-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Surge Quote & Place Order CTA (1 Col) */}
          <div className="lg:col-span-1 space-y-4 sticky top-24">
            {/* Surge Quote Status Box */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Surge Pricing Status
                </span>
                <button
                  type="button"
                  onClick={fetchSurgeQuote}
                  disabled={isQuoteLoading}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isQuoteLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isQuoteLoading ? (
                <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                  Querying demand & supply engines...
                </div>
              ) : quoteError ? (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {quoteError}
                  <button
                    type="button"
                    onClick={fetchSurgeQuote}
                    className="block font-bold mt-1.5 text-orange-600 hover:underline"
                  >
                    Retry Quote
                  </button>
                </div>
              ) : isQuoteExpired ? (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 space-y-2 text-center">
                  <p className="font-bold">Quote Expired</p>
                  <p className="text-[11px] text-red-600">
                    The 120-second guaranteed surge window has ended.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={fetchSurgeQuote}
                  >
                    Refresh Delivery Price
                  </Button>
                </div>
              ) : quote ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Surge Multiplier</span>
                    <span className="font-bold text-gray-900">
                      {quote.surgeMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-bold text-gray-900">
                      ₹{quote.deliveryFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bill Details */}
            <PricingBreakdown
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              baseFee={baseFee}
              surgeMultiplier={surgeMultiplier}
              platformFee={platformFee}
              total={total}
              quoteToken={quote?.quoteToken || quote?.surgeToken}
              expiresAt={quote?.expiresAt}
              onQuoteExpire={handleQuoteExpired}
            />

            {/* Submit Order Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full font-black text-sm shadow-lg hover:shadow-xl"
              disabled={isSubmitting || isQuoteLoading || isQuoteExpired || !quote}
              isLoading={isSubmitting}
              onClick={handlePlaceOrder}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Placing Order...' : `Pay ₹${total.toFixed(2)} & Place Order`}
            </Button>

            <div className="text-[11px] text-gray-400 space-y-1 text-center">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                End-to-end cryptographic order verification
              </p>
              <p>Idempotency protected to avoid duplicate charges</p>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
