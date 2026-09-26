import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import useAuthStore from '../../store/authStore';
import axiosClient from '../../api/axiosClient';

const schema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.enum(['MOTORCYCLE', 'BICYCLE', 'CAR'], {
    errorMap: () => ({ message: 'Please select a valid vehicle type' }),
  }),
});

export default function DeliveryRegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleType: 'MOTORCYCLE',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        vehicleType: data.vehicleType,
      };

      const res = await axiosClient.post('/api/auth/register/delivery-partner', payload);
      const authData = res.data.data;
      setAuth(authData);
      navigate('/delivery', { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Driver onboarding failed. Please check your information.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-3">
            <BrandLogo size="lg" to="/" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Bike className="w-4 h-4" />
            Deliver With IntelliFood
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Partner Onboarding</h1>
          <p className="text-gray-500 text-sm mt-1">
            Deliver orders, earn on your schedule, and join our fleet
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {serverError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  {...register('name')}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="driver@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Vehicle *</label>
              <div className="relative">
                <select
                  {...register('vehicleType')}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="MOTORCYCLE">Motorcycle / Scooter</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="CAR">Car</option>
                </select>
              </div>
              {errors.vehicleType && (
                <p className="text-[11px] text-red-600 mt-1">{errors.vehicleType.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Instant activation: start receiving delivery offers immediately upon signup.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <>
                  Register as Delivery Partner
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center text-xs text-gray-500">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                Sign In
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-400 pt-1">
              <Link to="/register" className="hover:text-gray-700 underline">
                Register as Customer
              </Link>
              <span>•</span>
              <Link to="/register/restaurant-owner" className="hover:text-gray-700 underline">
                Register Restaurant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
