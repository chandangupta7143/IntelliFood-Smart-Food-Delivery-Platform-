/**
 * App.jsx — Root Application Component
 *
 * Responsibilities:
 *   1. Restores auth state from localStorage on initial mount
 *   2. Renders the route tree via AppRoutes
 */

import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';

export default function App() {
  const restoreAuth = useAuthStore((s) => s.restoreAuth);

  // On mount: rehydrate auth from localStorage so page refreshes
  // don't log users out unexpectedly.
  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return <AppRoutes />;
}
