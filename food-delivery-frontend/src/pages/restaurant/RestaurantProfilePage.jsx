import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import RestaurantLayout from '../../layouts/RestaurantLayout';
import { getOwnerRestaurant, updateOwnerRestaurant } from '../../api/restaurantOwnerApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function RestaurantProfilePage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['ownerRestaurant'],
    queryFn: getOwnerRestaurant,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisines: '',
    address: '',
    phone: '',
    email: '',
    priceRange: 2,
    averageDeliveryTimeMinutes: 30,
    minimumOrderAmount: 100,
    isVegetarian: false,
    isActive: true
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisines: restaurant.cuisines?.join(', ') || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        priceRange: restaurant.priceRange || 2,
        averageDeliveryTimeMinutes: restaurant.averageDeliveryTimeMinutes || 30,
        minimumOrderAmount: restaurant.minimumOrderAmount || 100,
        isVegetarian: restaurant.isVegetarian || false,
        isActive: restaurant.isActive ?? true
      });
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateOwnerRestaurant(data),
    onSuccess: (saved) => {
      queryClient.setQueryData(['ownerRestaurant'], saved);
      setSuccessMsg('Restaurant profile saved successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cuisinesList = formData.cuisines
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      cuisines: cuisinesList.length > 0 ? cuisinesList : ['Indian'],
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      priceRange: parseInt(formData.priceRange) || 2,
      averageDeliveryTimeMinutes: parseInt(formData.averageDeliveryTimeMinutes) || 30,
      minimumOrderAmount: parseFloat(formData.minimumOrderAmount) || 100,
      isVegetarian: formData.isVegetarian,
      isActive: formData.isActive
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="p-8"><LoadingSkeleton /></div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-orange-600" />
            Restaurant Profile & Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your public outlet info, contact details, cuisines, and operating limits
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Short Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cuisines (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Indian, Biryani, Mughlai"
                value={formData.cuisines}
                onChange={(e) => setFormData({ ...formData, cuisines: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Price Range</label>
              <select
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
              >
                <option value={1}>₹ (Budget)</option>
                <option value={2}>₹₹ (Mid-range)</option>
                <option value={3}>₹₹₹ (Premium)</option>
                <option value={4}>₹₹₹₹ (Fine Dine)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Avg Preparation + Delivery Time (mins)</label>
              <input
                type="number"
                value={formData.averageDeliveryTimeMinutes}
                onChange={(e) => setFormData({ ...formData, averageDeliveryTimeMinutes: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Order Amount (₹)</label>
              <input
                type="number"
                value={formData.minimumOrderAmount}
                onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-6 border-t border-gray-100">
            <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVegetarian}
                onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <span>100% Pure Vegetarian Restaurant</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
              />
              <span>Accepting Orders from Customers (Active)</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Restaurant Profile
            </button>
          </div>
        </form>
      </div>
    </RestaurantLayout>
  );
}
