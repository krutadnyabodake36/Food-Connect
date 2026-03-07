import React, { useState } from 'react';
import { NavItem } from '../../types';
import { Logo } from '../shared/Logo';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  Menu, 
  X,
  LogOut,
  BellRing,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBell from '../shared/NotificationBell';

interface HotelLayoutProps {
  children: React.ReactNode;
  activeTab: NavItem;
  onNavigate: (tab: NavItem) => void;
  notificationCount?: number;
}

const HotelLayout: React.FC<HotelLayoutProps> = ({ children, activeTab, onNavigate, notificationCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const NavLink = ({ item, icon: Icon, label, badge }: { item: NavItem; icon: any; label: string; badge?: number }) => (
    <button
      onClick={() => { onNavigate(item); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${activeTab === item 
          ? 'bg-forest-50 text-forest-900 border border-forest-100 dark:bg-forest-900/20 dark:text-forest-300 dark:border-forest-800/50 shadow-sm' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={`transition-colors duration-200 ${activeTab === item ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300'}`} />
        {label}
      </div>
      {badge && badge > 0 ? (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/20">{badge}</span>
      ) : null}
    </button>
  );

  return (
    <div className="min-h-screen h-screen bg-stone-50 dark:bg-stone-950 flex transition-colors duration-200 font-sans">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800/50">
            <Logo size="md" />
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mt-1 ml-[52px]">Partner</p>
          </div>

          {/* Profile card */}
          <div className="p-4">
            <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800/50 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-200 dark:bg-forest-800 rounded-xl flex items-center justify-center text-forest-700 dark:text-forest-300 font-bold text-sm">
                {(user?.hotelName || user?.name || 'H')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest-900 dark:text-forest-200 truncate">{user?.hotelName || user?.name}</p>
                <p className="text-[11px] text-forest-600 dark:text-forest-400 font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-2">Menu</div>
            <nav className="space-y-1">
              <NavLink item={NavItem.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
              <NavLink item={NavItem.REQUESTS} icon={BellRing} label="My Donations" badge={notificationCount} />
              <NavLink item={NavItem.DONATE} icon={PlusCircle} label="Post Donation" />
              <NavLink item={NavItem.HISTORY} icon={History} label="History" />
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-stone-100 dark:border-stone-800/50 space-y-1">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-2">Preferences</div>
            <NavLink item={NavItem.SETTINGS} icon={Settings} label="Settings" />
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors group">
              {theme === 'light' ? <Moon size={20} className="text-stone-400 group-hover:text-stone-600" /> : <Sun size={20} className="text-stone-400 group-hover:text-stone-600" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors group mt-1">
              <LogOut size={20} className="text-stone-400 group-hover:text-red-500" />Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-50 dark:bg-stone-950">
        <header className="lg:hidden h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 shadow-sm z-30 relative flex-shrink-0">
          <Logo size="sm" showText={true} />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default HotelLayout;
