import { apiRequest } from './api';

export interface LocationData {
  volunteerID: number;
  donationID: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationUpdate {
  ok: boolean;
  id: number;
  timestamp: string;
}

export interface LatestLocation {
  found: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: string;
  message?: string;
}

/**
 * Start real-time location tracking for a volunteer
 * Updates location every 10 seconds
 */
export function startLocationTracking(
  volunteerID: number,
  donationID: number,
  onLocationUpdate?: (location: LocationData) => void,
  onError?: (error: string) => void
): () => void {
  let watchId: number | null = null;
  let lastUpdate = 0;
  const UPDATE_INTERVAL = 10000; // 10 seconds

  if (!navigator.geolocation) {
    const error = 'Geolocation is not supported by your browser';
    onError?.(error);
    return () => {};
  }

  const handleSuccess = async (position: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastUpdate < UPDATE_INTERVAL) return; // Skip if too soon

    lastUpdate = now;
    const { latitude, longitude, accuracy } = position.coords;

    try {
      const locationData: LocationData = {
        volunteerID,
        donationID,
        latitude,
        longitude,
        accuracy,
      };

      const result = await apiRequest<LocationUpdate>('/location/update', {
        method: 'POST',
        body: JSON.stringify(locationData),
      });

      if (result.ok) {
        onLocationUpdate?.({
          ...locationData,
        });
      }
    } catch (err: any) {
      onError?.(err.message || 'Failed to update location');
    }
  };

  const handleError = (error: GeolocationPositionError) => {
    let message = 'Failed to get location';
    if (error.code === 1) message = 'Location permission denied';
    else if (error.code === 2) message = 'Position unavailable';
    else if (error.code === 3) message = 'Location request timeout';
    onError?.(message);
  };

  // Request high accuracy location with 10 second updates
  watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });

  // Return cleanup function
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}

/**
 * Get latest volunteer location for a donation
 */
export async function getLatestLocation(donationID: number): Promise<LatestLocation> {
  return apiRequest<LatestLocation>(`/location/${donationID}/latest`, {
    method: 'GET',
  });
}

/**
 * Get location history (path taken)
 */
export async function getLocationHistory(
  donationID: number,
  limit: number = 100
): Promise<LocationData[]> {
  return apiRequest<LocationData[]>(`/location/${donationID}/history?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate ETA based on distance and average speed
 * Assumes average speed of 30 km/h for vehicles
 */
export function estimateETA(distanceKm: number, speedKmh: number = 30): number {
  return Math.ceil((distanceKm / speedKmh) * 60); // Return in minutes
}
