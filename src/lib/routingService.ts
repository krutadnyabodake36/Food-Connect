/**
 * Routing service using Open Source Routing Machine (OSRM)
 * Uses free public OSRM API for route calculation
 * For production, consider hosting your own OSRM instance
 */

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Route {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lng, lat] pairs for route
  geometry: string;
}

interface OsrmGeometry {
  coordinates: [number, number][];
  type: string;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: OsrmGeometry;
}

export interface RouteResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: Array<{ hint: string; distance: number; name: string; location: [number, number] }>;
}

/**
 * Calculate fastest route between two points using OSRM
 * Uses the free public OSRM service
 */
export async function calculateFastestRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<Route | null> {
  try {
    // Use OSRM API (free public instance)
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to calculate route');

    const data = (await response.json()) as RouteResponse;

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('No route found from OSRM');
      return null;
    }

    const route = data.routes[0];

    return {
      distance: route.distance,
      duration: route.duration,
      coordinates: route.geometry.coordinates || [],
      geometry: route.geometry.type || 'LineString',
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    // Fallback to straight line if routing fails
    return null;
  }
}

/**
 * Calculate distance between two points (haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate time to destination in minutes
 */
export function calculateETA(durationSeconds: number): number {
  return Math.ceil(durationSeconds / 60);
}

/**
 * Calculate progress percentage along route
 */
export function calculateProgress(
  currentLat: number,
  currentLng: number,
  routeCoordinates: [number, number][]
): number {
  if (!routeCoordinates || routeCoordinates.length < 2) return 0;

  let closestIndex = 0;
  let minDistance = Infinity;

  // Find closest point on route
  for (let i = 0; i < routeCoordinates.length; i++) {
    const dist = calculateDistance(
      currentLat,
      currentLng,
      routeCoordinates[i][1],
      routeCoordinates[i][0]
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // Progress = (position on route / total route length) * 100
  return Math.round((closestIndex / routeCoordinates.length) * 100);
}
