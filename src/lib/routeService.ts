// OpenRouteService — fetch real driving directions
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

export interface RouteResult {
  coordinates: [number, number][];  // [lat, lng] array for Leaflet
  distanceKm: number;
  durationMin: number;
  summary: string;
}

/**
 * Get driving directions between two points.
 * Returns a decoded route polyline, distance (km), and duration (min).
 */
export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  if (!ORS_API_KEY) {
    console.warn('ORS API key not set. Using straight line.');
    return null;
  }

  try {
    const res = await fetch(
      `${ORS_BASE}?api_key=${ORS_API_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`,
      { headers: { 'Accept': 'application/json, application/geo+json' } }
    );

    if (!res.ok) {
      console.error('ORS error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const coords: [number, number][] = feature.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as [number, number]  // GeoJSON is [lng, lat] → Leaflet [lat, lng]
    );

    const segment = feature.properties?.segments?.[0];
    const distanceKm = segment ? +(segment.distance / 1000).toFixed(1) : 0;
    const durationMin = segment ? Math.ceil(segment.duration / 60) : 0;
    const summary = feature.properties?.summary
      ? `${distanceKm} km · ${durationMin} min`
      : `${distanceKm} km`;

    return { coordinates: coords, distanceKm, durationMin, summary };
  } catch (err) {
    console.error('ORS fetch error:', err);
    return null;
  }
}
