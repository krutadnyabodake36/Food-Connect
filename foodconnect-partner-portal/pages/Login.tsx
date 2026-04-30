import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Loader2, Building2, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [hotelName, setHotelName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!hotelName.trim() || !password) {
      setError('Please enter both hotel name and password.');
      return;
    }

    setLoading(true);
    try {
      // The backend supports logging in with the Hotel Name directly as the identifier
      await login(hotelName.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-forest-900">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80" 
            alt="Community Food Sharing" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/40 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-xl font-serif font-bold tracking-wide">FoodConnect</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              Turn Surplus into <span className="text-forest-300">Sustenance</span>
            </h1>
            <p className="text-lg text-stone-200 leading-relaxed">
              Join our network of conscious partners bridging the gap between abundance and need. Your contribution makes a difference.
            </p>
          </motion.div>
          
          <div className="text-sm text-stone-400">
            © 2024 FoodConnect Partner Portal
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white dark:bg-stone-950">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-forest-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Leaf size={24} />
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Please enter your details to access your dashboard.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="hotelName" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Hotel Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-stone-400 group-focus-within:text-forest-500 transition-colors" />
                  </div>
                  <input
                    id="hotelName"
                    name="hotelName"
                    type="text"
                    required
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all duration-200 shadow-sm"
                    placeholder="e.g. Grand Plaza Hotel"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-forest-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all duration-200 shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-stone-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-600 dark:text-stone-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-forest-600 hover:text-forest-500 dark:text-forest-400">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await login('Grand Plaza Hotel', 'password123');
                  navigate('/dashboard');
                } catch (err) {
                  setError('Demo login failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-amber-500 rounded-xl shadow-md text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:-translate-y-0.5 mt-3"
            >
              🧭 Demo Login (Hotel)
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Don't have an account?{' '}
                <a 
                  href="/register" 
                  className="font-semibold text-forest-600 hover:text-forest-500 dark:text-forest-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/register');
                  }}
                >
                  Register now
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
