import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './src/contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthenticatedApp from './src/AuthenticatedApp';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="animate-spin text-forest-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={user ? <AuthenticatedApp /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default App;