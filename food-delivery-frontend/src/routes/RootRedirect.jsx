/**
 * RootRedirect.jsx
 *
 * Smart redirect from "/" based on the authenticated user's role.
 * If not authenticated, sends to /login.
 */

import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_PORTAL = {
  USER:             '/customer',
  DELIVERY_PARTNER: '/delivery',
  RESTAURANT_OWNER: '/restaurant',
  ADMIN:            '/admin',
};

export default function RootRedirect() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const destination = ROLE_PORTAL[user.role] ?? '/login';
  return <Navigate to={destination} replace />;
}
