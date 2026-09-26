/**
 * main.jsx — Application Entry Point
 *
 * Mounts the React tree into #root.
 * Wraps the entire app with:
 *   - QueryClientProvider  (TanStack React Query — server state)
 *   - BrowserRouter        (React Router — client-side routing)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';
import './index.css';

// ---------------------------------------------------------------------------
// React Query client — server state configuration
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Do not refetch on every window focus by default — backend APIs are
      // not a live-polling system; real-time updates come via WebSocket.
      refetchOnWindowFocus: false,
      // Retry failed requests once before surfacing an error to the UI.
      retry: 1,
      // Cache data for 5 minutes before marking it stale.
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
