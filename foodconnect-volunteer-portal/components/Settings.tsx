import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Lock, Globe, Moon, ChevronRight, LogOut, Shield, HelpCircle, FileText, Smartphone } from 'lucide-react';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState(true);

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">{title}</h3>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );

  const ToggleItem = ({ icon: Icon, label, value, onChange, color = "emerald" }: any) => {
    const colorClasses = {
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', toggle: 'bg-emerald-500' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', toggle: 'bg-blue-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', toggle: 'bg-purple-500' },
    };
    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;

    return (
      <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${value ? `${colors.bg} ${colors.text}` : 'bg-slate-100 text-slate-500'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-medium text-slate-900">{label}</span>
        </div>
        <button 
          onClick={() => onChange(!value)}
          className={`w-12 h-6 rounded-full transition-colors relative ${value ? colors.toggle : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    );
  };

  const LinkItem = ({ icon: Icon, label, badge }: any) => (
    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group text-left">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{badge}</span>}
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
      </div>
    </button>
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 px-2">Settings</h1>

        <Section title="Account">
          <LinkItem icon={User} label="Edit Profile" />
          <LinkItem icon={Lock} label="Change Password" />
          <LinkItem icon={Shield} label="Privacy & Security" />
        </Section>

        <Section title="Preferences">
          <ToggleItem icon={Bell} label="Push Notifications" value={notifications} onChange={setNotifications} />
          <ToggleItem icon={Globe} label="Location Services" value={location} onChange={setLocation} color="blue" />
          <ToggleItem icon={Moon} label="Dark Mode" value={darkMode} onChange={setDarkMode} color="purple" />
        </Section>

        <Section title="Support">
          <LinkItem icon={HelpCircle} label="Help Center" />
          <LinkItem icon={Smartphone} label="Contact Support" />
          <LinkItem icon={FileText} label="Terms of Service" />
        </Section>

        <div className="px-4 mt-8">
          <button className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">Version 1.0.2 (Build 2024.10.25)</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
