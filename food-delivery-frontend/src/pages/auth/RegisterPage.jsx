/**
 * RegisterPage.jsx
 *
 * Customer registration form.
 *
 * IMPORTANT BACKEND CONSTRAINTS (from forensic audit):
 *   - POST /api/auth/register ALWAYS creates ROLE_USER
 *   - No "Register as Delivery Partner" — backend does not support it
 *   - No "Register as Admin" — Admin created via AdminBootstrap only
 *   - Phone field is REQUIRED by the backend User entity
 *
 * On success: stores auth state and redirects to /customer portal.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

import { register as registerApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import BrandLogo from '../../components/common/BrandLogo';

// ── Zod validation schema ─────────────────────────────────────────────────
const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone:    z.string()
              .min(10, 'Phone must be at least 10 digits')
              .regex(/^\d+$/, 'Phone must contain only digits'),
  password: z.string()
              .min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [serverError,  setServerError]  = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const authResponse = await registerApi(data);
      // Backend always returns ROLE_USER; route accordingly
      setAuth(authResponse);
      navigate('/customer', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-3">
            <BrandLogo size="lg" to="/" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join us and order your favourite food</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Server error */}
            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {serverError}
              </div>
            )}

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition
                    ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition
                    ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition
                    ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Login & Cross-Portal links */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center text-xs text-gray-500">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 font-bold hover:underline">
                Sign in
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-400 pt-1">
              <Link to="/register/restaurant-owner" className="hover:text-gray-700 underline">
                Partner as Restaurant
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
