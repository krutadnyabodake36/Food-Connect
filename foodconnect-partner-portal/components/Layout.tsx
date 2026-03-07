import React, { useState } from 'react';
import { NavItem } from '../types';
import { Logo } from './Logo';
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

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavItem;
  onNavigate: (tab: NavItem) => void;
  notificationCount?: number;
  currentTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, notificationCount = 0, currentTheme, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ item, icon: Icon, label, badge }: { item: NavItem; icon: any; label: string; badge?: number }) => (
    <button
      onClick={() => {
        onNavigate(item);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${activeTab === item 
          ? 'bg-forest-50 text-forest-900 border border-forest-100 dark:bg-forest-900/20 dark:text-forest-300 dark:border-forest-800/50 shadow-sm' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon 
          size={20} 
          className={`transition-colors duration-200 ${
            activeTab === item 
              ? 'text-forest-600 dark:text-forest-400' 
              : 'text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300'
          }`} 
        />
        {label}
      </div>
      {badge && badge > 0 ? (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/20">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex transition-colors duration-200 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800/50">
            <Logo size="md" />
          </div>

          <div className="px-4 py-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4 px-2">Menu</div>
            <nav className="space-y-1">
              <NavLink item={NavItem.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
              <NavLink item={NavItem.REQUESTS} icon={BellRing} label="My Donations" badge={notificationCount} />
              <NavLink item={NavItem.DONATE} icon={PlusCircle} label="Post Donation" />
              <NavLink item={NavItem.HISTORY} icon={History} label="History" />
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-stone-100 dark:border-stone-800/50 space-y-2">
             <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-2">Preferences</div>
             <NavLink item={NavItem.SETTINGS} icon={Settings} label="Settings" />
             
             <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors group"
             >
                {currentTheme === 'light' ? 
                  <Moon size={20} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500" /> : 
                  <Sun size={20} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500" />
                }
                {currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
             </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors group mt-2">
              <LogOut size={20} className="text-stone-400 group-hover:text-red-500 dark:text-stone-500" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-50 dark:bg-stone-950">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 shadow-sm z-30 relative">
          <Logo size="sm" showText={true} />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;