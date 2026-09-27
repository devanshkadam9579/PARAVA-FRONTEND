import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, MapPin, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { getAuthInstance, getDb } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onShowNotification?: (msg: string) => void;
  initialTab?: 'signin' | 'signup';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onShowNotification,
  initialTab = 'signin'
}: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kolhapur');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError(null);
      setResetSent(false);
      setSignupStep(1);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const auth = getAuthInstance();
  const db = getDb();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existing = userSnap.exists() ? userSnap.data() : {};
      
      const userData = {
        uid: user.uid,
        name: user.displayName || existing.name || 'Parva Client',
        email: user.email || existing.email || '',
        phone: user.phoneNumber || existing.phone || '',
        role: existing.role || 'customer',
        city: existing.city || 'Kolhapur',
        address: existing.address || '',
        photoURL: user.photoURL || existing.photoURL || '',
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, userData, { merge: true });

      onSuccess(userData);
      if (onShowNotification) onShowNotification(`🎉 Welcome, ${userData.name}!`);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists()
        ? userSnap.data()
        : { uid: user.uid, email: user.email, name: user.email?.split('@')[0] || 'User', role: 'customer' };

      onSuccess(userData);
      if (onShowNotification) onShowNotification('✨ Welcome back to MyParva!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const userData = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '',
        address: address.trim() || '',
        city: city || 'Kolhapur',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      onSuccess(userData);
      if (onShowNotification) onShowNotification('🎉 Account created successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      if (onShowNotification) onShowNotification('Password reset link sent to your email!');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (tab === 'signup' && signupStep === 1) {
      if (!name || !email || !password) {
        setError('Please fill in name, email, and password first.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setError(null);
      setSignupStep(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden border border-gray-100 relative my-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition z-20 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-10 space-y-6">
          {/* Header Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-black text-xl shadow-xs">
              P
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-2xl font-sans tracking-tight">
                {tab === 'signin' ? 'Welcome Back' : tab === 'signup' ? 'Create Account' : 'Reset Password'}
              </h3>
              <p className="text-sm text-gray-500 font-normal">
                {tab === 'signin' 
                  ? 'Sign in to confirm your booking and connect with vendors'
                  : tab === 'signup'
                  ? 'Join Parva Celebrations to plan and lock verified services'
                  : 'Enter your email to receive recovery instructions'}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Sign In / Sign Up */}
          {tab !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl">
              <button
                type="button"
                onClick={() => { setTab('signin'); setError(null); }}
                className={`py-3 text-sm font-black rounded-xl transition cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setSignupStep(1); setError(null); }}
                className={`py-3 text-sm font-black rounded-xl transition cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-sm font-bold border border-rose-200 flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span className="leading-snug flex-1">{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* 1. SIGN IN TAB */}
            {tab === 'signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 pt-1"
              >
                {/* 1-Click Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 transition shadow-xs active:scale-98 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">or sign in with email</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">Password</label>
                      <button
                        type="button"
                        onClick={() => { setTab('forgot'); setError(null); }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Signing in...' : 'Sign In to Account'}
                  </button>
                </form>

                {/* Redirect / Switcher to Sign Up */}
                <div className="pt-3 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setTab('signup'); setSignupStep(1); setError(null); }}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Sign Up & Register
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. SIGN UP TAB */}
            {tab === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 pt-1"
              >
                {/* 1-Click Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 transition shadow-xs active:scale-98 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Quick Sign-Up with Google</span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">or enter details</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={signupStep === 1 ? (e) => { e.preventDefault(); goToNextStep(); } : handleEmailSignUp} className="space-y-4">
                  {signupStep === 1 ? (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">Full Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            required
                            placeholder="yourname@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">Create Password</label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            required
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-black text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-lg transition active:scale-98 flex justify-center items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Profile Setup</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">Mobile / WhatsApp Number</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            placeholder="e.g. 9823456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">City / Region</label>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="e.g. Kolhapur, Pune, Mumbai"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setSignupStep(1)}
                          className="w-14 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition flex items-center justify-center cursor-pointer"
                          title="Back"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          {loading ? 'Creating Account...' : 'Complete & Register'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Redirect / Switcher to Sign In */}
                <div className="pt-3 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setError(null); }}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. FORGOT PASSWORD TAB */}
            {tab === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 pt-1"
              >
                {resetSent ? (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                    <h4 className="font-bold text-base">Reset Link Sent!</h4>
                    <p className="text-sm text-emerald-700">Check your email inbox (<strong>{email}</strong>) to reset your password.</p>
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setResetSent(false); }}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-xl transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">Registered Email Address</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="yourname@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-rose-600 transition"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Sending Link...' : 'Send Recovery Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-900 cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>🔒 Secure Firebase Auth</span>
            <a
              href="https://parva-vendor-app.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 font-bold hover:underline"
            >
              Vendor Partner Portal ↗
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
