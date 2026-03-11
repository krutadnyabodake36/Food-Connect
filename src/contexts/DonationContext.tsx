import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { HotelDonation, Volunteer } from '../types';
import supabase from '../lib/supabase';
import { sendLocalNotification } from '../lib/notifications';

/*  ── Donation lifecycle ──
 *   pending    →  Hotel posted, shows on volunteer map
 *   requested  →  Volunteer sent a pickup request (activeRequest populated)
 *   assigned   →  Hotel accepted, volunteer gets directions / tracking
 *   completed  →  Hotel verified OTP, order done
 */

interface DonationContextType {
  donations: HotelDonation[];
  loading: boolean;
  // Hotel actions
  addDonation: (data: Partial<HotelDonation>, hotelId: string, hotelName: string) => void;
  editDonation: (id: string, data: Partial<HotelDonation>) => void;
  acceptRequest: (donationId: string) => void;
  rejectRequest: (donationId: string) => void;
  markCompleted: (donationId: string) => void;
  verifyAndComplete: (donationId: string, code: string) => boolean;
  // Volunteer actions
  requestPickup: (donationId: string, volunteerInfo: Volunteer) => void;
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export const useDonations = () => {
  const context = useContext(DonationContext);
  if (!context) throw new Error('useDonations must be used within a DonationProvider');
  return context;
};

// Map coordinates per hotel (Dadar, Mumbai area)
export const HOTEL_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  '11111111-1111-1111-1111-111111111111': { lat: 19.0178, lng: 72.8478 },
};

// Hotel name cache
const HOTEL_NAMES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Demo Hotel',
};

export const getHotelName = (donation: HotelDonation): string =>
  HOTEL_NAMES[donation.hotelId] || 'Unknown Hotel';

export const getHotelLocation = (hotelId: string): { lat: number; lng: number } =>
  HOTEL_LOCATIONS[hotelId] || { lat: 19.018, lng: 72.848 };

// ── Supabase helpers ──

const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!(url && !url.includes('placeholder'));
};

// Convert Supabase row to HotelDonation
const rowToDonation = (row: any): HotelDonation => ({
  id: row.id,
  hotelId: row.hotel_id,
  title: row.title,
  weight: row.weight,
  tags: row.tags || [],
  status: row.status,
  timestamp: new Date(row.created_at).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
  pickupWindow: row.pickup_window || 'Anytime',
  imageUrl: row.image_url,
  isUrgent: row.is_urgent,
  pickupCode: row.pickup_code,
  // These will be populated from pickup_requests
  activeRequest: row._activeRequest,
  assignedVolunteer: row._assignedVolunteer,
  tracking: row._tracking,
});

// ── STORAGE KEY ──
const STORAGE_KEY = 'foodconnect_donations';

// Seed data for localStorage fallback — ALL belong to the Demo Hotel
const DEMO_HOTEL_ID = '11111111-1111-1111-1111-111111111111';

const SEED_DONATIONS: HotelDonation[] = [
  { id: 'seed-1', hotelId: DEMO_HOTEL_ID, title: 'Veg Biryani & Curry', weight: 6, tags: ['Veg', 'Hot'], status: 'pending', timestamp: '25 min ago', pickupWindow: '10:30 PM', imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=60', isUrgent: false },
  { id: 'seed-2', hotelId: 'hotel-oceanCatch', title: 'Grilled Fish Surplus', weight: 3, tags: ['Non-Veg', 'Fragile'], status: 'pending', timestamp: '40 min ago', pickupWindow: '11:00 PM', imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2750?w=800&auto=format&fit=crop&q=60', isUrgent: false },
  { id: 'seed-3', hotelId: 'hotel-spiceRoute', title: 'Assorted Breads & Dal', weight: 12, tags: ['Veg', 'Bulk'], status: 'pending', timestamp: '1 hour ago', pickupWindow: '11:45 PM', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=60', isUrgent: false },
  { id: 'seed-4', hotelId: 'hotel-cafeDelight', title: 'Pastries & Sandwiches', weight: 4, tags: ['Bakery', 'Cool'], status: 'pending', timestamp: '2 hours ago', pickupWindow: '08:00 AM', imageUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&auto=format&fit=crop&q=60', isUrgent: false },
];

// Extra hotel maps for seed data
HOTEL_NAMES['hotel-oceanCatch'] = 'Ocean Catch';
HOTEL_NAMES['hotel-spiceRoute'] = 'Spice Route Banquet';
HOTEL_NAMES['hotel-cafeDelight'] = 'Café Delight';
HOTEL_LOCATIONS['hotel-oceanCatch'] = { lat: 19.0210, lng: 72.8420 };
HOTEL_LOCATIONS['hotel-spiceRoute'] = { lat: 19.0120, lng: 72.8550 };
HOTEL_LOCATIONS['hotel-cafeDelight'] = { lat: 19.0250, lng: 72.8380 };

// ── localStorage helpers (shared between tabs) ──

function readFromStorage(): HotelDonation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED_DONATIONS;
}

function writeToStorage(donations: HotelDonation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
}


export const DonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donations, setDonations] = useState<HotelDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const useSupabase = useRef(isSupabaseConfigured());
  const skipNextPersist = useRef(false);

  // ── Initial load ──
  useEffect(() => {
    if (useSupabase.current) {
      loadFromSupabase();
      subscribeToRealtime();
    } else {
      const data = readFromStorage();
      setDonations(data);
      setLoading(false);
    }
  }, []);

  // ── Persist to localStorage on every change (localStorage mode) ──
  useEffect(() => {
    if (!useSupabase.current && donations.length > 0) {
      if (skipNextPersist.current) {
        skipNextPersist.current = false;
        return;
      }
      writeToStorage(donations);
    }
  }, [donations]);

  // ── Cross-tab sync: listen for localStorage changes from other tabs ──
  useEffect(() => {
    if (useSupabase.current) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          skipNextPersist.current = true; // Don't re-persist what we just received
          setDonations(updated);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── Supabase loaders ──

  const loadFromSupabase = async () => {
    try {
      // Load donations
      const { data: donationRows, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load pending pickup requests
      const { data: requestRows } = await supabase
        .from('pickup_requests')
        .select('*, volunteer:profiles(*)')
        .eq('status', 'pending');

      // Load accepted pickup requests (assigned volunteers)
      const { data: acceptedRows } = await supabase
        .from('pickup_requests')
        .select('*, volunteer:profiles(*)')
        .eq('status', 'accepted');

      // Load hotel profiles for names + locations
      const { data: hotels } = await supabase
        .from('profiles')
        .select('id, hotel_name, lat, lng')
        .eq('role', 'hotel');

      // Cache hotel info
      hotels?.forEach(h => {
        if (h.hotel_name) HOTEL_NAMES[h.id] = h.hotel_name;
        if (h.lat && h.lng) HOTEL_LOCATIONS[h.id] = { lat: h.lat, lng: h.lng };
      });

      // Map requests to donations
      const mapped = (donationRows || []).map(row => {
        const pendingReq = requestRows?.find(r => r.donation_id === row.id);
        const acceptedReq = acceptedRows?.find(r => r.donation_id === row.id);

        const activeRequest = pendingReq ? {
          id: pendingReq.volunteer?.id || pendingReq.volunteer_id,
          name: pendingReq.volunteer?.name || 'Volunteer',
          rating: 4.9,
          distanceKm: parseFloat((Math.random() * 3 + 0.5).toFixed(1)),
          etaMinutes: Math.round(Math.random() * 15 + 5),
          vehicle: pendingReq.volunteer?.vehicle || 'Bicycle',
          phone: pendingReq.volunteer?.phone || '',
        } as Volunteer : undefined;

        const assignedVolunteer = acceptedReq ? {
          id: acceptedReq.volunteer?.id || acceptedReq.volunteer_id,
          name: acceptedReq.volunteer?.name || 'Volunteer',
          rating: 4.9,
          distanceKm: parseFloat((Math.random() * 3 + 0.5).toFixed(1)),
          etaMinutes: Math.round(Math.random() * 15 + 5),
          vehicle: acceptedReq.volunteer?.vehicle || 'Bicycle',
          phone: acceptedReq.volunteer?.phone || '',
        } as Volunteer : undefined;

        const hotelLoc = getHotelLocation(row.hotel_id);
        const tracking = row.status === 'assigned' && assignedVolunteer ? {
          active: true,
          currentLocation: { lat: hotelLoc.lat + 0.003, lng: hotelLoc.lng + 0.002, address: 'Volunteer Location' },
          destination: { lat: hotelLoc.lat, lng: hotelLoc.lng, address: HOTEL_NAMES[row.hotel_id] || 'Hotel' },
          progress: 35,
          status: 'on_route' as const,
          lastUpdated: 'Live',
        } : undefined;

        return {
          ...rowToDonation(row),
          activeRequest,
          assignedVolunteer,
          tracking,
        };
      });

      setDonations(mapped);
    } catch (err) {
      console.error('Supabase load error, falling back to localStorage:', err);
      useSupabase.current = false;
      const data = readFromStorage();
      setDonations(data);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtime = () => {
    // Subscribe to donations changes
    supabase
      .channel('donations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        loadFromSupabase(); // Reload all data on any change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_requests' }, () => {
        loadFromSupabase();
      })
      .subscribe();
  };

  // ── Tracking simulation ──
  useEffect(() => {
    const interval = setInterval(() => {
      setDonations(prev => {
        const hasTracking = prev.some(d => d.status === 'assigned' && d.tracking?.active);
        if (!hasTracking) return prev; // Skip update if nothing to track
        return prev.map(d => {
          if (d.status === 'assigned' && d.tracking && d.tracking.active) {
            let newProgress = d.tracking.progress + 1;
            let newStatus = d.tracking.status;
            if (newProgress >= 100) { newProgress = 100; newStatus = 'arrived'; }
            return { ...d, tracking: { ...d.tracking, progress: newProgress, status: newStatus, lastUpdated: 'Live' } };
          }
          return d;
        });
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Hotel actions ──

  const addDonation = useCallback(async (data: Partial<HotelDonation>, hotelId: string, hotelName: string) => {
    HOTEL_NAMES[hotelId] = hotelName;
    if (!HOTEL_LOCATIONS[hotelId]) {
      HOTEL_LOCATIONS[hotelId] = { lat: 19.015 + Math.random() * 0.015, lng: 72.835 + Math.random() * 0.02 };
    }

    if (useSupabase.current) {
      const { error } = await supabase.from('donations').insert({
        hotel_id: hotelId,
        title: data.title || 'Untitled Donation',
        weight: data.weight || 0,
        tags: data.tags || [],
        pickup_window: data.pickupWindow || 'Anytime',
        image_url: data.imageUrl,
        is_urgent: data.isUrgent || false,
      });
      if (error) console.error('Add donation error:', error);
      // Realtime will trigger reload
    } else {
      const newId = 'don-' + Date.now();
      const newDonation: HotelDonation = {
        id: newId, hotelId,
        title: data.title || 'Untitled', weight: data.weight || 0,
        tags: data.tags || [], status: 'pending', timestamp: 'Just now',
        pickupWindow: data.pickupWindow || 'Anytime', imageUrl: data.imageUrl, isUrgent: data.isUrgent,
      } as HotelDonation;
      setDonations(prev => {
        const updated = [newDonation, ...prev];
        writeToStorage(updated); // Immediately persist so other tabs see it
        return updated;
      });
    }
    sendLocalNotification('new_donation', '🍲 New Donation Posted', `${data.title || 'A donation'} (${data.weight || 0}kg) is now available for pickup.`, data.title);
  }, []);

  const editDonation = useCallback(async (id: string, data: Partial<HotelDonation>) => {
    if (useSupabase.current) {
      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.weight !== undefined) updates.weight = data.weight;
      if (data.tags) updates.tags = data.tags;
      if (data.pickupWindow) updates.pickup_window = data.pickupWindow;
      if (data.imageUrl) updates.image_url = data.imageUrl;
      if (data.isUrgent !== undefined) updates.is_urgent = data.isUrgent;
      if (data.rating !== undefined) updates.rating = data.rating;
      updates.updated_at = new Date().toISOString();
      await supabase.from('donations').update(updates).eq('id', id);
    } else {
      setDonations(prev => {
        const updated = prev.map(d => d.id === id ? { ...d, ...data } : d);
        writeToStorage(updated);
        return updated;
      });
    }
  }, []);

  const acceptRequest = useCallback(async (donationId: string) => {
    const pickupCode = String(Math.floor(1000 + Math.random() * 9000));

    if (useSupabase.current) {
      // Get the pending request
      const { data: requests } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('donation_id', donationId)
        .eq('status', 'pending')
        .limit(1);

      if (requests && requests.length > 0) {
        // Accept the request
        await supabase.from('pickup_requests').update({ status: 'accepted' }).eq('id', requests[0].id);
        // Update donation
        await supabase.from('donations').update({
          status: 'assigned',
          volunteer_id: requests[0].volunteer_id,
          pickup_code: pickupCode,
          updated_at: new Date().toISOString(),
        }).eq('id', donationId);
      }
    } else {
      setDonations(prev => {
        const updated = prev.map(d => {
          if (d.id === donationId && d.activeRequest) {
            const hotelLoc = getHotelLocation(d.hotelId);
            return {
              ...d, status: 'assigned' as const, assignedVolunteer: d.activeRequest, activeRequest: undefined, pickupCode,
              tracking: {
                active: true,
                currentLocation: { lat: hotelLoc.lat + (Math.random() * 0.01 - 0.005), lng: hotelLoc.lng + (Math.random() * 0.01 - 0.005), address: 'Volunteer Location' },
                destination: { lat: hotelLoc.lat, lng: hotelLoc.lng, address: HOTEL_NAMES[d.hotelId] || 'Hotel' },
                progress: 5, status: 'on_route' as const, lastUpdated: 'Just now',
              },
            };
          }
          return d;
        });
        writeToStorage(updated);
        return updated;
      });
    }
    const donation = donations.find(d => d.id === donationId);
    sendLocalNotification('request_accepted', '✅ Request Accepted!', `Your pickup request for "${donation?.title || 'a donation'}" has been accepted. Head to the hotel now!`, donationId);
  }, [donations]);

  const rejectRequest = useCallback(async (donationId: string) => {
    if (useSupabase.current) {
      await supabase.from('pickup_requests').update({ status: 'rejected' }).eq('donation_id', donationId).eq('status', 'pending');
    } else {
      setDonations(prev => {
        const updated = prev.map(d => d.id === donationId ? { ...d, activeRequest: undefined } : d);
        writeToStorage(updated);
        return updated;
      });
    }
    sendLocalNotification('request_rejected', '❌ Request Declined', `Your pickup request has been declined. Try other available donations.`, donationId);
  }, []);

  const markCompleted = useCallback(async (donationId: string) => {
    if (useSupabase.current) {
      await supabase.from('donations').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', donationId);
    } else {
      setDonations(prev => {
        const updated = prev.map(d => d.id === donationId ? {
          ...d, status: 'completed' as const, tracking: d.tracking ? { ...d.tracking, active: false, status: 'arrived' as const, progress: 100 } : undefined,
        } : d);
        writeToStorage(updated);
        return updated;
      });
    }
  }, []);

  const verifyAndComplete = useCallback((donationId: string, code: string): boolean => {
    const donation = donations.find(d => d.id === donationId);
    if (!donation?.pickupCode || donation.pickupCode !== code) return false;

    if (useSupabase.current) {
      supabase.from('donations').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', donationId);
    }
    setDonations(prev => {
      const updated = prev.map(d => d.id === donationId ? {
        ...d, status: 'completed' as const, tracking: d.tracking ? { ...d.tracking, active: false, status: 'arrived' as const, progress: 100 } : undefined,
      } : d);
      writeToStorage(updated);
      return updated;
    });
    sendLocalNotification('pickup_completed', '🎉 Pickup Complete!', `Donation "${donation?.title || ''}" has been successfully verified and completed.`, donationId);
    return true;
  }, [donations]);

  // ── Volunteer actions ──

  const requestPickup = useCallback(async (donationId: string, volunteerInfo: Volunteer) => {
    if (useSupabase.current) {
      await supabase.from('pickup_requests').insert({
        donation_id: donationId,
        volunteer_id: volunteerInfo.id,
        status: 'pending',
      });
    } else {
      setDonations(prev => {
        const updated = prev.map(d => {
          if (d.id === donationId && d.status === 'pending' && !d.activeRequest) {
            return { ...d, activeRequest: volunteerInfo };
          }
          return d;
        });
        writeToStorage(updated);
        return updated;
      });
    }
    const donation = donations.find(d => d.id === donationId);
    sendLocalNotification('pickup_requested', '🙋 New Pickup Request', `${volunteerInfo.name} wants to pick up "${donation?.title || 'your donation'}". Review the request!`, donationId);
  }, [donations]);

  return (
    <DonationContext.Provider value={{ donations, loading, addDonation, editDonation, acceptRequest, rejectRequest, markCompleted, verifyAndComplete, requestPickup }}>
      {children}
    </DonationContext.Provider>
  );
};
