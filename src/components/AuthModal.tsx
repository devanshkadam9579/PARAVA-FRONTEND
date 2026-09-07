import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, MapPin, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

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
      const userData = {
        uid: user.uid,
        name: user.displayName || 'Customer',
        email: user.email || '',
        phone: user.phoneNumber || userSnap.data()?.phone || '',
        role: 'customer',
        city: userSnap.data()?.city || 'Kolhapur',
        address: userSnap.data()?.address || '',
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, userData, { merge: true });

      onSuccess(userData);
      onShowNotification('Welcome back! Signed in successfully.');
      onClose();
    } catch (err: any) {
      console.error(err);
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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists()
        ? userSnap.data()
        : { uid: user.uid, email: user.email, name: user.email?.split('@')[0] || 'User', role: 'customer' };

      onSuccess(userData);
      onShowNotification('Welcome back!');
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const userData = {
        uid: user.uid,
        name,
        email,
        phone: phone || '',
        address: address || '',
        city: city || '',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      onSuccess(userData);
      onShowNotification('Account created successfully!');
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
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      onShowNotification('Password reset link sent to your email!');
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
      setError(null);
      setSignupStep(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white/50 backdrop-blur-md rounded-full hover:bg-gray-100 transition z-20"
        >
          <X size={20} />
        </button>

        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center min-h-[500px]">
          <div className="mb-8 flex justify-center md:justify-start">
            <img src="/parva-logo.png" alt="MyParva" className="h-10 object-contain" />
          </div>

          <AnimatePresence mode="wait">
            {/* 1. SIGN IN FORM */}
            {tab === 'signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2 font-display">Welcome back!</h2>
                  <p className="text-sm text-gray-500 font-medium">Log in to book your favorite vendors.</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                      />
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(null); }}
                      className="text-xs font-bold text-gray-500 hover:text-rose-600"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">or continue with</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm font-medium text-gray-500">
                    Not a member?{' '}
                    <button onClick={() => {setTab('signup'); setSignupStep(1); setError(null);}} className="text-rose-600 font-bold hover:underline">
                      Register now
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. SIGN UP FORM */}
            {tab === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2 font-display">Create Account</h2>
                  <p className="text-sm text-gray-500 font-medium">Step {signupStep} of 2</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={signupStep === 1 ? (e) => { e.preventDefault(); goToNextStep(); } : handleEmailSignUp} className="space-y-4">
                  {signupStep === 1 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="relative">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number (Optional)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          required
                          placeholder="Password (Min 6 chars)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex justify-center items-center gap-2"
                      >
                        Next Step <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="Your City (e.g. Pune)"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-3 text-gray-400" />
                        <textarea
                          placeholder="Full Address (Optional)"
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSignupStep(1)}
                          className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3.5 rounded-2xl transition active:scale-95 flex justify-center items-center"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50"
                        >
                          {loading ? 'Creating...' : 'Create Account'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </form>

                <div className="text-center pt-2">
                  <p className="text-sm font-medium text-gray-500">
                    Already a member?{' '}
                    <button onClick={() => {setTab('signin'); setError(null);}} className="text-rose-600 font-bold hover:underline">
                      Log in
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {tab === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2 font-display">Reset Password</h2>
                  <p className="text-sm text-gray-500 font-medium">Enter your email to receive a recovery link.</p>
                </div>

                {resetSent ? (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                    <p className="font-bold">Email Dispatched!</p>
                    <p className="text-xs text-emerald-700">Check your inbox at {email} to reset your password.</p>
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setResetSent(false); }}
                      className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                      </div>
                    )}
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="Registered Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gray-900 hover:bg-black text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Recovery Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-900"
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side - Visual / Illustration */}
        <div className="hidden md:flex md:w-1/2 relative bg-emerald-50 items-center justify-center p-12 overflow-hidden">
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center">
            {/* Soft decorative blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/40 blur-3xl rounded-full pointer-events-none"></div>
            
            <img 
              src="https://cdni.iconscout.com/illustration/premium/thumb/event-management-4560935-3796541.png" 
              alt="Event Celebration Illustration" 
              className="max-w-[80%] max-h-[60%] object-contain mb-8 z-10 drop-shadow-sm filter hue-rotate-[-30deg]" 
            />
            
            <div className="z-10 bg-white/70 backdrop-blur-sm px-8 py-6 rounded-3xl border border-white shadow-xs max-w-sm">
              <h3 className="text-xl font-black text-gray-900 mb-2 font-display">Plan less, Celebrate more</h3>
              <p className="text-sm text-gray-600 font-medium">
                Make your event planning easier and organized with MyParva.
              </p>
            </div>
            
            {/* Carousel Dots indicator */}
            <div className="absolute bottom-10 flex gap-2 z-10">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-6 h-2 rounded-full bg-gray-800"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
