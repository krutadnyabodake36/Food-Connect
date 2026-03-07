import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Hotel, UserRole } from '../types';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  hotelProfile: Hotel | null;
  loading: boolean;
  register: (role: UserRole, data: any, password: string) => Promise<void>;
  login: (role: UserRole, identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  verifyPhoneOtp: (otp: string, role: UserRole, extraData?: any) => Promise<void>;
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
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('foodconnect_user');
    const storedProfile = localStorage.getItem('foodconnect_profile');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (storedProfile) {
          setHotelProfile(JSON.parse(storedProfile));
        }
      } catch (e) {
        console.error("Failed to parse stored auth data", e);
        localStorage.removeItem('foodconnect_user');
        localStorage.removeItem('foodconnect_profile');
      }
    } else {
      // Initialize default demo users
      const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');

      // Demo Hotel
      const demoHotelEmail = 'demohotel@foodconnect.app';
      if (!users[demoHotelEmail]) {
        const demoUid = '11111111-1111-1111-1111-111111111111';
        const demoUser: User = {
          id: demoUid,
          name: 'Demo Hotel',
          email: demoHotelEmail,
          role: 'hotel',
          hotelName: 'Demo Hotel',
        };
        const demoProfile: Hotel = {
          id: demoUid,
          hotelName: 'Demo Hotel',
          address: '123 Demo St, City',
          managerNumber: '+1234567890',
          licenseNumber: 'DEMO-123',
          createdAt: new Date().toISOString()
        };
        users[demoHotelEmail] = { password: 'password', user: demoUser, profile: demoProfile };
      }

      // Demo Volunteer
      const demoVolEmail = 'demovolunteer@foodconnect.app';
      if (!users[demoVolEmail]) {
        const demoUid = '22222222-2222-2222-2222-222222222222';
        const demoUser: User = {
          id: demoUid,
          name: 'Demo Volunteer',
          email: demoVolEmail,
          role: 'volunteer',
          phone: '+91 98765 43210',
        };
        users[demoVolEmail] = { password: 'password', user: demoUser, profile: null };
      }

      localStorage.setItem('foodconnect_users_db', JSON.stringify(users));
    }
    setLoading(false);
  }, []);

  const register = async (role: UserRole, data: any, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');

    let email: string;
    let newUser: User;
    let profile: Hotel | null = null;

    if (role === 'hotel') {
      email = data.hotelName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@foodconnect.app';
      if (users[email]) {
        throw new Error('An account with this hotel name already exists.');
      }
      const uid = 'user-' + Date.now();
      newUser = {
        id: uid,
        name: data.hotelName,
        email,
        role: 'hotel',
        hotelName: data.hotelName,
      };
      profile = {
        id: uid,
        hotelName: data.hotelName,
        address: data.address || '',
        managerNumber: data.managerNumber || '',
        licenseNumber: data.licenseNumber || '',
        createdAt: new Date().toISOString()
      };
    } else {
      email = (data.name || 'volunteer').toLowerCase().replace(/[^a-z0-9]/g, '') + '-vol@foodconnect.app';
      if (users[email]) {
        email = email.replace('@', Date.now() + '@');
      }
      const uid = 'user-' + Date.now();
      newUser = {
        id: uid,
        name: data.name || 'Volunteer',
        email,
        role: 'volunteer',
        phone: data.phone || '',
        age: data.age,
        vehicle: data.vehicle,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
      };
    }

    users[email] = { password, user: newUser, profile };
    localStorage.setItem('foodconnect_users_db', JSON.stringify(users));

    localStorage.setItem('foodconnect_user', JSON.stringify(newUser));
    if (profile) localStorage.setItem('foodconnect_profile', JSON.stringify(profile));

    setUser(newUser);
    setHotelProfile(profile);
  };

  const login = async (role: UserRole, identifier: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');

    let userData: any = null;

    if (role === 'hotel') {
      // Try direct email lookup
      const email = identifier.toLowerCase().replace(/[^a-z0-9]/g, '') + '@foodconnect.app';
      userData = users[email];

      // Fallback: match by hotelName
      if (!userData) {
        const normalizedInput = identifier.toLowerCase().replace(/[^a-z0-9]/g, '');
        const foundEmail = Object.keys(users).find(key => {
          const u = users[key];
          if (u.user?.role !== 'hotel') return false;
          const storedName = (u.profile?.hotelName || u.user?.hotelName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return storedName === normalizedInput;
        });
        if (foundEmail) userData = users[foundEmail];
      }
    } else {
      // Volunteer: look up by phone or name
      const normalizedInput = identifier.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundEmail = Object.keys(users).find(key => {
        const u = users[key];
        if (u.user?.role !== 'volunteer') return false;
        const storedName = (u.user?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const storedPhone = (u.user?.phone || '').replace(/[^0-9]/g, '');
        return storedName === normalizedInput || storedPhone.includes(normalizedInput.replace(/[^0-9]/g, ''));
      });
      if (foundEmail) userData = users[foundEmail];
    }

    if (!userData || userData.password !== password) {
      throw new Error(role === 'hotel' ? 'Invalid hotel name or password.' : 'Invalid credentials.');
    }

    const { user: foundUser, profile } = userData;

    localStorage.setItem('foodconnect_user', JSON.stringify(foundUser));
    if (profile) localStorage.setItem('foodconnect_profile', JSON.stringify(profile));

    setUser(foundUser);
    setHotelProfile(profile || null);
  };

  const logout = async () => {
    localStorage.removeItem('foodconnect_user');
    localStorage.removeItem('foodconnect_profile');
    setUser(null);
    setHotelProfile(null);
    try { await auth.signOut(); } catch { /* ignore */ }
  };

  // ── Firebase Phone Auth ──

  const sendPhoneOtp = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      // Clean up previous verifier
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => { /* reCAPTCHA solved */ },
      });
      recaptchaVerifierRef.current = verifier;

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      confirmationResultRef.current = confirmation;
    } catch (err: any) {
      // Clean up on error
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }
      throw new Error(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const verifyPhoneOtp = async (otp: string, role: UserRole, extraData?: any) => {
    if (!confirmationResultRef.current) {
      throw new Error('No OTP was sent. Please request a new one.');
    }

    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const firebaseUser = result.user;
      const phoneNum = firebaseUser.phoneNumber || '';

      // Check if user already exists in our local DB
      const users = JSON.parse(localStorage.getItem('foodconnect_users_db') || '{}');
      const existingEmail = Object.keys(users).find(key => {
        const u = users[key];
        return u.user?.phone === phoneNum || u.user?.id === firebaseUser.uid;
      });

      if (existingEmail) {
        // Existing user — log them in
        const { user: foundUser, profile } = users[existingEmail];
        localStorage.setItem('foodconnect_user', JSON.stringify(foundUser));
        if (profile) localStorage.setItem('foodconnect_profile', JSON.stringify(profile));
        setUser(foundUser);
        setHotelProfile(profile || null);
      } else {
        // New user — create profile
        const uid = firebaseUser.uid;
        const displayName = extraData?.name || firebaseUser.displayName || 'User';
        const email = `${uid}@phone.foodconnect.app`;
        let newUser: User;
        let profile: Hotel | null = null;

        if (role === 'hotel') {
          newUser = {
            id: uid,
            name: extraData?.hotelName || displayName,
            email,
            role: 'hotel',
            hotelName: extraData?.hotelName || displayName,
            phone: phoneNum,
          };
          profile = {
            id: uid,
            hotelName: extraData?.hotelName || displayName,
            address: extraData?.address || '',
            managerNumber: phoneNum,
            licenseNumber: extraData?.licenseNumber || '',
            createdAt: new Date().toISOString(),
          };
        } else {
          newUser = {
            id: uid,
            name: displayName,
            email,
            role: 'volunteer',
            phone: phoneNum,
            age: extraData?.age,
            vehicle: extraData?.vehicle,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
          };
        }

        users[email] = { password: '', user: newUser, profile };
        localStorage.setItem('foodconnect_users_db', JSON.stringify(users));
        localStorage.setItem('foodconnect_user', JSON.stringify(newUser));
        if (profile) localStorage.setItem('foodconnect_profile', JSON.stringify(profile));
        setUser(newUser);
        setHotelProfile(profile);
      }

      confirmationResultRef.current = null;
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please check and try again.');
      }
      throw new Error(err.message || 'Verification failed.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, hotelProfile, loading, register, login, logout, sendPhoneOtp, verifyPhoneOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
