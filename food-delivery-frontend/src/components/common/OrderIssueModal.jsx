import React, { useState } from 'react';
import { AlertCircle, HelpCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { reportOrderIssue } from '../../api/orderApi';

const CATEGORIES_BY_ROLE = {
  CUSTOMER: [
    { value: 'FOOD_QUALITY', label: 'Food Quality / Wrong Item' },
    { value: 'ORDER_DELAYED', label: 'Order is Delayed' },
    { value: 'WRONG_ADDRESS', label: 'Delivery Address Issue' },
    { value: 'OTHER', label: 'Other Problem' },
  ],
  RESTAURANT: [
    { value: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unreachable' },
    { value: 'ORDER_DELAYED', label: 'Kitchen Delay' },
    { value: 'SAFETY_CONCERN', label: 'Packaging / Food Safety Concern' },
    { value: 'OTHER', label: 'Other Operational Issue' },
  ],
  DELIVERY_PARTNER: [
    { value: 'ORDER_DELAYED', label: 'Food Still Preparing / Long Kitchen Wait' },
    { value: 'RESTAURANT_UNAVAILABLE', label: 'Restaurant Closed / Unavailable' },
    { value: 'CUSTOMER_UNAVAILABLE', label: 'Customer Not Available at Dropoff' },
    { value: 'WRONG_ADDRESS', label: 'Incorrect or Unreachable Address' },
    { value: 'VEHICLE_ISSUE', label: 'Vehicle Breakdown / Transit Problem' },
    { value: 'SAFETY_CONCERN', label: 'Weather or Safety Concern' },
    { value: 'OTHER', label: 'Other Delivery Problem' },
  ],
};

export default function OrderIssueModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  role = 'CUSTOMER',
  onSuccess,
}) {
  const categories = CATEGORIES_BY_ROLE[role] || CATEGORIES_BY_ROLE.CUSTOMER;
  const [category, setCategory] = useState(categories[0]?.value || 'OTHER');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide at least 5 characters describing the issue');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const issue = await reportOrderIssue(orderId, {
        category,
        description: description.trim(),
      });
      setSubmitted(true);
      if (onSuccess) onSuccess(issue);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Support & Issue Help • #${orderNumber || orderId?.slice(-6)}`}
      size="md"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm">Issue Logged Successfully</h4>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Our operational team and relevant partners have been notified. An update will be posted to your timeline shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Issue Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Description / Notes *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem clearly so operations and support can assist you immediately..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Reporting an issue alerts operations and creates an auditable record on this order without blind status rollbacks.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Report
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
