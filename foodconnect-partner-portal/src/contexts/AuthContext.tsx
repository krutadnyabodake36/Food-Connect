import React, { createContext, useContext, useEffect, useState } from 'react';
import { Hotel } from '../../types';

// Mock User type since we removed Firebase
export interface User {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  hotelProfile: Hotel | null;
  loading: boolean;
  register: (email: string, password: string, hotelData: Omit<Hotel, 'id' | 'createdAt'>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hotelProfile, setHotelProfile] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('foodconnect_user');
    const storedProfile = localStorage.getItem('foodconnect_profile');

    if (storedUser && storedProfile) {
      try {
        setUser(JSON.parse(storedUser));
        setHotelProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error("Failed to parse stored auth data", e);
        localStorage.removeItem('foodconnect_user');
        localStorage.removeItem('foodconnect_profile');
      }
    } else {
        // Initialize default demo user if not present
        const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');
        
        // "Demo Hotel" sanitizes to "demohotel@foodconnect.app"
        const demoEmail = 'demohotel@foodconnect.app';
        
        if (!users[demoEmail]) {
            const demoUid = 'demo-user-123';
            const demoUser: User = { uid: demoUid, email: demoEmail };
            const demoProfile: Hotel = {
                id: demoUid,
                hotelName: 'Demo Hotel',
                address: '123 Demo St, City',
                managerNumber: '+1234567890',
                licenseNumber: 'DEMO-123',
                createdAt: new Date().toISOString()
            };
            users[demoEmail] = { password: 'password', user: demoUser, profile: demoProfile };
            localStorage.setItem('foodconnect_users_db', JSON.stringify(users));
        }
    }
    setLoading(false);
  }, []);

  const register = async (email: string, password: string, hotelData: Omit<Hotel, 'id' | 'createdAt'>) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');
    if (users[email]) {
        throw new Error('An account with this hotel name already exists.');
    }

    const uid = 'mock-user-' + Date.now();
    const newUser: User = { uid, email };
    const newProfile: Hotel = {
      id: uid,
      ...hotelData,
      createdAt: new Date().toISOString()
    };

    // Store credentials "database"
    users[email] = { password, user: newUser, profile: newProfile };
    localStorage.setItem('foodconnect_users_db', JSON.stringify(users));

    // Set session
    localStorage.setItem('foodconnect_user', JSON.stringify(newUser));
    localStorage.setItem('foodconnect_profile', JSON.stringify(newProfile));
    
    setUser(newUser);
    setHotelProfile(newProfile);
  };

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');
    
    // Check if the input is just the hotel name (without @foodconnect.app)
    let lookupEmail = email;
    if (!email.includes('@')) {
        lookupEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '') + '@foodconnect.app';
    }

    let userData = users[lookupEmail];

    // Fallback: If not found, try to find by matching hotelName directly (case insensitive)
    if (!userData) {
        const normalizedInput = email.toLowerCase().replace(/[^a-z0-9]/g, '');
        const foundEmail = Object.keys(users).find(key => {
            const user = users[key];
            const storedName = user.profile.hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
            return storedName === normalizedInput;
        });
        if (foundEmail) {
            userData = users[foundEmail];
        }
    }

    if (!userData || userData.password !== password) {
       throw new Error('Invalid hotel name or password.');
    }

    const { user, profile } = userData;

    localStorage.setItem('foodconnect_user', JSON.stringify(user));
    localStorage.setItem('foodconnect_profile', JSON.stringify(profile));

    setUser(user);
    setHotelProfile(profile);
  };

  const logout = async () => {
    localStorage.removeItem('foodconnect_user');
    localStorage.removeItem('foodconnect_profile');
    setUser(null);
    setHotelProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, hotelProfile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
