import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Store } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import CartItem from '../../components/customer/CartItem';
import PricingBreakdown from '../../components/customer/PricingBreakdown';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import useCartStore from '../../store/cartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    restaurantName,
    getSubtotal,
    clearCart,
  } = useCartStore();

  const subtotal = getSubtotal();
  const deliveryFee = 40;
  const platformFee = 10;
  const total = subtotal + deliveryFee + platformFee;

  if (!items || items.length === 0) {
    return (
      <CustomerLayout>
        <div className="py-12">
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet. Explore our top restaurants to fill it up!"
            action={{
              label: 'Discover Restaurants',
              onClick: () => navigate('/customer/restaurants'),
            }}
          />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-orange-500" />
              Your Cart
            </h1>
            {restaurantName && (
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Store className="w-3.5 h-3.5 text-gray-400" />
                Ordering from{' '}
                <Link
                  to={`/customer/restaurants/${restaurantId}`}
                  className="font-bold text-orange-600 hover:underline"
                >
                  {restaurantName}
                </Link>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="self-start sm:self-auto text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition p-2 rounded-xl hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cart
          </button>
        </div>

        {/* 2-Column Cart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Review Items ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <CartItem key={item.itemId} item={item} />
                ))}
              </div>
            </div>

            <div className="bg-orange-50/60 rounded-2xl border border-orange-100 p-4 flex items-center justify-between text-xs text-orange-800">
              <span>Want to add more delicious food?</span>
              <Link
                to={`/customer/restaurants/${restaurantId}`}
                className="font-bold text-orange-600 hover:underline"
              >
                + Add items
              </Link>
            </div>
          </div>

          {/* Pricing Summary & Checkout Button (1 Col) */}
          <div className="lg:col-span-1 space-y-4 sticky top-24">
            <PricingBreakdown
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              platformFee={platformFee}
              total={total}
            />

            <Button
              variant="primary"
              size="lg"
              className="w-full font-black text-sm shadow-md hover:shadow-lg"
              onClick={() => navigate('/customer/checkout')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Checkout
            </Button>

            <p className="text-[11px] text-gray-400 text-center">
              Real-time surge quote and delivery coordinates verified at checkout
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
