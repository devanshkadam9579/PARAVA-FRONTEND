import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, ArrowRight, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
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
  onShowNotification: (msg: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onShowNotification
}: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const auth = getAuthInstance();
  const db = getDb();

  // 1. Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync user profile to Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = {
        uid: user.uid,
        name: user.displayName || 'Customer',
        email: user.email || '',
        phone: user.phoneNumber || userSnap.data()?.phone || '',
        role: 'customer',
        city: userSnap.data()?.city || 'Kolhapur',
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, userData, { merge: true });

      onSuccess(userData);
      onShowNotification('🎉 Welcome back! Signed in successfully.');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email / Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists()
        ? userSnap.data()
        : { uid: user.uid, email: user.email, name: user.email?.split('@')[0] || 'User', role: 'customer' };

      onSuccess(userData);
      onShowNotification('👋 Welcome back!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. New User Registration
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const userData = {
        uid: user.uid,
        name,
        email,
        phone: phone || '',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      onSuccess(userData);
      onShowNotification('🎉 Account created successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      onShowNotification('📧 Password reset link sent to your email!');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-2 text-center space-y-1 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto mb-2 font-black text-xl">
            P
          </div>
          <h3 className="font-extrabold text-lg text-gray-900 font-display">
            {tab === 'signin' && 'Welcome to Parva'}
            {tab === 'signup' && 'Create Your Account'}
            {tab === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            {tab === 'signin' && 'Sign in to book events, save favorites & chat'}
            {tab === 'signup' && 'Join Parva to book verified celebration partners'}
            {tab === 'forgot' && 'Enter your email to receive a recovery link'}
          </p>
        </div>

        {/* Tabs */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-gray-100 px-6 pt-3">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition ${
                tab === 'signin'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition ${
                tab === 'signup'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Google 1-Click Button */}
          {tab !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2.5 shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">or email</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </>
          )}

          {/* 2. Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Password</label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(null); }}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs py-3 rounded-2xl shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In with Email'}
              </button>
            </form>
          )}

          {/* 3. Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Full Name</label>
                <div className="relative flex items-center">
                  <User size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Mobile Phone Number</label>
                <div className="relative flex items-center">
                  <Phone size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Create Password</label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs py-3 rounded-2xl shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* 4. Forgot Password Form */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              {resetSent ? (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                  <p className="text-xs font-bold">Password Reset Email Dispatched!</p>
                  <p className="text-[11px] text-emerald-700">Please check your inbox at {email} to reset your password.</p>
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); setResetSent(false); }}
                    className="mt-2 text-xs font-black text-brand-primary underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Registered Email Address</label>
                    <div className="relative flex items-center">
                      <Mail size={15} className="absolute left-3.5 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs py-3 rounded-2xl shadow-xs transition active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('signin')}
                    className="w-full text-center text-[11px] font-bold text-gray-500 hover:text-gray-800"
                  >
                    ← Back to Sign In
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
