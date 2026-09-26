/**
 * LoginPage.jsx
 *
 * Clean, minimal login form backed by react-hook-form + zod validation.
 * On success: stores JWT in Zustand → localStorage → redirects to correct portal.
 *
 * Backend endpoint: POST /api/auth/login
 * Response: { token, userId, name, email, role }
 *
 * Error handling:
 *   - 401: "Invalid email or password" (shown inline)
 *   - Validation errors: shown per-field
 *   - Other: generic message shown
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ChefHat, Bike, ArrowRight } from 'lucide-react';

import { login as loginApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import BrandLogo from '../../components/common/BrandLogo';

// ── Zod validation schema ─────────────────────────────────────────────────
const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Role → portal path mapping
const ROLE_PORTAL = {
  USER:             '/customer',
  DELIVERY_PARTNER: '/delivery',
  RESTAURANT_OWNER: '/restaurant',
  ADMIN:            '/admin',
};

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const setAuth   = useAuthStore((s) => s.setAuth);

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
      const authResponse = await loginApi(data);
      setAuth(authResponse);

      // Redirect back to the originally attempted page ONLY if permitted for this role
      const from = location.state?.from?.pathname;
      let dest = ROLE_PORTAL[authResponse.role] || '/';
      if (from && from !== '/' && from !== '/login') {
        const isPermitted =
          authResponse.role === 'ADMIN' ||
          (authResponse.role === 'USER' && from.startsWith('/customer')) ||
          (authResponse.role === 'RESTAURANT_OWNER' && from.startsWith('/restaurant')) ||
          (authResponse.role === 'DELIVERY_PARTNER' && from.startsWith('/delivery'));
        if (isPermitted) {
          dest = from;
        }
      }
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
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
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
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

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
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
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Register customer link */}
          <div className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-orange-600 font-semibold hover:underline">
              Create Customer Account
            </Link>
          </div>

          {/* Partner & Driver onboarding hub */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">
              Partner With Us
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/register/restaurant-owner"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-100/70 text-gray-800 transition group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 group-hover:text-orange-600">Restaurant</div>
                  <div className="text-[10px] text-gray-500">List your kitchen</div>
                </div>
              </Link>

              <Link
                to="/register/delivery-partner"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 text-gray-800 transition group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">Delivery</div>
                  <div className="text-[10px] text-gray-500">Drive & earn</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
