import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    shareLocation: boolean;
    showProfile: boolean;
  };
  defaultArea: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: { push: true, email: true, sms: false },
  privacy: { shareLocation: true, showProfile: true },
  defaultArea: 'Dadar, Mumbai',
};

interface SettingsContextType {
  settings: AppSettings;
  updateNotifications: (key: keyof AppSettings['notifications'], value: boolean) => void;
  updatePrivacy: (key: keyof AppSettings['privacy'], value: boolean) => void;
  updateDefaultArea: (area: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('foodconnect_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; }
      catch { return DEFAULT_SETTINGS; }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('foodconnect_settings', JSON.stringify(settings));
  }, [settings]);

  const updateNotifications = (key: keyof AppSettings['notifications'], value: boolean) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
  };

  const updatePrivacy = (key: keyof AppSettings['privacy'], value: boolean) => {
    setSettings(prev => ({ ...prev, privacy: { ...prev.privacy, [key]: value } }));
  };

  const updateDefaultArea = (area: string) => {
    setSettings(prev => ({ ...prev, defaultArea: area }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateNotifications, updatePrivacy, updateDefaultArea }}>
      {children}
    </SettingsContext.Provider>
  );
};
