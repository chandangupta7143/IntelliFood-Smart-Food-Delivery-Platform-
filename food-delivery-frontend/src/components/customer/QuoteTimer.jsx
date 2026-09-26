import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function QuoteTimer({ expiresAt, onExpire, className = '' }) {
  const getExpiresMs = (exp) => {
    if (!exp) return 0;
    if (typeof exp === 'number') {
      return exp < 1e11 ? exp * 1000 : exp;
    }
    const parsed = new Date(exp).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const expMs = getExpiresMs(expiresAt);
    if (!expMs) return 0;
    const diff = Math.floor((expMs - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const expMs = getExpiresMs(expiresAt);
    if (!expMs) return;

    const interval = setInterval(() => {
      const diff = Math.floor((expMs - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(interval);
        onExpire?.();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  if (secondsRemaining <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 text-red-800 border border-red-300 ${className}`}>
        <AlertTriangle className="w-4 h-4 text-red-600" />
        Quote expired! Please refresh quote.
      </div>
    );
  }

  const isUrgent = secondsRemaining <= 15;
  const isWarning = secondsRemaining <= 45;

  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (isUrgent) {
    bgClass = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
  } else if (isWarning) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${bgClass} ${className}`}>
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>
        Price locked for <strong className="font-bold">{formatted}</strong>
      </span>
    </div>
  );
}
