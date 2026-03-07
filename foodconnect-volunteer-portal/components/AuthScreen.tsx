import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Leaf, Building2, Eye, EyeOff, CheckCircle2, Phone, Hash, Calendar, Car, MapPin } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'volunteer' | 'ngo'>('ngo'); // Default to NGO to match "Hotel Name" screenshot
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Common Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Volunteer Specific State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [vehicle, setVehicle] = useState('');
  
  // NGO Specific State
  const [ngoName, setNgoName] = useState('');
  const [ngoNumber, setNgoNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // OTP Verification State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verified'>('idle');

  const handleSendOtp = () => {
    if (phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpStep('sent');
      alert("Your OTP is 1234");
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp === '1234') {
      setOtpStep('verified');
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && otpStep !== 'verified' && role === 'volunteer') {
      alert("Please verify your phone number first.");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const mockUser: UserType = {
        id: '123',
        name: role === 'volunteer' ? name : ngoName || 'Grand Plaza Hotel',
        email: isLogin ? 'user@example.com' : email,
        role: role,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
        phone: phone,
        address: address,
        age: role === 'volunteer' ? parseInt(age) : undefined,
        vehicle: role === 'volunteer' ? vehicle : undefined,
        ngoName: role === 'ngo' ? ngoName : undefined,
        ngoNumber: role === 'ngo' ? ngoNumber : undefined,
        contactPerson: role === 'ngo' ? contactPerson : undefined,
      };
      
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px]">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-700/20 rotate-3 hover:rotate-6 transition-transform duration-300">
            <Leaf className="w-7 h-7 text-white fill-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-slate-500 text-[15px]">
            {isLogin 
              ? 'Please enter your details to access your dashboard.' 
              : 'Create an account to start making a difference.'}
          </p>
        </div>

        {/* Role Switcher (Subtle) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setRole('ngo')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'ngo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Partner / Hotel
            </button>
            <button
              onClick={() => setRole('volunteer')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'volunteer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Volunteer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                {/* Registration Fields */}
                {role === 'volunteer' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Alex Johnson"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    {/* Add other volunteer fields as needed, keeping it simple for now */}
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Organization Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Hope Foundation"
                          value={ngoName}
                          onChange={(e) => setNgoName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900">
              {role === 'ngo' ? 'Hotel Name' : 'Phone Number'}
            </label>
            <div className="relative group">
              {role === 'ngo' ? (
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              ) : (
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              )}
              <input 
                type="text"
                placeholder={role === 'ngo' ? "e.g. Grand Plaza Hotel" : "+91 98765 43210"}
                value={role === 'ngo' ? ngoName : phone}
                onChange={(e) => role === 'ngo' ? setNgoName(e.target.value) : setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium tracking-widest"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 group-hover:border-emerald-500'}`}>
                {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span className="text-sm text-slate-600 font-medium">Remember me</span>
            </label>
            
            <button type="button" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl py-3.5 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign in' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-700 font-bold hover:underline transition-all"
            >
              {isLogin ? 'Register now' : 'Sign in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;
