import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MapPin, Mail, Lock, AlertCircle } from 'lucide-react';
import { getAuthInstance, getDb } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';

interface VendorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  vendors: any[];
  categoriesList: any[];
  showNotification: (msg: string) => void;
}

export default function VendorAuthModal({
  isOpen,
  onClose,
  onSuccess,
  vendors,
  categoriesList,
  showNotification
}: VendorAuthModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [wizardName, setWizardName] = useState('');
  const [wizardCategories, setWizardCategories] = useState<string[]>([]);
  const [wizardLat, setWizardLat] = useState('');
  const [wizardLng, setWizardLng] = useState('');
  const [wizardLocationName, setWizardLocationName] = useState('');
  const [wizardEmail, setWizardEmail] = useState('');
  const [wizardPassword, setWizardPassword] = useState('');
  const [wizardPhone, setWizardPhone] = useState('');
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getAuthInstance(), provider);
      const user = result.user;
      
      const db = getDb();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // Check if they have a vendor profile
      const vendorRef = await getDoc(doc(db, 'vendors', user.uid));
      if (vendorRef.exists()) {
        const vendorData = vendorRef.data();
        const vendorUserObj = {
          id: vendorData.id,
          name: vendorData.name,
          role: 'vendor',
          vendorId: vendorData.id,
          category: vendorData.category
        };
        onSuccess(vendorUserObj);
        onClose();
        showNotification(`Welcome back, ${vendorData.name}!`);
      } else {
        // They authenticated with Google, but have no vendor profile yet
        // Let's populate the wizard with their email/name and jump to registration
        setWizardEmail(user.email || '');
        setWizardName(user.displayName || '');
        setIsRegistering(true);
        setStep(1);
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setLoginError('');
      const auth = getAuthInstance();
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      
      const db = getDb();
      const vendorRef = await getDoc(doc(db, 'vendors', result.user.uid));
      
      if (vendorRef.exists()) {
        const vendorData = vendorRef.data();
        
        // Block if email not verified
        if (!result.user.emailVerified) {
          setLoginError('Please verify your email address before accessing the dashboard.');
          return;
        }

        const vendorUserObj = {
          id: vendorData.id,
          name: vendorData.name,
          role: 'vendor',
          vendorId: vendorData.id,
          category: vendorData.category
        };
        onSuccess(vendorUserObj);
        onClose();
        showNotification(`Welcome back, ${vendorData.name}!`);
      } else {
        setLoginError('No vendor account found with this email.');
      }
    } catch (err: any) {
      setLoginError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setWizardLat(position.coords.latitude.toString());
        setWizardLng(position.coords.longitude.toString());
        setWizardLocationName(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        showNotification('Location captured via GPS!');
      }, () => {
        showNotification('Failed to get location. Please allow GPS permissions.');
      });
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setLoginError('');
      
      if (!wizardName || wizardCategories.length === 0 || !wizardEmail || !wizardPassword) {
        setLoginError('Please fill all required fields.');
        return;
      }

      const auth = getAuthInstance();
      const db = getDb();
      
      let user = auth.currentUser;
      // If not already signed in via Google, create email account
      if (!user || user.email !== wizardEmail) {
        const result = await createUserWithEmailAndPassword(auth, wizardEmail, wizardPassword);
        user = result.user;
        await sendEmailVerification(user);
        showNotification('Verification email sent! Please check your inbox.');
      }

      const newId = user.uid; // Link vendor profile directly to Auth UID!

      const newVendor = {
        id: newId,
        name: wizardName.trim(),
        category: wizardCategories[0], // primary
        allCategories: wizardCategories,
        location: wizardLocationName || 'India',
        lat: wizardLat,
        lng: wizardLng,
        phone: wizardPhone,
        email: wizardEmail,
        rating: 0,
        reviews: 0,
        price: 'Contact for price',
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'],
        distance: '0 km',
        approved: true,
        isLive: true
      };

      await setDoc(doc(db, 'vendors', newId), newVendor);
      
      // If they just created via email, block them until verified.
      if (!user.emailVerified) {
        setIsRegistering(false);
        setLoginError('Registration successful. Please verify your email before logging in.');
        return;
      }

      const vendorUserObj = {
        id: newId,
        name: newVendor.name,
        role: 'vendor',
        vendorId: newId,
        category: newVendor.category
      };
      
      onSuccess(vendorUserObj);
      onClose();
      showNotification(`Business registered successfully!`);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[125] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 leading-tight">Vendor Portal</h3>
              <p className="text-[11px] text-gray-500">{isRegistering ? 'Register your business' : 'Sign in to your dashboard'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{loginError}</span>
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-brand-primary"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-brand-primary"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl text-xs"
              >
                {loading ? 'Logging in...' : 'Login to Dashboard'}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                Sign in with Google
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-[10px] font-bold text-brand-primary hover:underline"
                >
                  New partner? Register your business
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Business Name</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Categories (Select multiple)</label>
                    <div className="flex flex-wrap gap-2">
                      {categoriesList.map(c => {
                        const isSelected = wizardCategories.includes(c.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setWizardCategories(prev => 
                                isSelected ? prev.filter(x => x !== c.name) : [...prev, c.name]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-600 border-gray-200'}`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Location</label>
                    <button 
                      type="button"
                      onClick={handleGetLocation}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-2 rounded-xl text-xs border border-blue-100"
                    >
                      <MapPin size={14} /> {wizardLocationName ? 'Location Captured ✓' : 'Detect GPS Location'}
                    </button>
                  </div>
                  <button onClick={() => setStep(2)} className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl text-xs mt-2">Next Step</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={wizardEmail}
                      onChange={(e) => setWizardEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Password</label>
                    <input
                      type="password"
                      value={wizardPassword}
                      onChange={(e) => setWizardPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={wizardPhone}
                      onChange={(e) => setWizardPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs">Back</button>
                    <button onClick={handleRegister} disabled={loading} className="flex-[2] bg-brand-primary text-white font-bold py-2.5 rounded-xl text-xs">
                      {loading ? 'Registering...' : 'Register Business'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="text-center pt-2 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-[10px] font-bold text-gray-500 hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
