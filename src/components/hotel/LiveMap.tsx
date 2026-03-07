import React, { useEffect } from 'react';
import { TrackingInfo } from '../../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

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
}

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LiveMap: React.FC<LiveMapProps> = ({ tracking }) => {
  const { lat, lng } = tracking.currentLocation;
  const destLat = tracking.destination.lat;
  const destLng = tracking.destination.lng;

  const center: [number, number] = [lat, lng];
  const destination: [number, number] = [destLat, destLng];
  const hotelLocation: [number, number] = [28.6139, 77.2090];

  return (
    <div className="relative w-full h-64 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={center}>
          <Popup>Volunteer Location</Popup>
        </Marker>

        <Marker position={destination}>
          <Popup>Destination</Popup>
        </Marker>

        <Marker position={hotelLocation}>
          <Popup>Hotel</Popup>
        </Marker>

        <Polyline 
            positions={[hotelLocation, center, destination]} 
            color="#268a5b" 
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10" 
        />

        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
};

export default LiveMap;
