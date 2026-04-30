import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { VolunteerMapProps, VolunteerDonation } from '../../types';
import { fetchRoute, RouteResult } from '../../lib/routeService';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/api';

const DEFAULT_LOC: [number, number] = [19.0176, 72.8562];

interface MapEntity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  role: 'hotel' | 'volunteer';
  address?: string;
  vehicle?: string;
  score?: number;
}

const createHotelIcon = () => {
  return L.divIcon({
    className: 'hotel-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 20px;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        border: 2px solid white;
      ">🏨</div>
    `
  });
};

const createVolunteerIcon = () => {
  return L.divIcon({
    className: 'volunteer-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, #ec4899, #db2777);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 20px;
        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
        border: 2px solid white;
      ">🛵</div>
    `
  });
};

const createDonationIcon = (donation: VolunteerDonation, isSelected: boolean) => {
  const isVeg = donation.tags.some(t => t.toLowerCase() === 'veg');
  const dotColor = isVeg ? '#22c55e' : '#ef4444';
  const borderColor = isSelected ? '#3b82f6' : '#ffffff';
  const size = isSelected ? 52 : 44;
  
  return L.divIcon({
    className: 'custom-map-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    html: `
      <div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: white; border: 3px solid ${borderColor};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; overflow: visible;
        transform: scale(${isSelected ? 1.05 : 1});
      " class="${isSelected ? 'shadow-2xl' : 'hover:scale-110'}">
        <img src="${donation.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
        <div class="marker-pulse-active" style="
          position: absolute; bottom: -4px; right: -4px;
          width: 16px; height: 16px; border-radius: 50%;
          background: ${dotColor}; border: 2px solid white;
        "></div>
      </div>
    `
  });
};

const createClusterIcon = (count: number) => {
  const size = Math.min(50, 30 + count * 2);
  return L.divIcon({
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    html: `
      <div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: 14px;
        box-shadow: 0 2px 8px rgba(16,185,129,0.4);
        border: 3px solid rgba(255,255,255,0.8);
      ">${count}</div>
    `
  });
};

const userLocIcon = L.divIcon({
  className: 'user-loc-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `
    <div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: #3b82f6; border: 3px solid white;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.2);
    "></div>
  `
});

const MapContent: React.FC<VolunteerMapProps & { 
  donations: VolunteerDonation[]; 
  userLocation: [number, number];
  onRouteUpdate?: (route: RouteResult | null) => void;
}> = ({ donations, selectedId, onSelectMarker, isNavigating, onRouteUpdate, userLocation }) => {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [mapEntities, setMapEntities] = useState<MapEntity[]>([]);
  const routeCacheRef = useRef<Record<string, RouteResult>>({});
  const lastEntitiesHashRef = useRef('');

  // Update map center when user location changes (geolocation update)
  useEffect(() => {
    if (map && userLocation) {
      map.setView(userLocation, map.getZoom());
    }
  }, [map, userLocation]);

  // Fetch map entities periodically so hotel/volunteer pins stay up to date.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const applyEntities = (entities: MapEntity[]) => {
      const sorted = [...entities].sort((a, b) => a.id - b.id);
      const hash = JSON.stringify(sorted);
      if (hash !== lastEntitiesHashRef.current) {
        lastEntitiesHashRef.current = hash;
        setMapEntities(sorted);
      }
    };

    const fetchEntities = async () => {
      try {
        const data = await apiRequest<{ hotels: MapEntity[]; volunteers: MapEntity[] }>('/map/all', { method: 'GET' });
        if (!cancelled) {
          applyEntities([...(data.hotels || []), ...(data.volunteers || [])]);
        }
      } catch (error) {
        console.error('Failed to fetch map entities from /map/all, trying /map/entities:', error);
        // Fallback to /map/entities
        try {
          const fallbackData = await apiRequest<{ hotels: MapEntity[]; volunteers: MapEntity[] }>('/map/entities', { method: 'GET' });
          if (!cancelled) {
            applyEntities([...(fallbackData.hotels || []), ...(fallbackData.volunteers || [])]);
          }
        } catch (fallbackError) {
          console.error('Failed to fetch map entities:', fallbackError);
        }
      }
    };

    fetchEntities();
    intervalId = setInterval(fetchEntities, 8000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const bounds = map.getBounds();
  const bbox: [number, number, number, number] = [
    bounds.getWest(), bounds.getSouth(),
    bounds.getEast(), bounds.getNorth()
  ];
  const zoom = map.getZoom();

  const points = useMemo(() => donations.map(d => ({
    type: 'Feature' as const,
    properties: { cluster: false, donationId: d.id, type: 'donation' },
    geometry: { type: 'Point' as const, coordinates: [d.lng, d.lat] }
  })), [donations]);

  const { clusters, supercluster } = useSupercluster({
    points: points as any,
    bounds: bbox,
    zoom,
    options: { radius: 75, maxZoom: 17 }
  });

  // Fetch real route when a donation is selected
  useEffect(() => {
    const selectedDonation = donations.find(d => d.id === selectedId);
    if (!selectedDonation) {
      setRouteCoords([]);
      onRouteUpdate?.(null);
      return;
    }

    const cacheKey = `${selectedDonation.lat},${selectedDonation.lng}`;
    
    // Check cache
    if (routeCacheRef.current[cacheKey]) {
      const cached = routeCacheRef.current[cacheKey];
      setRouteCoords(cached.coordinates);
      onRouteUpdate?.(cached);
      return;
    }

    // Fetch route
    let cancelled = false;
    fetchRoute(
      { lat: userLocation[0], lng: userLocation[1] },
      { lat: selectedDonation.lat, lng: selectedDonation.lng }
    ).then(result => {
      if (cancelled) return;
      if (result) {
        routeCacheRef.current[cacheKey] = result;
        setRouteCoords(result.coordinates);
        onRouteUpdate?.(result);

        // Fit map to show the route
        if (result.coordinates.length > 1) {
          const routeBounds = L.latLngBounds(result.coordinates);
          map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 16, duration: 0.8 });
        }
      } else {
        // Fallback to straight line
        setRouteCoords([userLocation, [selectedDonation.lat, selectedDonation.lng]]);
        onRouteUpdate?.(null);
      }
    });

    return () => { cancelled = true; };
  }, [selectedId, donations, map, onRouteUpdate, userLocation]);

  const updateMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // User location marker
    const userMarker = L.marker(userLocation, { icon: userLocIcon }).addTo(map);
    markersRef.current.push(userMarker);

    // Add hotels and volunteers
    mapEntities.forEach(entity => {
      const icon = entity.role === 'hotel' ? createHotelIcon() : createVolunteerIcon();
      const popupContent = entity.role === 'hotel' 
        ? `<strong>${entity.name}</strong><br/>${entity.address || 'Hotel'}`
        : `<strong>${entity.name}</strong><br/>🛵 ${entity.vehicle || 'Bike'}<br/>⭐ ${entity.score || 0} trips`;
      
      const marker = L.marker([entity.latitude, entity.longitude], { icon }).addTo(map);
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // Add donations (clustered)
    clusters.forEach((cluster: any) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount, donationId } = cluster.properties;

      if (isCluster) {
        const icon = createClusterIcon(pointCount);
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.on('click', () => {
          const expansionZoom = Math.min(supercluster!.getClusterExpansionZoom(cluster.id), 18);
          map.flyTo([lat, lng], expansionZoom, { duration: 0.5 });
        });
        markersRef.current.push(marker);
      } else {
        const donation = donations.find(d => d.id === donationId);
        if (!donation) return;
        const isSelected = selectedId === donationId;
        const icon = createDonationIcon(donation, isSelected);
        const marker = L.marker([lat, lng], { icon, zIndexOffset: isSelected ? 1000 : 0 }).addTo(map);
        marker.on('click', () => onSelectMarker(donationId));
        markersRef.current.push(marker);
      }
    });
  }, [clusters, donations, selectedId, map, onSelectMarker, supercluster, mapEntities, userLocation]);

  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  const { theme } = useTheme();
  const mapStyleUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <>
      <TileLayer url={mapStyleUrl} />
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: isNavigating ? '#22c55e' : '#3b82f6',
            weight: isNavigating ? 6 : 4,
            dashArray: isNavigating ? undefined : '8, 8',
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </>
  );
};

// Export RouteResult type for parent components
export type { RouteResult };

const VolunteerMap: React.FC<VolunteerMapProps & { onRouteUpdate?: (route: RouteResult | null) => void }> = (props) => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_LOC);
  const [isLocating, setIsLocating] = useState(true);

  // Push live location updates to backend while navigating so hotel-side tracking remains real-time.
  useEffect(() => {
    if (!props.isNavigating || !props.selectedId || !user?.id || !navigator.geolocation) return;

    const volunteerID = Number(user.id);
    const donationID = Number(props.selectedId);
    if (!Number.isFinite(volunteerID) || !Number.isFinite(donationID)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);

        apiRequest('/location/update', {
          method: 'POST',
          body: JSON.stringify({
            volunteerID,
            donationID,
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
          }),
        }).catch((err) => {
          console.error('Failed to update live location:', err);
        });
      },
      (error) => {
        console.warn('Live location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [props.isNavigating, props.selectedId, user?.id]);

  useEffect(() => {
    let isMounted = true;

    // Priority 1: Try navigator.geolocation for real-time location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
            setUserLocation(newLocation);
            setIsLocating(false);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fall back to user profile or default on error
          if (user?.id && isMounted) {
            apiRequest<any>(`/users/${user.id}`, { method: 'GET' })
              .then(userData => {
                if (isMounted && userData.latitude && userData.longitude) {
                  setUserLocation([userData.latitude, userData.longitude]);
                }
              })
              .catch(() => {
                if (isMounted) {
                  setUserLocation(DEFAULT_LOC);
                }
              })
              .finally(() => {
                if (isMounted) setIsLocating(false);
              });
          } else {
            if (isMounted) {
              setUserLocation(DEFAULT_LOC);
              setIsLocating(false);
            }
          }
        },
        { 
          timeout: 5000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not available, use profile or default
      if (user?.id) {
        apiRequest<any>(`/users/${user.id}`, { method: 'GET' })
          .then(userData => {
            if (isMounted && userData.latitude && userData.longitude) {
              setUserLocation([userData.latitude, userData.longitude]);
            }
          })
          .catch(() => {
            if (isMounted) {
              setUserLocation(DEFAULT_LOC);
            }
          })
          .finally(() => {
            if (isMounted) setIsLocating(false);
          });
      } else {
        if (isMounted) {
          setUserLocation(DEFAULT_LOC);
          setIsLocating(false);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Show loading state while locating
  if (isLocating) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>📍</div>
          <p style={{ color: '#666' }}>Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer center={userLocation} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
      <MapContent {...props} userLocation={userLocation} />
    </MapContainer>
  );
};

export default VolunteerMap;
