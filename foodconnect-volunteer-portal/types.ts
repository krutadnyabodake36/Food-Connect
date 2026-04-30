export interface Donation {
  id: string;
  hotelName: string;
  distance: string;
  foodItem: string;
  weight: number; // changed from quantity → weight
  quantityUnit?: 'kg' | 'plates' | 'pieces' | 'servings'; // NEW: track unit type
  expiryTime: string;
  pickupTime: string;
  lat: number;
  lng: number;
  imageUrl: string;
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'volunteer' | 'ngo';
  avatar?: string;
  phone?: string;
  address?: string;
  age?: number;
  vehicle?: string;
  ngoName?: string;
  ngoNumber?: string;
  contactPerson?: string;
}

export interface VolunteerMapProps {
  donations: Donation[];
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  isNavigating?: boolean;
}

export interface DonationSheetProps {
  donations: Donation[];
  selectedId: string | null;
  onCloseDetail: () => void;
  onSelectDonation: (id: string) => void;
  onAcceptPickup: (id: string, claimedQuantity: number, quantityUnit: string) => void; // NEW: pass claimed quantity and unit
  isNavigating?: boolean;
}
