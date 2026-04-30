import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import HotelApp from './layouts/HotelApp';
import VolunteerApp from './layouts/VolunteerApp';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while session is being restored
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12 mb-4" />
        <p className="text-stone-500 font-medium animate-pulse">Restoring your session...</p>
      </div>
    );
  }

  // Debug log for routing state
  console.log(`[Router] Path: ${location.pathname}, Auth: ${!!user}, Role: ${user?.role || 'none'}`);

  return (
    <Routes>
      {/* Public Pages: Redirect to app if already logged in */}
      <Route 
        path="/" 
        element={!user ? <LandingPage /> : <Navigate to="/app" replace />} 
      />
      
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/app" replace />} 
      />
      
      {/* Protected App Space */}
      <Route
        path="/app/*"
        element={
          !user ? (
            <Navigate to="/login" state={{ from: location }} replace />
          ) : user.role === 'hotel' ? (
            <HotelApp />
          ) : user.role === 'volunteer' ? (
            <VolunteerApp />
          ) : (
            // Fallback for unexpected roles
            <Navigate to="/login" replace />
          )
        }
      />
      
      {/* Fallback Catch-all */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/app" : "/"} replace />} 
      />
    </Routes>
  );
};

export default App;

