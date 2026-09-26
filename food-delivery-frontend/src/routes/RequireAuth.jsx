/**
 * RequireAuth.jsx
 *
 * Route guard: Ensures the user is authenticated before rendering protected routes.
 * If not authenticated, redirects to /login and preserves the attempted URL
 * so we can redirect back after successful login.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RequireAuth() {
  const token    = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    // Pass the current location as state so LoginPage can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
