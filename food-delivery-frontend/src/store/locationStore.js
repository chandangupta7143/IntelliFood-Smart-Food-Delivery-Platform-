import { create } from 'zustand';

const LOCATION_STORAGE_KEY = 'intellifood_user_location';

export const POPULAR_INDIAN_LOCATIONS = [
  {
    state: 'Maharashtra',
    cities: [
      { name: 'Pune', areas: ['Shivajinagar', 'Kothrud', 'Hinjewadi', 'Viman Nagar', 'Baner', 'Hadapsar'], lat: 18.5204, lng: 73.8567 },
      { name: 'Mumbai', areas: ['Bandra', 'Andheri', 'Colaba', 'Dadar', 'Borivali', 'Powai'], lat: 19.0760, lng: 72.8777 },
      { name: 'Nagpur', areas: ['Dharampeth', 'Sitabuldi', 'Sadar', 'Manish Nagar'], lat: 21.1458, lng: 79.0882 },
      { name: 'Nashik', areas: ['College Road', 'Panchavati', 'Indira Nagar', 'Gangapur Road'], lat: 19.9975, lng: 73.7898 },
    ],
  },
  {
    state: 'Delhi NCR',
    cities: [
      { name: 'New Delhi', areas: ['Connaught Place', 'Hauz Khas', 'Saket', 'Karol Bagh', 'Dwarka'], lat: 28.6139, lng: 77.2090 },
      { name: 'Noida', areas: ['Sector 18', 'Sector 62', 'Sector 137', 'Greater Noida'], lat: 28.5355, lng: 77.3910 },
      { name: 'Gurugram', areas: ['Cyber Hub', 'DLF Phase 3', 'Sohna Road', 'Golf Course Road'], lat: 28.4595, lng: 77.0266 },
    ],
  },
  {
    state: 'Karnataka',
    cities: [
      { name: 'Bengaluru', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'], lat: 12.9716, lng: 77.5946 },
      { name: 'Mysuru', areas: ['Gokulam', 'Jayalakshmipuram', 'Kuvempunagar', 'Saraswathipuram'], lat: 12.2958, lng: 76.6394 },
    ],
  },
  {
    state: 'Uttar Pradesh',
    cities: [
      { name: 'Lucknow', areas: ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Aminabad'], lat: 26.8467, lng: 80.9462 },
      { name: 'Kanpur', areas: ['Swaroop Nagar', 'Civil Lines', 'Kakadeo', 'Govind Nagar'], lat: 26.4499, lng: 80.3319 },
      { name: 'Varanasi', areas: ['Lanka', 'Sigra', 'Assi Ghat', 'Godowlia', 'Bhojubir'], lat: 25.3176, lng: 82.9739 },
      { name: 'Agra', areas: ['Tajganj', 'Sanjay Place', 'Civil Lines', 'Dayalbagh'], lat: 27.1767, lng: 78.0081 },
      { name: 'Prayagraj', areas: ['Civil Lines', 'George Town', 'Katra', 'Tagore Town'], lat: 25.4358, lng: 81.8463 },
    ],
  },
  {
    state: 'Gujarat',
    cities: [
      { name: 'Ahmedabad', areas: ['Navrangpura', 'Bodakdev', 'Vastrapur', 'Satellite', 'Maninagar'], lat: 23.0225, lng: 72.5714 },
      { name: 'Surat', areas: ['Vesu', 'Adajan', 'Athwa', 'Piplod', 'Varachha'], lat: 21.1702, lng: 72.8311 },
    ],
  },
  {
    state: 'Rajasthan',
    cities: [
      { name: 'Jaipur', areas: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Raja Park'], lat: 26.9124, lng: 75.7873 },
      { name: 'Udaipur', areas: ['Fatehpura', 'Hiran Magri', 'Panchwati', 'Sector 14'], lat: 24.5854, lng: 73.7125 },
    ],
  },
  {
    state: 'Madhya Pradesh',
    cities: [
      { name: 'Indore', areas: ['Vijay Nagar', 'Palasia', 'Bhawarkua', 'Rajendra Nagar'], lat: 22.7196, lng: 75.8577 },
      { name: 'Bhopal', areas: ['MP Nagar', 'Arera Colony', 'Kolar Road', 'Shahpura'], lat: 23.2599, lng: 77.4126 },
    ],
  },
  {
    state: 'Bihar',
    cities: [
      { name: 'Patna', areas: ['Boring Road', 'Kankarbagh', 'Bailey Road', 'Frazer Road', 'Danapur'], lat: 25.5941, lng: 85.1376 },
      { name: 'Muzaffarpur', areas: ['Mithanpura', 'Kalambagh', 'Aghoria Bazar'], lat: 26.1209, lng: 85.3647 },
    ],
  },
  {
    state: 'West Bengal',
    cities: [
      { name: 'Kolkata', areas: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge', 'Garia'], lat: 22.5726, lng: 88.3639 },
    ],
  },
  {
    state: 'Telangana',
    cities: [
      { name: 'Hyderabad', areas: ['Madhapur', 'Gachibowli', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally'], lat: 17.3850, lng: 78.4867 },
    ],
  },
  {
    state: 'Tamil Nadu',
    cities: [
      { name: 'Chennai', areas: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Besant Nagar'], lat: 13.0827, lng: 80.2707 },
    ],
  },
];

// Default to Pune / Shivajinagar where active restaurants are registered
const DEFAULT_LOCATION = {
  state: 'Maharashtra',
  city: 'Pune',
  village: 'Shivajinagar',
  latitude: 18.5204,
  longitude: 73.8567,
  radiusKm: 10,
  isCustom: false,
};

function getInitialLocation() {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.latitude && parsed.longitude) {
        return {
          state: parsed.state || 'Maharashtra',
          city: parsed.city || 'Pune',
          village: parsed.village || 'Shivajinagar',
          latitude: Number(parsed.latitude),
          longitude: Number(parsed.longitude),
          radiusKm: Number(parsed.radiusKm) || 10,
          isCustom: !!parsed.isCustom,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return DEFAULT_LOCATION;
}

const useLocationStore = create((set, get) => ({
  ...getInitialLocation(),
  isLocationModalOpen: false,

  openLocationModal: () => set({ isLocationModalOpen: true }),
  closeLocationModal: () => set({ isLocationModalOpen: false }),

  setLocation: (loc) => {
    const updated = {
      state: loc.state?.trim() || get().state,
      city: loc.city?.trim() || get().city,
      village: loc.village?.trim() || loc.area?.trim() || get().village,
      latitude: Number(loc.latitude ?? get().latitude),
      longitude: Number(loc.longitude ?? get().longitude),
      radiusKm: Number(loc.radiusKm ?? get().radiusKm ?? 10),
      isCustom: loc.isCustom ?? true,
    };

    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable fallback
    }

    set({ ...updated, isLocationModalOpen: false });
  },

  setRadius: (radiusKm) => {
    const r = Number(radiusKm) || 10;
    set((state) => {
      const updated = { ...state, radiusKm: r };
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { radiusKm: r };
    });
  },

  resetToDefault: () => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(DEFAULT_LOCATION));
    } catch {}
    set({ ...DEFAULT_LOCATION, isLocationModalOpen: false });
  },

  getFormattedLocation: () => {
    const { village, city, state } = get();
    const parts = [village, city, state].filter(Boolean);
    return parts.join(', ');
  },

  getShortLocation: () => {
    const { city, village } = get();
    return `${city || 'City'} | ${village || 'Area'}`;
  },
}));

export default useLocationStore;
