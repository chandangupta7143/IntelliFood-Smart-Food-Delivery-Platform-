import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Play, Square, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { updateLocation } from '../../api/deliveryApi';
import useAuthStore from '../../store/authStore';

/**
 * LocationSharingControl
 *
 * Allows delivery partners to stream real-time GPS coordinates to the backend (POST /api/delivery/location).
 * Features:
 * - Real GPS via navigator.geolocation.getCurrentPosition
 * - Built-in Simulation Mode with coordinates and step simulator
 * - 10-second minimum interval throttle (respects backend rate-limits & prevents anti-spoofing trips)
 * - Live connection indicator and error banners
 */
export default function LocationSharingControl({ partner, onLocationUpdated }) {
  const token = useAuthStore((s) => s.token);
  const [isSharing, setIsSharing] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);

  // Default coordinates (Pune Central / Shivajinagar)
  const [latitude, setLatitude] = useState(partner?.latitude || 18.5204);
  const [longitude, setLongitude] = useState(partner?.longitude || 73.8567);

  const [lastPushedTime, setLastPushedTime] = useState(partner?.lastLocationUpdateTime || null);
  const [isPushing, setIsPushing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const latestCoordsRef = useRef({ lat: latitude, lng: longitude });

  // Keep ref up to date
  useEffect(() => {
    latestCoordsRef.current = { lat: latitude, lng: longitude };
  }, [latitude, longitude]);

  // Update initial coords if partner data loads
  useEffect(() => {
    if (partner?.latitude && partner?.longitude) {
      setLatitude(partner.latitude);
      setLongitude(partner.longitude);
      latestCoordsRef.current = { lat: partner.latitude, lng: partner.longitude };
    }
  }, [partner?.latitude, partner?.longitude]);

  // Core push function
  const pushCoordinates = async (lat, lng) => {
    setIsPushing(true);
    setErrorMsg('');
    try {
      const updated = await updateLocation({ latitude: lat, longitude: lng });
      setLastPushedTime(new Date().toISOString());
      setSuccessMsg(`Location updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      if (onLocationUpdated) {
        onLocationUpdated(updated);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update location';
      setErrorMsg(msg);
    } finally {
      setIsPushing(false);
    }
  };

  // Start / Stop Location Tracking
  const toggleSharing = () => {
    if (isSharing) {
      stopSharing();
    } else {
      startSharing();
    }
  };

  const startSharing = () => {
    setIsSharing(true);
    setErrorMsg('');
    setSuccessMsg('Location broadcast active (10s interval)');

    // Immediate initial push
    pushCoordinates(latestCoordsRef.current.lat, latestCoordsRef.current.lng);

    if (simulationMode) {
      // In simulation mode, interval simulates slight movement (e.g. driving at ~30 km/h)
      intervalRef.current = setInterval(() => {
        setLatitude((prevLat) => {
          const deltaLat = (Math.random() - 0.45) * 0.001; // slight north-east drift
          const nextLat = Number((prevLat + deltaLat).toFixed(6));
          return nextLat;
        });
        setLongitude((prevLng) => {
          const deltaLng = (Math.random() - 0.45) * 0.001;
          const nextLng = Number((prevLng + deltaLng).toFixed(6));
          return nextLng;
        });

        pushCoordinates(latestCoordsRef.current.lat, latestCoordsRef.current.lng);
      }, 10000);
    } else {
      // Use Browser Geolocation
      if (!('geolocation' in navigator)) {
        setErrorMsg('Geolocation is not supported by your browser. Switch to Simulation mode.');
        setIsSharing(false);
        return;
      }

      // Read browser position every 10s
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            setLatitude(lat);
            setLongitude(lng);
            pushCoordinates(lat, lng);
          },
          (err) => {
            setErrorMsg(`GPS Error: ${err.message}. Consider using Simulation Mode.`);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }, 10000);
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    setSuccessMsg('Location broadcast stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Stop broadcasting when driver goes OFFLINE or logs out
  useEffect(() => {
    if ((partner?.status === 'OFFLINE' || !token) && isSharing) {
      stopSharing();
    }
  }, [partner?.status, token, isSharing]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-xl ${isSharing ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            <Navigation className={`w-5 h-5 ${isSharing ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              GPS Location Stream
              {isSharing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Broadcasting
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              Pushes coordinates every 10s for customer live tracking & assignment
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={toggleSharing}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
            isSharing
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isSharing ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop GPS
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Start GPS
            </>
          )}
        </button>
      </div>

      {/* Mode Selector & Coords Display */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 select-none">
            <input
              type="checkbox"
              checked={simulationMode}
              disabled={isSharing}
              onChange={(e) => setSimulationMode(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-400 w-3.5 h-3.5"
            />
            <span>Simulation Mode (Dev/Testing)</span>
          </label>
        </div>

        <div className="flex items-center gap-2 text-gray-600 font-mono">
          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
        </div>
      </div>

      {/* Simulation Controls (Visible when in Simulation Mode) */}
      {simulationMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={latitude}
              disabled={isSharing}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={longitude}
              disabled={isSharing}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={isPushing}
              onClick={() => pushCoordinates(latitude, longitude)}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2 px-3 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isPushing ? 'animate-spin' : ''}`} />
              Push Once
            </button>
          </div>
        </div>
      )}

      {/* Status Banners */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && !errorMsg && (
        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {lastPushedTime && (
            <span className="text-[10px] text-emerald-600 opacity-80">
              {new Date(lastPushedTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
