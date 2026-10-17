import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  sendPasswordReset, 
  updateCustomerProfile,
  CustomerProfileData 
} from '../services/authService';
import { getAuthErrorMessage } from '../auth/authErrors';
import { validateEmail, validateIndianPhone } from '../utils/validators';
import { useBranding } from '../hooks/useBranding';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://parava-backend-1.onrender.com');

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CustomerProfileData) => void;
  onShowNotification?: (msg: string) => void;
  initialTab?: 'signin' | 'signup' | 'forgot';
  contextTitle?: string;
  contextSubtitle?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onShowNotification,
  initialTab = 'signin',
  contextTitle,
  contextSubtitle
}: AuthModalProps) {
  const { logoUrl: brandingLogoUrl, logoAltText: brandingAltText } = useBranding();
  const sanitizeTab = (t: any): 'signin' | 'signup' | 'forgot' => {
    if (t === 'signup') return 'signup';
    if (t === 'forgot') return 'forgot';
    return 'signin';
  };

  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot' | 'complete_profile' | 'verify_otp'>(() => sanitizeTab(initialTab));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Kolhapur');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [temporaryProfile, setTemporaryProfile] = useState<CustomerProfileData | null>(null);

  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [validatedCredentials, setValidatedCredentials] = useState<{ email: string; phone: string; name: string } | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  useEffect(() => {
    if (isOpen) {
      setTab(sanitizeTab(initialTab));
      setError(null);
      setResetSent(false);
      setShowPassword(false);
      // Auto-focus email input after modal opens
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTab]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { profile, isNewUser } = await signInWithGoogle();
      
      // If it's a new user and phone is missing, optionally prompt profile completion
      if (isNewUser && !profile.phone) {
        setTemporaryProfile(profile);
        setPhone('');
        setCity(profile.city || 'Kolhapur');
        setTab('complete_profile');
        setLoading(false);
        return;
      }

      onSuccess(profile);
      if (onShowNotification) {
        onShowNotification(`Welcome, ${profile.name || 'valued customer'}!`);
      }
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await signInWithEmail(trimmedEmail, password);
      onSuccess(profile);
      if (onShowNotification) {
        onShowNotification(`Welcome back, ${profile.name || 'valued customer'}!`);
      }
      onClose();
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    // Strict Email Validation
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    // Strict Indian Phone Validation
    const phoneValidation = validateIndianPhone(trimmedPhone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password) {
      setError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setOtpNotice(null);

    try {
      // 1. Dispatch authoritative verification OTP
      const res = await fetch(`${BACKEND_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValidation.cleanedValue,
          phone: phoneValidation.cleanedValue,
          name: trimmedName,
          purpose: 'Customer Registration'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification OTP. Please try again.');
      }

      setValidatedCredentials({
        email: emailValidation.cleanedValue!,
        phone: phoneValidation.cleanedValue!,
        name: trimmedName
      });
      setOtp('');
      setOtpTimer(60);
      setOtpNotice(data.message || `Verification OTP sent to ${emailValidation.cleanedValue}.`);
      setTab('verify_otp');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Could not send verification OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validatedCredentials) return;

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Authoritative OTP verification
      const verifyRes = await fetch(`${BACKEND_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validatedCredentials.email,
          phone: validatedCredentials.phone,
          otp: cleanOtp
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Invalid OTP. Please check the code and try again.');
      }

      // 2. Create authoritative Firebase account after successful OTP verification
      const profile = await signUpWithEmail(validatedCredentials.email, password, {
        name: validatedCredentials.name,
        phone: validatedCredentials.phone,
        city: city.trim() || 'Kolhapur',
        address: address.trim()
      });

      onSuccess(profile);
      if (onShowNotification) {
        onShowNotification(`🎉 Welcome to Parva, ${profile.name}! Account verified and created successfully.`);
      }
      onClose();
    } catch (err: any) {
      console.error('OTP Verification / Signup error:', err);
      setError(err.message || getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || otpTimer > 0 || !validatedCredentials) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validatedCredentials.email,
          phone: validatedCredentials.phone,
          name: validatedCredentials.name,
          purpose: 'Customer Registration'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not resend OTP.');
      }
      setOtpTimer(60);
      setOtpNotice(`New verification code sent to ${validatedCredentials.email}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temporaryProfile || loading) return;

    setLoading(true);
    setError(null);
    try {
      const updatedFields = {
        phone: phone.trim(),
        city: city.trim() || 'Kolhapur',
        address: address.trim()
      };
      await updateCustomerProfile(temporaryProfile.uid, updatedFields);
      const mergedProfile = { ...temporaryProfile, ...updatedFields };
      onSuccess(mergedProfile);
      if (onShowNotification) {
        onShowNotification(`Welcome to Parva, ${mergedProfile.name}!`);
      }
      onClose();
    } catch (err: any) {
      console.error('Profile completion error:', err);
      // Fallback: continue with temporary profile
      onSuccess(temporaryProfile);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(trimmedEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      style={{ zIndex: 99999, position: 'fixed' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-gray-100 relative my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ width: 'min(100% - 24px, 460px)', maxHeight: 'calc(100vh - 32px)', opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition z-30 cursor-pointer disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-7 md:p-8 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <img 
                src={brandingLogoUrl || "/parva-logo.png"} 
                alt={brandingAltText || "Parva"} 
                className="h-8 sm:h-9 w-auto object-contain" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/parva-logo.png'; }}
              />
              <h2 id="auth-modal-title" className="font-black text-gray-900 text-xl sm:text-2xl tracking-tight">
                {contextTitle || (
                  tab === 'signin' 
                    ? 'Welcome back' 
                    : tab === 'signup' 
                    ? 'Create account' 
                    : tab === 'verify_otp'
                    ? 'Verify your account'
                    : tab === 'complete_profile'
                    ? 'Complete your profile'
                    : 'Reset password'
                )}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed">
              {contextSubtitle || (
                tab === 'signin'
                  ? 'Sign in to access your bookings, saved events, and vendor messages.'
                  : tab === 'signup'
                  ? 'Join Parva to book verified event vendors with instant confirmation.'
                  : tab === 'verify_otp'
                  ? `Enter the 6-digit code sent to ${validatedCredentials?.email || 'your email'} to activate your account.`
                  : tab === 'complete_profile'
                  ? 'Add your contact details to complete your event bookings smoothly.'
                  : 'Enter your account email to receive secure password reset instructions.'
              )}
            </p>
          </div>

          {/* Tab Switcher: Sign In / Create Account */}
          {(tab === 'signin' || tab === 'signup') && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setTab('signin'); setError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs sm:text-sm font-medium border border-rose-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-snug flex-1">{error}</span>
            </div>
          )}

          {/* OTP Notice Banner */}
          {otpNotice && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-snug flex-1">{otpNotice}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN BUTTON (Available on Sign In & Sign Up tabs) */}
          {(tab === 'signin' || tab === 'signup') && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 transition shadow-2xs active:scale-[0.99] text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-rose-600" />
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* 1. SIGN IN FORM */}
            {tab === 'signin' && (
              <motion.form
                key="signin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleEmailSignIn}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(null); }}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setTab('signup'); setError(null); }}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* 2. SIGN UP FORM */}
            {tab === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleEmailSignUp}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Create Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Mobile (10 Digits) *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-2 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">City</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Kolhapur"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={loading}
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-2 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                  <span>A secure 6-digit OTP will be sent to your email to verify and activate your registration.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>{loading ? 'Sending verification OTP...' : 'Verify with OTP & Register'}</span>
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setError(null); }}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* 2.1 OTP VERIFICATION STEP */}
            {tab === 'verify_otp' && (
              <motion.form
                key="verify_otp"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleVerifyOtpAndSignUp}
                className="space-y-4"
              >
                <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center space-y-1">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <KeyRound size={20} />
                  </div>
                  <h4 className="text-sm font-black text-gray-900">Enter Verification Code</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We sent a 6-digit code to <b className="text-gray-900 font-semibold">{validatedCredentials?.email}</b>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-center uppercase tracking-wider">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    autoFocus
                    className="w-full h-14 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center text-2xl font-black font-mono tracking-[10px] text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                  />
                  <p className="text-[11px] text-gray-400 text-center">
                    Check your email inbox or spam folder for the one-time password
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Complete Registration'}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => { setTab('signup'); setError(null); }}
                    className="font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Edit details</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || otpTimer > 0}
                    onClick={handleResendOtp}
                    className="font-bold text-rose-600 hover:underline disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend OTP Code'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* 3. GOOGLE FIRST-TIME PROFILE COMPLETION */}
            {tab === 'complete_profile' && (
              <motion.form
                key="complete_profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleCompleteGoogleProfile}
                className="space-y-3.5"
              >
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                  {temporaryProfile?.photoURL ? (
                    <img 
                      src={temporaryProfile.photoURL} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center">
                      {temporaryProfile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-900 truncate">{temporaryProfile?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{temporaryProfile?.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Mobile / WhatsApp Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">City / Region</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kolhapur, Pune, Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (temporaryProfile) onSuccess(temporaryProfile);
                      onClose();
                    }}
                    disabled={loading}
                    className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    <span>Save & Continue</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* 4. FORGOT PASSWORD FORM */}
            {tab === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {resetSent ? (
                  <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-200 text-center space-y-2.5">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
                    <h4 className="font-bold text-sm">Reset link sent</h4>
                    <p className="text-xs text-emerald-700">
                      We sent instructions to <strong>{email}</strong>. Check your inbox to update your password.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setResetSent(false); }}
                      className="mt-2 w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Account Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 text-xs sm:text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setError(null); }}
                      className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer pt-1 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Sign In</span>
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer note */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Secure Firebase Auth</span>
            <a
              href="https://parva-vendor-app.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 font-semibold hover:underline"
            >
              Vendor Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
