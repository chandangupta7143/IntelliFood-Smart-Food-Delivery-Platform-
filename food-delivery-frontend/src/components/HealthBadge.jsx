/**
 * HealthBadge.jsx
 *
 * Development utility component — checks GET /healthz and shows a live badge.
 * Proves Axios → Spring Boot connectivity from within the React app.
 *
 * Shows:
 *   🟢 Backend UP     — when /healthz returns { status: "UP" }
 *   🔴 Backend DOWN   — on network error or non-UP status
 *   ⏳ Checking…      — while the request is in-flight
 */

import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function HealthBadge() {
  const [status, setStatus] = useState('checking'); // 'up' | 'down' | 'checking'

  useEffect(() => {
    axiosClient
      .get('/healthz')
      .then((res) => {
        setStatus(res.data?.status === 'UP' ? 'up' : 'down');
      })
      .catch(() => setStatus('down'));
  }, []);

  const config = {
    up:       { label: 'Backend UP',    dot: 'bg-green-400', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    down:     { label: 'Backend DOWN',  dot: 'bg-red-400',   text: 'text-red-700',   bg: 'bg-red-50 border-red-200'   },
    checking: { label: 'Checking…',     dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
