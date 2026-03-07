
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
  // Expanded details
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
  progress: number; // 0 to 100 representing percentage of trip
  status: 'on_route' | 'stopped' | 'deviated' | 'arrived';
  lastUpdated: string;
}

export interface Donation {
  id: string;
  hotelId: string;
  title: string;
  weight: number;
  tags: string[];
  status: 'pending' | 'assigned' | 'completed';
  timestamp: string;
  imageUrl?: string;
  pickupWindow: string;
  activeRequest?: Volunteer; // A volunteer requesting to pick it up
  assignedVolunteer?: Volunteer; // The volunteer who was accepted
  tracking?: TrackingInfo;
  rating?: number; // 1-5 stars
  review?: string;
  isUrgent?: boolean;
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