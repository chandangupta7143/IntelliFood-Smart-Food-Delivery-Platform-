import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminSurgeStatus,
  adminSetEmergencySurgeDisable,
  adminCreateSurgeOverride,
  adminDeleteSurgeOverride,
  testPricingQuote,
  getAdminRestaurants
} from '../../api/adminApi';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useAuthStore from '../../store/authStore';
import {
  Zap,
  AlertOctagon,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  XCircle,
  Sliders
} from 'lucide-react';

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Emergency Disable Modal
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyTargetStatus, setEmergencyTargetStatus] = useState(false);
  const [emergencyZone, setEmergencyZone] = useState('');

  // Create Override Modal
  const [isCreateOverrideOpen, setIsCreateOverrideOpen] = useState(false);
  const [newH3Index, setNewH3Index] = useState('8860145b25fffff');
  const [newMultiplier, setNewMultiplier] = useState(1.5);
  const [newDurationMinutes, setNewDurationMinutes] = useState(60);
  const [newReason, setNewReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  // Pricing Simulator / Sandbox State
  const [simLat, setSimLat] = useState(18.5204);
  const [simLng, setSimLng] = useState(73.8567);
  const [simRestaurantId, setSimRestaurantId] = useState('');
  const [simSubtotal, setSimSubtotal] = useState(350);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState('');

  // Queries
  const {
    data: surgeStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
    isFetching: statusFetching
  } = useQuery({
    queryKey: ['adminSurgeStatus'],
    queryFn: getAdminSurgeStatus,
    refetchInterval: 15000,
  });

  const { data: restaurantsData } = useQuery({
    queryKey: ['adminSimRestaurants'],
    queryFn: () => getAdminRestaurants({ page: 0, size: 20 }),
  });

  // Mutations
  const emergencyMutation = useMutation({
    mutationFn: ({ disable, zoneName }) => adminSetEmergencySurgeDisable(disable, zoneName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSurgeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setIsEmergencyModalOpen(false);
    }
  });

  const createOverrideMutation = useMutation({
    mutationFn: (payload) => adminCreateSurgeOverride(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSurgeStatus'] });
      setIsCreateOverrideOpen(false);
      setNewReason('');
      setOverrideError('');
    },
    onError: (err) => {
      setOverrideError(err.response?.data?.message || 'Failed to create surge override');
    }
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (overrideId) => adminDeleteSurgeOverride(overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSurgeStatus'] });
    }
  });

  const handleToggleEmergency = (targetDisable) => {
    setEmergencyTargetStatus(targetDisable);
    setEmergencyZone('');
    setIsEmergencyModalOpen(true);
  };

  const confirmEmergencyAction = () => {
    emergencyMutation.mutate({
      disable: emergencyTargetStatus,
      zoneName: emergencyZone.trim() || undefined
    });
  };

  const handleCreateOverrideSubmit = (e) => {
    e.preventDefault();
    if (!newH3Index.trim()) {
      setOverrideError('Zone / H3 Index is required');
      return;
    }
    if (newMultiplier < 1.0) {
      setOverrideError('Multiplier must be at least 1.0x');
      return;
    }
    if (!newReason.trim()) {
      setOverrideError('Operational reason is mandatory');
      return;
    }
    setOverrideError('');
    createOverrideMutation.mutate({
      h3Index: newH3Index.trim(),
      targetMultiplier: Number(newMultiplier),
      durationMinutes: Number(newDurationMinutes),
      reason: newReason.trim()
    });
  };

  const handleRunSimulator = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    setSimError('');
    setSimResult(null);

    const rId = simRestaurantId || (restaurantsData?.content?.[0]?.id || 'rest_demo_01');

    try {
      const res = await testPricingQuote({
        cartId: user?.userId || 'admin-sim-cart',
        userId: user?.userId || 'admin-sim-user',
        restaurantId: rId,
        deliveryLatitude: Number(simLat),
        deliveryLongitude: Number(simLng),
        subtotal: Number(simSubtotal)
      });
      setSimResult(res);
    } catch (err) {
      setSimError(err.response?.data?.message || 'Simulator failed to calculate surge pricing');
    } finally {
      setSimLoading(false);
    }
  };

  const isEmergencyDisabled = surgeStatus?.emergencyDisabled;
  const activeOverrides = surgeStatus?.activeOverrides || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="text-amber-400" size={26} />
              <h1 className="text-2xl font-bold text-white tracking-tight">Dynamic Surge & Pricing Control</h1>
            </div>
            <p className="text-sm text-slate-400">
              Demand algorithms, spatial hex overrides, and system-wide emergency controls
            </p>
          </div>
          <button
            onClick={() => refetchStatus()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={statusFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Emergency Killswitch Banner */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            isEmergencyDisabled
              ? 'bg-rose-950/40 border-rose-600 text-rose-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertOctagon
                className={isEmergencyDisabled ? 'text-rose-500 animate-pulse' : 'text-slate-400'}
                size={28}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Emergency Surge Killswitch</h3>
                  {isEmergencyDisabled ? (
                    <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-rose-600 text-white rounded">
                      ACTIVE — SURGE DISABLED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      STANDBY — DYNAMIC SURGE ENABLED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {isEmergencyDisabled
                    ? 'All algorithm-driven surge multipliers are currently suppressed across the platform. Customers are billed standard delivery base rates only.'
                    : 'System is operating under normal dynamic surge pricing based on real-time driver density and pending orders.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleEmergency(!isEmergencyDisabled)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                isEmergencyDisabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
              }`}
            >
              <AlertOctagon size={16} />
              <span>{isEmergencyDisabled ? 'Restore Normal Surge Pricing' : 'Trigger Emergency Killswitch'}</span>
            </button>
          </div>
        </div>

        {/* Two Column Grid: Overrides & Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Overrides Table (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-amber-400" />
                  <h2 className="text-base font-semibold text-white">Active Regional Overrides</h2>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-700 text-slate-300">
                    {activeOverrides.length}
                  </span>
                </div>
                <button
                  onClick={() => { setIsCreateOverrideOpen(true); setOverrideError(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  <Plus size={14} />
                  <span>Add Override</span>
                </button>
              </div>

              {statusLoading ? (
                <div className="p-8">
                  <LoadingSkeleton />
                </div>
              ) : statusError ? (
                <div className="p-6">
                  <ErrorState message={statusError.message || 'Failed to load surge status'} onRetry={refetchStatus} />
                </div>
              ) : activeOverrides.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon="⚡"
                    title="No Manual Overrides"
                    description="No regional surge overrides are currently active. All zones are calculated dynamically by the demand engine."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Zone / H3</th>
                        <th className="py-3 px-4">Multiplier</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {activeOverrides.map((ovr) => (
                        <tr key={ovr.id || ovr.h3Index} className="hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4 font-mono text-xs text-amber-300">
                            {ovr.h3Index}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                              {ovr.targetMultiplier || ovr.multiplier}x
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                            {ovr.expiresAt
                              ? new Date(ovr.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : `${ovr.durationMinutes || 60}m`}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">
                            {ovr.reason || 'Operational adjustment'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => deleteOverrideMutation.mutate(ovr.id)}
                              disabled={deleteOverrideMutation.isPending}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition hover:bg-slate-700"
                              title="Delete Override"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Simulator / Sandbox (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Play size={18} className="text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Pricing Quote Sandbox</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Test the live surge pricing algorithm and quote verification token generator against arbitrary GPS coordinates.
              </p>

              <form onSubmit={handleRunSimulator} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={simLat}
                      onChange={(e) => setSimLat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={simLng}
                      onChange={(e) => setSimLng(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Restaurant ID</label>
                  <input
                    type="text"
                    value={simRestaurantId}
                    onChange={(e) => setSimRestaurantId(e.target.value)}
                    placeholder={restaurantsData?.content?.[0]?.id || 'rest_demo_01'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Order Subtotal (₹)</label>
                  <input
                    type="number"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {simError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                    <XCircle size={15} />
                    <span>{simError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={simLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>{simLoading ? 'Simulating Quote...' : 'Calculate Live Pricing Quote'}</span>
                </button>
              </form>

              {/* Simulation Result Output */}
              {simResult && (
                <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Surge Multiplier</span>
                    <span className="text-sm font-bold text-amber-400">
                      {simResult.surgeMultiplier}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Base Delivery Fee</span>
                    <span className="text-white">₹{simResult.baseDeliveryFee ?? 40}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Surge Fee</span>
                    <span className="text-amber-300 font-semibold">+₹{simResult.surgeFee ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-300 font-bold">Total Delivery Fee</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{simResult.totalDeliveryFee ?? (Number(simResult.baseDeliveryFee || 40) + Number(simResult.surgeFee || 0))}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">HMAC Quote Token</div>
                    <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                      {simResult.quoteToken || 'TOKEN_VERIFIED'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Killswitch Modal */}
        <Modal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          title={emergencyTargetStatus ? 'Trigger Emergency Surge Killswitch' : 'Restore Dynamic Surge Pricing'}
          size="md"
        >
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                emergencyTargetStatus
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {emergencyTargetStatus ? (
                <>
                  <p className="font-bold mb-1">WARNING: High Impact Action</p>
                  Disabling surge pricing will cap delivery fees system-wide to standard base rates.
                  This may cause driver shortages during extreme demand peaks.
                </>
              ) : (
                <>
                  <p className="font-bold mb-1">Confirm System Normalization</p>
                  Re-enabling surge pricing allows dynamic supply/demand algorithms to balance driver allocation.
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Zone Scope (leave blank for Platform-Wide)
              </label>
              <input
                type="text"
                value={emergencyZone}
                onChange={(e) => setEmergencyZone(e.target.value)}
                placeholder="e.g., PUNE_CORE or blank for all zones"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEmergencyAction}
                disabled={emergencyMutation.isPending}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 ${
                  emergencyTargetStatus ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {emergencyMutation.isPending
                  ? 'Processing...'
                  : emergencyTargetStatus
                  ? 'Confirm Killswitch'
                  : 'Confirm Normalization'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Add Override Modal */}
        <Modal
          isOpen={isCreateOverrideOpen}
          onClose={() => setIsCreateOverrideOpen(false)}
          title="Create Manual Surge Override"
          size="md"
        >
          <form onSubmit={handleCreateOverrideSubmit} className="space-y-4">
            {overrideError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <XCircle size={15} />
                <span>{overrideError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zone Identifier or H3 Index <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newH3Index}
                onChange={(e) => setNewH3Index(e.target.value)}
                placeholder="e.g., 8860145b25fffff or PUNE_CORE"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Multiplier (x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={newMultiplier}
                  onChange={(e) => setNewMultiplier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="720"
                  value={newDurationMinutes}
                  onChange={(e) => setNewDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operational Rationale <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g., Heavy monsoon waterlogging in high demand cluster"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOverrideOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOverrideMutation.isPending}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {createOverrideMutation.isPending ? 'Applying...' : 'Apply Surge Override'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
