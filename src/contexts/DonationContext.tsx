import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { HotelDonation, Volunteer } from '../types';
import { apiRequest, API_BASE_URL } from '../lib/api';
import { sendLocalNotification } from '../lib/notifications';
import { FALLBACK_HOTEL_LOCATION, getHotelLocation, setHotelLocation, setHotelName, hasHotelLocation } from '../lib/hotelLocation';
import { useAuth } from './AuthContext';

/*  ── Donation lifecycle ──
 *   pending    →  Hotel posted, shows on volunteer map
 *   requested  →  Volunteer sent a pickup request (activeRequest populated)
 *   assigned   →  Hotel accepted, volunteer gets directions / tracking
 *   completed  →  Hotel verified OTP, order done
 */

interface DonationContextType {
  donations: HotelDonation[];
  loading: boolean;
  addDonation: (data: Partial<HotelDonation>, hotelId: string, hotelName: string) => void;
  editDonation: (id: string, data: Partial<HotelDonation>) => void;
  acceptRequest: (donationId: string) => void;
  rejectRequest: (donationId: string) => void;
  markCompleted: (donationId: string) => void;
  verifyAndComplete: (donationId: string, code: string) => Promise<boolean>;
  requestPickup: (donationId: string, volunteerInfo: Volunteer) => void;
}

type ApiVolunteer = Volunteer & { phone?: string };
type ApiDonation = {
  id: string;
  hotelId: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelType?: string;
  contactName?: string;
  hotelLat?: number;
  hotelLng?: number;
  title: string;
  description?: string;
  isVeg?: boolean;
  prepTime?: string;
  weight: number;
  quantityUnit?: 'kg' | 'plates' | 'pieces' | 'servings';
  tags: string[];
  status: 'pending' | 'assigned' | 'completed';
  timestamp: string;
  createdAt?: string;
  pickupWindow: string;
  imageUrl?: string;
  isUrgent?: boolean;
  pickupCode?: string;
  rating?: number;
  review?: string;
  activeRequest?: ApiVolunteer;
  assignedVolunteer?: ApiVolunteer;
  tracking?: HotelDonation['tracking'];
};

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export const useDonations = () => {
  const context = useContext(DonationContext);
  if (!context) throw new Error('useDonations must be used within a DonationProvider');
  return context;
};

const STORAGE_KEY = 'foodconnect_donations';
const STORAGE_VERSION_KEY = 'foodconnect_donations_version';
const STORAGE_VERSION = 'city-realistic-v1';
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

function readFromStorage(): HotelDonation[] {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== STORAGE_VERSION) {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}


function writeToStorage(donations: HotelDonation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
  localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
}

const toVolunteer = (value: ApiVolunteer | undefined): Volunteer | undefined => (value ? value : undefined);

const mapDonation = (row: ApiDonation): HotelDonation => {
  setHotelName(row.hotelId, row.hotelName);
  if (typeof row.hotelLat === 'number' && typeof row.hotelLng === 'number') {
    setHotelLocation(row.hotelId, row.hotelLat, row.hotelLng);
  } else if (!hasHotelLocation(row.hotelId)) {
    getHotelLocation(row.hotelId);
  }

  return {
    id: row.id,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    hotelAddress: row.hotelAddress,
    hotelType: row.hotelType,
    contactName: row.contactName,
    title: row.title,
    description: row.description,
    isVeg: row.isVeg,
    prepTime: row.prepTime,
    weight: row.weight,
    quantityUnit: row.quantityUnit || 'kg',
    tags: row.tags || [],
    status: row.status,
    timestamp: row.timestamp,
    createdAt: row.createdAt,
    pickupWindow: row.pickupWindow || 'Anytime',
    imageUrl: row.imageUrl,
    isUrgent: row.isUrgent,
    pickupCode: row.pickupCode,
    rating: row.rating,
    review: row.review,
    activeRequest: toVolunteer(row.activeRequest),
    assignedVolunteer: toVolunteer(row.assignedVolunteer),
    tracking: row.tracking,
  };
};

const mapApiDonations = (rows: ApiDonation[]): HotelDonation[] => rows.map(mapDonation);

// Helper to detect if a donation has changed
const hasChanged = (oldDonation: HotelDonation | undefined, newDonation: HotelDonation): boolean => {
  if (!oldDonation) return true; // New donation
  return JSON.stringify(oldDonation) !== JSON.stringify(newDonation);
};

const tryGetCurrentPosition = (): Promise<{ lat: number; lng: number } | null> => {
  if (!navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  });
};

export const DonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donations, setDonations] = useState<HotelDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const useBackend = useRef(true);
  const skipNextPersist = useRef(false);
  const { user } = useAuth();

  // Create demo donations for demo volunteer users
  const ensureDemoDonations = useCallback(() => {
    if (!user || !user.id.startsWith('demo-volunteer')) return;

    const stored = readFromStorage();
    // Only create demo donations if there are none yet
    if (stored.length === 0) {
      const demoDonations: HotelDonation[] = [
        {
          id: 'demo-donation-1',
          hotelId: 'demo-hotel-001',
          hotelName: 'Hotel Paradise',
          hotelAddress: '123 Premium St, Mumbai',
          title: 'Veg Biryani & Curry',
          description: 'Freshly prepared vegetarian biryani with special curry',
          isVeg: true,
          weight: 15,
          quantityUnit: 'kg',
          tags: ['Veg', 'Rice', 'Curry', 'Hot'],
          status: 'pending',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          pickupWindow: '14:00 - 16:00',
          imageUrl: 'https://images.unsplash.com/photo-1589985645852-5c0265aace00?auto=format&fit=crop&q=80&w=400',
          isUrgent: true,
        },
        {
          id: 'demo-donation-2',
          hotelId: 'demo-hotel-001',
          hotelName: 'Hotel Paradise',
          hotelAddress: '123 Premium St, Mumbai',
          title: 'Butter Chicken & Naan',
          description: 'Non-veg butter chicken with fresh naan bread',
          isVeg: false,
          weight: 12,
          quantityUnit: 'kg',
          tags: ['Non-Veg', 'Chicken', 'Bread'],
          status: 'pending',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          pickupWindow: '14:00 - 16:00',
          imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561404?auto=format&fit=crop&q=80&w=400',
        },
        {
          id: 'demo-donation-3',
          hotelId: 'demo-hotel-001',
          hotelName: 'Hotel Paradise',
          hotelAddress: '123 Premium St, Mumbai',
          title: 'Fresh Desserts & Pastries',
          description: 'Assorted sweets and chocolate pastries',
          isVeg: true,
          weight: 8,
          quantityUnit: 'kg',
          tags: ['Bakery', 'Sweets', 'Veg'],
          status: 'pending',
          timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
          pickupWindow: '16:00 - 18:00',
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400',
        },
      ];

      writeToStorage(demoDonations);
      setDonations(demoDonations);
      setLoading(false);
    }
  }, [user]);

  const loadFromBackend = useCallback(async () => {
    const rows = await apiRequest<ApiDonation[]>('/donations');
    const mapped = mapApiDonations(rows);
    setDonations(mapped);
    setLoading(false);
    return mapped;
  }, []);

  const loadFromStorage = useCallback(() => {
    const data = readFromStorage();
    setDonations(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    if (!user) return;

    // For demo users, ensure we have demo donations
    if (user.id.startsWith('demo-volunteer')) {
      ensureDemoDonations();
      return;
    }

    if (useBackend.current) {
      loadFromBackend().catch((err) => {
        console.error('Backend load error, falling back to localStorage:', err);
        useBackend.current = false;
        loadFromStorage();
      });
    } else {
      loadFromStorage();
    }
  }, [loadFromBackend, loadFromStorage, user, ensureDemoDonations]);

  useEffect(() => {
    if (useBackend.current) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          skipNextPersist.current = true;
          setDonations(updated);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (useBackend.current || donations.length === 0) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    writeToStorage(donations);
  }, [donations]);

  // Auto-refresh donations for live sync (only when data actually changes)
  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;
    let isVisible = true;
    let previousIds = new Set(donations.map(d => d.id));
    let previousHash = JSON.stringify(donations.map(d => ({
      id: d.id,
      status: d.status,
      weight: d.weight,
      quantityUnit: d.quantityUnit,  // NEW: include quantityUnit
      claimedQuantity: d.claimedQuantity,  // NEW: include claimed quantity
      activeRequest: d.activeRequest?.id,
      assignedVolunteer: d.assignedVolunteer?.id,
      pickupCode: d.pickupCode,
      updatedAt: d.timestamp,
    })));

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      // Refresh immediately when user returns to tab
      if (isVisible && useBackend.current) {
        loadFromBackend().catch(() => {
          useBackend.current = false;
          loadFromStorage();
        });
      }
    };

    // Handle cross-tab/window storage changes (for live updates when another window posts donations)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            console.log('[Donations] 📡 Live update from another window - refreshing donations');
            skipNextPersist.current = true; // Don't persist back to localStorage (prevent loops)
            setDonations(updated);
            
            // Send notification for new donations
            const newIds = new Set(updated.map((d: HotelDonation) => d.id));
            const oldIds = new Set(donations.map(d => d.id));
            
            const newDonations = updated.filter((d: HotelDonation) => !oldIds.has(d.id));
            if (newDonations.length > 0) {
              newDonations.forEach((d: HotelDonation) => {
                console.log(`[Donations] 🔔 New donation detected from live update: ${d.title}`);
                sendLocalNotification('new_donation', '🍲 New Donation Posted', `${d.title} (${d.weight} ${d.quantityUnit || 'kg'}) is available for pickup from ${d.hotelName}!`, d.id);
              });
            }
          }
        } catch (err) {
          console.warn('[Donations] Failed to process storage update:', err);
        }
      }
    };

    // Handle custom in-window donations update event
    const handleCustomDonationsUpdate = (e: any) => {
      const donations = e.detail?.donations;
      if (donations && Array.isArray(donations)) {
        console.log('[Donations] 🔄 Custom event update received - refreshing donations');
        setDonations(donations);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('foodconnect:donations-updated', handleCustomDonationsUpdate);

    // Set up polling interval when component mounts
    if (useBackend.current) {
      intervalId = setInterval(async () => {
        if (!document.hidden) {
          try {
            const rows = await apiRequest<ApiDonation[]>('/donations');
            const mapped = mapApiDonations(rows);
            const currentHash = JSON.stringify(mapped.map(d => ({
              id: d.id,
              status: d.status,
              weight: d.weight,
              quantityUnit: d.quantityUnit,  // NEW: include quantityUnit
              claimedQuantity: d.claimedQuantity,  // NEW: include claimed quantity
              activeRequest: d.activeRequest?.id,
              assignedVolunteer: d.assignedVolunteer?.id,
              pickupCode: d.pickupCode,
              updatedAt: d.timestamp,
            })));
            
            // Only update state if there are actual changes
            if (currentHash !== previousHash) {
              // Find new donations for notifications
              const newDonations: HotelDonation[] = [];
              const newIds = new Set(mapped.map(d => d.id));
              
              mapped.forEach(newDonation => {
                if (!previousIds.has(newDonation.id)) {
                  newDonations.push(newDonation);
                }
              });
              
              setDonations(mapped);
              previousHash = currentHash;
              previousIds = newIds;
              
              // Send notifications only for brand new donations
              if (newDonations.length > 0) {
                newDonations.forEach(d => {
                  sendLocalNotification('new_donation', '🍲 New Donation Posted', `${d.title} (${d.weight} ${d.quantityUnit || 'kg'}) is available for pickup from ${d.hotelName}!`, d.id);
                });
              }
            }
          } catch (err) {
            console.warn('Auto-refresh failed:', err);
          }
        }
      }, 3000); // Poll every 3 seconds for fast real-time sync
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('foodconnect:donations-updated', handleCustomDonationsUpdate);
    };
  }, [loadFromBackend, loadFromStorage, user]);

  // 🔴 NEW: SSE Real-time listener for instant donation updates
  useEffect(() => {
    if (!user || !useBackend.current) return;

    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource(`${API_BASE_URL}/donations/events`);
        console.log('[Donations] 🔴 SSE Connection established');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Donations] 📡 SSE Event received:', data);

            if (data.type === 'donation_updated') {
              console.log(`[Donations] 🔄 Real-time update for donation ${data.data.donationId}: ${data.data.type}`);
              // Trigger immediate refresh of donations
              loadFromBackend().catch((err) => {
                console.error('[Donations] SSE refresh failed:', err);
              });
            }
          } catch (parseErr) {
            console.warn('[Donations] Failed to parse SSE data:', parseErr);
          }
        };

        eventSource.onerror = (err) => {
          console.error('[Donations] SSE connection error:', err);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Attempt reconnection after 3 seconds
          setTimeout(() => {
            console.log('[Donations] 🔁 Attempting SSE reconnection...');
            setupSSE();
          }, 3000);
        };
      } catch (err) {
        console.error('[Donations] Failed to setup SSE:', err);
      }
    };

    setupSSE();

    return () => {
      if (eventSource) {
        console.log('[Donations] 🔴 SSE Connection closed');
        eventSource.close();
      }
    };
  }, [user, loadFromBackend]);

  const refreshDonations = useCallback(async () => {
    if (useBackend.current) {
      try {
        await loadFromBackend();
        return;
      } catch (err) {
        console.error('Reload from backend failed, using local data:', err);
        useBackend.current = false;
      }
    }
    loadFromStorage();
  }, [loadFromBackend, loadFromStorage]);

  const addDonation = useCallback(async (data: Partial<HotelDonation>, hotelId: string, hotelName: string) => {
    setHotelName(hotelId, hotelName);
    if (!hasHotelLocation(hotelId)) getHotelLocation(hotelId);

    if (useBackend.current) {
      try {
        const numericHotelId = Number(hotelId);
        const currentHotelLoc = getHotelLocation(hotelId);
        const needsRealLocation = !currentHotelLoc
          || (currentHotelLoc.lat === FALLBACK_HOTEL_LOCATION.lat && currentHotelLoc.lng === FALLBACK_HOTEL_LOCATION.lng);

        if (Number.isFinite(numericHotelId) && needsRealLocation) {
          const currentPos = await tryGetCurrentPosition();
          if (currentPos) {
            await apiRequest(`/hotels/${numericHotelId}/location?lat=${currentPos.lat}&lng=${currentPos.lng}`, {
              method: 'POST',
            });
            setHotelLocation(hotelId, currentPos.lat, currentPos.lng);
          }
        }

        await apiRequest('/donations', {
          method: 'POST',
          body: JSON.stringify({
            hotelId: Number(hotelId),
            title: data.title || 'Untitled Donation',
            description: data.description,
            isVeg: data.isVeg,
            prepTime: data.prepTime,
            weight: data.weight || 0,
            quantityUnit: (data as any).quantityUnit || 'kg',
            tags: (data.tags || []).map((tag) => String(tag).toLowerCase()),
            pickupWindow: data.pickupWindow || 'Anytime',
            expiryDate: data.expiryDate,
            imageUrl: data.imageUrl,
            isUrgent: data.isUrgent || false,
          }),
        });
        await refreshDonations();
      } catch (err) {
        console.error('Add donation error:', err);
        sendLocalNotification('request_rejected', 'Create failed', 'Unable to create donation. Please check fields and try again.');
        return;
      }
    }

    if (!useBackend.current) {
      const newId = 'don-' + Date.now();
      const newDonation: HotelDonation = {
        id: newId,
        hotelId,
        hotelName,
        title: data.title || 'Untitled',
        weight: data.weight || 0,
        tags: data.tags || [],
        status: 'pending',
        timestamp: 'Just now',
        createdAt: new Date().toISOString(),
        pickupWindow: data.pickupWindow || 'Anytime',
        imageUrl: data.imageUrl,
        isUrgent: data.isUrgent,
      } as HotelDonation;
      setDonations(prev => {
        const updated = [newDonation, ...prev];
        writeToStorage(updated);
        // Dispatch custom event for immediate in-window updates
        window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
        return updated;
      });
    }

    sendLocalNotification('new_donation', '🍲 New Donation Posted', `${data.title || 'A donation'} (${data.weight || 0}kg) is now available for pickup.`, data.title);
  }, [refreshDonations]);

  const editDonation = useCallback(async (id: string, data: Partial<HotelDonation>) => {
    if (useBackend.current) {
      try {
        await apiRequest(`/donations/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            isVeg: data.isVeg,
            prepTime: data.prepTime,
            weight: data.weight,
            quantityUnit: (data as any).quantityUnit,
            tags: data.tags,
            expiryDate: data.expiryDate,
            pickupWindow: data.pickupWindow,
            imageUrl: data.imageUrl,
            isUrgent: data.isUrgent,
            rating: data.rating,
            review: data.review,
          }),
        });
        await refreshDonations();
        return;
      } catch (err) {
        console.error('Edit donation error:', err);
        sendLocalNotification('request_rejected', 'Update failed', 'Unable to update donation right now.');
        return;
      }
    }

    setDonations(prev => {
      const updated = prev.map(d => (d.id === id ? { ...d, ...data } : d));
      writeToStorage(updated);
      // Dispatch custom event for immediate in-window updates
      window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
      return updated;
    });
  }, [refreshDonations]);

  const acceptRequest = useCallback(async (donationId: string) => {
    if (useBackend.current) {
      try {
        await apiRequest(`/donations/${donationId}/accept`, { method: 'POST' });
        await refreshDonations();
      } catch (err) {
        console.error('Accept request error:', err);
        sendLocalNotification('request_rejected', 'Accept failed', 'Could not accept this request. Please retry.');
        return;
      }
    }

    if (!useBackend.current) {
      const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
      setDonations(prev => {
        const updated = prev.map(d => {
          if (d.id === donationId && d.activeRequest) {
            const hotelLoc = getHotelLocation(d.hotelId);
            return {
              ...d,
              status: 'assigned' as const,
              assignedVolunteer: d.activeRequest,
              activeRequest: undefined,
              pickupCode,
              tracking: {
                active: true,
                currentLocation: {
                  lat: hotelLoc.lat + (Math.random() * 0.01 - 0.005),
                  lng: hotelLoc.lng + (Math.random() * 0.01 - 0.005),
                  address: 'Volunteer Location',
                },
                destination: { lat: hotelLoc.lat, lng: hotelLoc.lng, address: d.hotelName || 'Hotel' },
                progress: 5,
                status: 'on_route' as const,
                lastUpdated: 'Just now',
              },
            };
          }
          return d;
        });
        writeToStorage(updated);
        // Dispatch custom event for immediate in-window updates
        window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
        return updated;
      });
    }

    const donation = donations.find(d => d.id === donationId);
    sendLocalNotification('request_accepted', '✅ Request Accepted!', `Your pickup request for "${donation?.title || 'a donation'}" has been accepted. Head to the hotel now!`, donationId);
  }, [donations, refreshDonations]);

  const rejectRequest = useCallback(async (donationId: string) => {
    if (useBackend.current) {
      try {
        await apiRequest(`/donations/${donationId}/reject`, { method: 'POST' });
        await refreshDonations();
      } catch (err) {
        console.error('Reject request error:', err);
        sendLocalNotification('request_rejected', 'Decline failed', 'Could not decline this request. Please retry.');
        return;
      }
    }

    if (!useBackend.current) {
      setDonations(prev => {
        const updated = prev.map(d => (d.id === donationId ? { ...d, activeRequest: undefined } : d));
        writeToStorage(updated);
        // Dispatch custom event for immediate in-window updates
        window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
        return updated;
      });
    }
    sendLocalNotification('request_rejected', '❌ Request Declined', 'Your pickup request has been declined. Try other available donations.', donationId);
  }, [refreshDonations]);

  const markCompleted = useCallback(async (donationId: string) => {
    if (useBackend.current) {
      try {
        await apiRequest(`/donations/${donationId}/complete`, { method: 'POST' });
        await refreshDonations();
        return;
      } catch (err) {
        console.error('Mark completed error:', err);
        sendLocalNotification('request_rejected', 'Completion failed', 'Could not mark this donation as complete.');
        return;
      }
    }

    setDonations(prev => {
      const updated = prev.map(d => (d.id === donationId ? {
        ...d,
        status: 'completed' as const,
        tracking: d.tracking ? { ...d.tracking, active: false, status: 'arrived' as const, progress: 100 } : undefined,
      } : d));
      writeToStorage(updated);
      // Dispatch custom event for immediate in-window updates
      window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
      return updated;
    });
  }, [refreshDonations]);

  const verifyAndComplete = useCallback(async (donationId: string, code: string): Promise<boolean> => {
    const donation = donations.find(d => d.id === donationId);
    if (!useBackend.current && (!donation?.pickupCode || donation.pickupCode !== code)) return false;

    if (useBackend.current) {
      try {
        const result = await apiRequest<{ ok?: boolean; status?: string; donation?: HotelDonation }>(`/donations/${donationId}/verify`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        if (!(result.ok || result.status === 'delivered')) return false;
        await refreshDonations();
        sendLocalNotification('pickup_completed', '🎉 Pickup Complete!', `Donation "${donation?.title || ''}" has been successfully verified and completed.`, donationId);
        return true;
      } catch (err) {
        console.error('Verify error:', err);
        sendLocalNotification('request_rejected', 'Verification failed', 'Invalid or expired verification code.');
        return false;
      }
    }

    setDonations(prev => {
      const updated = prev.map(d => (d.id === donationId ? {
        ...d,
        status: 'completed' as const,
        tracking: d.tracking ? { ...d.tracking, active: false, status: 'arrived' as const, progress: 100 } : undefined,
      } : d));
      writeToStorage(updated);
      return updated;
    });
    sendLocalNotification('pickup_completed', '🎉 Pickup Complete!', `Donation "${donation?.title || ''}" has been successfully verified and completed.`, donationId);
    return true;
  }, [donations, refreshDonations]);

  const requestPickup = useCallback(async (donationId: string, volunteerInfo: Volunteer) => {
    if (useBackend.current) {
      try {
        await apiRequest(`/donations/${donationId}/request`, {
          method: 'POST',
          body: JSON.stringify({ volunteerInfo }),
        });
        await refreshDonations();
      } catch (err: any) {
        console.error('Request pickup error:', err);
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('already') || msg.includes('claimed') || msg.includes('409')) {
          sendLocalNotification('request_rejected', 'Already Requested', 'This donation already has a pending pickup request.');
        } else {
          sendLocalNotification('request_rejected', 'Request failed', 'Unable to request this pickup right now. Please try again.');
        }
        return;
      }
    }

    if (!useBackend.current) {
      setDonations(prev => {
        const updated = prev.map(d => {
          if (d.id === donationId && d.status === 'pending' && !d.activeRequest) {
            return { ...d, activeRequest: volunteerInfo };
          }
          return d;
        });
        writeToStorage(updated);
        // Dispatch custom event for immediate in-window updates
        window.dispatchEvent(new CustomEvent('foodconnect:donations-updated', { detail: { donations: updated } }));
        return updated;
      });
    }

    const donation = donations.find(d => d.id === donationId);
    sendLocalNotification('pickup_requested', '🙋 New Pickup Request', `${volunteerInfo.name} wants to pick up "${donation?.title || 'your donation'}". Review the request!`, donationId);
  }, [donations, refreshDonations]);

  return (
    <DonationContext.Provider value={{ donations, loading, addDonation, editDonation, acceptRequest, rejectRequest, markCompleted, verifyAndComplete, requestPickup }}>
      {children}
    </DonationContext.Provider>
  );
};
