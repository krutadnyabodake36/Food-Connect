import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Hotel, UserRole } from '../types';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';
import supabase from '../lib/supabase';

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

// Helper to normalize strings for emails
const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
const getHotelEmail = (name: string) => `${normalizeString(name)}@hotel.foodconnect.com`;
const getVolEmail = (name: string) => `${normalizeString(name)}@vol.foodconnect.com`;
const getPhoneEmail = (phone: string) => `${normalizeString(phone)}@phone.foodconnect.com`;
// Secure constant password for phone-login users in this demo app
const PHONE_AUTH_PASSWORD = 'FoodConnectPhoneLogin2024!';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hotelProfile, setHotelProfile] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSetProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAndSetProfile(session.user);
      } else {
        setUser(null);
        setHotelProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error) throw error;
      
      const role = data.role as UserRole;
      const appUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role,
        phone: data.phone,
        avatar: data.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
      };

      if (role === 'hotel') {
        appUser.hotelName = data.hotel_name;
        appUser.managerNumber = data.manager_number;
        appUser.licenseNumber = data.license_number;
        
        const profile: Hotel = {
          id: data.id,
          hotelName: data.hotel_name,
          address: data.address,
          managerNumber: data.manager_number,
          licenseNumber: data.license_number,
          createdAt: data.created_at,
        };
        setHotelProfile(profile);
      } else {
        appUser.age = data.age;
        appUser.vehicle = data.vehicle;
        appUser.ngoName = data.ngo_name;
        appUser.ngoNumber = data.ngo_number;
        appUser.contactPerson = data.contact_person;
      }
      
      setUser(appUser);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
      setHotelProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (role: UserRole, data: any, password: string) => {
    let email: string;
    if (role === 'hotel') {
      email = getHotelEmail(data.hotelName);
    } else {
      email = getVolEmail(data.name || 'volunteer');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name: role === 'hotel' ? data.hotelName : data.name || 'Volunteer',
          phone: data.phone || data.managerNumber || '',
          hotelName: data.hotelName, // Note: trigger mapping expects hotel_name to be hotelName in metadata
          address: data.address,
          managerNumber: data.managerNumber, // Trigger expects managerNumber
          licenseNumber: data.licenseNumber, // Trigger expects licenseNumber
          age: data.age,
          vehicle: data.vehicle,
        }
      }
    });

    if (error) throw error;
    
    // Auto-login because Supabase might not return a session instantly if Email Confirmations are on,
    // but our Postgres trigger auto-confirms the email!
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) throw signInError;
    // The onAuthStateChange will handle fetching the profile
  };

  const login = async (role: UserRole, identifier: string, password: string) => {
    // User might input email directly, otherwise we construct it
    let email = identifier;
    if (!identifier.includes('@')) {
      email = role === 'hotel' ? getHotelEmail(identifier) : getVolEmail(identifier);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    try { await auth.signOut(); } catch { /* ignore firebase error */ }
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error', error);
  };

  // ── Firebase Phone Auth ──

  const sendPhoneOtp = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
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
      const email = getPhoneEmail(phoneNum);

      // Check if user exists in Supabase by attempting to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: PHONE_AUTH_PASSWORD,
      });

      if (signInError) {
        // User likely does not exist, so register them
        const displayName = extraData?.name || firebaseUser.displayName || 'User';
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: PHONE_AUTH_PASSWORD,
          options: {
            data: {
              role,
              name: role === 'hotel' ? extraData?.hotelName || displayName : displayName,
              phone: phoneNum,
              hotelName: extraData?.hotelName,
              address: extraData?.address,
              managerNumber: phoneNum,
              licenseNumber: extraData?.licenseNumber,
              age: extraData?.age,
              vehicle: extraData?.vehicle,
            }
          }
        });

        if (signUpError) {
          throw new Error('Failed to create account: ' + signUpError.message);
        }
      }
      
      confirmationResultRef.current = null;
    } catch (err: any) {
      // Don't leak exact Supabase auth errors if Firebase succeeds but Supabase fails
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
