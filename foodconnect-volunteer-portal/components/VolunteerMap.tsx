import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { Plus, Minus, Navigation } from 'lucide-react';
import { VolunteerMapProps, Donation } from '../types';

// Mock User Location (Dadar, Mumbai)
const USER_LOCATION: [number, number] = [19.0222, 72.8468];

// Function to generate Custom HTML Marker
const createCustomMarker = (donation: Donation, isSelected: boolean) => {
  const isVeg = donation.tags.includes('Veg');
  
  // Icon content: Leaf for veg, Utensils for non-veg/mixed
  const iconSvg = isVeg 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.77 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.558 2.85-5.923 5.923a1.445 1.445 0 0 1-2.043 0L7.96 3.14a1.443 1.443 0 0 0-2.043 0l-3.329 3.329a1.443 1.443 0 0 0 0 2.043L8.22 14.15a1.445 1.445 0 0 1 0 2.043l-5.923 5.923m3.882-3.882-3.883 3.883"/><path d="m14.15 8.22 5.633 5.633a1.445 1.445 0 0 1 0 2.043l-3.328 3.329a1.443 1.443 0 0 0 0 2.043l3.329-3.329a1.443 1.443 0 0 0 2.043 0l3.329 3.328a1.445 1.445 0 0 1 0 2.043L19.5 17.67"/></svg>`;

  const size = isSelected ? 'w-14 h-14' : 'w-10 h-10';
  const ringColor = isSelected ? 'ring-4 ring-emerald-500/40' : 'ring-1 ring-slate-200';
  const shadow = isSelected ? 'shadow-2xl' : 'shadow-md';
  const zIndex = isSelected ? 1000 : 100;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="${size} ${ringColor} ${shadow} bg-white rounded-full flex items-center justify-center transition-all duration-300 transform" style="position: relative; z-index: ${zIndex};">
        ${iconSvg}
        ${isSelected ? '<div class="absolute -bottom-1.5 w-3 h-3 bg-emerald-600 rotate-45 border-2 border-white"></div>' : ''}
      </div>
    `,
    iconSize: isSelected ? [56, 56] : [40, 40],
    iconAnchor: isSelected ? [28, 60] : [20, 20],
    popupAnchor: [0, -40]
  });
};

const createClusterIcon = (count: number) => {
  const size = 40 + (count > 10 ? 10 : 0) + (count > 100 ? 10 : 0);
  return L.divIcon({
    html: `<div class="w-full h-full rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold border-4 border-white shadow-lg text-sm">${count}</div>`,
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Component to handle map instance access
const MapInstanceHandler: React.FC<{ setMap: (map: L.Map) => void }> = ({ setMap }) => {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
};

const MapController: React.FC<{ selectedLat: number | null; selectedLng: number | null }> = ({ selectedLat, selectedLng }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLat !== null && selectedLng !== null) {
      const markerBounds = L.latLngBounds([[selectedLat, selectedLng]]);
      
      map.fitBounds(markerBounds, {
        paddingTopLeft: [0, 180],     
        paddingBottomRight: [0, 400], 
        maxZoom: 16,
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedLat, selectedLng, map]);

  return null;
};

const Markers = ({ donations, selectedId, onSelectMarker }: { donations: Donation[], selectedId: string | null, onSelectMarker: (id: string) => void }) => {
  const map = useMap();
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(14);

  useEffect(() => {
    if (!map) return;
    
    const updateMap = () => {
      const b = map.getBounds();
      setBounds([
        b.getSouthWest().lng,
        b.getSouthWest().lat,
        b.getNorthEast().lng,
        b.getNorthEast().lat,
      ]);
      setZoom(map.getZoom());
    };

    updateMap(); // Initial update

    map.on('moveend', updateMap);
    return () => {
      map.off('moveend', updateMap);
    };
  }, [map]);

  const points = donations.map(donation => ({
    type: 'Feature' as const,
    properties: { cluster: false, donationId: donation.id, ...donation },
    geometry: {
      type: 'Point' as const,
      coordinates: [donation.lng, donation.lat]
    }
  }));

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 17 }
  });

  return (
    <>
      {clusters.map(cluster => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={createClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    18
                  );
                  map.setView([latitude, longitude], expansionZoom, {
                    animate: true
                  });
                }
              }}
            />
          );
        }

        const donation = cluster.properties as Donation;
        return (
          <Marker
            key={donation.id}
            position={[donation.lat, donation.lng]}
            icon={createCustomMarker(donation, selectedId === donation.id)}
            eventHandlers={{
              click: () => onSelectMarker(donation.id)
            }}
          />
        );
      })}
    </>
  );
};

const VolunteerMap: React.FC<VolunteerMapProps> = ({ donations, selectedId, onSelectMarker, isNavigating }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleRecenter = () => {
    map?.flyTo(USER_LOCATION, 15, {
      animate: true,
      duration: 1.5
    });
  };

  if (!isMounted) return (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-slate-400 font-medium">Loading Map...</span>
    </div>
  );

  const selectedDonation = donations.find(d => d.id === selectedId);

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0">
      <MapContainer
        center={USER_LOCATION}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
        className="w-full h-full outline-none"
      >
        <MapInstanceHandler setMap={setMap} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
          className="silver-map-tiles"
        />

        {/* User Location Marker */}
        <Marker 
          position={USER_LOCATION} 
          icon={L.divIcon({
            className: 'user-loc-marker',
            html: `
              <div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <div class="absolute inset-1 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        />

        <MapController 
          selectedLat={selectedDonation?.lat ?? null} 
          selectedLng={selectedDonation?.lng ?? null} 
        />

        {/* Route Line */}
        {selectedDonation && (
          <Polyline 
            positions={[USER_LOCATION, [selectedDonation.lat, selectedDonation.lng]]}
            pathOptions={{ 
              color: isNavigating ? '#2563eb' : '#059669', 
              dashArray: isNavigating ? undefined : '10, 10', 
              weight: isNavigating ? 6 : 4, 
              opacity: isNavigating ? 0.9 : 0.6,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        <Markers 
          donations={donations} 
          selectedId={selectedId} 
          onSelectMarker={onSelectMarker} 
        />
      </MapContainer>
      
      {/* Custom Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[400]">
        <div className="flex flex-col bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <button 
            onClick={handleZoomIn}
            className="p-3 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-3 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={handleRecenter}
          className="p-3 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Top Gradient for text readability */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/90 via-white/50 to-transparent pointer-events-none z-[5]" />
    </div>
  );
};

export default VolunteerMap;
