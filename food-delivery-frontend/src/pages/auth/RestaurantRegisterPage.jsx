import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, MapPin, ChefHat, Loader2, ArrowRight } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import useAuthStore from '../../store/authStore';
import axiosClient from '../../api/axiosClient';

const schema = z.object({
  name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  description: z.string().optional(),
  cuisines: z.string().min(2, 'Enter at least one cuisine (e.g. Indian, Chinese)'),
  address: z.string().min(5, 'Enter valid street address'),
  priceRange: z.string().default('2'),
});

export default function RestaurantRegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      priceRange: '2'
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        restaurantName: data.restaurantName.trim(),
        description: data.description?.trim() || '',
        cuisines: data.cuisines.split(',').map(c => c.trim()).filter(Boolean),
        address: data.address.trim(),
        priceRange: parseInt(data.priceRange) || 2,
        cityName: 'Pune',
        cityCode: 'PNQ',
        latitude: 18.5204,
        longitude: 73.8567
      };

      const res = await axiosClient.post('/api/auth/register/restaurant-owner', payload);
      const authData = res.data.data;
      setAuth(authData);
      navigate('/restaurant', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Onboarding failed. Please check your information.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo size="lg" to="/" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mt-4 mb-2">
            <ChefHat className="w-4 h-4 text-orange-600" />
            Partner with IntelliFood
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Register Your Restaurant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Grow your culinary business with intelligent dispatch & dynamic demand management
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {serverError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner Account Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Owner Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    {...register('name')}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    {...register('phone')}
                    placeholder="10-digit mobile"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Login Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="owner@restaurant.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Min 6 chars"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <hr className="border-gray-100 my-4" />

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Restaurant Outlet Information</h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Name *</label>
              <div className="relative">
                <Store className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  {...register('restaurantName')}
                  placeholder="e.g. Royal Spice Bistro"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              {errors.restaurantName && <p className="text-[11px] text-red-600 mt-1">{errors.restaurantName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cuisines (comma separated) *</label>
                <input
                  {...register('cuisines')}
                  placeholder="e.g. Biryani, Indian, Chinese"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                {errors.cuisines && <p className="text-[11px] text-red-600 mt-1">{errors.cuisines.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Price Range</label>
                <select
                  {...register('priceRange')}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                >
                  <option value="1">₹ (Budget Friendly)</option>
                  <option value="2">₹₹ (Mid-range Popular)</option>
                  <option value="3">₹₹₹ (Premium Dining)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Outlet Address *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  {...register('address')}
                  placeholder="e.g. Shop 4, FC Road, Shivajinagar, Pune"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Short Description (Optional)</label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="Signature dishes, ambiance, or specialties..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <>
                  Complete Restaurant Registration
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center text-xs text-gray-500">
            <div>
              Already have a partner account?{' '}
              <Link to="/login" className="text-orange-600 font-bold hover:underline">
                Sign In
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-400 pt-1">
              <Link to="/register" className="hover:text-gray-700 underline">
                Register as Customer
              </Link>
              <span>•</span>
              <Link to="/register/delivery-partner" className="hover:text-gray-700 underline">
                Deliver with Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
