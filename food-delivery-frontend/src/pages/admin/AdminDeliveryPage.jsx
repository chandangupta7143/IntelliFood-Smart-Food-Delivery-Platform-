import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminDrivers,
  adminSuspendDriver,
  adminUnsuspendDriver,
  adminForceAssignDriver
} from '../../api/adminApi';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Bike,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Star,
  MapPin
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: '', label: 'All Fleet' },
  { key: 'ONLINE', label: 'Online' },
  { key: 'ON_DELIVERY', label: 'On Delivery' },
  { key: 'BUSY', label: 'Offer Pending' },
  { key: 'OFFLINE', label: 'Offline' },
  { key: 'SUSPENDED', label: 'Suspended' },
];

export default function AdminDeliveryPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Assign Order Modal state
  const [assigningDriver, setAssigningDriver] = useState(null);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Fetch drivers
  const {
    data: driversData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminDrivers', selectedStatus, page],
    queryFn: () => getAdminDrivers({
      page,
      size: 15,
      ...(selectedStatus ? { status: selectedStatus } : {})
    }),
    refetchInterval: 15000,
  });

  // Action mutations
  const suspendMutation = useMutation({
    mutationFn: (id) => adminSuspendDriver(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDrivers'] }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id) => adminUnsuspendDriver(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDrivers'] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, driverId }) => adminForceAssignDriver(orderId, driverId),
    onSuccess: () => {
      setAssignSuccess('Manual assignment dispatched successfully.');
      setTargetOrderId('');
      queryClient.invalidateQueries({ queryKey: ['adminDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setTimeout(() => {
        setAssigningDriver(null);
        setAssignSuccess('');
      }, 1500);
    },
    onError: (err) => {
      setAssignError(err.response?.data?.message || 'Manual order assignment failed.');
    }
  });

  const drivers = driversData?.content || [];
  const totalPages = driversData?.totalPages || 0;
  const totalElements = driversData?.totalElements || 0;

  const filteredDrivers = searchTerm
    ? drivers.filter((d) => d.id?.toLowerCase().includes(searchTerm.toLowerCase()) || d.userId?.toLowerCase().includes(searchTerm.toLowerCase()))
    : drivers;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONLINE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>;
      case 'ON_DELIVERY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">ON DELIVERY</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">OFFER PENDING</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">SUSPENDED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">OFFLINE</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Fleet Operations</h1>
            <p className="text-sm text-slate-400">
              Real-time driver availability, live assignments, and suspension controls ({totalElements} drivers)
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Refresh Fleet</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800">
          {STATUS_FILTERS.map((tab) => {
            const active = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(0);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Meta Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by Driver ID or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-xs text-slate-400 self-end sm:self-auto">
            Showing <span className="font-semibold text-white">{filteredDrivers.length}</span> drivers
          </div>
        </div>

        {/* Fleet Table */}
        {isLoading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error.message || 'Failed to load delivery fleet'} onRetry={refetch} />
        ) : filteredDrivers.length === 0 ? (
          <EmptyState
            icon="🛵"
            title="No delivery partners found"
            description={selectedStatus ? `No drivers with status ${selectedStatus}` : 'No drivers registered yet.'}
          />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Driver Profile</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Active Assignment</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Rating / Acceptance</th>
                    <th className="px-4 py-3">Deliveries Today</th>
                    <th className="px-4 py-3">GPS Telemetry</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-white">ID: {driver.id?.slice(-8)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">User: {driver.userId?.slice(-8)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(driver.status)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {driver.currentOrderId ? (
                          <span className="text-amber-400 font-bold">
                            #{driver.currentOrderId.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {driver.vehicleType || 'MOTORCYCLE'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-semibold text-white">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span>{driver.rating ?? '5.0'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {driver.acceptanceRate ?? 100}% accept ({driver.totalAccepted ?? 0}/{driver.totalAssignments ?? 0})
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200">
                        {driver.dailyDeliveryCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-400">
                        {driver.latitude ? (
                          <span>{driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}</span>
                        ) : (
                          <span className="text-slate-600 italic">No GPS fix</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Force Assign Button */}
                          <button
                            onClick={() => {
                              setAssigningDriver(driver);
                              setTargetOrderId('');
                              setAssignError('');
                              setAssignSuccess('');
                            }}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-semibold transition"
                            title="Force assign active order"
                          >
                            Assign Order
                          </button>

                          {/* Suspend / Unsuspend */}
                          {driver.status === 'SUSPENDED' ? (
                            <button
                              disabled={unsuspendMutation.isPending}
                              onClick={() => unsuspendMutation.mutate(driver.id)}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold transition"
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              disabled={suspendMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Suspend driver #${driver.id.slice(-6)}?`)) {
                                  suspendMutation.mutate(driver.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold transition"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Page <span className="text-white font-semibold">{page + 1}</span> of{' '}
                  <span className="text-white font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Order Assignment Modal */}
        {assigningDriver && (
          <Modal
            isOpen={!!assigningDriver}
            onClose={() => setAssigningDriver(null)}
            title={`Force-Assign Order to Driver #${assigningDriver.id.slice(-6)}`}
            size="sm"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAssignError('');
                setAssignSuccess('');
                assignMutation.mutate({
                  driverId: assigningDriver.id,
                  orderId: targetOrderId.trim()
                });
              }}
              className="space-y-4 text-xs text-slate-300"
            >
              {assignError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                  {assignSuccess}
                </div>
              )}

              <p className="text-slate-400">
                Admin manual override overrides the automatic geospatial scoring engine and immediately binds the order to this driver document.
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Order ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste MongoDB Order ObjectId..."
                  value={targetOrderId}
                  onChange={(e) => setTargetOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningDriver(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetOrderId.trim() || assignMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition disabled:opacity-40"
                >
                  <Send size={14} />
                  <span>{assignMutation.isPending ? 'Assigning...' : 'Dispatch Assignment'}</span>
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
