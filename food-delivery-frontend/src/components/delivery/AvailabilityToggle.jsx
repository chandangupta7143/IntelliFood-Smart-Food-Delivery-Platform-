import React, { useState } from 'react';
import { Power, AlertCircle, Loader2 } from 'lucide-react';
import { updateAvailability } from '../../api/deliveryApi';

export default function AvailabilityToggle({
  currentStatus = 'OFFLINE',
  onStatusChange,
  disabled = false,
  className = '',
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOnline = currentStatus === 'ONLINE';
  const isBusy = currentStatus === 'BUSY' || currentStatus === 'ON_DELIVERY';
  const isSuspended = currentStatus === 'SUSPENDED';

  const handleToggle = async () => {
    if (isSuspended || isBusy || disabled) return;

    const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';
    setLoading(true);
    setErrorMsg('');

    try {
      const updated = await updateAvailability(nextStatus);
      onStatusChange?.(updated.status);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-xs ${
              isSuspended
                ? 'bg-red-100 text-red-700 ring-4 ring-red-50'
                : isBusy
                ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50'
                : isOnline
                ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
                : 'bg-gray-100 text-gray-500 ring-4 ring-gray-50'
            }`}
          >
            <Power className={`w-6 h-6 ${isOnline ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Partner Duty Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  isSuspended
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : isBusy
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSuspended
                      ? 'bg-red-500'
                      : isBusy
                      ? 'bg-amber-500 animate-ping'
                      : isOnline
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                />
                {currentStatus}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {isSuspended
                ? 'Your account has been suspended by administration.'
                : isBusy
                ? 'You are currently assigned to an active delivery.'
                : isOnline
                ? 'You are visible for nearby restaurant orders.'
                : 'Go online to receive delivery requests.'}
            </p>
          </div>
        </div>

        {/* Action button */}
        {!isSuspended && !isBusy && (
          <button
            type="button"
            disabled={loading || disabled}
            onClick={handleToggle}
            className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isOnline
                ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
                : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-md'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
