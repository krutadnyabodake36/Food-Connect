import React, { useEffect, useState } from 'react';
import { TrackingInfo } from '../../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateFastestRoute } from '../../lib/routingService';
import { apiRequest } from '../../lib/api';

// Fix Leaflet default icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  tracking: TrackingInfo;
  donationId?: string;
}

const VolunteerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const HotelIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LiveMap: React.FC<LiveMapProps> = ({ tracking, donationId }) => {
  const [currentLoc, setCurrentLoc] = useState<[number, number]>([tracking.currentLocation.lat, tracking.currentLocation.lng]);
  const destLat = tracking.destination.lat;
  const destLng = tracking.destination.lng;
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const center: [number, number] = currentLoc;
  const destination: [number, number] = [destLat, destLng];

  useEffect(() => {
    setCurrentLoc([tracking.currentLocation.lat, tracking.currentLocation.lng]);
  }, [tracking.currentLocation.lat, tracking.currentLocation.lng]);

  // Poll latest volunteer location for this donation to get ride-like tracking updates.
  useEffect(() => {
    if (!donationId) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const pollLatest = async () => {
      try {
        const latest = await apiRequest<{ found: boolean; latitude?: number; longitude?: number }>(`/location/${donationId}/latest`, { method: 'GET' });
        if (cancelled || !latest?.found || typeof latest.latitude !== 'number' || typeof latest.longitude !== 'number') return;

        setCurrentLoc((prev) => {
          const next: [number, number] = [latest.latitude!, latest.longitude!];
          if (Math.abs(prev[0] - next[0]) < 0.00001 && Math.abs(prev[1] - next[1]) < 0.00001) {
            return prev;
          }
          return next;
        });
      } catch {
        // Keep existing tracking state on transient failures.
      }
    };

    pollLatest();
    intervalId = setInterval(pollLatest, 2000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [donationId]);

  // Fetch route when tracking starts
  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true);
      try {
        const route = await calculateFastestRoute(center[0], center[1], destLat, destLng);
        if (route && route.coordinates) {
          // Convert [lng, lat] to [lat, lng] for Leaflet
          setRouteCoordinates(
            route.coordinates.map(coord => [coord[1], coord[0]] as [number, number])
          );
        } else {
          // Fallback to direct line
          setRouteCoordinates([center, destination]);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteCoordinates([center, destination]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [center[0], center[1], destLat, destLng]);

  return (
    <div className="relative w-full h-64 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 z-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
        </div>
      )}
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {/* Current Location Marker */}
        <Marker position={center} icon={VolunteerIcon}>
          <Popup>📍 Volunteer Current Location</Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destination} icon={HotelIcon}>
          <Popup>🏨 {tracking.destination.address}</Popup>
        </Marker>

        {/* Optimized Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates}
            color="#059669" 
            weight={4} 
            opacity={0.8} 
            dashArray="5, 5"
          />
        )}

        {/* Fallback direct line if no route found */}
        {routeCoordinates.length < 2 && (
          <Polyline 
            positions={[center, destination]} 
            color="#dc2626" 
            weight={2} 
            opacity={0.5}
            dashArray="10, 10"
          />
        )}

        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
};

export default LiveMap;
