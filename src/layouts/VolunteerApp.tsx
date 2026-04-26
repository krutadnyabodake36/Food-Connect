import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, LayoutDashboard, Heart, Settings as SettingsIcon, Filter, X, Leaf, Menu, LogOut, MapPin, Moon, Sun } from 'lucide-react';
import VolunteerMap from '../components/volunteer/VolunteerMap';
import type { RouteResult } from '../components/volunteer/VolunteerMap';
import DonationSheet from '../components/volunteer/DonationSheet';
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard';
import Impact from '../pages/volunteer/Impact';
import SettingsPage from '../pages/volunteer/Settings';
import SyncIndicator from '../components/shared/SyncIndicator';
import { VolunteerDonation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDonations } from '../contexts/DonationContext';
import { getHotelName, getHotelLocation } from '../lib/hotelLocation';
import NotificationBell from '../components/shared/NotificationBell';
import AIChatWidget from '../components/shared/AIChatWidget';

type View = 'map' | 'dashboard' | 'impact' | 'settings';

const DEFAULT_VOLUNTEER_LOCATION = { lat: 19.0176, lng: 72.8562 };
const NEARBY_RADIUS_KM = 50;

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const VolunteerApp: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [volunteerLocation, setVolunteerLocation] = useState(DEFAULT_VOLUNTEER_LOCATION);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { donations: allDonations, requestPickup } = useDonations();

  const filters = ['All', 'Veg', 'Non-Veg', 'Bakery', 'Bulk', 'Hot'];

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVolunteerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Keep default location if permission is denied.
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      },
    );
  }, []);

  // Convert shared HotelDonation[] to VolunteerDonation[] for the map
  const availableDonations: VolunteerDonation[] = useMemo(() => {
    const mapped = allDonations
      .filter(d => d.status === 'pending' || (d.status === 'assigned' && d.assignedVolunteer?.id === user?.id))
      .map(d => {
        const loc = getHotelLocation(d.hotelId);
        const distanceKm = getDistanceKm(volunteerLocation.lat, volunteerLocation.lng, loc.lat, loc.lng);
        return {
          id: d.id,
          hotelName: getHotelName(d),
          distance: `${distanceKm.toFixed(1)} km`,
          foodItem: d.title,
          quantity: Math.max(1, Math.round(d.weight * 2)), // approx plates
          expiryTime: d.pickupWindow,
          pickupTime: d.pickupWindow,
          lat: loc.lat,
          lng: loc.lng,
          imageUrl: d.imageUrl || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400',
          tags: d.tags,
          // Extra fields for status awareness
          status: d.status as any,
          hasActiveRequest: !!d.activeRequest,
          pickupCode: d.pickupCode,
          _distanceKm: distanceKm,
        };
      })
      .sort((a: any, b: any) => a._distanceKm - b._distanceKm);

    const nearby = mapped.filter((item: any) => item._distanceKm <= NEARBY_RADIUS_KM);
    const realistic = nearby.length > 0 ? nearby : mapped.slice(0, 12);
    return realistic.map(({ _distanceKm, ...rest }: any) => rest as VolunteerDonation);
  }, [allDonations, user?.id, volunteerLocation.lat, volunteerLocation.lng]);

  const filteredDonations = useMemo(() => {
    if (!activeFilter || activeFilter === 'All') return availableDonations;
    return availableDonations.filter(d => d.tags.some(t => t.toLowerCase() === activeFilter.toLowerCase()));
  }, [availableDonations, activeFilter]);

  // Check if the selected donation was accepted (volunteer should see navigation)
  const selectedDonationRaw = allDonations.find(d => d.id === selectedId);
  const isNavigating = selectedDonationRaw?.status === 'assigned' && selectedDonationRaw?.assignedVolunteer?.id === user?.id;

  const handleSelectMarker = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleRequestPickup = useCallback((id: string) => {
    if (!user) return;
    requestPickup(id, {
      id: user.id,
      name: user.name,
      rating: 4.9,
      distanceKm: parseFloat((Math.random() * 3 + 0.5).toFixed(1)),
      etaMinutes: Math.round(Math.random() * 15 + 5),
      vehicle: user.vehicle || 'Bicycle',
      location: 'Current Location',
      availability: 'Now',
      completedTrips: 89,
      joinedDate: 'Mar 2024',
      phone: user.phone || '+91 98765 43210',
    });
  }, [user, requestPickup]);

  const handleNavigate = (v: View) => {
    setView(v);
    setIsMobileMenuOpen(false);
    if (v !== 'map') { setSelectedId(null); }
  };

  const NavLink = ({ targetView, icon: Icon, label }: { targetView: View; icon: any; label: string }) => {
    const isActive = view === targetView;
    return (
      <button
        onClick={() => handleNavigate(targetView)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
          ${isActive
            ? 'bg-forest-50 text-forest-900 border border-forest-100 shadow-sm dark:bg-forest-900/20 dark:text-forest-300 dark:border-forest-800/50'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
          }`}
      >
        <Icon
          size={20}
          className={`transition-colors duration-200 ${
            isActive ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300'
          }`}
        />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex font-sans transition-colors duration-200">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 glass-sidebar lg:my-4 lg:ml-4 lg:rounded-3xl transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-2xl shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-forest-900/20">
                <Leaf size={20} />
              </div>
              <div>
                <span className="text-xl font-serif font-bold tracking-wide animate-gradient-text">FoodConnect</span>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest -mt-0.5">Volunteer</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800/50 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-200 dark:bg-forest-800 rounded-xl flex items-center justify-center text-forest-700 dark:text-forest-300 font-bold text-sm">
                {(user?.name || 'V')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest-900 dark:text-forest-200 truncate">{user?.name || 'Volunteer'}</p>
                <p className="text-[11px] text-forest-600 dark:text-forest-400 font-medium">⭐ 4.9 · A+ Impact</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-2">Menu</div>
            <nav className="space-y-1">
              <NavLink targetView="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink targetView="map" icon={Map} label="Rescue Map" />
              <NavLink targetView="impact" icon={Heart} label="My Impact" />
            </nav>
          </div>

          <div className="px-4 py-4">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-2">This Week</div>
            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Meals Saved</span>
                <span className="text-sm font-bold text-forest-800 dark:text-forest-400">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Hours Volunteered</span>
                <span className="text-sm font-bold text-forest-800 dark:text-forest-400">24.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Available Pickups</span>
                <span className="text-sm font-bold text-forest-800 dark:text-forest-400">{availableDonations.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-stone-100 dark:border-stone-800/50 space-y-1">
            <NavLink targetView="settings" icon={SettingsIcon} label="Settings" />
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors group">
              {theme === 'light' ? <Moon size={20} className="text-stone-400 group-hover:text-stone-600" /> : <Sun size={20} className="text-stone-400 group-hover:text-stone-600" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors group">
              <LogOut size={20} className="text-stone-400 group-hover:text-red-500" />Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-stone-50 dark:bg-stone-950">
        <header className="lg:hidden h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 shadow-sm z-30 relative shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-forest-700 rounded-xl flex items-center justify-center text-white"><Leaf size={15} /></div>
            <span className="text-lg font-serif font-bold animate-gradient-text">FoodConnect</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <div className="relative min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <AnimatePresence mode="wait">
            {view === 'map' && (
              <motion.div key="map" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="absolute inset-0">
                <div className="absolute inset-0 z-0">
                  <VolunteerMap donations={filteredDonations} selectedId={selectedId} onSelectMarker={handleSelectMarker} isNavigating={isNavigating} onRouteUpdate={setRouteInfo} />
                </div>
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2">
                  <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-xl px-3.5 py-2.5 shadow-lg shadow-stone-900/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-forest-500 ring-4 ring-forest-500/20" />
                    <span className="text-xs font-semibold text-stone-700">Dadar, Mumbai</span>
                  </div>
                  <SyncIndicator />
                  <div className="flex-1" />
                  <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-xl shadow-lg border transition-all backdrop-blur-xl ${showFilters ? 'bg-forest-700 text-white border-forest-700' : 'bg-white/90 text-stone-600 border-stone-200/60'}`}>
                    {showFilters ? <X size={18} /> : <Filter size={18} />}
                  </button>
                </div>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-16 left-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-2 shadow-lg flex gap-2 overflow-x-auto no-scrollbar">
                        {filters.map(f => (
                          <button key={f} onClick={() => setActiveFilter(f === 'All' ? null : f)} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${(activeFilter === f || (!activeFilter && f === 'All')) ? 'bg-forest-700 text-white shadow-md shadow-forest-700/20' : 'text-stone-600 hover:bg-stone-100'}`}>
                            {f === 'Veg' && '🥬 '}{f === 'Non-Veg' && '🍗 '}{f === 'Bakery' && '🥐 '}{f === 'Bulk' && '📦 '}{f === 'Hot' && '🔥 '}{f === 'All' && '✨ '}{f}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <DonationSheet
                  donations={filteredDonations}
                  selectedId={selectedId}
                  onCloseDetail={handleCloseDetail}
                  onSelectDonation={handleSelectMarker}
                  onAcceptPickup={handleRequestPickup}
                  isNavigating={isNavigating}
                />
              </motion.div>
            )}
            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="absolute inset-0 overflow-y-auto scroll-smooth">
                <VolunteerDashboard onGoToMap={() => handleNavigate('map')} availableCount={availableDonations.length} />
              </motion.div>
            )}
            {view === 'impact' && (
              <motion.div key="impact" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="absolute inset-0 overflow-y-auto scroll-smooth">
                <Impact />
              </motion.div>
            )}
            {view === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="absolute inset-0 overflow-y-auto scroll-smooth">
                <SettingsPage />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <AIChatWidget role="volunteer" />
    </div>
  );
};

export default VolunteerApp;
