import React, { createContext, useContext, useEffect, useState } from 'react';
import { Hotel } from '../../types';

export interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  hotelProfile: Hotel | null;
  loading: boolean;
  register: (payload: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = 'http://localhost:8000'; // Default backend URL

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
    const storedUser = localStorage.getItem('foodconnect_user');
    const storedProfile = localStorage.getItem('foodconnect_profile');
    const storedToken = localStorage.getItem('foodconnect_token');

    if (storedUser && storedProfile && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setHotelProfile(JSON.parse(storedProfile));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const register = async (payload: any) => {
    // payload should be { role, password, data: { ... } }
    console.log('Sending Registration Payload:', payload);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Registration Error Data:', data);
        throw new Error(data.detail || 'Registration failed');
      }

      const { token, user, hotelProfile: profile } = data;
      
      localStorage.setItem('foodconnect_token', token);
      localStorage.setItem('foodconnect_user', JSON.stringify(user));
      localStorage.setItem('foodconnect_profile', JSON.stringify(profile));
      
      setUser(user);
      setHotelProfile(profile);
    } catch (err: any) {
      console.error('Registration Exception:', err);
      throw err;
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'hotel',
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      const { token, user, hotelProfile: profile } = data;
      
      localStorage.setItem('foodconnect_token', token);
      localStorage.setItem('foodconnect_user', JSON.stringify(user));
      localStorage.setItem('foodconnect_profile', JSON.stringify(profile));
      
      setUser(user);
      setHotelProfile(profile);
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('foodconnect_token');
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
