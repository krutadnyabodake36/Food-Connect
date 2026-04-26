
// ==========================================
// SHARED TYPES
// ==========================================

export type UserRole = 'hotel' | 'volunteer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  // Hotel-specific
  hotelName?: string;
  managerNumber?: string;
  licenseNumber?: string;
  // Volunteer-specific
  age?: number;
  vehicle?: string;
  ngoName?: string;
  ngoNumber?: string;
  contactPerson?: string;
}

// ==========================================
// HOTEL (PARTNER) TYPES
// ==========================================

export interface Hotel {
  id: string;
  hotelName: string;
  address: string;
  managerNumber: string;
  licenseNumber: string;
  createdAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  vehicle: string;
  location?: string;
  availability?: string;
  completedTrips?: number;
  joinedDate?: string;
  phone?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface TrackingInfo {
  active: boolean;
  currentLocation: Location;
  destination: Location;
  progress: number;
  status: 'on_route' | 'stopped' | 'deviated' | 'arrived';
  lastUpdated: string;
}

export interface HotelDonation {
  id: string;
  hotelId: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelType?: string;
  contactName?: string;
  title: string;
  description?: string;
  isVeg?: boolean;
  prepTime?: string;
  weight: number;
  quantityUnit?: 'kg' | 'plates' | 'pieces' | 'servings';
  tags: string[];
  status: 'pending' | 'assigned' | 'completed';
  timestamp: string;
  createdAt?: string;
  imageUrl?: string;
  pickupWindow: string;
  activeRequest?: Volunteer;
  assignedVolunteer?: Volunteer;
  tracking?: TrackingInfo;
  pickupCode?: string;
  rating?: number;
  review?: string;
  isUrgent?: boolean;
  claimedQuantity?: number;  // NEW: What volunteer claims to pick (partial pickup)
  expiryDate?: string;  // NEW: ISO datetime when food was prepared / when it expires
}

export interface Stats {
  rescuedKg: number;
  mealsServed: number;
  nextPickup: string;
  nextPickupStatus: string;
}

export enum NavItem {
  DASHBOARD = 'dashboard',
  DONATE = 'donate',
  REQUESTS = 'requests',
  HISTORY = 'history',
  SETTINGS = 'settings',
}

export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  url?: string;
}

// ==========================================
// VOLUNTEER TYPES
// ==========================================

export interface VolunteerDonation {
  id: string;
  hotelName: string;
  distance: string;
  foodItem: string;
  quantity: number;
  expiryTime: string;
  pickupTime: string;
  lat: number;
  lng: number;
  imageUrl: string;
  tags: string[];
}

export interface VolunteerMapProps {
  donations: VolunteerDonation[];
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  isNavigating?: boolean;
}

export interface DonationSheetProps {
  donations: VolunteerDonation[];
  selectedId: string | null;
  onCloseDetail: () => void;
  onSelectDonation: (id: string) => void;
  onAcceptPickup: (id: string) => void;
  isNavigating?: boolean;
}
