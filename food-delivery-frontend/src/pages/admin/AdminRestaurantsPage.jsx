import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminRestaurants,
  adminActivateRestaurant,
  adminDeactivateRestaurant,
  adminVerifyRestaurant,
  adminDeleteRestaurant,
  adminCreateRestaurant,
  adminUpdateRestaurant
} from '../../api/adminApi';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Store,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminRestaurantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactPersonName: '',
    phone: '',
    email: '',
    address: '',
    cityCode: 'PUN',
    cityName: 'Pune',
    cuisines: 'Indian, Biryani',
    isVegetarian: false,
    priceRange: 2,
    averageDeliveryTimeMinutes: 30,
    minimumOrderAmount: 100,
    latitude: 18.5204,
    longitude: 73.8567,
  });
  const [formError, setFormError] = useState('');

  // Fetch paginated restaurants
  const {
    data: restData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminRestaurants', page],
    queryFn: () => getAdminRestaurants({ page, size: 15 }),
    refetchInterval: 30000,
  });

  // Action mutations
  const activateMutation = useMutation({
    mutationFn: (id) => adminActivateRestaurant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => adminDeactivateRestaurant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => adminVerifyRestaurant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteRestaurant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] }),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const formatted = {
        ...payload,
        priceRange: Number(payload.priceRange),
        averageDeliveryTimeMinutes: Number(payload.averageDeliveryTimeMinutes),
        minimumOrderAmount: Number(payload.minimumOrderAmount),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        cuisines: typeof payload.cuisines === 'string'
          ? payload.cuisines.split(',').map((c) => c.trim()).filter(Boolean)
          : payload.cuisines,
      };
      if (editingRestaurant) {
        return adminUpdateRestaurant(editingRestaurant.id, formatted);
      }
      return adminCreateRestaurant(formatted);
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setEditingRestaurant(null);
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to save restaurant.');
    }
  });

  const openCreateModal = () => {
    setEditingRestaurant(null);
    setFormData({
      name: '',
      description: '',
      contactPersonName: '',
      phone: '',
      email: '',
      address: '',
      cityCode: 'PUN',
      cityName: 'Pune',
      cuisines: 'Indian, Biryani',
      isVegetarian: false,
      priceRange: 2,
      averageDeliveryTimeMinutes: 30,
      minimumOrderAmount: 100,
      latitude: 18.5204,
      longitude: 73.8567,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingRestaurant(r);
    setFormData({
      name: r.name || '',
      description: r.description || '',
      contactPersonName: r.contactPersonName || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      cityCode: r.cityCode || 'PUN',
      cityName: r.cityName || 'Pune',
      cuisines: Array.isArray(r.cuisines) ? r.cuisines.join(', ') : '',
      isVegetarian: !!r.isVegetarian,
      priceRange: r.priceRange || 2,
      averageDeliveryTimeMinutes: r.averageDeliveryTimeMinutes || 30,
      minimumOrderAmount: r.minimumOrderAmount || 100,
      latitude: r.latitude || 18.5204,
      longitude: r.longitude || 73.8567,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const restaurants = restData?.content || [];
  const totalPages = restData?.totalPages || 0;
  const totalElements = restData?.totalElements || 0;

  const filteredRestaurants = searchTerm
    ? restaurants.filter(
        (r) =>
          r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.cityName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : restaurants;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Restaurant Partner Catalog</h1>
            <p className="text-sm text-slate-400">
              Manage merchant storefronts, geospatial anchors, and active status ({totalElements} total)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin text-amber-400' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow"
            >
              <Plus size={16} />
              <span>Add Restaurant</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by restaurant name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="text-white font-semibold">{filteredRestaurants.length}</span> restaurants
          </div>
        </div>

        {/* Catalog Table */}
        {isLoading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error.message || 'Failed to load restaurants'} onRetry={refetch} />
        ) : filteredRestaurants.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No restaurants in catalog"
            description="Add the first merchant partner to get started."
            action={{ label: 'Add Restaurant', onClick: openCreateModal }}
          />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Store Name</th>
                    <th className="px-4 py-3">City / Address</th>
                    <th className="px-4 py-3">Cuisines</th>
                    <th className="px-4 py-3">GPS Coordinates</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredRestaurants.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{r.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {r.id?.slice(-6)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">{r.cityName || 'Pune'}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">{r.address || '--'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {Array.isArray(r.cuisines) ? r.cuisines.join(', ') : '--'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                        {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        {r.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle size={10} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.verified ? (
                          <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                            <ShieldCheck size={14} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => verifyMutation.mutate(r.id)}
                            className="text-slate-500 hover:text-amber-400 underline"
                          >
                            Mark Verified
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.active ? (
                            <button
                              onClick={() => deactivateMutation.mutate(r.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
                              title="Deactivate storefront"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => activateMutation.mutate(r.id)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded text-[11px] transition"
                              title="Activate storefront"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                            title="Edit Restaurant"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete restaurant "${r.name}"?`)) {
                                deleteMutation.mutate(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

        {/* Create / Edit Restaurant Modal */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title={editingRestaurant ? `Edit: ${editingRestaurant.name}` : 'Register New Partner Restaurant'}
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="space-y-4 text-xs text-slate-300"
            >
              {formError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">City Name</label>
                  <input
                    type="text"
                    value={formData.cityName}
                    onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">City Code</label>
                  <input
                    type="text"
                    value={formData.cityCode}
                    onChange={(e) => setFormData({ ...formData, cityCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Cuisines (comma separated)</label>
                  <input
                    type="text"
                    value={formData.cuisines}
                    onChange={(e) => setFormData({ ...formData, cuisines: e.target.value })}
                    placeholder="e.g. Indian, Biryani, Italian"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Latitude (GPS) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Longitude (GPS) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Price Range (1-4)</label>
                  <select
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1">1 - Budget (₹)</option>
                    <option value="2">2 - Moderate (₹₹)</option>
                    <option value="3">3 - Premium (₹₹₹)</option>
                    <option value="4">4 - Luxury (₹₹₹₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Avg Delivery Minutes</label>
                  <input
                    type="number"
                    value={formData.averageDeliveryTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, averageDeliveryTimeMinutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold transition disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editingRestaurant ? 'Update Store' : 'Create Store'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
