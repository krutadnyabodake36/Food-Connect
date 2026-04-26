import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest, TOKEN_STORAGE_KEY } from '../lib/api';
import { Hotel, User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  hotelProfile: Hotel | null;
  loading: boolean;
  register: (role: UserRole, data: any, password: string) => Promise<void>;
  login: (role: UserRole, identifier: string, password: string) => Promise<void>;
  demoLogin: () => void;
  updateProfile: (data: any) => Promise<void>;
  logout: () => void;
}

type AuthResponse = {
  token?: string;
  user: User;
  hotelProfile?: Hotel;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'foodconnect_session';

/**
 * Hook to access authentication context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const buildHotelProfile = (user: User): Hotel => ({
  id: user.id,
  hotelName: user.hotelName || user.name,
  address: user.address || '',
  managerNumber: user.managerNumber || user.phone || '',
  licenseNumber: user.licenseNumber || '',
  createdAt: new Date().toISOString(),
});

/**
 * AuthProvider Component
 * 
 * Manages authentication state, session persistence, and user data.
 * 
 * Features:
 * - Automatic session restoration on app load
 * - JWT token storage and retrieval
 * - Login/Register/Logout functionality
 * - Hotel profile management
 * - Global unauthorized event handling
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hotelProfile, setHotelProfile] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  /**
   * Clears all session data (localStorage and state)
   * Does NOT redirect - that's handled by the router when user becomes null
   */
  const logout = useCallback(() => {
    console.log('[Auth] 🚪 Logging out user...');
    
    // Clear localStorage
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    
    // Clear state
    setUser(null);
    setHotelProfile(null);
    
    console.log('[Auth] ✅ Logout complete - user state cleared');
  }, []);

  /**
   * Persists authentication data to localStorage
   * Stores both session (user + profile) and token separately for redundancy
   */
  const persistSession = useCallback((payload: AuthResponse) => {
    try {
      // Get token from payload or existing storage (for profile updates)
      const existingRaw = localStorage.getItem(SESSION_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const finalToken = payload.token || existing.token || localStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (!finalToken) {
        console.warn('[Auth] ⚠️ No token available for persistence');
      }

      const sessionData: AuthResponse = {
        ...payload,
        token: finalToken || undefined,
      };

      // Store session (user + profile + token)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      // Store token separately for API requests
      if (finalToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, finalToken);
      }
      
      console.log('[Auth] 💾 Session persisted:', {
        email: payload.user.email,
        role: payload.user.role,
        hasToken: !!finalToken,
      });
    } catch (error) {
      console.error('[Auth] ❌ Failed to persist session:', error);
    }
  }, []);

  /**
   * Restores session from localStorage on component mount
   * This runs exactly ONCE when the app loads
   */
  useEffect(() => {
    // Guard against running multiple times
    if (initialized.current) return;
    initialized.current = true;

    const restoreSession = () => {
      console.log('[Auth] 🔄 Attempting to restore session from localStorage...');
      
      try {
        const sessionRaw = localStorage.getItem(SESSION_KEY);
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        // Both session data and token must exist for valid session
        if (!sessionRaw || !token) {
          console.log('[Auth] ℹ️ No stored session found (fresh start or logged out)');
          setUser(null);
          setHotelProfile(null);
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionRaw) as AuthResponse;

        // Validate session has required fields
        if (!session.user || !session.user.id || !session.user.email) {
          throw new Error('Invalid session data - missing required fields');
        }

        // Successfully restored
        console.log('[Auth] ✅ Session restored:', {
          email: session.user.email,
          role: session.user.role,
          tokenLength: token.length,
        });

        setUser(session.user);
        setHotelProfile(
          session.hotelProfile || 
          (session.user.role === 'hotel' ? buildHotelProfile(session.user) : null)
        );
      } catch (error) {
        console.error('[Auth] ❌ Session restoration failed:', error);
        // Clear corrupted session data
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setHotelProfile(null);
      } finally {
        // CRITICAL: Set loading to false so router can proceed
        setLoading(false);
      }
    };

    restoreSession();

    // Global handler for 401 Unauthorized responses (from apiRequest)
    const handleUnauthorized = () => {
      console.warn('[Auth] 📢 Received unauthorized event - clearing session');
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  /**
   * Updates React state and localStorage with new authentication data
   * Called after successful login, register, or profile updates
   */
  const updateAuthState = useCallback((payload: AuthResponse) => {
    console.log('[Auth] 🆙 Updating authentication state');
    
    // Build hotel profile if user is a hotel and profile not provided
    const finalProfile = 
      payload.hotelProfile || 
      (payload.user.role === 'hotel' ? buildHotelProfile(payload.user) : null);
    
    // Update React state
    setUser(payload.user);
    setHotelProfile(finalProfile);
    
    // Persist to localStorage (with token)
    persistSession({ ...payload, hotelProfile: finalProfile || undefined });
  }, [persistSession]);

  /**
   * Login with credentials
   * @param role - 'hotel' or 'volunteer'
   * @param identifier - hotel name or phone number
   * @param password - user password
   */
  const login = async (role: UserRole, identifier: string, password: string) => {
    console.log(`[Auth] 🔑 Attempting login as ${role}: ${identifier}`);
    
    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role, identifier, password }),
      });

      if (!response.user) {
        throw new Error('Server returned invalid response - missing user data');
      }

      // Update state and storage
      updateAuthState(response);
      console.log('[Auth] ✅ Login successful:', response.user.email);
    } catch (error) {
      console.error('[Auth] ❌ Login failed:', error);
      throw error; // Re-throw so UI can handle error display
    }
  };

  /**
   * Register a new user account
   * @param role - 'hotel' or 'volunteer'
   * @param data - user profile data (different fields based on role)
   * @param password - new password
   */
  const register = async (role: UserRole, data: any, password: string) => {
    console.log(`[Auth] 📝 Attempting registration as ${role}`);
    
    try {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          role,
          password,
          data: {
            name: data.name || data.hotelName || 'User',
            hotelName: data.hotelName,
            address: data.address,
            managerNumber: data.managerNumber,
            licenseNumber: data.licenseNumber,
            phone: data.phone,
            age: data.age,
            vehicle: data.vehicle,
            ngoName: data.ngoName,
            ngoNumber: data.ngoNumber,
            contactPerson: data.contactPerson,
            email: data.email,
          },
        }),
      });

      if (!response.user) {
        throw new Error('Server returned invalid response - missing user data');
      }

      updateAuthState(response);
      console.log('[Auth] ✅ Registration successful');
    } catch (error) {
      console.error('[Auth] ❌ Registration failed:', error);
      throw error;
    }
  };

  /**
   * Demo Login - Bypass real authentication with a demo user
   * Used only for testing/development purposes
   * @param role - 'hotel' or 'volunteer' to determine which demo user to load
   */
  const demoLogin = useCallback((role: UserRole = 'hotel') => {
    console.log(`[Auth] 🎭 Demo login initiated for role: ${role}`);
    
    try {
      let demoUser: User;
      
      if (role === 'hotel') {
        demoUser = {
          id: 'demo-hotel-001',
          email: 'demo@hotelparadise.com',
          name: 'Hotel Paradise',
          role: 'hotel',
          hotelName: 'Hotel Paradise',
          address: '123 Premium St, Mumbai',
          phone: '+91 98765 43210',
          managerNumber: '+91 98765 43210',
          licenseNumber: 'FSSAI-2024-001',
        };
      } else {
        demoUser = {
          id: 'demo-volunteer-001',
          email: 'demo@volunteer.com',
          name: 'Alex Johnson',
          role: 'volunteer',
          phone: '+91 98765 12345',
          address: 'Mumbai, India',
          age: 28,
          vehicle: 'Motorcycle',
        };
      }

      const demoToken = `demo_token_${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      updateAuthState({
        token: demoToken,
        user: demoUser,
        hotelProfile: demoUser.role === 'hotel' ? buildHotelProfile(demoUser) : undefined,
      });

      console.log(`[Auth] ✅ Demo login successful - user logged in as ${demoUser.name}`);
    } catch (error) {
      console.error('[Auth] ❌ Demo login failed:', error);
      throw error;
    }
  }, [updateAuthState]);

  /**
   * Update user profile data
   * Called when user modifies their profile information
   */
  const updateProfile = async (data: any) => {
    if (!user) {
      throw new Error('Cannot update profile - not logged in');
    }

    console.log('[Auth] 🔄 Updating user profile...');
    
    try {
      const response = await apiRequest<AuthResponse>(`/users/${user.id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      });

      if (!response.user) {
        throw new Error('Server returned invalid response');
      }

      // Note: Server may not return token on profile update, merge with existing token
      updateAuthState(response);
      console.log('[Auth] ✅ Profile updated');
    } catch (error) {
      console.error('[Auth] ❌ Profile update failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        hotelProfile, 
        loading, 
        register, 
        login, 
        demoLogin,
        updateProfile, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

