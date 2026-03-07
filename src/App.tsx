import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HotelApp from './layouts/HotelApp';
import VolunteerApp from './layouts/VolunteerApp';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-forest-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      
      {/* Authenticated routes */}
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : user.role === 'hotel' ? (
            <HotelApp />
          ) : (
            <VolunteerApp />
          )
        }
      />
    </Routes>
  );
};

export default App;
