import React from 'react';
import { User, Bell, Shield, Moon, Sun, ChevronRight, MapPin, Phone, Mail, Award, Calendar, ExternalLink, BellRing, Eye, LocateFixed } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-forest-600' : 'bg-stone-300 dark:bg-stone-600'}`}>
    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);

const HotelSettings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateNotifications, updatePrivacy } = useSettings();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Settings</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Manage your hotel profile and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 rounded-2xl flex items-center justify-center">
          <User size={28} className="text-forest-600 dark:text-forest-400" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">{user?.hotelName || user?.name}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2.5 py-1 rounded-lg border border-forest-100 dark:border-forest-800 flex items-center gap-1">
            <Award size={12} /> Verified Partner
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div>
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Notifications</p>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><BellRing size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Push Notifications</p><p className="text-xs text-stone-500 dark:text-stone-400">Receive alerts when volunteers accept pickups</p></div>
              <Toggle checked={settings.notifications.push} onChange={(v) => updateNotifications('push', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Mail size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Email Notifications</p><p className="text-xs text-stone-500 dark:text-stone-400">Receive donation status updates via email</p></div>
              <Toggle checked={settings.notifications.email} onChange={(v) => updateNotifications('email', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Phone size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">SMS Alerts</p><p className="text-xs text-stone-500 dark:text-stone-400">Get text messages for urgent notifications</p></div>
              <Toggle checked={settings.notifications.sms} onChange={(v) => updateNotifications('sms', v)} />
            </div>
          </div>
        </div>

        {/* Privacy & Appearance */}
        <div>
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Privacy & Appearance</p>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                {theme === 'light' ? <Moon size={18} className="text-stone-500" /> : <Sun size={18} className="text-stone-400" />}
              </div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Dark Mode</p><p className="text-xs text-stone-500 dark:text-stone-400">Switch between light and dark themes</p></div>
              <Toggle checked={theme === 'dark'} onChange={() => toggleTheme()} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><LocateFixed size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Share Location</p><p className="text-xs text-stone-500 dark:text-stone-400">Allow volunteers to see your hotel location</p></div>
              <Toggle checked={settings.privacy.shareLocation} onChange={(v) => updatePrivacy('shareLocation', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Eye size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Public Profile</p><p className="text-xs text-stone-500 dark:text-stone-400">Show your hotel on the volunteer map</p></div>
              <Toggle checked={settings.privacy.showProfile} onChange={(v) => updatePrivacy('showProfile', v)} />
            </div>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="max-w-lg">
        <p className an="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Support</p>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Mail size={18} className="text-stone-500 dark:text-stone-400" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Contact Support</p><p className="text-xs text-stone-500 dark:text-stone-400">help@foodconnect.app</p></div>
            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><ExternalLink size={18} className="text-stone-500 dark:text-stone-400" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Terms & Conditions</p></div>
            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelSettings;
