import React, { useState, useMemo } from 'react';
import { Menu, Search, Bell, MapPin, X, Leaf, Flame, ShieldCheck, Trophy, Settings as SettingsIcon, ScanLine, ShoppingBag, LogOut, Building2, PlusCircle, FileText, ChevronDown, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import VolunteerMap from './components/VolunteerMap';
import DonationSheet from './components/DonationSheet';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import Impact from './components/Impact';
import Settings from './components/Settings';
import { MOCK_DONATIONS } from './constants';
import { Donation, User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'map' | 'dashboard' | 'impact' | 'settings'>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Filter Logic
  const filteredDonations = useMemo(() => {
    return MOCK_DONATIONS.filter(d => {
      const matchesSearch = d.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.foodItem.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilters.includes('Veg Only')) {
        matchesFilter = matchesFilter && d.tags.includes('Veg');
      }
      if (activeFilters.includes('Urgent')) {
        matchesFilter = matchesFilter && parseInt(d.expiryTime) < 3; 
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilters]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleMarkerClick = (id: string) => {
    setSelectedId(id);
    setIsNavigating(false); // Reset navigation when selecting a new marker
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setIsDrawerOpen(false);
    setCurrentView('dashboard');
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'map':
        return (
          <VolunteerMap 
            donations={filteredDonations}
            selectedId={selectedId}
            onSelectMarker={handleMarkerClick}
            isNavigating={isNavigating}
          />
        );
      case 'impact':
        return <Impact />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-50 font-sans">
      
      {/* Main Content Area */}
      <div className="absolute inset-0 pb-20 md:pb-0 md:pl-20">
        {renderContent()}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-200 z-50 items-center py-8 gap-8">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-6 w-full px-2">
          <NavButton 
            icon={<LayoutDashboard className="w-6 h-6" />} 
            label="Home" 
            isActive={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
          />
          <NavButton 
            icon={<MapPin className="w-6 h-6" />} 
            label="Map" 
            isActive={currentView === 'map'} 
            onClick={() => setCurrentView('map')} 
          />
          <NavButton 
            icon={<Trophy className="w-6 h-6" />} 
            label="Impact" 
            isActive={currentView === 'impact'} 
            onClick={() => setCurrentView('impact')} 
          />
          <NavButton 
            icon={<SettingsIcon className="w-6 h-6" />} 
            label="Settings" 
            isActive={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
          />
        </nav>

        <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
        <MobileNavButton 
          icon={<LayoutDashboard className="w-6 h-6" />} 
          label="Home" 
          isActive={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')} 
        />
        <MobileNavButton 
          icon={<MapPin className="w-6 h-6" />} 
          label="Map" 
          isActive={currentView === 'map'} 
          onClick={() => setCurrentView('map')} 
        />
        <div className="relative -top-8">
          <button 
            onClick={() => setCurrentView('map')}
            className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-slate-50"
          >
            <PlusCircle className="w-8 h-8 text-white" />
          </button>
        </div>
        <MobileNavButton 
          icon={<Trophy className="w-6 h-6" />} 
          label="Impact" 
          isActive={currentView === 'impact'} 
          onClick={() => setCurrentView('impact')} 
        />
        <MobileNavButton 
          icon={<UserIcon className="w-6 h-6" />} 
          label="Profile" 
          isActive={isDrawerOpen} 
          onClick={() => setIsDrawerOpen(true)} 
        />
      </div>

      {/* Map Overlays (Only visible when map is active) */}
      {currentView === 'map' && (
        <>
          {/* Floating Header Island */}
          <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none flex flex-col items-center gap-4 md:pl-20">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-2xl bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl p-2 pointer-events-auto border border-white/50 flex items-center gap-2"
            >
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={user.role === 'ngo' ? "Search my donations..." : "Search food, hotels..."}
                  className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-medium"
                />
              </div>

              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="hidden md:flex pl-2 pr-1 py-1 items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">{user.role}</div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden">
                  <img src={user.avatar || "https://i.pravatar.cc/150?img=11"} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </button>
            </motion.div>

            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 pointer-events-auto overflow-x-auto max-w-full pb-2 no-scrollbar px-2"
            >
              <FilterChip 
                label="Veg Only" 
                icon={<Leaf className="w-3.5 h-3.5" />} 
                isActive={activeFilters.includes('Veg Only')} 
                onClick={() => toggleFilter('Veg Only')} 
                colorClass="emerald"
              />
              <FilterChip 
                label="Urgent" 
                icon={<Flame className="w-3.5 h-3.5" />} 
                isActive={activeFilters.includes('Urgent')} 
                onClick={() => toggleFilter('Urgent')} 
                colorClass="red"
              />
              <FilterChip 
                label="Nearby (< 5km)" 
                icon={<MapPin className="w-3.5 h-3.5" />} 
                isActive={activeFilters.includes('< 5km')} 
                onClick={() => toggleFilter('< 5km')} 
                colorClass="blue"
              />
            </motion.div>
          </div>

          <DonationSheet 
            donations={filteredDonations}
            selectedId={selectedId}
            onCloseDetail={() => { setSelectedId(null); setIsNavigating(false); }}
            onSelectDonation={handleMarkerClick}
            onAcceptPickup={() => setIsNavigating(true)}
            isNavigating={isNavigating}
          />
        </>
      )}

      {/* LAYER 4: Profile Drawer (Slide Over) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
            />
            
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute top-2 right-2 bottom-20 md:bottom-2 w-[85%] max-w-xs bg-white rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden border border-slate-100"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Menu</h2>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-500 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden">
                    <img src={user.avatar || "https://i.pravatar.cc/150?img=11"} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${user.role === 'ngo' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {user.role === 'ngo' ? 'Partner NGO' : 'Gold Volunteer'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                {user.role === 'volunteer' ? (
                  <>
                    <DrawerItem icon={<ShoppingBag className="w-5 h-5" />} label="My Claims" badge="2" />
                    <DrawerItem icon={<ScanLine className="w-5 h-5" />} label="Scanner" />
                    <DrawerItem icon={<Trophy className="w-5 h-5" />} label="Leaderboard" />
                    <DrawerItem icon={<ShieldCheck className="w-5 h-5" />} label="Safety Guide" />
                  </>
                ) : (
                  <>
                    <DrawerItem icon={<PlusCircle className="w-5 h-5" />} label="Post Donation" />
                    <DrawerItem icon={<Building2 className="w-5 h-5" />} label="Listings" badge="5" />
                    <DrawerItem icon={<FileText className="w-5 h-5" />} label="Reports" />
                    <DrawerItem icon={<ShieldCheck className="w-5 h-5" />} label="Verification" />
                  </>
                )}
                
                <div className="h-px bg-slate-100 my-2 mx-2" />
                <DrawerItem icon={<Settings className="w-5 h-5" />} label="Settings" />
              </div>
              
              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

// UI Components for App.tsx
const NavButton = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const MobileNavButton = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const FilterChip = ({ label, icon, isActive, onClick, colorClass }: any) => {
  const activeStyles = {
    emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30',
    red: 'bg-red-500 text-white border-red-500 shadow-red-500/30',
    blue: 'bg-blue-500 text-white border-blue-500 shadow-blue-500/30',
  };

  const baseStyle = isActive 
    // @ts-ignore
    ? activeStyles[colorClass] || activeStyles.emerald
    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300';

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition-all whitespace-nowrap
        ${baseStyle}
      `}
    >
      {icon}
      {label}
    </motion.button>
  )
}

const DrawerItem = ({ icon, label, badge }: any) => (
  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group text-slate-600 hover:text-slate-900">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500 group-hover:text-emerald-600">
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
    </div>
    {badge && (
      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
)

export default App;
