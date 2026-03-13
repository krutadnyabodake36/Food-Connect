import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Leaf, Building2, Eye, EyeOff, CheckCircle2, Phone, Hash, Calendar, Car, MapPin, Smartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('hotel');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'credentials' | 'phone'>('credentials');

  // Phone OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const { login, register, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  // Common Form State
  const [password, setPassword] = useState('');
  
  // Hotel-specific
  const [hotelName, setHotelName] = useState('');
  const [address, setAddress] = useState('');
  const [managerNumber, setManagerNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Volunteer-specific
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [vehicle, setVehicle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const identifier = role === 'hotel' ? hotelName : (phone || name);
        await login(role, identifier, password);
      } else {
        if (role === 'hotel') {
          await register(role, { hotelName, address, managerNumber, licenseNumber }, password);
        } else {
          await register(role, { name, phone, age: age ? parseInt(age) : undefined, vehicle }, password);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    const phoneNumber = role === 'hotel' ? managerNumber : phone;
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +91...)');
      return;
    }
    setIsLoading(true);
    try {
      await sendPhoneOtp(phoneNumber, 'recaptcha-container');
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const extraData = role === 'hotel'
        ? { hotelName, address, licenseNumber }
        : { name, age: age ? parseInt(age) : undefined, vehicle };
      await verifyPhoneOtp(otp, role, extraData);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`login-otp-${index - 1}`)?.focus();
    }
  };

  const resetPhoneAuth = () => {
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 dark:bg-stone-950 flex font-sans relative overflow-hidden selection:bg-forest-500/30">
      {/* Left Side - Image & Branding (desktop only) */}
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
              Turn Surplus into <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest-300 to-emerald-200">Sustenance</span>
            </h1>
            <p className="text-lg text-stone-200 leading-relaxed">
              Join our network of conscious partners bridging the gap between abundance and need. Your contribution makes a difference.
            </p>
          </motion.div>
          
          <div className="text-sm text-stone-400">
            © 2024 FoodConnect
          </div>
        </div>
      </div>

      {/* Right Side - Login Form with Spatial Background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 animate-mesh-bg relative">
        <div className="absolute inset-0 bg-white/40 dark:bg-stone-950/40 backdrop-blur-[2px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-[440px] glass-panel p-8 sm:p-10 rounded-3xl relative z-10 shadow-2xl preserve-3d"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-700/20 rotate-3 hover:rotate-6 transition-transform duration-300">
              <Leaf className="w-7 h-7 text-white fill-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10" style={{ transform: "translateZ(20px)" }}>
            <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight animate-gradient-text">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>
            <p className="text-slate-500 text-[15px]">
              {isLogin 
                ? 'Please enter your details to access your dashboard.' 
                : 'Create an account to start making a difference.'}
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-stone-100/50 dark:bg-stone-800/50 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-stone-200/50 dark:border-stone-700/50">
              <button
                onClick={() => { setRole('hotel'); resetPhoneAuth(); }}
                className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  role === 'hotel' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-md transform scale-105' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                }`}
              >
                🏨 Hotel / Partner
              </button>
              <button
                onClick={() => { setRole('volunteer'); resetPhoneAuth(); }}
                className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  role === 'volunteer' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-md transform scale-105' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                }`}
              >
                🤝 Volunteer
              </button>
            </div>
          </div>

          {/* Auth Method Switcher */}
          {isLogin && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-slate-100/70 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => { setAuthMethod('credentials'); resetPhoneAuth(); }}
                  className={`px-4 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    authMethod === 'credentials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Lock size={13} /> Password
                </button>
                <button
                  onClick={() => { setAuthMethod('phone'); resetPhoneAuth(); }}
                  className={`px-4 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Smartphone size={13} /> Phone OTP
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          {/* ── Phone OTP Flow ── */}
          {isLogin && authMethod === 'phone' ? (
            <div className="space-y-5">
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                      <input 
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={role === 'hotel' ? managerNumber : phone}
                        onChange={(e) => role === 'hotel' ? setManagerNumber(e.target.value) : setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Include country code (e.g. +91 for India)</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl py-3.5 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Smartphone size={18} /> Send OTP
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <ShieldCheck size={24} className="text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-800">OTP sent to your phone!</p>
                    <p className="text-xs text-emerald-600 mt-1">Enter the 6-digit code below</p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        id={`login-otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-slate-50 text-slate-900 border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otpDigits.some(d => !d)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-xl py-3.5 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Verify & Sign In
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetPhoneAuth}
                    className="w-full text-sm text-slate-500 hover:text-emerald-700 font-medium transition-colors"
                  >
                    ← Change phone number
                  </button>
                </>
              )}

              {/* reCAPTCHA container (invisible) */}
              <div id="recaptcha-container"></div>
            </div>
          ) : (
            /* ── Credentials Flow ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    {role === 'hotel' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Hotel Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="e.g. 123 Main St, Mumbai"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Manager Phone</label>
                            <input
                              type="text"
                              placeholder="+91 98765..."
                              value={managerNumber}
                              onChange={(e) => setManagerNumber(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">License No.</label>
                            <input
                              type="text"
                              placeholder="FSSAI-123"
                              value={licenseNumber}
                              onChange={(e) => setLicenseNumber(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Age</label>
                            <input
                              type="number"
                              placeholder="25"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Vehicle</label>
                            <input
                              type="text"
                              placeholder="Bike, Car..."
                              value={vehicle}
                              onChange={(e) => setVehicle(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm"
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
                  {role === 'hotel' ? 'Hotel Name' : 'Phone Number'}
                </label>
                <div className="relative group">
                  {role === 'hotel' ? (
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  ) : (
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  )}
                  <input 
                    type="text"
                    placeholder={role === 'hotel' ? "e.g. Grand Plaza Hotel" : "+91 98765 43210"}
                    value={role === 'hotel' ? hotelName : phone}
                    onChange={(e) => role === 'hotel' ? setHotelName(e.target.value) : setPhone(e.target.value)}
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

              {/* reCAPTCHA container for credentials flow (if needed) */}
              <div id="recaptcha-container"></div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); setAuthMethod('credentials'); resetPhoneAuth(); }}
                className="text-emerald-700 font-bold hover:underline transition-all"
              >
                {isLogin ? 'Register now' : 'Sign in'}
              </button>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
