import { HotelDonation } from '../types';

export const FALLBACK_HOTEL_LOCATION = { lat: 19.0176, lng: 72.8562 };

const HOTEL_LOCATIONS: Record<string, { lat: number; lng: number }> = {};
const HOTEL_NAMES: Record<string, string> = {};

export function setHotelName(hotelId: string, hotelName?: string) {
  if (hotelName) {
    HOTEL_NAMES[hotelId] = hotelName;
  }
}

export function getHotelName(donation: HotelDonation): string {
  return donation.hotelName || HOTEL_NAMES[donation.hotelId] || 'Unknown Hotel';
}

export function getHotelLocation(hotelId: string): { lat: number; lng: number } {
  if (!HOTEL_LOCATIONS[hotelId]) {
    HOTEL_LOCATIONS[hotelId] = FALLBACK_HOTEL_LOCATION;
  }
  return HOTEL_LOCATIONS[hotelId];
}

export function setHotelLocation(hotelId: string, lat: number, lng: number) {
  HOTEL_LOCATIONS[hotelId] = { lat, lng };
}

export function hasHotelLocation(hotelId: string): boolean {
  return !!HOTEL_LOCATIONS[hotelId];
}

// Seed demo markers in Mumbai, Thane, and Kalyan for realistic locality-based listing.
setHotelName('demo-hotel-001', 'Hotel Paradise');
setHotelLocation('demo-hotel-001', 19.0176, 72.8562); // Demo Hotel Paradise - central Mumbai
setHotelLocation('hotel-colaba-kitchen', 18.9182, 72.8331);
setHotelLocation('hotel-dadar-dining', 19.0180, 72.8429);
setHotelLocation('hotel-bandra-bites', 19.0607, 72.8362);
setHotelLocation('hotel-andheri-tiffin', 19.1197, 72.8468);
setHotelLocation('hotel-powai-platter', 19.1176, 72.9060);
setHotelLocation('hotel-chembur-corner', 19.0620, 72.9005);
setHotelLocation('hotel-vashi-vyanjan', 19.0771, 72.9986);
setHotelLocation('hotel-ghatkopar-grain', 19.0854, 72.9081);
setHotelLocation('hotel-thane-lakeview', 19.2183, 72.9781);
setHotelLocation('hotel-thane-mealbox', 19.2030, 72.9722);
setHotelLocation('hotel-thane-khopat', 19.1894, 72.9688);
setHotelLocation('hotel-kalyan-foodhub', 19.2437, 73.1355);
setHotelLocation('hotel-kalyan-station', 19.2368, 73.1307);
setHotelLocation('hotel-dombivli-delights', 19.2167, 73.0875);
setHotelLocation('hotel-ambernath-ann', 19.2094, 73.1868);
setHotelLocation('hotel-ulhasnagar-udupi', 19.2215, 73.1632);
