import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminFraudQueue,
  adminApproveFraudCase,
  adminRejectFraudCase,
  adminRestrictUser,
  getDailyFraudMetrics
} from '../../api/adminApi';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import OrderStatusBadge from '../../components/customer/OrderStatusBadge';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  UserX,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

export default function AdminFraudPage() {
  const queryClient = useQueryClient();

  // State for Review Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'APPROVE' | 'REJECT'
  const [reviewReason, setReviewReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // State for Restrict User Modal
  const [restrictUserId, setRestrictUserId] = useState(null);
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictDuration, setRestrictDuration] = useState(7);
  const [selectedRestrictions, setSelectedRestrictions] = useState(['ORDERING_BLOCKED']);
  const [restrictError, setRestrictError] = useState('');
  const [restrictSuccess, setRestrictSuccess] = useState('');

  // Queries
  const {
    data: fraudQueue = [],
    isLoading: queueLoading,
    error: queueError,
    refetch: refetchQueue,
    isFetching: queueFetching
  } = useQuery({
    queryKey: ['adminFraudQueue'],
    queryFn: getAdminFraudQueue,
    refetchInterval: 10000,
  });

  const {
    data: dailyMetrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['adminDailyFraudMetrics'],
    queryFn: () => getDailyFraudMetrics(),
    refetchInterval: 30000,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ orderId, reason }) => adminApproveFraudCase(orderId, reason),
    onSuccess: () => {
      setReviewSuccess('Order hold cleared and approved successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminFraudQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminDailyFraudMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setTimeout(() => {
        setSelectedCase(null);
        setReviewAction(null);
        setReviewReason('');
        setReviewSuccess('');
      }, 1500);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Failed to approve fraud case');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, reason }) => adminRejectFraudCase(orderId, reason),
    onSuccess: () => {
      setReviewSuccess('Order rejected and cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminFraudQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminDailyFraudMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setTimeout(() => {
        setSelectedCase(null);
        setReviewAction(null);
        setReviewReason('');
        setReviewSuccess('');
      }, 1500);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Failed to reject fraud case');
    }
  });

  const restrictMutation = useMutation({
    mutationFn: ({ userId, payload }) => adminRestrictUser(userId, payload),
    onSuccess: () => {
      setRestrictSuccess('User restrictions applied successfully.');
      setTimeout(() => {
        setRestrictUserId(null);
        setRestrictReason('');
        setRestrictSuccess('');
      }, 1500);
    },
    onError: (err) => {
      setRestrictError(err.response?.data?.message || 'Failed to restrict user');
    }
  });

  const handleOpenReview = (orderCase, action) => {
    setSelectedCase(orderCase);
    setReviewAction(action);
    setReviewReason('');
    setReviewError('');
    setReviewSuccess('');
  };

  const handleExecuteReview = (e) => {
    e.preventDefault();
    if (!reviewReason || reviewReason.trim().length < 10) {
      setReviewError('Review rationale must be at least 10 characters long');
      return;
    }
    setReviewError('');
    if (reviewAction === 'APPROVE') {
      approveMutation.mutate({ orderId: selectedCase.id || selectedCase.orderId, reason: reviewReason.trim() });
    } else {
      rejectMutation.mutate({ orderId: selectedCase.id || selectedCase.orderId, reason: reviewReason.trim() });
    }
  };

  const handleOpenRestrict = (userId) => {
    setRestrictUserId(userId);
    setRestrictReason('');
    setRestrictDuration(7);
    setSelectedRestrictions(['ORDERING_BLOCKED']);
    setRestrictError('');
    setRestrictSuccess('');
  };

  const handleExecuteRestrict = (e) => {
    e.preventDefault();
    if (!restrictReason || !restrictReason.trim()) {
      setRestrictError('Restriction reason is mandatory');
      return;
    }
    restrictMutation.mutate({
      userId: restrictUserId,
      payload: {
        restrictionTypes: selectedRestrictions,
        reason: restrictReason.trim(),
        durationDays: Number(restrictDuration) || 7
      }
    });
  };

  const toggleRestriction = (type) => {
    if (selectedRestrictions.includes(type)) {
      setSelectedRestrictions(selectedRestrictions.filter(t => t !== type));
    } else {
      setSelectedRestrictions([...selectedRestrictions, type]);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-amber-400" size={26} />
              <h1 className="text-2xl font-bold text-white tracking-tight">Fraud & Risk Operations</h1>
            </div>
            <p className="text-sm text-slate-400">
              Suspicious activity review, heuristics clearance, and security enforcement
            </p>
          </div>
          <button
            onClick={() => { refetchQueue(); refetchMetrics(); }}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={queueFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Telemetry Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Queue Backlog</span>
              <AlertTriangle className="text-amber-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">
              {fraudQueue?.length ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Transactions on security hold</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today Evaluated</span>
              <Activity className="text-blue-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-white">
              {dailyMetrics?.totalEvaluated ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Rule checks executed</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today Approved</span>
              <ShieldCheck className="text-emerald-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {dailyMetrics?.manualApproved ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Cleared after manual audit</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today Rejected</span>
              <ShieldX className="text-rose-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-rose-400">
              {dailyMetrics?.manualRejected ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Blocked fraudulent orders</p>
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Active Investigation Queue</h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {fraudQueue.length} Pending
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Real-time audit log
            </span>
          </div>

          {queueLoading ? (
            <div className="p-8">
              <LoadingSkeleton />
            </div>
          ) : queueError ? (
            <div className="p-6">
              <ErrorState
                message={queueError.message || 'Failed to load fraud queue'}
                onRetry={refetchQueue}
              />
            </div>
          ) : fraudQueue.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon="🛡️"
                title="Fraud Queue Clear"
                description="No flagged transactions currently require security intervention. Automated heuristic checks are healthy."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Risk Factors</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Placed At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {fraudQueue.map((order) => {
                    const orderId = order.id || order.orderId;
                    return (
                      <tr key={orderId} className="hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-amber-300">
                          #{orderId ? orderId.slice(-8) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white text-xs">
                            {order.customerName || order.userId || 'Customer'}
                          </div>
                          <button
                            onClick={() => handleOpenRestrict(order.userId)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 underline mt-0.5 flex items-center gap-1"
                          >
                            <UserX size={11} />
                            Restrict User
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {order.fraudReasons && order.fraudReasons.length > 0 ? (
                              order.fraudReasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                >
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                HEURISTIC_HOLD
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <OrderStatusBadge status={order.status || 'PENDING_REVIEW'} />
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenReview(order, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded text-xs font-semibold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReview(order, 'REJECT')}
                              className="px-2.5 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Confirmation Modal */}
        {selectedCase && (
          <Modal
            isOpen={!!selectedCase}
            onClose={() => setSelectedCase(null)}
            title={reviewAction === 'APPROVE' ? 'Approve & Clear Fraud Hold' : 'Reject & Cancel Fraudulent Order'}
            size="md"
          >
            <form onSubmit={handleExecuteReview} className="space-y-4">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Order ID:</span>
                  <span className="font-mono text-white">#{selectedCase.id || selectedCase.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Customer ID:</span>
                  <span className="text-white">{selectedCase.userId || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transaction Amount:</span>
                  <span className="font-bold text-white">₹{Number(selectedCase.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {reviewError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <XCircle size={16} />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operational Audit Rationale <span className="text-rose-400">* (min 10 chars)</span>
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'e.g., Verified customer contact details via phone, confirmed legitimate order.'
                      : 'e.g., Repeated rapid velocity check failures from anonymous VPN IP.'
                  }
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <div className="text-[11px] text-right mt-1 text-slate-400">
                  Characters: {reviewReason.length} / 10 required
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending || rejectMutation.isPending || reviewReason.trim().length < 10}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {approveMutation.isPending || rejectMutation.isPending
                    ? 'Submitting...'
                    : reviewAction === 'APPROVE'
                    ? 'Approve Order'
                    : 'Reject Order'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* User Restrict Modal */}
        {restrictUserId && (
          <Modal
            isOpen={!!restrictUserId}
            onClose={() => setRestrictUserId(null)}
            title="Enforce Account Restrictions"
            size="md"
          >
            <form onSubmit={handleExecuteRestrict} className="space-y-4">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400">Target User ID: </span>
                <span className="font-mono text-white font-semibold">{restrictUserId}</span>
              </div>

              {restrictError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <XCircle size={16} />
                  <span>{restrictError}</span>
                </div>
              )}

              {restrictSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{restrictSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Restriction Flags
                </label>
                <div className="space-y-2">
                  {['ORDERING_BLOCKED', 'COD_BLOCKED', 'PROMOTIONS_BLOCKED', 'LOGIN_BLOCKED'].map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/60 p-2 rounded border border-slate-700 hover:border-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRestrictions.includes(type)}
                        onChange={() => toggleRestriction(type)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={restrictDuration}
                  onChange={(e) => setRestrictDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Restriction
                </label>
                <input
                  type="text"
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  placeholder="e.g., Chargeback fraud and multiple order denials"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestrictUserId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restrictMutation.isPending || !restrictReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {restrictMutation.isPending ? 'Enforcing...' : 'Apply Restrictions'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
