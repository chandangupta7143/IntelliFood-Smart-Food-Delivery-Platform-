import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, Compass, Check, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import useLocationStore, { POPULAR_INDIAN_LOCATIONS } from '../../store/locationStore';

export default function LocationModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const locationStore = useLocationStore();

  const [stateName, setStateName] = useState(locationStore.state || 'Maharashtra');
  const [cityName, setCityName] = useState(locationStore.city || 'Pune');
  const [villageName, setVillageName] = useState(locationStore.village || 'Shivajinagar');
  const [radiusKm, setRadiusKm] = useState(locationStore.radiusKm || 10);
  const [lat, setLat] = useState(locationStore.latitude || 18.5204);
  const [lng, setLng] = useState(locationStore.longitude || 73.8567);

  const [mode, setMode] = useState('preset'); // 'preset' | 'custom'
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStateName(locationStore.state || 'Maharashtra');
      setCityName(locationStore.city || 'Pune');
      setVillageName(locationStore.village || 'Shivajinagar');
      setRadiusKm(locationStore.radiusKm || 10);
      setLat(locationStore.latitude || 18.5204);
      setLng(locationStore.longitude || 73.8567);
      setGeoError('');
      setSaveSuccess(false);
    }
  }, [isOpen, locationStore]);

  // Derived available cities for preset mode
  const currentPresetState = POPULAR_INDIAN_LOCATIONS.find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  const availableCities = currentPresetState ? currentPresetState.cities : [];
  const currentPresetCity = availableCities.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  );
  const availableAreas = currentPresetCity ? currentPresetCity.areas : [];

  const handleStateChange = (selectedState) => {
    setStateName(selectedState);
    const stateObj = POPULAR_INDIAN_LOCATIONS.find((s) => s.state === selectedState);
    if (stateObj && stateObj.cities.length > 0) {
      const firstCity = stateObj.cities[0];
      setCityName(firstCity.name);
      setVillageName(firstCity.areas[0] || 'Center');
      setLat(firstCity.lat);
      setLng(firstCity.lng);
    }
  };

  const handleCityChange = (selectedCity) => {
    setCityName(selectedCity);
    const cityObj = availableCities.find((c) => c.name === selectedCity);
    if (cityObj) {
      setVillageName(cityObj.areas[0] || 'Center');
      setLat(cityObj.lat);
      setLng(cityObj.lng);
    }
  };

  const handleAreaChange = (selectedArea) => {
    setVillageName(selectedArea);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6));
        const detectedLng = Number(pos.coords.longitude.toFixed(6));
        setLat(detectedLat);
        setLng(detectedLng);
        setMode('custom');
        setVillageName('My Current Area');
        setCityName('Current City');
        setStateName('Current State');
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(err.message || 'Unable to retrieve your GPS position. Please select manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    locationStore.setLocation({
      state: stateName.trim() || 'Custom State',
      city: cityName.trim() || 'Custom City',
      village: villageName.trim() || 'Custom Village',
      latitude: lat,
      longitude: lng,
      radiusKm: Number(radiusKm) || 10,
      isCustom: mode === 'custom',
    });

    // Invalidate all restaurant queries so the UI immediately switches to nearby restaurants
    queryClient.invalidateQueries({ queryKey: ['restaurants'] });

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleResetToDefault = () => {
    locationStore.resetToDefault();
    queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Your Location" size="lg">
      <div className="p-6 space-y-6">
        {/* Banner with GPS button */}
        <div className="bg-gradient-to-r from-blue-900/10 via-sky-900/10 to-blue-950/10 border border-blue-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Auto-Detect GPS Location</p>
              <p className="text-xs text-gray-500">Get restaurants nearest to your live coordinates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={geoLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {geoLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                Use GPS
              </>
            )}
          </button>
        </div>

        {geoError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'preset' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Popular Cities & Towns
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custom State, City & Village
          </button>
        </div>

        {mode === 'preset' ? (
          <div className="space-y-4">
            {/* State Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                State
              </label>
              <select
                value={stateName}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {POPULAR_INDIAN_LOCATIONS.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City / District
              </label>
              <select
                value={cityName}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {availableCities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Village / Area Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Village / Locality / Sector
              </label>
              {availableAreas.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={villageName}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400">
                    Or switch to &quot;Custom State, City & Village&quot; tab to type any specific village or town.
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="Enter village or locality..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                State Name
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Maharashtra, Uttar Pradesh, Bihar..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City / Town Name
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Pune, Lucknow, Patna..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Village / Area / Colony Name
              </label>
              <input
                type="text"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                placeholder="e.g. Shivajinagar, Rampur, Kothrud..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Custom Coordinates (Optional / Advanced) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Nearby Radius Selector */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              Delivery Radius: <span className="text-blue-600 font-black">{radiusKm} km</span>
            </label>
            <span className="text-[11px] text-gray-400">Strict nearby filtering</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 25].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  radiusKm === r
                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Only restaurants registered within {radiusKm} km of this location will appear. If nobody created a restaurant nearby, the app will show 0 restaurants.
          </p>
        </div>

        {/* Current Active Preview */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-600 flex items-center justify-between">
          <div className="truncate">
            <span className="font-bold text-gray-800">Target Location: </span>
            <span>{villageName ? `${villageName}, ` : ''}{cityName}, {stateName}</span>
          </div>
          <span className="font-mono text-[10px] text-gray-400 shrink-0 ml-2">
            [{lat.toFixed(3)}, {lng.toFixed(3)}]
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
          >
            Reset to Pune Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Applied!
                </>
              ) : (
                'Save & Show Nearby'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
