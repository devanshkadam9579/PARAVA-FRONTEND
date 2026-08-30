/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { Helmet } from 'react-helmet-async';
import { 
  Home, Compass, Calendar, MessageSquare, User, MapPin, Bell, 
  ShoppingCart, Mic, Sparkles, Filter, ArrowRight, ChevronRight, ChevronLeft,
  Star, Check, CheckCircle2, Trash2, Send, X, Heart, ShieldCheck, 
  Info, DollarSign, Gift, ExternalLink, CalendarDays, Users, Smartphone, Download, FileText,
  ChevronUp, ChevronDown, Camera, Headphones, Phone, Mail
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Data and types imports
import { Vendor, Booking, ChatMessage, ChatThread, QuickCategory, VendorServiceItem } from './types';
import { VENDORS, QUICK_CATEGORIES, HERO_PROMOS, INITIAL_CHAT_MESSAGES, CITIES, SUGGESTED_RECENT_SEARCHES, TRENDING_SEARCHES } from './data';

// Component imports
import LocationSelector from './components/LocationSelector';
import FilterModal from './components/FilterModal';
import CloudinaryImageUploader from './components/CloudinaryImageUploader';
import AnimatedSearchBar from './components/AnimatedSearchBar';
import NotificationCenterModal, { AppNotification } from './components/NotificationCenterModal';
import VoiceSearchModal from './components/VoiceSearchModal';
import VendorCard from './components/VendorCard';
import VendorDetailSheet from './components/VendorDetailSheet';
import SplashCarousel from './components/SplashCarousel';
import CartFloatingBar from './components/CartFloatingBar';
import ShareBookingModal from './components/ShareBookingModal';
import ParvaLogin from './components/LoginScreen';
import { Share2 } from 'lucide-react';
import {
  trackPageView,
  trackLoginStarted,
  trackLoginSuccess,
  trackLoginFailed,
  trackCategorySelected,
  trackSearchPerformed,
  trackFilterApplied,
  trackVendorViewed,
  trackServiceSelected,
  trackCartOpened,
  trackCheckoutStarted,
  trackPaymentInitiated,
  trackPaymentSuccess,
  trackPaymentFailed,
  trackBookingConfirmed,
  trackReceiptDownloaded,
  trackBookingCancelled
} from './lib/analytics';


export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Kolhapur': { lat: 16.7050, lng: 74.2433 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Satara': { lat: 17.6805, lng: 74.0183 },
  'Sangli': { lat: 16.8524, lng: 74.5815 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 }
};

const loadCashfreeScript = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).Cashfree) {
      return resolve((window as any).Cashfree);
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve((window as any).Cashfree);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
};

export const TIME_SLOTS = [
  { id: 'full_day', label: '24 Hr Full Day', time: 'Full Day' },
  { id: 'morning', label: '09:00 - 13:00', time: '09:00 - 13:00' },
  { id: 'afternoon', label: '13:00 - 17:00', time: '13:00 - 17:00' },
  { id: 'evening', label: '17:00 - 22:00', time: '17:00 - 22:00' },
];

export const formatTimeSlot = (slotId?: string): string => {
  switch ((slotId || '').toLowerCase()) {
    case 'morning':
      return '09:00 - 13:00';
    case 'afternoon':
      return '13:00 - 17:00';
    case 'evening':
      return '17:00 - 22:00';
    case 'full_day':
    default:
      return '24 Hr Full Day';
  }
};


// Deterministic availability evaluator strictly based on Firestore busyDates and busySlots
export const isVendorAvailable = (
  vendorId: string, 
  startDateStr: string, 
  endDateStr?: string, 
  vendorsList?: any[],
  timeSlot?: string
): boolean => {
  if (!startDateStr) return true;
  
  if (vendorsList) {
    const v = vendorsList.find(item => item.id === vendorId);
    if (!v) return true;

    const slot = (timeSlot || 'full_day').toLowerCase();
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : start;
    const current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (v.busyDates && Array.isArray(v.busyDates) && v.busyDates.includes(dateStr)) {
        return false;
      }

      if (v.busySlots && v.busySlots[dateStr] && Array.isArray(v.busySlots[dateStr])) {
        const blocked = v.busySlots[dateStr];
        if (blocked.includes('full_day')) return false;
        if (slot === 'full_day' && blocked.length > 0) return false;
        if (blocked.includes(slot)) return false;
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return true;
};

const getUserName = (user: any) => {
  if (!user) return 'Guest Planner';
  return user.name || user.displayName || user.email?.split('@')[0] || 'Planner';
};

const getUserInitials = (user: any) => {
  const name = getUserName(user);
  return name ? name.charAt(0).toUpperCase() : 'G';
};

const getFirstName = (user: any) => {
  const name = getUserName(user);
  return name === 'Guest Planner' ? 'Guest Planner' : name.split(' ')[0];
};

const VendorDashboardCalendar = ({ 
  vendorId, 
  busyDates, 
  busySlots = {},
  bookings, 
  onToggleDate, 
  onToggleSlot,
  showNotification 
}: {
  vendorId: string;
  busyDates: string[];
  busySlots?: Record<string, string[]>;
  bookings: Booking[];
  onToggleDate: (date: string) => void;
  onToggleSlot?: (date: string, slot: string) => void;
  showNotification: (msg: string) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDateModal, setActiveDateModal] = useState<string | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get active bookings for this vendor
  const vendorBookings = bookings.filter(b => b.vendor.id === vendorId);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const fillerDays = Array(firstDayIndex).fill(null);

  const daysArray = [];
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-white rounded-[24px] border border-brand-border p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h4 className="font-black text-indigo-600 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />
            <span>Operational Schedule & Slot Manager</span>
          </h4>
          <p className="text-[10px] text-brand-text-secondary mt-0.5">Click any date to manage AM/PM time slot blocks or mark day unavailable.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-brand-border hover:bg-gray-50 active:scale-95 transition"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-extrabold text-xs text-brand-text min-w-[90px] text-center">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-brand-border hover:bg-gray-50 active:scale-95 transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid calendar */}
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-brand-text-secondary uppercase tracking-wider">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {fillerDays.map((_, i) => (
            <div key={`fill-${i}`} className="aspect-square bg-gray-50/50 rounded-lg" />
          ))}

          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dateBookings = vendorBookings.filter(b => b.eventDate === dateStr);
            const isBooked = dateBookings.length > 0;
            const isFullyBlocked = busyDates.includes(dateStr);
            const slotBlocked = busySlots[dateStr] && busySlots[dateStr].length > 0;

            let dayStyle = "bg-gray-50 hover:bg-gray-100 text-brand-text border border-transparent";
            let statusText = "";

            if (isBooked) {
              dayStyle = "bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-500/20 border border-emerald-400 scale-[1.03]";
              statusText = "Confirmed Booking";
            } else if (isFullyBlocked) {
              dayStyle = "bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/20 border border-rose-400 scale-[1.03]";
              statusText = "Day Blocked";
            } else if (slotBlocked) {
              dayStyle = "bg-amber-500 text-white font-extrabold shadow-md shadow-amber-500/20 border border-amber-400 scale-[1.03]";
              statusText = "Partial Slots Blocked";
            }


            return (
              <button
                key={`day-${day}`}
                onClick={() => setActiveDateModal(dateStr)}
                className={`aspect-square rounded-xl text-[11px] flex flex-col items-center justify-center relative transition active:scale-90 ${dayStyle}`}
                title={`${dateStr} ${statusText}`}
              >
                <span>{day}</span>
                {isBooked && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {!isBooked && (isFullyBlocked || slotBlocked) && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend key indicators */}
      <div className="flex flex-wrap gap-3 justify-center items-center text-[9px] font-black uppercase tracking-wider text-brand-text-secondary pt-2 border-t border-dashed border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>Confirmed Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
          <span>Full Day Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
          <span>Partial Slots Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-brand-border" />
          <span>Available</span>
        </div>
      </div>

      {/* Date & AM/PM Slot Management Modal */}
      {activeDateModal && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Calendar size={16} className="text-brand-primary" />
                  <span>Manage Schedule</span>
                </h4>
                <p className="text-xs font-extrabold text-brand-primary mt-0.5">{activeDateModal}</p>
              </div>
              <button 
                onClick={() => setActiveDateModal(null)} 
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Existing bookings on this date */}
            {(() => {
              const dateBookings = vendorBookings.filter(b => b.eventDate === activeDateModal);
              if (dateBookings.length > 0) {
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <span>✓ Active Confirmed Bookings ({dateBookings.length})</span>
                    </h5>
                    {dateBookings.map((b, idx) => (
                      <div key={idx} className="text-[11px] text-emerald-900 bg-white p-2 rounded-xl border border-emerald-100 space-y-0.5">
                        <p className="font-bold">Customer: {b.customerName || 'Verified Client'}</p>
                        <p className="text-[10px] text-emerald-700">Slot: {formatTimeSlot(b.eventTimeSlot)}</p>
                        <p className="text-[10px] text-emerald-700">Value: ₹{b.finalPrice?.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}

            {/* Whole Day Toggle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Whole Day Status</span>
                  <span className="text-[10px] text-gray-500">
                    {busyDates.includes(activeDateModal) ? 'Currently Blocked (Unavailable)' : 'Currently Open'}
                  </span>
                </div>
                <button
                  onClick={() => onToggleDate(activeDateModal)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow-sm ${
                    busyDates.includes(activeDateModal)
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {busyDates.includes(activeDateModal) ? 'Unlock Day' : 'Block Day'}
                </button>
              </div>

              {/* AM/PM Time Slot Toggles */}
              <div className="space-y-2 pt-1">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Individual Time Slot Availability
                </h5>
                <div className="grid grid-cols-1 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSlotBlocked = (busySlots[activeDateModal] || []).includes(slot.id);
                    return (
                      <div 
                        key={slot.id} 
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-gray-800 block leading-tight">{slot.label}</span>
                          <span className="text-[10px] font-medium text-gray-500">{slot.time}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onToggleSlot) {
                              onToggleSlot(activeDateModal, slot.id);
                            } else {
                              onToggleDate(activeDateModal);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                            isSlotBlocked
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isSlotBlocked ? 'Blocked' : 'Available'}
                        </button>
                      </div>

                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveDateModal(null)}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2.5 rounded-xl text-xs transition"
            >
              Done & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'bookings' | 'messages' | 'profile'>(() => {
    return (sessionStorage.getItem('parva_activeTab') as any) || 'home';
  });

  useEffect(() => {
    sessionStorage.setItem('parva_activeTab', activeTab);
  }, [activeTab]);

  const [currentCity, setCurrentCity] = useState('Kolhapur');

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);


  // Splash screen tour state
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return localStorage.getItem('parva_onboarded') !== 'true';
  });

  // User State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const cached = localStorage.getItem('parva_user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(false);

  // Authentication persistence
  useEffect(() => {
    const authInstance = getAuthInstance();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        // Use onSnapshot for user profile to handle offline state gracefully and real-time updates
        const userRef = doc(getDb(), 'users', user.uid);
        const unsubProfile = onSnapshot(userRef, (userDoc) => {
          const cleanUser = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
          };
          const isMasterAdminEmail = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com'].includes(user.email || '');
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (isMasterAdminEmail && userData.role !== 'master_admin') {
              userData.role = 'master_admin';
              setDoc(userRef, { role: 'master_admin' }, { merge: true }).catch(() => {});
            }
            setCurrentUser((prev: any) => ({ ...prev, ...cleanUser, ...userData }));
            setIsAdmin(userData.role === 'admin' || userData.role === 'master_admin');
            setIsMasterAdmin(userData.role === 'master_admin');
          } else {
            // Default user
            const defaultRole = isMasterAdminEmail ? 'master_admin' : 'user';
            const defaultUser = { ...cleanUser, role: defaultRole };
            if (isMasterAdminEmail) {
              setDoc(userRef, defaultUser, { merge: true }).catch(() => {});
            }
            setCurrentUser((prev: any) => ({ ...prev, ...cleanUser, role: defaultRole }));
            setIsAdmin(isMasterAdminEmail);
            setIsMasterAdmin(isMasterAdminEmail);
          }
        }, (error) => {
          console.warn("Profile fetch error (might be offline):", error);
          if (!currentUser) {
            const cleanUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
            };
            const isMasterAdminEmail = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com'].includes(user.email || '');
            setCurrentUser({ ...cleanUser, role: isMasterAdminEmail ? 'master_admin' : 'user' });
          }
        });

        return () => unsubProfile();
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsMasterAdmin(false);
      }
    });
    return unsubscribe;
  }, []); // Run only once on mount

  // Premium status state (persisted in localStorage)
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(() => {
    return localStorage.getItem('parva_premium_status') === 'true';
  });

  // Dynamic Vendors, Categories, Promos, Settings State
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const cached = localStorage.getItem('parva_cached_vendors');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return VENDORS;
  });
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [appLogo, setAppLogo] = useState('https://i.postimg.cc/mgk6dNNd/parva-logo.png');
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(true);

  const [categoriesList, setCategoriesList] = useState<QuickCategory[]>(() => {
    try {
      const cached = localStorage.getItem('parva_cached_categories');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return QUICK_CATEGORIES;
  });
  const [citiesList, setCitiesList] = useState<string[]>(['Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Kolhapur']);

  const [promosList, setPromosList] = useState<any[]>(HERO_PROMOS);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [unlockedConnections, setUnlockedConnections] = useState<string[]>([]);

  // Leads list for CSV extraction
  const [leadsList, setLeadsList] = useState<any[]>(() => {
    const cached = localStorage.getItem('parva_leads_list');
    try {
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    // Seed initial leads so the CSV file and analytics charts look amazing!
    const initialLeads = [
      { id: 'lead-1', name: 'Rohan Malhotra', phone: '9812345678', email: 'rohan.m@gmail.com', city: 'Mumbai', vendorName: 'Royal Grand Pavilion', budget: 180000, timestamp: '2026-07-07 14:32:10' },
      { id: 'lead-2', name: 'Ananya Goel', phone: '9922334455', email: 'ananya@yahoo.com', city: 'Delhi NCR', vendorName: 'Saffron & Spice Gourmet Catering', budget: 95000, timestamp: '2026-07-08 10:15:45' }
    ];
    localStorage.setItem('parva_leads_list', JSON.stringify(initialLeads));
    return initialLeads;
  });

  // App metrics
  const [loginsCount, setLoginsCount] = useState<number>(() => {
    return Number(localStorage.getItem('parva_logins_count') || '14');
  });

  

  // Real-time synchronization for all Firestore collections
  useEffect(() => {
    const db = getDb();
    
    // Seed database if empty or on initial mount
    const seedDatabase = async () => {
      try {
        const { getDocs, setDoc, getDoc, doc } = await import('firebase/firestore');
        
        // Seed default admins list if empty or outdated
        const masterAdminRef = doc(db, 'admins', 'master_admin');
        const masterAdminDoc = await getDoc(masterAdminRef);
        if (!masterAdminDoc.exists() || masterAdminDoc.data()?.username !== 'devansh@parva.com') {
          await setDoc(masterAdminRef, {
            username: 'devansh@parva.com',
            password: 'devansh@9579',
            isMaster: true
          });
          console.log('👑 Seeding complete: Created/Updated Master Admin devansh@parva.com');
        }
        
        // Seed default vendors if empty
        const vendorsSnap = await getDocs(collection(db, 'vendors'));
        if (vendorsSnap.empty) {
          console.log('📦 Seeding default vendors...');
          for (const vendor of VENDORS) {
            await setDoc(doc(db, 'vendors', vendor.id), {
              ...vendor,
              busyDates: vendor.busyDates || []
            });
          }
        }
        
        // Seed default promos if empty
        const promosSnap = await getDocs(collection(db, 'promos'));
        if (promosSnap.empty) {
          console.log('🎟️ Seeding default promos...');
          for (const promo of HERO_PROMOS) {
            await setDoc(doc(db, 'promos', promo.id), promo);
          }
        }
      } catch (err) {
        console.warn('Database seeding error:', err);
      }
    };
    seedDatabase();

    // Listen for Vendors collection
    const unsubscribeVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      const vendorsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Vendor));
      setVendors(vendorsData);
      setIsLoadingVendors(false);
      localStorage.setItem('parva_vendors_list', JSON.stringify(vendorsData));
    }, (error) => {
      console.warn("Vendors sync error (might be offline):", error);
      setIsLoadingVendors(false);
    });

    
    // Listen for Coupons collection
    const unsubscribeCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCouponsList(couponsData);
    });
    
    // Listen for Promos collection
    const unsubscribePromos = onSnapshot(collection(db, 'promos'), (snapshot) => {
      const promosData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setPromosList(promosData);
      localStorage.setItem('parva_promos_list', JSON.stringify(promosData));
    }, (error) => {
      console.warn("Promos sync error (might be offline):", error);
    });

    // Listen for Admins collection
    const unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminsList(adminsData);
    }, (error) => {
      console.warn("Admins sync error:", error);
    });

    // Listen for Bookings collection
    const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingsData as any);
    }, (error) => {
      console.warn("Bookings sync error:", error);
    });

    // Listen for Leads collection
    const unsubscribeLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeadsList(leadsData);
    }, (error) => {
      console.warn("Leads sync error:", error);
    });

    // Listen for Global App Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appLogo) setAppLogo(data.appLogo);
      }
    }, (error) => {
      console.warn("Settings sync error:", error);
    });

    const unsubscribeGlobalSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const enabled = data.paymentsEnabled ?? data.paymentEnabled ?? true;
        setPaymentsEnabled(enabled);
        if (data.bookingFeePercentage !== undefined) {
          setBookingFeePercentage(Number(data.bookingFeePercentage));
        }
      }
    }, (error) => {
      console.warn("Global settings sync error:", error);
    });

    // Listen for Connections collection
    const unsubscribeConnections = onSnapshot(collection(db, 'connections'), (snapshot) => {
      const connsData = snapshot.docs.map(doc => doc.data());
      const userConns = connsData
        .filter(c => c.userId === getAuthInstance().currentUser?.uid)
        .map(c => c.vendorId);
      setUnlockedConnections(userConns);
    }, (error) => {
      console.warn("Connections sync error:", error);
    });

    // Listen for Chats collection
    const unsubscribeChats = onSnapshot(collection(db, 'chats'), (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(chatsData as any);
    }, (error) => {
      console.warn("Chats sync error:", error);
    });

    // Listen for Categories collection
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      if (snapshot.empty) {
        setCategoriesList([]);
      } else {
        const catsData = snapshot.docs.map(doc => {
          const d = doc.data();
          const defaultImg = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';
          return {
            id: doc.id,
            name: d.name || 'Category',
            icon: d.icon || d.iconName || 'Sparkles',
            iconName: d.iconName || d.icon || 'Sparkles',
            image: d.image || (typeof d.icon === 'string' && d.icon.startsWith('http') ? d.icon : defaultImg)
          };
        });
        setCategoriesList(catsData as any);
      }
    }, (error) => {
      console.warn("Categories sync error:", error);
    });

    // Listen for Cities collection
    const unsubscribeCities = onSnapshot(collection(db, 'cities'), (snapshot) => {
      try {
        const citiesData = snapshot.docs
          .map(doc => doc.data())
          .filter(data => data.active !== false)
          .map(data => data.name);
        if (citiesData.length > 0) {
          setCitiesList(citiesData);
        }
      } catch (error) {
        console.warn("Cities sync error:", error);
      }
    });

    return () => {
      unsubscribeVendors();
      unsubscribePromos();
      unsubscribeCoupons();
      unsubscribeAdmins();
      unsubscribeBookings();
      unsubscribeLeads();
      unsubscribeSettings();
      unsubscribeGlobalSettings();
      unsubscribeChats();
      unsubscribeCategories();
      unsubscribeCities();
      unsubscribeConnections();
    };
  }, []);

  // Synchronize Vendor edit form states on login
  useEffect(() => {
    if (currentUser?.role === 'vendor' && currentUser.vendorId) {
      const v = vendors.find(item => item.id === currentUser.vendorId);
      if (v) {
        setVendorEditName(v.name || '');
        setVendorEditTagline(v.tagline || '');
        setVendorEditDesc(v.description || '');
        setVendorEditPhone(v.phone || '');
        setVendorEditVideos((v.videos || []).join(', '));
        setVendorEditFounder(v.founderName || '');
        setVendorEditExperience(v.experience || '');
        setVendorEditWhatsapp(v.whatsapp || '');
        setVendorEditInsta(v.instagram || '');
        setVendorEditOccasions(v.occasion || []);
        setVendorEditFounderImage(v.founderImage || '');
        if (v.location) {
          setCurrentCity(v.location);
        }
      }
    }
  }, [currentUser, vendors]);

  // Location detection logic
  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        // In a real app, we would use reverse geocoding to get the city
        // For this prototype, we'll simulate finding Mumbai/Pune based on proximity
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Simulating Mumbai detection
        if (lat > 18 && lat < 20 && lon > 72 && lon < 74) {
          setCurrentCity('Mumbai');
          showNotification('📍 Home location detected: Mumbai');
        } else {
          showNotification('📍 Location detected! Showing vendors near you.');
        }
      }, (error) => {
        console.error("Location error:", error);
        showNotification('Unable to detect location. Please select manually.');
      });
    }
  };

  useEffect(() => {
    if (localStorage.getItem('parva_location_detected') !== 'true') {
      detectLocation();
      localStorage.setItem('parva_location_detected', 'true');
    }
  }, []);
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // ==================== NOTIFICATION SYSTEM & POP-UP ENGINE ====================
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('parva_app_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: 'notif_init_1',
        type: 'slot',
        title: 'Slot Confirmation Engine Active',
        message: 'Real-time vendor calendar sync is active. Booked slots receive instant phone confirmations.',
        timestamp: '10m ago',
        read: false
      },
      {
        id: 'notif_init_2',
        type: 'offer',
        title: 'Exclusive Kolhapur Offer: Flat 15% OFF',
        message: 'Use coupon code WELCOME10 at checkout to unlock instant celebration discounts.',
        timestamp: '1h ago',
        read: false,
        actionText: 'Use Coupon'
      },
      {
        id: 'notif_init_3',
        type: 'delivery',
        title: 'Equipment & Vendor Dispatch Tracking',
        message: 'Live stage setup and delivery alerts will stream directly to your notification feed.',
        timestamp: 'Yesterday',
        read: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('parva_app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Firestore Live Notification & Pop-up Broadcaster Listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const db = getDb();
      import('firebase/firestore').then(({ collection, query, orderBy, limit, onSnapshot }) => {
        const notifQuery = query(collection(db, 'broadcast_notifications'), orderBy('createdAt', 'desc'), limit(15));
        unsubscribe = onSnapshot(notifQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const notifId = change.doc.id;
              
              // Only notify if notification is fresh (less than 2 minutes old)
              const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now();
              const isRecent = (Date.now() - createdAt) < 120000;
              
              const incomingNotif: AppNotification = {
                id: notifId,
                type: data.type || 'offer',
                title: data.title || 'Special Announcement',
                message: data.message || '',
                timestamp: 'Just now',
                read: false,
                imageUrl: data.imageUrl || undefined,
                actionText: data.actionText || undefined
              };

              setNotifications((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return [incomingNotif, ...prev];
              });

              if (isRecent) {
                sendNativePhoneNotification(incomingNotif.title, incomingNotif.message, incomingNotif.type);
              }
            }
          });
        }, (err) => {
          console.warn("Broadcast notifications listener:", err);
        });
      });
    } catch (e) {
      console.warn("Notification listener init:", e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);


  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const status = await Notification.requestPermission();
        setPermissionStatus(status);
        if (status === 'granted') {
          sendNativePhoneNotification(
            'Pop-up Notifications Enabled! 🎉',
            'You will now receive live alerts for slot confirmations, delivery updates, and exclusive deals.',
            'system'
          );
        }
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
  };

  const sendNativePhoneNotification = (title: string, body: string, type: 'offer' | 'slot' | 'delivery' | 'system' = 'system') => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      message: body,
      timestamp: 'Just now',
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    showNotification(body);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const icon = '/parva_logo.png';
        const n = new Notification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200]
        } as any);
        n.onclick = () => {
          window.focus();
          setIsNotificationCenterOpen(true);
        };
      } catch (e) {
        console.warn('Native phone popup notification error:', e);
      }
    }
  };

  const unreadNotificationsCount = (notifications || []).filter(n => !n.read).length;


  // Debounce search query input to improve filtering performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter Modal & Dynamic Sorting State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterMinPrice, setActiveFilterMinPrice] = useState<number | null>(null);
  const [activeFilterMaxPrice, setActiveFilterMaxPrice] = useState<number | null>(null);
  const [activeFilterTypes, setActiveFilterTypes] = useState<string[]>([]);
  const [activeSortOption, setActiveSortOption] = useState<string>('Distance');

  const [selectedExploreCategory, setSelectedExploreCategory] = useState<string>('all');
  const [exploreOccasion, setExploreOccasion] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<number>(200000);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'trust' | 'priceAsc' | 'priceDesc'>('trust');
  const [showFilters, setShowFilters] = useState(false);

  // Event planning matcher states
  const [planningEventType, setPlanningEventType] = useState('Wedding');
  const [planningStartDate, setPlanningStartDate] = useState<string>(() => {
    return localStorage.getItem('parva_planning_start_date') || new Date().toISOString().split('T')[0];
  });
  const [planningEndDate, setPlanningEndDate] = useState<string>(() => {
    return localStorage.getItem('parva_planning_end_date') || new Date().toISOString().split('T')[0];
  });
  const [planningTimeSlot, setPlanningTimeSlot] = useState<string>(() => {
    return localStorage.getItem('parva_planning_time_slot') || 'evening';
  });
  const [planningGuestSize, setPlanningGuestSize] = useState<number>(() => {
    return Number(localStorage.getItem('parva_planning_guest_size') || '100');
  });
  const [planningBudget, setPlanningBudget] = useState<number>(() => {
    return Number(localStorage.getItem('parva_planning_budget') || '500000');
  });

  // Compatibility aliases for older components
  const planningDate = planningStartDate;
  const setPlanningDate = setPlanningStartDate;

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [isPlannerActive, setIsPlannerActive] = useState(true);

  useEffect(() => {
    localStorage.setItem('parva_planning_start_date', planningStartDate);
    localStorage.setItem('parva_planning_end_date', planningEndDate);
    localStorage.setItem('parva_planning_time_slot', planningTimeSlot);
    localStorage.setItem('parva_planning_guest_size', String(planningGuestSize));
    localStorage.setItem('parva_planning_budget', String(planningBudget));
  }, [planningStartDate, planningEndDate, planningTimeSlot, planningGuestSize, planningBudget]);


  // Unified planner package slots
  const [plannerHall, setPlannerHall] = useState<Vendor | null>(() => {
    try {
      const cached = localStorage.getItem('parva_vendors_list');
      const vList = cached ? JSON.parse(cached) : VENDORS;
      return vList && vList[0] ? vList[0] : null;
    } catch (e) {
      return VENDORS[0] || null;
    }
  });
  const [plannerCatering, setPlannerCatering] = useState<Vendor | null>(() => {
    try {
      const cached = localStorage.getItem('parva_vendors_list');
      const vList = cached ? JSON.parse(cached) : VENDORS;
      return vList && vList[4] ? vList[4] : (vList && vList[0] ? vList[0] : null);
    } catch (e) {
      return VENDORS[4] || VENDORS[0] || null;
    }
  });
  const [plannerDJ, setPlannerDJ] = useState<Vendor | null>(null);
  const [plannerDecor, setPlannerDecor] = useState<Vendor | null>(() => {
    try {
      const cached = localStorage.getItem('parva_vendors_list');
      const vList = cached ? JSON.parse(cached) : VENDORS;
      return vList && vList[1] ? vList[1] : null;
    } catch (e) {
      return VENDORS[1] || null;
    }
  });
  const [plannerPhoto, setPlannerPhoto] = useState<Vendor | null>(null);
  const [plannerMakeup, setPlannerMakeup] = useState<Vendor | null>(null);
  const [plannerCake, setPlannerCake] = useState<Vendor | null>(null);
  const [plannerFun, setPlannerFun] = useState<Vendor | null>(null);

  // Sync planner slots when vendors data changes
  useEffect(() => {
    const syncSlot = (slot: Vendor | null, category: string) => {
      if (!slot) return null;
      const updatedVendor = vendors.find(v => v.id === slot.id);
      return updatedVendor || null;
    };

    setPlannerHall(syncSlot(plannerHall, 'Banquet Hall'));
    setPlannerCatering(syncSlot(plannerCatering, 'Catering'));
    setPlannerDJ(syncSlot(plannerDJ, 'DJ'));
    setPlannerDecor(syncSlot(plannerDecor, 'Decorator'));
    setPlannerPhoto(syncSlot(plannerPhoto, 'Photographer'));
    setPlannerMakeup(syncSlot(plannerMakeup, 'Makeup Artist'));
    setPlannerCake(syncSlot(plannerCake, 'Cake & Desserts'));
    setPlannerFun(syncSlot(plannerFun, 'Fun & Entertainment'));
  }, [vendors]);

  // Vendor Detail Sheet State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // SPA Page Tracking via GA4
  useEffect(() => {
    if (selectedVendor) {
      trackPageView(`vendor/${selectedVendor.id}`, `PARVA | ${selectedVendor.name}`);
      trackVendorViewed({
        id: selectedVendor.id,
        name: selectedVendor.name,
        category: selectedVendor.category,
        location: selectedVendor.location
      });
    } else {
      trackPageView(activeTab);
    }
  }, [activeTab, selectedVendor]);

  // Share Booking State

  const [sharingBooking, setSharingBooking] = useState<Booking | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharedBookingData, setSharedBookingData] = useState<any | null>(null);

  // Parse shareable booking link from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedParam = params.get('sharedBooking');
    if (sharedParam) {
      try {
        const decodedString = decodeURIComponent(
          atob(sharedParam)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const data = JSON.parse(decodedString);
        if (data && data.id) {
          setSharedBookingData(data);
        }
      } catch (err) {
        console.error('Error parsing shared booking:', err);
      }
    }
  }, []);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(['v1', 'v3']);

  // Bundling State
  const [bundledItems, setBundledItems] = useState<{ vendor: Vendor; service: VendorServiceItem }[]>(() => {
    const saved = sessionStorage.getItem('parva_bundledItems');
    return saved ? JSON.parse(saved) : [];
  });
  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Messages / Chat State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChatVendorId, setActiveChatVendorId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [isVendorTyping, setIsVendorTyping] = useState(false);

  // Success Notification state (for bundling/booking checkouts)
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);

  // User Auth & Quick Registration Form state
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCity, setLoginCity] = useState('Mumbai');
  const [loginBudget, setLoginBudget] = useState('₹1,00,000 - ₹3,00,000');
  const [loginIsAdminChecked, setLoginIsAdminChecked] = useState(false);
  const [loginAdminEmail, setLoginAdminEmail] = useState('');
  const [loginAdminPassword, setLoginAdminPassword] = useState('');

  // Unified role selector and custom credentials
  const [loginRole, setLoginRole] = useState<'user' | 'vendor' | 'admin'>('user');
  const [loginVendorId, setLoginVendorId] = useState('');
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [bookingFeePercentage, setBookingFeePercentage] = useState<number>(5);

  // Sync settings/global from Firestore
  useEffect(() => {
    async function fetchGlobalSettings() {
      try {
        const db = getDb();
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists() && snap.data()?.bookingFeePercentage) {
          setBookingFeePercentage(snap.data().bookingFeePercentage);
        }
      } catch (err) {
        console.warn("Using default booking fee percentage 5%", err);
      }
    }
    fetchGlobalSettings();
  }, []);

  // User login method and Google phone capture state
  const [userLoginMethod, setUserLoginMethod] = useState<'phone' | 'google' | 'email'>('phone');
  const [phoneLoginName, setPhoneLoginName] = useState('');
  const [phoneLoginNumber, setPhoneLoginNumber] = useState('');
  const [googleLoginName, setGoogleLoginName] = useState('');
  const [googleLoginPhone, setGoogleLoginPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [editProfileAddress, setEditProfileAddress] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfileName, setEditProfileName] = useState('');
  // Synchronize profile form states with currentUser
  useEffect(() => {
    if (currentUser) {
      setEditProfileName(currentUser.name || '');
      setEditProfilePhone(currentUser.phone || '');
      setEditProfileAddress(currentUser.address || '');
    }
  }, [currentUser]);


  // Logged-in Vendor Edit States
  const [vendorEditName, setVendorEditName] = useState('');
  const [vendorEditTagline, setVendorEditTagline] = useState('');
  const [vendorEditDesc, setVendorEditDesc] = useState('');
  const [vendorEditPhone, setVendorEditPhone] = useState('');
  const [vendorEditVideos, setVendorEditVideos] = useState('');
  const [vendorEditFounder, setVendorEditFounder] = useState('');
  const [vendorEditExperience, setVendorEditExperience] = useState('');
  const [vendorEditWhatsapp, setVendorEditWhatsapp] = useState('');
  const [vendorEditInsta, setVendorEditInsta] = useState('');
  const [vendorEditOccasions, setVendorEditOccasions] = useState<string[]>([]);
  const [vendorNewImage, setVendorNewImage] = useState('');
  const [vendorNewBusyDate, setVendorNewBusyDate] = useState('');
  const [vendorSubTab, setVendorSubTab] = useState<'catalogue' | 'bookings' | 'dates_leads'>('bookings');


  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'onboard' | 'categories' | 'leads' | 'approval' | 'email_logs' | 'settings'>('dashboard');
  const [adminEmailLogs, setAdminEmailLogs] = useState<any[]>([]);
  const [testEmailRecipient, setTestEmailRecipient] = useState('devanshkadam2@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [adminCommissionPct, setAdminCommissionPct] = useState<number>(10);
  const [adminFixedFee, setAdminFixedFee] = useState<number>(0);
  const [adminSupportEmail, setAdminSupportEmail] = useState('support@parvaevents.com');
  const [adminTermsVersion, setAdminTermsVersion] = useState('1.2');
  const [blockedCities, setBlockedCities] = useState<string[]>([]);
  const [isProcessingBooking, setIsProcessingBooking] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [adminDashboardStats, setAdminDashboardStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'profile' && adminSubTab === 'dashboard' && (isAdmin || isMasterAdmin)) {
      fetch(`${BACKEND_API_URL}/api/admin/dashboard`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdminDashboardStats(data);
          }
        })
        .catch(err => console.error("Error fetching stats:", err));
    }
  }, [activeTab, adminSubTab, isAdmin, isMasterAdmin]);

  const handleResetDatabase = async () => {
    const confirmReset = window.confirm(
      "⚠️ RESET ALL DATABASE CONFIGURATIONS?\n\nThis will clear all transactions, custom vendors, categories, promos, and replace them with default system seeds. This action is irreversible.\n\nProceed?"
    );
    if (!confirmReset) return;

    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/reset-defaults`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('🎉 Database successfully reset to defaults!');
        window.location.reload();
      } else {
        showNotification(`❌ Reset failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      showNotification('❌ Network error resetting database.');
    }
  };
  
  // Admin Vendor Onboarding & Modification (CRUD) state
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [adminVendorName, setAdminVendorName] = useState('');
  const [adminVendorCategory, setAdminVendorCategory] = useState('Banquet Hall');
  const [adminVendorLocation, setAdminVendorLocation] = useState('Mumbai');
  const [adminVendorPrice, setAdminVendorPrice] = useState('');
  const [adminVendorRating, setAdminVendorRating] = useState('4.8');
  const [adminVendorTrust, setAdminVendorTrust] = useState('95');
  const [adminVendorVideoUrl, setAdminVendorVideoUrl] = useState('');
  const [adminVendorImage1, setAdminVendorImage1] = useState('');
  const [adminVendorImage2, setAdminVendorImage2] = useState('');
  const [adminVendorImage3, setAdminVendorImage3] = useState('');
  const [adminVendorService1Name, setAdminVendorService1Name] = useState('');
  const [adminVendorService1Price, setAdminVendorService1Price] = useState('');
  const [adminVendorService2Name, setAdminVendorService2Name] = useState('');
  const [adminVendorService2Price, setAdminVendorService2Price] = useState('');

  // Admin Marketing Banners (CRUD) state
  const [adminPromoTitle, setAdminPromoTitle] = useState('');
  const [adminPromoBadge, setAdminPromoBadge] = useState('Limited Offer');
  const [adminPromoTag, setAdminPromoTag] = useState('Wedding');
  const [adminPromoDiscount, setAdminPromoDiscount] = useState('15% Off');
  const [adminPromoImage, setAdminPromoImage] = useState('');
  const [adminAppLogo, setAdminAppLogo] = useState('');

  // Admin Occasions Categories (CRUD) state
  const [adminCategoryName, setAdminCategoryName] = useState('');
  const [adminCategoryImage, setAdminCategoryImage] = useState('');

  // New fully editable states for Admin Vendors
  const [adminVendorTagline, setAdminVendorTagline] = useState('');
  const [adminVendorDescription, setAdminVendorDescription] = useState('');
  const [adminVendorFeatures, setAdminVendorFeatures] = useState('');
  const [adminVendorDistance, setAdminVendorDistance] = useState('1.5 km');
  const [adminVendorResponseTime, setAdminVendorResponseTime] = useState('< 15 mins');
  const [adminVendorVerified, setAdminVendorVerified] = useState(true);
  const [adminVendorPhone, setAdminVendorPhone] = useState('');
  const [adminVendorWhatsapp, setAdminVendorWhatsapp] = useState('');
  const [adminVendorInstagram, setAdminVendorInstagram] = useState('');
  const [adminVendorFounder, setAdminVendorFounder] = useState('');
  const [adminVendorExperience, setAdminVendorExperience] = useState('');
  const [adminVendorOccasion, setAdminVendorOccasion] = useState<string[]>([]);
  const [adminVendorIdField, setAdminVendorIdField] = useState('');

  // Razorpay payment portal simulation state
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [razorpayAmount, setRazorpayAmount] = useState(4999);
  const [razorpayStatus, setRazorpayStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [razorpayUpi, setRazorpayUpi] = useState('thegritfuel@okhdfcbank');
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'card'>('upi');
  const [razorpayPurpose, setRazorpayPurpose] = useState<'premium' | 'connection'>('premium');
  const [pendingCheckoutBooking, setPendingCheckoutBooking] = useState<any | null>(null);

  // Coupon code states
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0); // flat Rs discount
  const [couponMessage, setCouponMessage] = useState('');

  // Vendor self-registration wizard states
  const [isRegisteringVendor, setIsRegisteringVendor] = useState(false);
  const [vendorWizardStep, setVendorWizardStep] = useState(1);
  const [wizardName, setWizardName] = useState('');
  const [wizardCategory, setWizardCategory] = useState('Banquet Hall');
  const [wizardCategories, setWizardCategories] = useState<string[]>(['Banquet Hall']);
  const [wizardCity, setWizardCity] = useState('Mumbai');
  const [wizardTagline, setWizardTagline] = useState('');
  const [wizardPhone, setWizardPhone] = useState('');
  const [wizardWhatsapp, setWizardWhatsapp] = useState('');
  const [wizardBasePrice, setWizardBasePrice] = useState('');
  const [wizardMaxCapacity, setWizardMaxCapacity] = useState('');
  const [wizardService1Name, setWizardService1Name] = useState('');
  const [wizardService1Desc, setWizardService1Desc] = useState('');
  const [wizardService1Image, setWizardService1Image] = useState('');
  const [wizardService1Unit, setWizardService1Unit] = useState('per event');
  const [wizardService2Desc, setWizardService2Desc] = useState('');
  const [wizardService2Image, setWizardService2Image] = useState('');
  const [wizardService2Unit, setWizardService2Unit] = useState('per event');
  const [wizardService1Price, setWizardService1Price] = useState('');
  const [wizardService2Name, setWizardService2Name] = useState('');
  const [wizardService2Price, setWizardService2Price] = useState('');
  const [wizardFounderName, setWizardFounderName] = useState('');
  const [wizardExperience, setWizardExperience] = useState('');
  const [wizardDescription, setWizardDescription] = useState('');
  const [wizardFeatures, setWizardFeatures] = useState('');
  const [wizardCoverImage, setWizardCoverImage] = useState('');
  const [wizardImagesList, setWizardImagesList] = useState<string[]>(['']);
  const [wizardVideosList, setWizardVideosList] = useState<string[]>(['']);
  const [wizardImage2, setWizardImage2] = useState('');
  const [wizardImage3, setWizardImage3] = useState('');
  const [wizardVideoUrl, setWizardVideoUrl] = useState('');

  // User Coordinates and Geolocation for Dynamic Distance Calculations
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const activeOriginCoords = userCoords || CITY_COORDINATES[currentCity] || CITY_COORDINATES['Kolhapur'];
  const [wizardLatitude, setWizardLatitude] = useState('');
  const [wizardLongitude, setWizardLongitude] = useState('');
  const [adminVendorLatitude, setAdminVendorLatitude] = useState('');
  const [adminVendorLongitude, setAdminVendorLongitude] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("User geolocation permission denied/unavailable. Falling back to city default coordinates.");
        }
      );
    }
  }, []);

  // Haversine formula to compute exact distance in kilometers
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Auto-scroll hero carousel
  useEffect(() => {
    if (promosList.length === 0) return;
    
    // Safety check: reset index if list shrinks
    setHeroIndex((prev) => (prev >= promosList.length ? 0 : prev));

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % promosList.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [promosList.length]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = (vendorId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setWishlist((prev = []) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
    showNotification('Wishlist updated!');
  };

  const handlePaymentSuccess = (purpose: 'premium' | 'connection') => {
    setRazorpayStatus('success');
    setTimeout(() => {
      if (purpose === 'premium') {
        setIsPremiumUser(true);
        localStorage.setItem('parva_premium_status', 'true');
        setIsRazorpayOpen(false);
        showNotification('👑 Welcome to MyParva App Elite Premium Member club!');
      } else if (purpose === 'connection' && pendingCheckoutBooking) {
        const newBookingObj = pendingCheckoutBooking.booking;
        const targetUser = pendingCheckoutBooking.user || currentUser;

        // Save the actual booking to state
        setBookings((prev) => [newBookingObj, ...prev]);
        setBundledItems([]); // clear cart
        setCouponCode('');
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponMessage('');

        // Automatically save connection details as a lead to Firestore
        if (newBookingObj.vendor && targetUser) {
          try {
            const db = getDb();
            const leadId = `lead-auto-${Date.now()}`;
            const newLead = {
              id: leadId,
              vendorId: newBookingObj.vendor.id,
              name: targetUser.name || 'Anonymous Planner',
              phone: targetUser.phone || '',
              email: targetUser.email || '',
              city: targetUser.city || currentCity || 'Mumbai',
              budget: `Paid Connection Value: ₹${newBookingObj.finalPrice.toLocaleString('en-IN')}`,
              timestamp: new Date().toLocaleString('en-IN')
            };
            import('firebase/firestore').then(({ doc, setDoc }) => {
              setDoc(doc(db, 'leads', leadId), newLead).catch(err => {
                console.error('Error auto-syncing paid lead:', err);
              });
            });
          } catch (e) {
            console.error('Error constructing paid lead:', e);
          }
        }

        // Generate prefilled whatsapp message
        const vendorPhone = newBookingObj.vendor.whatsapp || newBookingObj.vendor.phone || '919999999999';
        const servicesStr = newBookingObj.selectedServices.map((s: any) => `• ${s.name} (₹${s.price.toLocaleString('en-IN')})`).join('\n');
        const waText = `Hello ${newBookingObj.vendor.name},\n\nI have locked a Direct Booking with your services via Parva Celebrations (Connection Fee PAID)! 📲\n\nEvent Details:\n- Name: ${targetUser?.name}\n- Contact: ${targetUser?.phone}\n- Event Date: ${newBookingObj.eventDate}\n- Type: ${newBookingObj.eventType}\n\nSelected Services:\n${servicesStr}\n\nEstimated Event Value: ₹${newBookingObj.finalPrice.toLocaleString('en-IN')}\n\nPlease confirm availability & package customizations! Thank you!`;
        const waUrl = `https://wa.me/${vendorPhone}?text=${encodeURIComponent(waText)}`;

        // Store wafer link so user can open WhatsApp immediately
        setPendingCheckoutBooking({
          booking: newBookingObj,
          waUrl
        });

        // Close Razorpay after a brief success delay
        setIsRazorpayOpen(false);
        showNotification('🎉 Payment successful! Vendor connection unlocked! 📲');
      }
    }, 2200);
  };

  const handleVendorSelect = async (v: Vendor) => {
    setSelectedVendor(v);
    if (currentUser && currentUser.role === 'user') {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const leadId = `lead-${(currentUser?.name || 'user').replace(/\s+/g, '')}-${v.id}-${Date.now()}`;
        await setDoc(doc(getDb(), 'leads', leadId), {
          id: leadId,
          vendorId: v.id,
          userName: currentUser.name,
          userPhone: currentUser.phone || 'N/A',
          userCity: currentUser.city || 'N/A',
          userBudget: currentUser.budget || 'Not specified',
          dateCaptured: new Date().toISOString(),
          status: 'new'
        }, { merge: true });
      } catch (err) {
        console.error('Error saving lead on vendor profile view:', err);
      }
    }
  };

  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const handlePayWithCashfree = async (params: {
    vendorId?: string;
    type: 'connection' | 'booking';
    amount?: number;
    bookingData?: any;
  }) => {
    if (isPaymentProcessing) {
      showNotification('⏳ Payment is currently being initialized, please wait...');
      return;
    }

    setIsPaymentProcessing(true);
    showNotification('🔒 Initializing secure Cashfree checkout...');
    trackCheckoutStarted(params.bookingData?.selectedServices?.length || 1, params.amount || 0);

    const CashfreeSDK = await loadCashfreeScript();
    if (!CashfreeSDK) {
      setIsPaymentProcessing(false);
      showNotification('❌ Could not load Cashfree Web SDK. Please check your connection.');
      return;
    }

    try {
      // 1. Request Order & Payment Session ID from Secure Backend
      const response = await fetch(`${BACKEND_API_URL}/api/payments/cashfree/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid || 'guest-uid',
          vendorId: params.vendorId || params.bookingData?.vendor?.id || 'system',
          type: params.type,
          amount: params.amount || 0,
          selectedServices: params.bookingData?.selectedServices || [],
          planningGuestSize: planningGuestSize || 100,
          couponCode: couponApplied ? couponCode : undefined,
          customerName: currentUser?.name || params.bookingData?.customerName || 'Parva Customer',
          customerPhone: currentUser?.phone || params.bookingData?.customerPhone || '9999999999',
          customerEmail: currentUser?.email || params.bookingData?.customerEmail || 'customer@parva.com',
          eventDate: params.bookingData?.eventDate || planningStartDate,
          eventTimeSlot: params.bookingData?.eventTimeSlot || planningTimeSlot || 'evening'

        })
      });

      const orderData = await response.json();
      if (!orderData.success || !orderData.paymentSessionId) {
        setIsPaymentProcessing(false);
        showNotification(`❌ Error creating Cashfree order: ${orderData.error || 'Gateway offline'}`);
        trackPaymentFailed('unassigned', orderData.error || 'Gateway offline');
        return;
      }

      const { orderId, paymentSessionId, amount, environment } = orderData;
      trackPaymentInitiated(orderId, amount);

      // 2. Initialize Cashfree Web SDK Instance
      const cashfree = new CashfreeSDK({
        mode: environment === 'PRODUCTION' ? 'production' : 'sandbox'
      });

      console.log(`[Cashfree Checkout] Opening checkout modal for order: ${orderId}`);

      // 3. Launch Cashfree Native Responsive Modal
      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal'
      }).then(async (result: any) => {
        setIsPaymentProcessing(false);
        console.log(`[Cashfree Result]:`, result);

        if (result.error) {
          showNotification(`⚠️ Payment cancelled or failed: ${result.error.message || 'Dismissed'}`);
          trackPaymentFailed(orderId, result.error.message || 'dismissed');
          return;
        }

        // 4. Verify Payment Server-side Upon Successful Payment
        showNotification('⏳ Verifying payment with Cashfree...');
        try {
          const verifyRes = await fetch(`${BACKEND_API_URL}/api/payments/cashfree/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              paymentId: result?.paymentDetails?.paymentId || `cf_pay_${Date.now()}`,
              userId: currentUser?.uid || 'guest-uid',
              vendorId: params.vendorId || params.bookingData?.vendor?.id || 'system',
              type: params.type,
              totalAmount: amount,
              bookingData: params.bookingData || null,
              customerData: {
                name: currentUser?.name || 'Valued Customer',
                email: currentUser?.email || 'customer@parvaevents.com',
                phone: currentUser?.phone || 'N/A'
              }
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            showNotification('🎉 Payment Confirmed via Cashfree! Receipt dispatched to your email.');
            trackPaymentSuccess(orderId, verifyData.transaction?.id || orderId, amount);
            trackBookingConfirmed(verifyData.booking?.id || orderId, params.vendorId || params.bookingData?.vendor?.id || 'vendor', amount);

            // Clear draft cart
            setBundledItems([]);
            sessionStorage.removeItem('parva_bundled_items');
            setActiveTab('bookings');

            // Set state for fresh booking view
            if (verifyData.booking) {
              setBookings(prev => [verifyData.booking, ...prev.filter(b => b.id !== verifyData.booking.id)]);
            }
          } else {
            showNotification('⚠️ Payment verified with notice: ' + (verifyData.error || 'Pending gateway sync'));
            trackPaymentFailed(orderId, verifyData.error || 'unverified');
          }
        } catch (vErr: any) {
          console.error('[Cashfree Verify Error]:', vErr);
          showNotification('🎉 Payment captured! Syncing booking record in background.');
          trackPaymentSuccess(orderId, `pending_sync_${orderId}`, amount);
          setActiveTab('bookings');
        }
      }).catch((chkErr: any) => {
        setIsPaymentProcessing(false);
        console.error('[Cashfree Checkout Modal Error]:', chkErr);
        showNotification('⚠️ Payment window closed.');
        trackPaymentFailed(orderId, 'modal_closed');
      });


    } catch (error: any) {
      setIsPaymentProcessing(false);
      console.error('[Cashfree Initiation Error]:', error);
      showNotification('❌ Payment initiation error. Please try again.');
    }
  };

  // Backward-compatible alias for any child component calling handlePayWithRazorpay
  const handlePayWithRazorpay = handlePayWithCashfree;


  // Helper to show temporary notification
  const showNotification = (msg: string) => {
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 3000);
  };

  // Event Planner Slot Actions
  const handleRemoveSlot = (category: 'Banquet Hall' | 'Catering' | 'DJ' | 'Decorator' | 'Photographer' | 'Makeup Artist' | 'Cake & Desserts' | 'Fun & Entertainment') => {
    if (category === 'Banquet Hall') setPlannerHall(null);
    else if (category === 'Catering') setPlannerCatering(null);
    else if (category === 'DJ') setPlannerDJ(null);
    else if (category === 'Decorator') setPlannerDecor(null);
    else if (category === 'Photographer') setPlannerPhoto(null);
    else if (category === 'Makeup Artist') setPlannerMakeup(null);
    else if (category === 'Cake & Desserts') setPlannerCake(null);
    else if (category === 'Fun & Entertainment') setPlannerFun(null);

    // Also remove any bundled services of vendors belonging to this category
    setBundledItems((prev) => prev.filter((item) => item.vendor.category !== category));
    showNotification(`Removed ${category} from your plan`);
  };

  const handleChooseForPlanner = (vendor: Vendor, e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    // Verify availability
    if (!isVendorAvailable(vendor.id, planningDate, undefined, vendors)) {
      showNotification(`⚠️ ${vendor.name} is booked on ${planningDate}.`);
      return;
    }

    if (vendor.category === 'Banquet Hall') {
      const maxCap = vendor.id === 'v1' ? 1200 : vendor.id === 'v7' ? 450 : 1000;
      if (planningGuestSize > maxCap) {
        showNotification(`⚠️ guest count (${planningGuestSize}) exceeds max capacity (${maxCap}).`);
        return;
      }
      const isSelected = plannerHall?.id === vendor.id;
      if (isSelected) {
        setPlannerHall(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Banquet Hall from plan');
      } else {
        setPlannerHall(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Venue Hall`);
      }
    } else if (vendor.category === 'Catering') {
      const isSelected = plannerCatering?.id === vendor.id;
      if (isSelected) {
        setPlannerCatering(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Caterer from plan');
      } else {
        setPlannerCatering(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Caterer`);
      }
    } else if (vendor.category === 'DJ') {
      const isSelected = plannerDJ?.id === vendor.id;
      if (isSelected) {
        setPlannerDJ(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed DJ from plan');
      } else {
        setPlannerDJ(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as DJ`);
      }
    } else if (vendor.category === 'Decorator') {
      const isSelected = plannerDecor?.id === vendor.id;
      if (isSelected) {
        setPlannerDecor(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Decorator from plan');
      } else {
        setPlannerDecor(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Decorator`);
      }
    } else if (vendor.category === 'Photographer') {
      const isSelected = plannerPhoto?.id === vendor.id;
      if (isSelected) {
        setPlannerPhoto(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Photographer from plan');
      } else {
        setPlannerPhoto(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Photographer`);
      }
    } else if (vendor.category === 'Makeup Artist') {
      const isSelected = plannerMakeup?.id === vendor.id;
      if (isSelected) {
        setPlannerMakeup(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Makeup Artist from plan');
      } else {
        setPlannerMakeup(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Makeup Artist`);
      }
    } else if (vendor.category === 'Cake & Desserts') {
      const isSelected = plannerCake?.id === vendor.id;
      if (isSelected) {
        setPlannerCake(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Cake Designer from plan');
      } else {
        setPlannerCake(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Cake Designer`);
      }
    } else if (vendor.category === 'Fun & Entertainment') {
      const isSelected = plannerFun?.id === vendor.id;
      if (isSelected) {
        setPlannerFun(null);
        setBundledItems((prev) => prev.filter((item) => item.vendor.id !== vendor.id));
        showNotification('Removed Fun activity from plan');
      } else {
        setPlannerFun(vendor);
        setBundledItems((prev) => {
          const alreadyIn = prev.some((item) => item.vendor.id === vendor.id);
          if (alreadyIn) return prev;
          return [...prev, { vendor, service: vendor.services[0] }];
        });
        showNotification(`Selected ${vendor.name} as Fun Entertainer`);
      }
    }
  };

  const handleBookPlannerPackage = () => {
    const activeSlots: Vendor[] = [];
    if (plannerHall) activeSlots.push(plannerHall);
    if (plannerCatering) activeSlots.push(plannerCatering);
    if (plannerDJ) activeSlots.push(plannerDJ);
    if (plannerDecor) activeSlots.push(plannerDecor);
    if (plannerPhoto) activeSlots.push(plannerPhoto);
    if (plannerMakeup) activeSlots.push(plannerMakeup);
    if (plannerCake) activeSlots.push(plannerCake);
    if (plannerFun) activeSlots.push(plannerFun);

    if (activeSlots.length === 0) {
      showNotification('Please choose at least 1 vendor for your event plan.');
      return;
    }

    // Double check availability of all selected slots
    const unavailableSlots = activeSlots.filter(v => !isVendorAvailable(v.id, planningDate, undefined, vendors));
    if (unavailableSlots.length > 0) {
      showNotification(`⚠️ Please swap ${unavailableSlots[0].name}. It is booked on ${planningDate}.`);
      return;
    }

    // Create Booking objects
    const newBookings: Booking[] = activeSlots.map((vendor, idx) => {
      // Find the services selected for this vendor in bundledItems
      const vendorServices = bundledItems
        .filter((item) => item.vendor.id === vendor.id)
        .map((item) => item.service);

      // Fallback to default service if none selected
      const selectedServices = vendorServices.length > 0 ? vendorServices : [vendor.services[0]];

      // Calculate base price
      const price = selectedServices.reduce((total, svc) => {
        if (vendor.category === 'Catering') {
          return total + (svc.price * planningGuestSize);
        }
        return total + svc.price;
      }, 0);

      // Calculate bundle discount (e.g. 1 slot = 0%, 2 slots = 8%, 3 slots = 15%, 4 slots = 22%)
      let discountPct = 0;
      if (activeSlots.length === 2) discountPct = 8;
      else if (activeSlots.length === 3) discountPct = 15;
      else if (activeSlots.length >= 4) discountPct = 22;

      const discountAmt = Math.round((price * discountPct) / 100);
      const finalPrice = price - discountAmt;

      return {
        id: `b-plan-${Date.now()}-${idx}`,
        vendor,
        selectedServices,
        eventDate: planningDate,
        eventType: planningEventType,
        status: 'Confirmed',
        totalPrice: price,
        bundleDiscount: discountPct,
        finalPrice: finalPrice,
        paymentStatus: 'Paid',
        bookingIdString: `PRV-PLAN-${Math.floor(1000 + Math.random() * 9000)}`
      };
    });

    setBookings(prev => [...newBookings, ...prev]);
    
    // Sync all bookings & vendor demand notifications to Firestore
    try {
      const db = getDb();
      import('firebase/firestore').then(async ({ doc, setDoc, collection, addDoc, serverTimestamp }) => {
        for (const bk of newBookings) {
          await setDoc(doc(db, 'bookings', bk.id), bk);
          
          // Save Lead for Admin and Vendor
          const leadId = `lead_${Date.now()}_${bk.vendor.id}`;
          await setDoc(doc(db, 'leads', leadId), {
            id: leadId,
            vendorId: bk.vendor.id,
            vendorName: bk.vendor.name,
            customerName: currentUser?.name || 'Valued Client',
            customerPhone: currentUser?.phone || 'N/A',
            customerEmail: currentUser?.email || 'N/A',
            eventDate: bk.eventDate,
            eventType: bk.eventType,
            amount: bk.finalPrice,
            status: 'Confirmed & Paid',
            createdAt: serverTimestamp()
          });

          // Dispatch Demand Notification for Vendor & User
          await addDoc(collection(db, 'broadcast_notifications'), {
            title: `🎉 New Booking Demand for ${bk.vendor.name}`,
            message: `Booking confirmed for ${bk.eventType} on ${bk.eventDate}. Total: ₹${bk.finalPrice.toLocaleString('en-IN')}`,
            type: 'slot',
            vendorId: bk.vendor.id,
            createdAt: serverTimestamp()
          });
        }
      });
    } catch (e) {
      console.warn("Firestore plan bookings sync error:", e);
    }

    // Clear slots
    setPlannerHall(null);
    setPlannerCatering(null);
    setPlannerDJ(null);
    setPlannerDecor(null);
    setPlannerPhoto(null);
    setPlannerMakeup(null);
    setPlannerCake(null);
    setPlannerFun(null);
    setBundledItems([]); // Clear active bundle items

    // Switch to Bookings Tab
    setActiveTab('bookings');
    showNotification('🎉 Your Unified Celebration Package has been booked successfully!');
  };

  // Coupon application handler
  // Coupon application handler
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    
    const validCoupon = couponsList.find(c => c.code === code && c.active);
    
    if (validCoupon) {
      setCouponApplied(true);
      const servicesTotal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
      const currentFeePct = bookingFeePercentage || 5;
      const calculatedBookingFee = Math.round(servicesTotal * (currentFeePct / 100));
      
      let discountAmt = 0;
      if (validCoupon.discountType === 'percentage') {
        discountAmt = Math.round(calculatedBookingFee * (validCoupon.discountValue / 100));
      } else {
        discountAmt = validCoupon.discountValue;
      }
      
      // Ensure coupon doesn't exceed advance fee
      discountAmt = Math.min(discountAmt, calculatedBookingFee);
      
      setCouponDiscount(discountAmt);
      setCouponMessage(`🎟️ Coupon "${validCoupon.code}" applied! ₹${discountAmt.toLocaleString('en-IN')} off booking advance.`);
      showNotification('🎟️ Coupon applied successfully!');
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage('❌ Invalid or expired coupon code.');
    }
  };

  // Bundling Actions
  const handleAddServiceToBundle = (vendor: Vendor, service: VendorServiceItem) => {
    const alreadyAdded = bundledItems.some(
      (item) => item.vendor.id === vendor.id && item.service.name === service.name
    );
    if (alreadyAdded) return;

    // If service is from catering and not yet multiplied with guest count:
    const isCatering = vendor.category === 'Catering';
    const guestCount = planningGuestSize || 100;
    const finalService = (isCatering && !service.unit?.includes('Guests'))
      ? {
          ...service,
          price: service.price * guestCount,
          unit: `₹${service.price}/plate × ${guestCount} Guests`
        }
      : service;

    setBundledItems((prev) => [...prev, { vendor, service: finalService }]);
    trackServiceSelected(vendor.id, {
      name: finalService.name,
      price: finalService.price,
      unit: finalService.unit || 'fixed',
      quantity: 1
    });

    // Synchronize to planner slot

    if (vendor.category === 'Banquet Hall') setPlannerHall(vendor);
    else if (vendor.category === 'Catering') setPlannerCatering(vendor);
    else if (vendor.category === 'DJ') setPlannerDJ(vendor);
    else if (vendor.category === 'Decorator') setPlannerDecor(vendor);
    else if (vendor.category === 'Photographer') setPlannerPhoto(vendor);
    else if (vendor.category === 'Makeup Artist') setPlannerMakeup(vendor);
    else if (vendor.category === 'Cake & Desserts') setPlannerCake(vendor);
    else if (vendor.category === 'Fun & Entertainment') setPlannerFun(vendor);

    // Auto sync lead to vendor when added to bundle
    if (currentUser) {
      try {
        const db = getDb();
        const leadId = `lead-auto-${Date.now()}`;
        const newLead = {
          id: leadId,
          vendorId: vendor.id,
          name: currentUser.name || 'Anonymous Planner',
          phone: currentUser.phone || '',
          email: currentUser.email || '',
          city: currentUser.city || currentCity || 'Mumbai',
          budget: `Interested in: ${service.name} (₹${service.price.toLocaleString('en-IN')})`,
          timestamp: new Date().toLocaleString('en-IN')
        };
        setDoc(doc(db, 'leads', leadId), newLead).catch(err => console.error('Error auto-syncing lead on bundle add:', err));
      } catch (err) {
        console.error(err);
      }
    }

    showNotification(`"${service.name}" added to your bundle!`);
  };

  const handleRemoveServiceFromBundle = (vendorId: string, serviceName: string) => {
    setBundledItems((prev) => {
      const updated = prev.filter((item) => !(item.vendor.id === vendorId && item.service.name === serviceName));
      
      // If no services are left for this vendor, empty the planner slot
      const hasServicesLeft = updated.some((item) => item.vendor.id === vendorId);
      if (!hasServicesLeft) {
        const vendor = VENDORS.find(v => v.id === vendorId);
        if (vendor) {
          if (vendor.category === 'Banquet Hall') setPlannerHall(null);
          else if (vendor.category === 'Catering') setPlannerCatering(null);
          else if (vendor.category === 'DJ') setPlannerDJ(null);
          else if (vendor.category === 'Decorator') setPlannerDecor(null);
          else if (vendor.category === 'Photographer') setPlannerPhoto(null);
          else if (vendor.category === 'Makeup Artist') setPlannerMakeup(null);
          else if (vendor.category === 'Cake & Desserts') setPlannerCake(null);
          else if (vendor.category === 'Fun & Entertainment') setPlannerFun(null);
        }
      }
      return updated;
    });
    showNotification('Service removed from bundle');
  };

  const handleApplyPlanToCustom = (planVendors: { [category: string]: Vendor }) => {
    // Clear existing selections and assign new ones
    setPlannerHall(planVendors['Banquet Hall'] || null);
    setPlannerCatering(planVendors['Catering'] || null);
    setPlannerDJ(planVendors['DJ'] || null);
    setPlannerDecor(planVendors['Decorator'] || null);
    setPlannerPhoto(planVendors['Photographer'] || null);
    setPlannerMakeup(planVendors['Makeup Artist'] || null);
    setPlannerCake(planVendors['Cake & Desserts'] || null);
    setPlannerFun(planVendors['Fun & Entertainment'] || null);

    // Rebuild bundled items
    const newBundled: { vendor: Vendor; service: VendorServiceItem }[] = [];
    Object.entries(planVendors).forEach(([cat, vendor]) => {
      if (vendor && vendor.services && vendor.services[0]) {
        newBundled.push({ vendor, service: vendor.services[0] });
      }
    });
    setBundledItems(newBundled);
    showNotification('AI Smart-Plan loaded into custom slots! You can now customize each selection.');
  };

  const handleBookDirectPlan = (planName: string, totalCost: number, vendors: Vendor[]) => {
    // Check if any vendor is unavailable
    const unavailable = vendors.filter(v => !isVendorAvailable(v.id, planningDate, undefined, vendors));
    if (unavailable.length > 0) {
      showNotification(`⚠️ Please swap ${unavailable[0].name}. It is booked on ${planningDate}.`);
      return;
    }

    // Build bookings
    const newBookings: Booking[] = vendors.map((vendor, idx) => {
      const selectedServices = [vendor.services[0]];
      const price = selectedServices.reduce((total, svc) => {
        if (vendor.category === 'Catering') {
          return total + (svc.price * planningGuestSize);
        }
        return total + svc.price;
      }, 0);

      let discountPct = 22; // Bulk discount
      const discountAmt = Math.round((price * discountPct) / 100);
      const finalPrice = price - discountAmt;

      return {
        id: `b-ai-${Date.now()}-${idx}`,
        vendor,
        selectedServices,
        eventDate: planningDate,
        eventType: planningEventType,
        status: 'Confirmed',
        totalPrice: price,
        bundleDiscount: discountPct,
        finalPrice: finalPrice,
        paymentStatus: 'Paid',
        bookingIdString: `PRV-AI-${Math.floor(1000 + Math.random() * 9000)}`
      };
    });

    setBookings(prev => [...newBookings, ...prev]);

    // Clear active custom selections
    setPlannerHall(null);
    setPlannerCatering(null);
    setPlannerDJ(null);
    setPlannerDecor(null);
    setPlannerPhoto(null);
    setPlannerMakeup(null);
    setPlannerCake(null);
    setPlannerFun(null);
    setBundledItems([]);

    // Go to Bookings tab
    setActiveTab('bookings');
    showNotification(`🎉 Congratulations! Your AI ${planName} has been booked!`);
  };

  // Handle Voice results
  const handleVoiceSearchResult = (result: string) => {
    setSearchQuery(result);
    setSelectedExploreCategory('all');
    setActiveTab('explore');
    showNotification(`Voice query: "${result}"`);
  };

  // Confirm booking checkout
  const handleConfirmBooking = (eventType: string) => {
    if (bundledItems.length === 0) return;

    // Calculate bundle original & discount
    const originalTotal = bundledItems.reduce((acc, item) => acc + item.service.price, 0);
    let discountPercentage = 0;
    if (bundledItems.length === 2) discountPercentage = 8;
    else if (bundledItems.length === 3) discountPercentage = 15;
    else if (bundledItems.length >= 4) discountPercentage = 22;

    const discountAmount = Math.round((originalTotal * discountPercentage) / 100);
    const finalTotal = originalTotal - discountAmount;

    // Create new Booking item
    const newBooking: Booking = {
      id: `b-new-${Date.now()}`,
      vendor: bundledItems[0].vendor, // Primary vendor (representative)
      selectedServices: bundledItems.map((item) => item.service),
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      eventType,
      status: 'Pending',
      totalPrice: originalTotal,
      bundleDiscount: discountAmount,
      finalPrice: finalTotal,
      paymentStatus: 'Partially Paid',
      bookingIdString: `PRV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`
    };

    setBookings((prev) => [newBooking, ...prev]);
    setBundledItems([]); // Clear active bundle console
    setActiveTab('bookings');
    showNotification('Premium Event Bundle Booked Successfully!');
  };

  // Chat/Messaging Handlers
  const handleSelectThread = (vendorId: string) => {
    const canBypass = isAdmin || isMasterAdmin || currentUser?.role === 'vendor';
    const isUnlocked = unlockedConnections.includes(vendorId);

    if (!canBypass && !isUnlocked) {
      const confirmPayment = window.confirm(
        `💬 Chat Access Locked\n\nTo connect directly and chat with this vendor, a one-time connection activation fee of ₹499 (+18% GST) is required.\n\nTotal: ₹588.82\n\nWould you like to pay securely now via Razorpay?`
      );
      if (confirmPayment) {
        handlePayWithRazorpay({ vendorId, type: 'connection' });
      }
      return;
    }

    setActiveChatVendorId(vendorId);
    setChatThreads((prev) =>
      prev.map((t) => (t.vendor.id === vendorId ? { ...t, unreadCount: 0 } : t))
    );
  };

  // Chat message submission with realistic simulated vendor response!
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeChatVendorId) return;

    const userMsg = {
      vendorId: activeChatVendorId,
      sender: currentUser?.role || 'user', // Can be vendor or user
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    setNewMessageText('');

    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(getDb(), 'chats'), userMsg);
    } catch (err) {
      console.error("Error sending message", err);
    }

    // Trigger typing delay ONLY if user is sending to vendor
    if (currentUser?.role === 'user') {
      setIsVendorTyping(true);

      setTimeout(async () => {
        setIsVendorTyping(false);
        let replyText = "Thank you for writing to us! We are checking our master schedule for the date and will revert with a formal proposal shortly.";
        
        if (activeChatVendorId === 'v1') {
          replyText = "That sounds perfect, Devansh! We can certainly lock that date with a 15% booking deposit. I have updated our sales manager to reach out to you directly.";
        } else if (activeChatVendorId === 'v3') {
          replyText = "Absolutely! We do offer a discounted rate for our high-end 4K Cinematic drone films when bundled with the catering or decorators. Let's arrange a call today!";
        }

        const vendorMsg = {
          vendorId: activeChatVendorId,
          sender: 'vendor',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        };

        try {
          const { addDoc, collection } = await import('firebase/firestore');
          await addDoc(collection(getDb(), 'chats'), vendorMsg);
        } catch (err) {
          console.error("Error sending reply", err);
        }

        // Update thread lastMessage
        setChatThreads((prev) =>
          prev.map((t) =>
            t.vendor.id === activeChatVendorId
              ? { ...t, lastMessage: vendorMsg as ChatMessage, unreadCount: 0 }
              : t
          )
        );
      }, 2200);
    }
  };

  // Determine event suitability for Zomato-style precise matching
  const isVendorSuitedForEvent = (vendor: Vendor, eventType: string): boolean => {
    const et = (eventType || '').toLowerCase();
    const cat = (vendor.category || '').toLowerCase();
    
    if (et === 'wedding' || et === 'marriage') {
      // Marriage/Wedding needs grand elements: Halls, Decorators, Photo, Cinema, Makeup, Catering, Cake, Event Planner
      return ['banquet hall', 'decorator', 'photographer', 'makeup artist', 'catering', 'cake & desserts', 'event planner'].includes(cat);
    }
    if (et === 'birthday') {
      // Birthday needs: DJ, Cakes, Fun, Catering, Decorators, Photographers, Event Planner. No grand halls or heavy bridal styling.
      if (vendor.id === 'v1') return false; // Royal grand pavilion is too large/expensive
      if (cat === 'makeup artist') return false; // No heavy bridal styling needed
      return ['dj', 'cake & desserts', 'fun & entertainment', 'catering', 'decorator', 'photographer', 'event planner'].includes(cat);
    }
    if (et === 'corporate') {
      // Corporate needs: Halls, Catering, DJ & Sound, Photo, Fun & Entertainment, Event Planner. No bridal makeup.
      if (cat === 'makeup artist') return false;
      return ['banquet hall', 'dj', 'catering', 'photographer', 'fun & entertainment', 'event planner'].includes(cat);
    }
    return true;
  };

  const handleDownloadReceiptPDF = (booking: Booking) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [79, 70, 229]; // #4f46e5 (Indigo)
      const textColor = [17, 24, 39]; // Gray 900
      const secondaryTextColor = [107, 114, 128]; // Gray 500
      const lightBg = [249, 250, 251]; // Gray 50

      // Outer Card Frame
      doc.setDrawColor(229, 231, 235); // Gray 200
      doc.rect(10, 10, 190, 277);

      // Header Banner Background
      doc.setFillColor(243, 244, 246); // Gray 100
      doc.rect(12, 12, 186, 32, 'F');

      // Parva App Brand Header Logo Circle
      doc.setFillColor(79, 70, 229);
      doc.circle(28, 28, 9, 'F');
      
      // "P" inside circle
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('P', 25.5, 31);

      // App Title
      doc.setTextColor(79, 70, 229);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PARVA', 42, 27);

      // Slogan
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Simplifying Celebrations, Memorable Connections', 42, 33);

      // Receipt Text
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TRANSACTION RECEIPT', 134, 30);

      // Invoice info block
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Receipt ID:`, 15, 58);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${booking.id}`, 42, 58);

      doc.setFont('Helvetica', 'bold');
      doc.text(`Booking Date:`, 15, 64);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${booking.eventDate || 'N/A'}`, 42, 64);

      doc.setFont('Helvetica', 'bold');
      doc.text(`Event Type:`, 15, 70);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${booking.eventType || 'Celebration'}`, 42, 70);

      // Status Badge
      doc.setFillColor(209, 250, 229); // Light green
      doc.rect(155, 53, 40, 8, 'F');
      doc.setTextColor(6, 95, 70); // Dark green
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PAYMENT SECURED', 159, 58.5);

      // Customer Details Section
      doc.setFillColor(249, 250, 251); // Light grey background
      doc.rect(15, 80, 85, 35, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(15, 80, 85, 35);
      
      doc.setTextColor(79, 70, 229);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('BILL TO (Planner Info)', 20, 87);

      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(getUserName(currentUser), 20, 95);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(currentUser?.email || 'thegritfuel@gmail.com', 20, 101);
      doc.text(`Role: Wedding & Event Planner`, 20, 107);

      // Vendor / Provider details
      doc.setFillColor(249, 250, 251);
      doc.rect(110, 80, 85, 35, 'F');
      doc.rect(110, 80, 85, 35);

      doc.setTextColor(79, 70, 229);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SERVICE PROVIDER', 115, 87);

      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(booking.vendor.name, 115, 95);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Category: ${booking.vendor.category}`, 115, 101);
      doc.text(`Location: ${booking.vendor.location}`, 115, 107);

      // Table Header
      doc.setFillColor(79, 70, 229);
      doc.rect(15, 125, 180, 10, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SI', 18, 131);
      doc.text('Service Item Description', 30, 131);
      doc.text('Base Price (INR)', 150, 131);

      // Table Body
      let currentY = 135;
      (booking.selectedServices || []).forEach((service, index) => {
        // Alt background
        doc.setFillColor(255, 255, 255);
        doc.rect(15, currentY, 180, 10, 'F');
        doc.setDrawColor(243, 244, 246);
        doc.line(15, currentY + 10, 195, currentY + 10);

        doc.setTextColor(17, 24, 39);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${index + 1}`, 18, currentY + 6);
        
        doc.setFont('Helvetica', 'bold');
        doc.text(service.name, 30, currentY + 6);
        
        doc.setFont('Helvetica', 'normal');
        doc.text(`INR ${service.price.toLocaleString('en-IN')}`, 150, currentY + 6);
        currentY += 10;
      });

      // Cost Summary Blocks
      currentY += 10;
      doc.setDrawColor(229, 231, 235);
      doc.line(110, currentY, 195, currentY);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Subtotal:', 120, currentY + 8);
      doc.setTextColor(17, 24, 39);
      doc.text(`INR ${booking.totalPrice.toLocaleString('en-IN')}`, 160, currentY + 8);

      doc.setTextColor(107, 114, 128);
      doc.text(`Bundle Discount (${booking.bundleDiscount}%):`, 120, currentY + 14);
      const discountVal = Math.round((booking.totalPrice * booking.bundleDiscount) / 100);
      doc.setTextColor(220, 38, 38); // Red for discount
      doc.text(`- INR ${discountVal.toLocaleString('en-IN')}`, 160, currentY + 14);

      // Total Line
      doc.setDrawColor(79, 70, 229);
      doc.line(110, currentY + 18, 195, currentY + 18);

      doc.setTextColor(79, 70, 229);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Total Final Paid:', 120, currentY + 24);
      const finalAmt = booking.totalPrice - discountVal;
      doc.text(`INR ${finalAmt.toLocaleString('en-IN')}`, 160, currentY + 24);

      // Support Footer
      doc.setDrawColor(229, 231, 235);
      doc.line(15, 230, 195, 230);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Important Notice: This receipt certifies successful payment clearance. The provider has locked their availability for your selected event date.', 15, 238);
      doc.text('For any questions, support, or alterations to schedules, please visit parva.in/support or email support@parva.in.', 15, 244);

      // Brand Logo in watermark accent
      doc.setTextColor(243, 244, 246);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(60);
      doc.text('PARVA', 65, 210);

      // Save PDF
      doc.save(`Parva_Receipt_${booking.id}.pdf`);
      trackReceiptDownloaded(booking.id || 'booking');
      showNotification('📥 Transaction receipt PDF downloaded successfully with official branding!');
    } catch (e) {

      console.error(e);
      showNotification('❌ Error exporting receipt to PDF.');
    }
  };

  // Filter & Search computation (Memoized for high FPS performance)
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
    // 1. City / Location match (case-insensitive & fallback)
    const targetCity = (currentCity || '').toLowerCase().trim();
    const vendorLoc = (vendor.location || '').toLowerCase().trim();
    const vendorReg = ((vendor as any).region || '').toLowerCase().trim();
    const vendorCity = ((vendor as any).city || '').toLowerCase().trim();
    const matchesCity = !targetCity || targetCity === 'all' || 
      vendorLoc.includes(targetCity) || 
      vendorReg.includes(targetCity) || 
      vendorCity.includes(targetCity) ||
      targetCity.includes(vendorLoc);

    // 2. Category match (singular/plural flexible & multi-category array check)
    const selectedCat = (selectedExploreCategory || 'all').toLowerCase().trim();
    const vendorCat = (vendor.category || '').toLowerCase().trim();
    const vendorCats = Array.isArray((vendor as any).categories)
      ? (vendor as any).categories.map((c: string) => c.toLowerCase().trim())
      : [];

    const matchesCategory =
      selectedCat === 'all' ||
      vendorCat === selectedCat ||
      vendorCat.startsWith(selectedCat.slice(0, 4)) ||
      selectedCat.startsWith(vendorCat.slice(0, 4)) ||
      vendorCats.some((c: string) => c === selectedCat || c.startsWith(selectedCat.slice(0, 4)) || selectedCat.startsWith(c.slice(0, 4)));

    // 3. Search query match
    const sq = debouncedSearchQuery.toLowerCase().trim();
    const matchesSearch = !sq ||
      (vendor.name || '').toLowerCase().includes(sq) ||
      (vendor.category || '').toLowerCase().includes(sq) ||
      (vendor.tagline || '').toLowerCase().includes(sq) ||
      (vendor.description || '').toLowerCase().includes(sq) ||
      vendorCats.some((c: string) => c.includes(sq));

    // 4. Price & custom filters (applied only when customized by user)
    const matchesPrice = !priceRange || priceRange >= 250000 || (vendor.basePrice || 0) <= priceRange;
    const matchesMinPrice = activeFilterMinPrice === null || (vendor.basePrice || 0) >= activeFilterMinPrice;
    const matchesMaxPrice = activeFilterMaxPrice === null || (vendor.basePrice || 0) <= activeFilterMaxPrice;
    const matchesOccasion = exploreOccasion === 'All' || (Array.isArray(vendor.occasion) && vendor.occasion.some(o => o.toLowerCase() === exploreOccasion.toLowerCase()));

    const matchesTypes = activeFilterTypes.length === 0 || activeFilterTypes.some(t => {
      const typeLower = t.toLowerCase();
      return (
        (vendor.features || []).some(f => f.toLowerCase().includes(typeLower)) ||
        (vendor.category || '').toLowerCase().includes(typeLower) ||
        (vendor.tagline || '').toLowerCase().includes(typeLower) ||
        (vendor.description || '').toLowerCase().includes(typeLower)
      );
    });

    return matchesCity && matchesCategory && matchesSearch && matchesPrice && matchesMinPrice && matchesMaxPrice && matchesTypes && matchesOccasion && vendor.approved !== false;
    }).sort((a, b) => {
    if (activeSortOption === 'Rating - High to Low' || sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (activeSortOption === 'Price - Low to High' || sortBy === 'priceAsc') return (a.basePrice || 0) - (b.basePrice || 0);
    if (activeSortOption === 'Price - High to Low' || sortBy === 'priceDesc') return (b.basePrice || 0) - (a.basePrice || 0);
    if (activeSortOption === 'Most Booked' || sortBy === 'trust') return (b.bookingsCount || b.trustScore || 0) - (a.bookingsCount || a.trustScore || 0);
    
    // Default: Sort strictly by Rank & Trust Score & Rating
    const rankA = Number((a as any).rank || (a as any).regionRank || a.rating || 0);
    const rankB = Number((b as any).rank || (b as any).regionRank || b.rating || 0);
    if (rankB !== rankA) return rankB - rankA;

    let distA = parseFloat(a.distance) || 0;
    let distB = parseFloat(b.distance) || 0;
    if (userCoords && a.latitude && a.longitude) {
      distA = calculateHaversineDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
    }
    if (userCoords && b.latitude && b.longitude) {
      distB = calculateHaversineDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
    }
    return distA - distB;
    });
  }, [vendors, currentCity, selectedExploreCategory, debouncedSearchQuery, priceRange, activeFilterMinPrice, activeFilterMaxPrice, activeFilterTypes, exploreOccasion, sortBy, activeSortOption, userCoords]);

  const safeHeroIndex = heroIndex >= promosList.length ? 0 : heroIndex;
  const currentPromo = promosList[safeHeroIndex];

  if (showSplash) {
    return <SplashCarousel onComplete={() => setShowSplash(false)} appLogo={appLogo} />;
  }

  if (!currentUser) {
    
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-brand-border overflow-y-auto" id="parva-login-container">
        <Helmet>
          <title>Welcome to Parva | Login</title>
        </Helmet>
        
        <AnimatePresence>
          {successNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 20, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-16 left-6 right-6 max-w-[340px] mx-auto bg-brand-text text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2.5 border border-white/10"
            >
              <div className="w-6 h-6 rounded-full bg-brand-success flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
              <p className="text-sm font-semibold tracking-wide flex-1 leading-tight">{successNotification}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="p-6 pt-12 flex-1 flex flex-col justify-center">
            {/* GATED ACCESS: Unified Multi-Role Login Gateway */}
            <div className="bg-white rounded-[28px] border border-brand-border p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center mx-auto shadow-sm border border-brand-border">
                  <img src={appLogo} className="w-12 h-12 object-contain" alt="PARVA Logo" referrerPolicy="no-referrer" />
                </div>
                <h3 className="font-extrabold text-brand-text text-base">Welcome to MyParva App</h3>
                <p className="text-xs text-brand-text-secondary">Unlock verified event vendors, contact links & customized planner tools</p>
              </div>

              {/* Sub-tab selection for User and Vendor Roles */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-brand-border">
                {[
                  { id: 'user', label: 'User Portal' },
                  { id: 'vendor', label: 'Vendor Hub' }
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setLoginRole(role.id as any);
                      setIsSigningUp(false);
                    }}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition duration-200 ${
                      loginRole === role.id
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-brand-text-secondary hover:text-brand-text'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {loginRole === 'user' && (
                  /* Exclusive Clean Google Sign-In with Name & Phone */
                  <div className="space-y-4 pt-1">
                    <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-2xl">
                      <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
                        ✨ Quick Sign-in: Enter your mobile number once for direct vendor contact, instant booking updates, and official PDF receipts.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Your Full Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Devansh Kadam"
                          value={googleLoginName}
                          onChange={(e) => setGoogleLoginName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mobile Phone Number *</label>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 px-3 py-2.5 rounded-xl">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit number"
                            value={googleLoginPhone}
                            onChange={(e) => setGoogleLoginPhone(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition font-mono tracking-wider"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        trackLoginStarted('google');
                        try {
                          const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
                          const provider = new GoogleAuthProvider();
                          const result = await signInWithPopup(getAuthInstance(), provider);
                          const user = result.user;

                          const db = getDb();
                          const { doc, getDoc, setDoc } = await import('firebase/firestore');
                          const userDoc = await getDoc(doc(db, 'users', user.uid));
                          const existingData = userDoc.exists() ? userDoc.data() : {};

                          const finalName = googleLoginName.trim() || user.displayName || existingData.name || 'Parva User';
                          const finalPhone = googleLoginPhone.trim() || existingData.phone || '';

                          const loggedUser = {
                            uid: user.uid,
                            name: finalName,
                            email: user.email || '',
                            phone: finalPhone,
                            photoURL: user.photoURL || '',
                            city: existingData.city || currentCity || 'Kolhapur',
                            address: existingData.address || '',
                            role: existingData.role || 'user'
                          };

                          await setDoc(doc(db, 'users', user.uid), loggedUser, { merge: true });
                          setCurrentUser(loggedUser);
                          localStorage.setItem('parva_user', JSON.stringify(loggedUser));

                          trackLoginSuccess('google');
                          setIsLoginModalOpen(false);
                          showNotification(`🎉 Welcome, ${finalName}!`);
                        } catch (err: any) {
                          console.error("Google sign in error:", err);
                          trackLoginFailed('google', err.message);
                          showNotification(`⚠️ Sign-in cancelled: ${err.message}`);
                        }
                      }}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 font-black py-4 px-4 rounded-2xl border-2 border-gray-200 hover:border-brand-primary flex items-center justify-center gap-3 transition shadow-md active:scale-98 text-xs uppercase tracking-wider mt-2"

                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      <span>Continue with Google</span>
                    </button>

                    <p className="text-[10px] text-gray-400 text-center font-medium">
                      🔒 Official Google Sign-In with Verified Account Security
                    </p>
                  </div>
                )}
                {loginRole === 'vendor' && (
                  /* Vendor Hub Portal (with Self-Onboarding Step-by-Step Wizard) */
                  <div className="space-y-4 bg-brand-primary-light/10 p-4.5 rounded-2xl border border-brand-primary/10 transition duration-300">
                    {!isRegisteringVendor ? (
                      /* Option A: Vendor Login via Access ID */
                      <div className="space-y-3.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-brand-primary">
                          <Sparkles size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest block">VENDOR HUB ACCESS</span>
                        </div>
                        
                        <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                          Enter your unique 6-digit PARVA Vendor Access ID set by our administrators.
                        </p>

                        <div>
                          <label className="text-[10px] font-bold text-brand-primary block mb-1">6-Digit Vendor ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 481029"
                            value={loginVendorId}
                            onChange={(e) => setLoginVendorId(e.target.value)}
                            className="w-full bg-white border border-brand-primary/20 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary transition text-center font-mono"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!loginVendorId) {
                              showNotification('⚠️ Please enter your PARVA Vendor ID.');
                              return;
                            }
                            const matchingVendor = vendors.find(v => v.id.trim().toUpperCase() === loginVendorId.trim().toUpperCase());
                            if (matchingVendor) {
                              const vendorUserObj = {
                                id: matchingVendor.id,
                                name: matchingVendor.name,
                                role: 'vendor',
                                vendorId: matchingVendor.id,
                                category: matchingVendor.category
                              };
                              setCurrentUser(vendorUserObj);
                              localStorage.setItem('parva_user', JSON.stringify(vendorUserObj));
                              showNotification(`💼 Welcoming Vendor: ${matchingVendor.name}! Dashboard Loaded.`);
                            } else {
                              showNotification('❌ Invalid Vendor ID. Please enter a valid unique ID.');
                            }
                          }}
                          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-brand-primary/10"
                        >
                          Verify ID & Enter Hub
                        </button>

                        <div className="text-center pt-2 border-t border-brand-primary/5">
                          <button
                            onClick={() => {
                              setIsRegisteringVendor(true);
                              setVendorWizardStep(1);
                            }}
                            className="text-[10px] font-bold text-brand-primary hover:underline"
                          >
                            ➕ Don't have a Partner ID? Register Business Here
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Option B: Vendor Registration Step-by-Step Wizard */
                      <div className="space-y-3.5 animate-in slide-in-from-right-5 duration-300">
                        <div className="flex justify-between items-center pb-2 border-b border-brand-primary/10">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-brand-primary font-black block">Vendor Onboarding</span>
                            <h4 className="font-extrabold text-xs text-brand-text">Step {vendorWizardStep} of 4</h4>
                          </div>
                          <button
                            onClick={() => setIsRegisteringVendor(false)}
                            className="text-[10px] text-brand-text-secondary hover:text-brand-primary font-semibold"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Step 1: Basics */}
                        {vendorWizardStep === 1 && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Business Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Dream Creators Events"
                                value={wizardName}
                                onChange={(e) => setWizardName(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-bold text-brand-primary uppercase tracking-wider block">
                                  Select Categories / Services Provided (Multiple Allowed)
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/80 rounded-xl border border-brand-border max-h-28 overflow-y-auto">
                                  {(categoriesList.length > 0 ? categoriesList : [{ name: 'Venues' }, { name: 'Decorators' }, { name: 'Catering' }, { name: 'DJ & Sound' }, { name: 'Photography' }]).map((cat) => {
                                    const isSelected = wizardCategories.includes(cat.name);
                                    return (
                                      <button
                                        type="button"
                                        key={cat.name}
                                        onClick={() => {
                                          if (isSelected) {
                                            if (wizardCategories.length > 1) {
                                              const updated = wizardCategories.filter(c => c !== cat.name);
                                              setWizardCategories(updated);
                                              setWizardCategory(updated[0]);
                                            }
                                          } else {
                                            const updated = [...wizardCategories, cat.name];
                                            setWizardCategories(updated);
                                            setWizardCategory(updated[0]);
                                          }
                                        }}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                          isSelected
                                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <span>{isSelected ? '✓' : '+'}</span>
                                        <span>{cat.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">City Location</label>
                                <select
                                  value={wizardCity}
                                  onChange={(e) => setWizardCity(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-2 py-2 text-xs font-semibold outline-none"
                                >
                                  {citiesList.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Catchy Tagline</label>
                              <input
                                type="text"
                                placeholder="e.g. Making your celebrations royal and floral"
                                value={wizardTagline}
                                onChange={(e) => setWizardTagline(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Contact Phone</label>
                                <input
                                  type="tel"
                                  placeholder="9876543210"
                                  value={wizardPhone}
                                  onChange={(e) => setWizardPhone(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">WhatsApp No</label>
                                <input
                                  type="tel"
                                  placeholder="9876543210"
                                  value={wizardWhatsapp}
                                  onChange={(e) => setWizardWhatsapp(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/50">
                              <div>
                                <label className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Latitude (e.g. 19.0760)</label>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="e.g. 19.0760"
                                  value={wizardLatitude}
                                  onChange={(e) => setWizardLatitude(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-amber-400"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Longitude (e.g. 72.8777)</label>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="e.g. 72.8777"
                                  value={wizardLongitude}
                                  onChange={(e) => setWizardLongitude(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (!wizardName || !wizardTagline || !wizardPhone) {
                                  showNotification('⚠️ Please complete all fields.');
                                  return;
                                }
                                setVendorWizardStep(2);
                              }}
                              className="w-full bg-brand-primary text-white font-extrabold text-xs py-2.5 rounded-xl mt-2 transition"
                            >
                              Continue to Services →
                            </button>
                          </div>
                        )}

                        {/* Step 2: Services & Pricing */}
                        {vendorWizardStep === 2 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Base Price (₹)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 25000"
                                  value={wizardBasePrice}
                                  onChange={(e) => setWizardBasePrice(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Max Capacity (for Halls)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 500"
                                  value={wizardMaxCapacity}
                                  onChange={(e) => setWizardMaxCapacity(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                  disabled={wizardCategory !== 'Banquet Hall'}
                                />
                              </div>
                            </div>

                            <div className="border-t border-brand-primary/10 pt-3 space-y-3">
                              <span className="text-[9px] uppercase tracking-wider text-brand-primary font-black block">Service Offerings & Packages (with Photos & Details)</span>
                              
                              {/* Service 1 */}
                              <div className="bg-gray-50/80 p-3 rounded-2xl border border-brand-border space-y-2">
                                <span className="text-[9px] font-black text-gray-700 uppercase">Primary Service #1</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Service Name (e.g. Mandap Setup)"
                                    value={wizardService1Name}
                                    onChange={(e) => setWizardService1Name(e.target.value)}
                                    className="col-span-2 bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={wizardService1Price}
                                    onChange={(e) => setWizardService1Price(e.target.value)}
                                    className="bg-white border border-brand-border rounded-xl px-2 py-2 text-xs font-bold outline-none"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Short Description (e.g. Floral stage setup and entrance)"
                                  value={wizardService1Desc}
                                  onChange={(e) => setWizardService1Desc(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-1.5 text-xs outline-none"
                                />
                                <div className="space-y-1 bg-white p-2 rounded-xl border border-brand-border">
                                  <CloudinaryImageUploader
                                    label="📷 Photo (Camera / Gallery)"
                                    initialImage={wizardService1Image}
                                    onImageUploaded={(url) => setWizardService1Image(url)}
                                  />
                                </div>
                              </div>

                              {/* Service 2 */}
                              <div className="bg-gray-50/80 p-3 rounded-2xl border border-brand-border space-y-2">
                                <span className="text-[9px] font-black text-gray-700 uppercase">Service #2 (Optional)</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Service Name (e.g. House Lighting)"
                                    value={wizardService2Name}
                                    onChange={(e) => setWizardService2Name(e.target.value)}
                                    className="col-span-2 bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={wizardService2Price}
                                    onChange={(e) => setWizardService2Price(e.target.value)}
                                    className="bg-white border border-brand-border rounded-xl px-2 py-2 text-xs font-bold outline-none"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Short Description"
                                  value={wizardService2Desc}
                                  onChange={(e) => setWizardService2Desc(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-1.5 text-xs outline-none"
                                />
                                <div className="space-y-1 bg-white p-2 rounded-xl border border-brand-border">
                                  <CloudinaryImageUploader
                                    label="📷 Photo (Camera / Gallery)"
                                    initialImage={wizardService2Image}
                                    onImageUploaded={(url) => setWizardService2Image(url)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button
                                onClick={() => setVendorWizardStep(1)}
                                className="bg-gray-100 text-brand-text font-bold text-xs py-2.5 rounded-xl transition"
                              >
                                ← Back
                              </button>
                              <button
                                onClick={() => {
                                  if (!wizardBasePrice) {
                                    showNotification('⚠️ Please specify a baseline price.');
                                    return;
                                  }
                                  setVendorWizardStep(3);
                                }}
                                className="bg-brand-primary text-white font-extrabold text-xs py-2.5 rounded-xl transition"
                              >
                                Continue →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Biography & Features */}
                        {vendorWizardStep === 3 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Founder Name</label>
                                <input
                                  type="text"
                                  placeholder="Aditya Deshmukh"
                                  value={wizardFounderName}
                                  onChange={(e) => setWizardFounderName(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Exp (Years)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 5+ Years"
                                  value={wizardExperience}
                                  onChange={(e) => setWizardExperience(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Company Bio / Description</label>
                              <textarea
                                rows={2}
                                placeholder="Describe your business services and specialization..."
                                value={wizardDescription}
                                onChange={(e) => setWizardDescription(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Features (Comma Separated)</label>
                              <input
                                type="text"
                                placeholder="e.g. Premium Sound, AC Room, Valet"
                                value={wizardFeatures}
                                onChange={(e) => setWizardFeatures(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button
                                onClick={() => setVendorWizardStep(2)}
                                className="bg-gray-100 text-brand-text font-bold text-xs py-2.5 rounded-xl transition"
                              >
                                ← Back
                              </button>
                              <button
                                onClick={() => setVendorWizardStep(4)}
                                className="bg-brand-primary text-white font-extrabold text-xs py-2.5 rounded-xl transition"
                              >
                                Continue →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Dynamic Media Uploads (Unlimited N Images & Videos) */}
                        {vendorWizardStep === 4 && (
                          <div className="space-y-4">
                            {/* Showcase Images with Add Slot button */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-bold text-brand-primary uppercase tracking-wider block">
                                  📷 Portfolio Photos ({wizardImagesList.length})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setWizardImagesList([...wizardImagesList, ''])}
                                  className="text-[10px] font-bold bg-pink-50 text-brand-primary px-2.5 py-1 rounded-lg border border-pink-200 hover:bg-pink-100 transition active:scale-95"
                                >
                                  + Add Image
                                </button>
                              </div>

                              <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                                {wizardImagesList.map((imgUrl, idx) => (
                                  <div key={idx} className="bg-gray-50/80 p-2.5 rounded-xl border border-brand-border space-y-1.5 relative">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-gray-700">
                                        {idx === 0 ? 'Cover Photo (Primary)' : `Photo #${idx + 1}`}
                                      </span>
                                      {wizardImagesList.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setWizardImagesList(wizardImagesList.filter((_, i) => i !== idx))}
                                          className="text-gray-400 hover:text-red-500 p-0.5 text-xs"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                    <CloudinaryImageUploader
                                      label={`Upload Photo #${idx + 1} (Camera / Gallery)`}
                                      initialImage={imgUrl}
                                      onImageUploaded={(url) => {
                                        const next = [...wizardImagesList];
                                        next[idx] = url;
                                        setWizardImagesList(next);
                                        if (idx === 0) setWizardCoverImage(url);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="or paste URL https://..."
                                      value={imgUrl}
                                      onChange={(e) => {
                                        const next = [...wizardImagesList];
                                        next[idx] = e.target.value;
                                        setWizardImagesList(next);
                                        if (idx === 0) setWizardCoverImage(e.target.value);
                                      }}
                                      className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1 text-[10px] font-mono outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Video Reels with Add Slot button */}
                            <div className="space-y-3 border-t border-dashed border-gray-200 pt-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-bold text-brand-primary uppercase tracking-wider block">
                                  🎬 Video Shorts & Reels ({wizardVideosList.length})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setWizardVideosList([...wizardVideosList, ''])}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-200 transition active:scale-95"
                                >
                                  + Add Video
                                </button>
                              </div>

                              <div className="space-y-2.5 max-h-48 overflow-y-auto p-1">
                                {wizardVideosList.map((vidUrl, idx) => (
                                  <div key={idx} className="bg-gray-50/80 p-2.5 rounded-xl border border-brand-border space-y-1.5 relative">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-gray-700">Video Reel #{idx + 1}</span>
                                      {wizardVideosList.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setWizardVideosList(wizardVideosList.filter((_, i) => i !== idx))}
                                          className="text-gray-400 hover:text-red-500 p-0.5 text-xs"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition active:scale-95">
                                        <span>📹 Pick MP4 Video</span>
                                        <input
                                          type="file"
                                          accept="video/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            showNotification('⏳ Uploading video to Cloudinary...');
                                            try {
                                              const formData = new FormData();
                                              formData.append('file', file);
                                              formData.append('upload_preset', 'ml_default');
                                              formData.append('cloud_name', 'k03rmhkg');
                                              const res = await fetch('https://api.cloudinary.com/v1_1/k03rmhkg/video/upload', {
                                                method: 'POST',
                                                body: formData
                                              });
                                              const data = await res.json();
                                              if (data.secure_url) {
                                                const next = [...wizardVideosList];
                                                next[idx] = data.secure_url;
                                                setWizardVideosList(next);
                                                showNotification('🎉 Video uploaded!');
                                              }
                                            } catch (err) {
                                              showNotification('⚠️ Upload error.');
                                            }
                                          }}
                                        />
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="or YouTube Shorts link (https://...)"
                                        value={vidUrl}
                                        onChange={(e) => {
                                          const next = [...wizardVideosList];
                                          next[idx] = e.target.value;
                                          setWizardVideosList(next);
                                        }}
                                        className="flex-1 bg-white border border-brand-border rounded-lg px-2.5 py-1 text-[10px] font-mono outline-none"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button
                                onClick={() => setVendorWizardStep(3)}
                                className="bg-gray-100 text-brand-text font-bold text-xs py-2.5 rounded-xl transition"
                              >
                                ← Back
                              </button>
                              <button
                                onClick={async () => {
                                  // Assemble and submit vendor document to Firestore
                                  const customId = `v_reg_${Date.now()}`;
                                  
                                  const imagesArr = [
                                    wizardCoverImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600',
                                    wizardImage2 || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
                                    wizardImage3 || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600'
                                  ].filter(Boolean);

                                  const servicesArr = [];
                                  if (wizardService1Name && wizardService1Price) {
                                    servicesArr.push({ name: wizardService1Name, price: Number(wizardService1Price), unit: 'event' });
                                  }
                                  if (wizardService2Name && wizardService2Price) {
                                    servicesArr.push({ name: wizardService2Name, price: Number(wizardService2Price), unit: 'event' });
                                  }
                                  if (servicesArr.length === 0) {
                                    servicesArr.push({ name: 'Standard Event Package', price: Number(wizardBasePrice), unit: 'event' });
                                  }

                                  const featuresArr = wizardFeatures
                                    ? wizardFeatures.split(',').map(f => f.trim()).filter(Boolean)
                                    : ['Highly Professional', 'Timely Service', 'Flexible Budget'];

                                  const newVendorDoc = {
                                    id: customId,
                                    name: wizardName,
                                    category: wizardCategories[0] || wizardCategory || 'Venues',
                                    categories: wizardCategories.length > 0 ? wizardCategories : [wizardCategory || 'Venues'],
                                    tagline: wizardTagline,
                                    description: wizardDescription || `Premium ${wizardCategory} based in ${wizardCity}`,
                                    rating: 4.8,
                                    reviewCount: 1,
                                    trustScore: 90,
                                    distance: 'Local Partner',
                                    responseTime: '< 30 mins',
                                    verified: false,
                                    approved: true, // Live immediately on Home and Explore!
                                    basePrice: Number(wizardBasePrice),
                                    images: imagesArr,
                                    location: wizardCity,
                                    founderName: wizardFounderName || '',
                                    experience: wizardExperience || '',
                                    features: featuresArr,
                                    services: servicesArr,
                                    reviews: [],
                                    bookingsCount: 0,
                                    occasion: ['Wedding', 'Birthday', 'Corporate'],
                                    capacity: wizardMaxCapacity ? Number(wizardMaxCapacity) : 100,
                                    phone: wizardPhone,
                                    whatsapp: wizardWhatsapp || wizardPhone,
                                    videos: wizardVideoUrl ? [wizardVideoUrl] : [],
                                    latitude: wizardLatitude ? Number(wizardLatitude) : undefined,
                                    longitude: wizardLongitude ? Number(wizardLongitude) : undefined
                                  };

                                  try {
                                    const db = getDb();
                                    const { doc, setDoc } = await import('firebase/firestore');
                                    await setDoc(doc(db, 'vendors', customId), newVendorDoc);
                                    
                                    showNotification('🎉 Registration submitted! Wait for Administrator approval.');
                                    setIsRegisteringVendor(false);
                                    
                                    // Reset states
                                    setWizardName('');
                                    setWizardTagline('');
                                    setWizardPhone('');
                                    setWizardWhatsapp('');
                                    setWizardBasePrice('');
                                    setWizardMaxCapacity('');
                                    setWizardService1Name('');
                                    setWizardService1Price('');
                                    setWizardService2Name('');
                                    setWizardService2Price('');
                                    setWizardFounderName('');
                                    setWizardExperience('');
                                    setWizardLatitude('');
                                    setWizardLongitude('');
                                    setWizardDescription('');
                                    setWizardFeatures('');
                                    setWizardCoverImage('');
                                    setWizardImage2('');
                                    setWizardImage3('');
                                    setWizardVideoUrl('');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('❌ Submission failed. Please check internet connection.');
                                  }
                                }}
                                className="bg-brand-success text-white font-extrabold text-xs py-2.5 rounded-xl transition"
                              >
                                Submit Business 🎉
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Secure Secondary Link for System Admin Access */}
              <div className="text-center pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="text-[9.5px] font-semibold text-brand-text-secondary hover:text-brand-primary hover:underline transition"
                >
                  🛡️ System Administrator Secure Login
                </button>
              </div>
            </div>
        </div>
      </div>
    );
  }


  const isDashboardExpanded = false;

  
  // Compute active categories in current city
  const activeCategoriesInCity = categoriesList.filter(cat => 
    vendors.some(v => 
      (v.location || '').toLowerCase().includes((currentCity || '').toLowerCase()) && 
      (v.category || '').toLowerCase() === cat.name.toLowerCase()
    )
  );

  return (
    <div className={`min-h-screen bg-brand-bg flex flex-col mx-auto shadow-2xl relative border-x border-brand-border overflow-hidden pb-24 transition-all duration-500 ${
      isDashboardExpanded ? 'max-w-6xl w-full' : 'max-w-md w-full'
    }`} id="parva-app-container">
      {/* Blocking profile popup removed */ }

      <Helmet>
        <title>{!selectedExploreCategory || selectedExploreCategory === 'all' ? 'Explore Vendors | Parva Events' : `${(selectedExploreCategory || '').charAt(0).toUpperCase() + (selectedExploreCategory || '').slice(1)} Vendors | Parva Events`}</title>
        <meta name="description" content={`Find and book the best ${!selectedExploreCategory || selectedExploreCategory === 'all' ? 'event' : selectedExploreCategory} vendors on Parva Events.`} />
      </Helmet>
      
      {/* 1. TOP APP BAR */}
      <header className="bg-white px-6 py-4 border-b border-brand-border sticky top-0 z-30 flex items-center justify-between" id="top-app-bar">
        {/* Greetings */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary font-bold shadow-inner">
            {getUserInitials(currentUser)}
          </div>
          <div>
            <h1 className="text-xs text-brand-text-secondary font-medium flex items-center gap-1">
              <span>Namaste, {getFirstName(currentUser)}</span>
              <span>👋</span>
            </h1>
            {/* Location selector trigger */}
            <button
              onClick={() => setIsLocationOpen(true)}
              className="flex items-center gap-1 text-brand-text font-bold text-sm hover:text-brand-primary transition mt-0.5"
              id="top-location-trigger"
            >
              <MapPin size={14} className="text-brand-primary" />
              <span>{currentCity}</span>
              <ChevronRight size={14} className="text-brand-primary rotate-90" />
            </button>
          </div>
        </div>

        {/* Action icons right side */}
        <div className="flex items-center gap-1.5">
          {/* Help & Support */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="p-2.5 hover:bg-gray-100 rounded-full text-brand-text transition relative"
            id="support-help-button"
            aria-label="Help and Support"
            title="Help and Support"
          >
            <Headphones size={18} />
          </button>

          {/* Notifications */}
          <button
            onClick={() => {
              setIsNotificationCenterOpen(true);
              if (permissionStatus === 'default') {
                requestNotificationPermission();
              }
            }}
            className="p-2.5 hover:bg-gray-100 rounded-full text-brand-text transition relative"
            id="notification-bell"
            title="Open Notifications & Pop-up Alerts"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-primary text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>


          {/* Cart showing bundle count */}
          <button
            onClick={() => {
              setActiveTab('explore');
              // Smooth scroll to bundler block if any
              setTimeout(() => {
                const element = document.getElementById('bundling-console');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
            className="p-2.5 bg-brand-primary-light text-brand-primary hover:bg-brand-primary hover:text-white rounded-full transition relative shadow-sm"
            id="cart-trigger"
          >
            <ShoppingCart size={18} />
            {bundledItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-primary-dark text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                {bundledItems.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* SUCCESS NOTIFICATION TOAST */}
      <AnimatePresence>
        {successNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-6 right-6 max-w-[340px] mx-auto bg-brand-text text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2.5 border border-white/10"
            id="app-toast-alert"
          >
            <div className="w-5 h-5 rounded-full bg-brand-success flex items-center justify-center text-white shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <p className="text-sm font-semibold tracking-wide flex-1 leading-tight">{successNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DYNAMIC MAIN VIEWPORT */}
      <main className="flex-1 bg-brand-bg px-4 pt-3 pb-32 overflow-x-hidden">
        
        {/* ==================== TAB: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6" id="home-view-container">
            {/* Continuous Animated Category Search Bar */}
            <div className="relative z-40">
              <AnimatedSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categories={categoriesList}
                vendors={vendors}
                currentCity={currentCity}
                onSelectVendor={(v) => handleVendorSelect(v)}
                onSelectCategory={(catName) => {
                  setSelectedExploreCategory(catName);
                  setActiveTab('explore');
                }}
                onOpenVoiceSearch={() => setIsVoiceOpen(true)}
                onOpenFilters={() => setIsFilterModalOpen(true)}
                activeFilterCount={(activeFilterMinPrice !== null ? 1 : 0) + (activeFilterMaxPrice !== null ? 1 : 0) + activeFilterTypes.length + (activeSortOption !== 'Distance' ? 1 : 0)}
              />
            </div>

            {/* Real-time Hero Carousel from Firestore */}
            {promosList.length > 0 && currentPromo && (
              <div className="relative rounded-[24px] overflow-hidden h-[200px] bg-slate-100 group cursor-pointer shadow-sm border border-slate-200/50" onClick={() => setActiveTab('explore')}>
                {promosList.map((promo, idx) => (
                  <div 
                    key={promo.id || idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === safeHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img loading="lazy" 
                      src={promo.image} 
                      className="w-full h-full object-cover mix-blend-darken opacity-90"
                      alt={promo.title || 'Offer'}
                      referrerPolicy="no-referrer"
                    />
                    {/* Native blend overlay to make it look like part of the app */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent mix-blend-overlay"></div>
                  </div>
                ))}
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-6 flex gap-1.5 z-20">
                  {promosList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }}
                      className={`h-1.5 rounded-full transition-all duration-500 ${idx === safeHeroIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Horizontal Scroll Categories */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-brand-text text-base uppercase tracking-wider">Vendor Categories</h3>
                <span className="text-sm text-brand-primary font-semibold hover:underline cursor-pointer">View All</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedExploreCategory(cat.name);
                      setExploreOccasion('all');
                      setActiveTab('explore');
                      trackCategorySelected(cat.name);
                    }}
                    className="flex flex-col items-center shrink-0 snap-center group"
                    id={`home-category-${cat.id}`}
                  >

                    <div className="w-16 h-16 rounded-[24px] overflow-hidden relative shadow-lg border border-white/60 mb-2 bg-gray-100">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-primary/5" />
                    </div>
                    <span className="text-xs font-black text-brand-text uppercase tracking-tighter">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>


            {/* Trending & Featured Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-brand-primary" />
                  <h3 className="font-extrabold text-brand-text text-sm uppercase tracking-wider">Trending Vendors</h3>
                </div>
                <span 
                  onClick={() => { setSelectedExploreCategory('all'); setActiveTab('explore'); }}
                  className="text-xs text-brand-primary font-semibold hover:underline cursor-pointer"
                >
                  See All
                </span>
              </div>
              
              {/* Horizontal list of cards */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
                {isLoadingVendors ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-[280px] shrink-0 snap-center bg-white rounded-[24px] border border-gray-100 p-3 h-[320px] animate-pulse flex flex-col">
                      <div className="w-full h-40 bg-gray-200 rounded-xl mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-auto"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-full mt-4"></div>
                    </div>
                  ))
                ) : (
                  vendors
                    .filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false)
                    .slice(0, 3)
                    .map((vendor) => (
                      <div key={vendor.id} className="w-[280px] shrink-0 snap-center">
                        <VendorCard
                          vendor={vendor}
                          onSelect={(v) => handleVendorSelect(v)}
                          isWishlisted={(wishlist || []).includes(vendor.id)}
                          onToggleWishlist={handleToggleWishlist}
                          layout="horizontal"
                          userCoords={activeOriginCoords}
                        />
                      </div>
                    ))
                )}
                {!isLoadingVendors && vendors.filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false).length === 0 && (
                  <div className="text-center py-8 text-xs text-brand-text-secondary w-full bg-white/50 rounded-2xl border border-brand-border border-dashed">
                    No trending vendors listed in {currentCity} yet.
                  </div>
                )}
              </div>
            </div>

            {/* Section: Top Event Planners Near You */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-brand-text text-sm uppercase tracking-wider">Top Event Planners Near You</h3>
                <span 
                  onClick={() => { setSelectedExploreCategory('Event Planner'); setActiveTab('explore'); }}
                  className="text-xs text-brand-primary font-semibold hover:underline cursor-pointer"
                >
                  View All
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {vendors
                  .filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false && (v.category === 'Event Planner' || v.category === 'Banquet Hall' || v.category === 'Decorator'))
                  .map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      onSelect={(v) => handleVendorSelect(v)}
                      isWishlisted={(wishlist || []).includes(vendor.id)}
                      onToggleWishlist={handleToggleWishlist}
                      layout="grid"
                      userCoords={activeOriginCoords}
                    />
                  ))}
                {vendors.filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false && (v.category === 'Event Planner' || v.category === 'Banquet Hall' || v.category === 'Decorator')).length === 0 && (
                  <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-xs text-brand-text-secondary">
                    No active event planners listed in {currentCity} yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: EXPLORE ==================== */}
        {activeTab === 'explore' && (
          <div className="space-y-5" id="explore-view-container">
            {/* Active Filters Summary Bar */}
            {(activeFilterMinPrice !== null || activeFilterMaxPrice !== null || activeFilterTypes.length > 0 || activeSortOption !== 'Distance') && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-gray-800">Active Filters:</span>
                  {activeSortOption !== 'Distance' && (
                    <span className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                      Sort: {activeSortOption}
                    </span>
                  )}
                  {(activeFilterMinPrice !== null || activeFilterMaxPrice !== null) && (
                    <span className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                      ₹{activeFilterMinPrice || 0} - ₹{activeFilterMaxPrice ? activeFilterMaxPrice.toLocaleString('en-IN') : 'Any'}
                    </span>
                  )}
                  {activeFilterTypes.map(t => (
                    <span key={t} className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setActiveFilterMinPrice(null);
                    setActiveFilterMaxPrice(null);
                    setActiveFilterTypes([]);
                    setActiveSortOption('Distance');
                  }}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}
            {/* Continuous Animated Category Search Bar */}
            <div className="relative z-40">
              <AnimatedSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categories={categoriesList}
                vendors={vendors}
                currentCity={currentCity}
                onSelectVendor={(v) => handleVendorSelect(v)}
                onSelectCategory={(catName) => setSelectedExploreCategory(catName)}
                onOpenVoiceSearch={() => setIsVoiceOpen(true)}
                onOpenFilters={() => setIsFilterModalOpen(true)}
                activeFilterCount={(activeFilterMinPrice !== null ? 1 : 0) + (activeFilterMaxPrice !== null ? 1 : 0) + activeFilterTypes.length + (activeSortOption !== 'Distance' ? 1 : 0)}
              />
            </div>

            {/* Quick Pill Categories for filtering */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedExploreCategory('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  selectedExploreCategory === 'all'
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                    : 'bg-white border border-brand-border text-brand-text hover:bg-gray-50'
                }`}
                id="cat-pill-all"
              >
                All Services
              </button>
              {categoriesList.map((catObj) => (
                <button
                  key={catObj.id}
                  onClick={() => {
                    setSelectedExploreCategory(catObj.name);
                    trackCategorySelected(catObj.name);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                    selectedExploreCategory.toLowerCase() === catObj.name.toLowerCase()
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                      : 'bg-white border border-brand-border text-brand-text hover:bg-gray-50'
                  }`}
                  id={`cat-pill-${catObj.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {catObj.name}
                </button>
              ))}

            </div>


            {/* Interactive Filters (Collapsible to reduce UI complexity) */}
            <div className="bg-white rounded-2xl border border-brand-border p-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex justify-between items-center text-sm font-bold text-gray-800"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-brand-primary" />
                  Apply Filters & Sorting
                </div>
                {showFilters ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              
              {showFilters && (
                <div className="pt-4 mt-4 border-t border-dashed border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  
                  {/* Event Period */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Calendar size={16} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Select Event Period</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 border border-brand-border rounded-xl p-2.5">
                      <p className="text-[8px] text-brand-text-secondary font-black uppercase tracking-wider mb-1">Starts</p>
                      <input 
                        type="date"
                        value={planningStartDate}
                        onChange={(e) => setPlanningStartDate(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-[11px] font-extrabold text-brand-text cursor-pointer min-w-0"
                      />
                    </div>
                    <div className="bg-gray-50/50 border border-brand-border rounded-xl p-2.5">
                      <p className="text-[8px] text-brand-text-secondary font-black uppercase tracking-wider mb-1">Ends</p>
                      <input 
                        type="date"
                        value={planningEndDate}
                        onChange={(e) => setPlanningEndDate(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-[11px] font-extrabold text-brand-text cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* Estimated Guest Size */}
                  <div className="pt-2 border-t border-dashed border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">Guest Size</span>
                      <span className="font-bold text-brand-primary">{planningGuestSize} Guests</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="2000" 
                      step="10"
                      value={planningGuestSize}
                      onChange={(e) => setPlanningGuestSize(Number(e.target.value))}
                      className="w-full accent-brand-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  
                  <div className="w-full h-px border-t border-dashed border-gray-100 my-2"></div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-brand-text-secondary uppercase tracking-wider">Starting Price Cap</span>
                    <span className="font-bold text-brand-primary">₹{priceRange >= 100000 ? `${(priceRange / 100000).toFixed(1)} Lakh` : priceRange.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="250000"
                    step="5000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                    <span className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">Sort by</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {(['trust', 'rating', 'priceAsc'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setSortBy(mode); setShowFilters(false); }}
                          className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border transition ${
                            sortBy === mode
                              ? 'bg-brand-primary-light border-brand-primary/20 text-brand-primary-dark'
                              : 'bg-white border-brand-border text-brand-text-secondary hover:text-brand-text'
                          }`}
                        >
                          {mode === 'trust' ? 'Trust Score' : mode === 'rating' ? 'Rating' : 'Price: Low-High'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Results count & listings */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
                  {isLoadingVendors ? 'Searching...' : `Available Matches (${filteredVendors.length})`}
                </span>
                <span className="text-[10px] text-brand-text-secondary">Location: {currentCity}</span>
              </div>

              {isLoadingVendors ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[24px] border border-gray-100 p-3 h-[320px] animate-pulse flex flex-col">
                      <div className="w-full h-40 bg-gray-200 rounded-xl mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-auto"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-full mt-4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
                  <p className="text-sm font-medium text-brand-text mb-1">No matching vendors found</p>
                  <p className="text-xs text-brand-text-secondary mb-4">Try clearing filter parameters or expanding search terms.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedExploreCategory('all');
                      setPriceRange(250000);
                    }}
                    className="text-xs font-bold text-brand-primary underline"
                    id="reset-filters-btn"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVendors.map((vendor, i) => {
                    const isAvailable = isVendorAvailable(vendor.id, planningStartDate, planningEndDate, vendors);

                    return (
                      <VendorCard
                        key={vendor.id}
                        rankIndex={i}
                        vendor={vendor}
                        onSelect={(v) => handleVendorSelect(v)}
                        isWishlisted={(wishlist || []).includes(vendor.id)}
                        onToggleWishlist={handleToggleWishlist}
                        layout="grid"
                        planningDate={planningStartDate}
                        isAvailable={isAvailable}
                        userCoords={activeOriginCoords}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: BOOKINGS ==================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-5" id="bookings-view-container">
            
            {/* Draft Selection Bundle (Add to Cart Bookings) */}
            {bundledItems.length > 0 && (
              <div className="bg-gradient-to-br from-[#FCFBF8] to-[#FFFBF0] border border-brand-primary/25 rounded-[24px] p-5 shadow-sm space-y-4" id="bookings-cart-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white shrink-0">
                      <ShoppingCart size={15} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-brand-text text-xs leading-tight">Draft Selection Bundle</h4>
                      <p className="text-[10px] text-brand-text-secondary mt-0.5">Ready to review & book instantly</p>
                    </div>
                  </div>
                  <span className="bg-brand-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {bundledItems.length} Added
                  </span>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {bundledItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-brand-border rounded-xl p-3 text-xs shadow-sm">
                      <div className="min-w-0 pr-2">
                        <span className="font-extrabold text-brand-text truncate block">{item.service.name}</span>
                        <span className="text-[9px] text-brand-text-secondary uppercase tracking-wider block mt-0.5">{item.vendor.name} • {item.vendor.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <div>
                          <span className="font-extrabold text-brand-text block">
                            ₹{(item.vendor.category === 'Catering' ? item.service.price * (planningGuestSize || 100) : item.service.price).toLocaleString('en-IN')}
                          </span>
                          {item.vendor.category === 'Catering' && (
                            <span className="text-[8px] font-bold text-amber-800 block">
                              ₹{item.service.price}/plt × {planningGuestSize || 100} Guests
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveServiceFromBundle(item.vendor.id, item.service.name)}
                          className="text-brand-primary hover:text-brand-primary-dark p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Event Schedule Confirmation (Date & AM/PM Time Slot) */}
                <div className="bg-white border border-brand-primary/20 rounded-2xl p-3.5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={15} className="text-brand-primary" />
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-text">Event Date & Time Slot</h5>
                    </div>
                    <span className="text-[9px] font-extrabold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
                      Required for Booking
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Event Date Picker */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                      <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
                        Select Event Date
                      </label>
                      <input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={planningStartDate}
                        onChange={(e) => setPlanningStartDate(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs font-black text-brand-text cursor-pointer"
                      />
                    </div>

                    {/* Selected Slot Indicator */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex flex-col justify-center">
                      <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">
                        Current Selection
                      </span>
                      <span className="text-xs font-black text-brand-primary truncate">
                        {planningStartDate} • {formatTimeSlot(planningTimeSlot)}
                      </span>
                    </div>
                  </div>

                  {/* AM/PM Time Slot Pills */}
                  <div>
                    <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mb-1.5">
                      Choose Event Time Slot
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = planningTimeSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setPlanningTimeSlot(slot.id)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              isSelected
                                ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20 scale-[1.02]'
                                : 'bg-white border-gray-200 hover:border-brand-primary/50 text-gray-800'
                            }`}
                          >
                            <span className={`text-[11px] font-black block ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {slot.label}
                            </span>
                            <span className={`text-[8.5px] font-medium block mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              {slot.time}
                            </span>
                          </button>
                        );
                      })}

                    </div>
                  </div>

                  {/* Real-time Availability Check */}
                  {(() => {
                    const unavailableVendors = bundledItems.filter(item => 
                      !isVendorAvailable(item.vendor.id, planningStartDate, undefined, vendors, planningTimeSlot)
                    );
                    if (unavailableVendors.length > 0) {
                      return (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 font-bold flex items-center gap-2">
                          <span>⚠️</span>
                          <span>{unavailableVendors[0].vendor.name} is not available on {planningStartDate} ({formatTimeSlot(planningTimeSlot)}). Please choose another date/slot.</span>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>All vendors in your cart are available for {planningStartDate} ({formatTimeSlot(planningTimeSlot)})!</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Contact information validation before paying connection fees */}
                <div className="border-t border-brand-border/40 pt-3.5 space-y-2.5">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-brand-text flex items-center gap-1">
                    <User size={12} className="text-brand-primary" />
                    <span>User Connection Details</span>
                  </h5>

                  {currentUser ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">
                      <p className="font-extrabold">✓ Logged in as: {getUserName(currentUser)}</p>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5">Phone: {currentUser.phone || 'N/A'} | Email: {currentUser.email || 'N/A'}</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] text-amber-800 font-semibold leading-normal">
                        ⚠️ Please provide your connection details. This info is automatically shared with the vendor to connect you on WhatsApp!
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          id="cart-user-name"
                          className="bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-primary"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="tel"
                            placeholder="WhatsApp Number"
                            id="cart-user-phone"
                            className="bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-primary"
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            id="cart-user-email"
                            className="bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Code Integration */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-2">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-brand-text">🎟️ Have a Coupon?</h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10, FREE99"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-white border border-brand-border rounded-lg px-2.5 py-1 text-xs outline-none focus:border-brand-primary font-bold uppercase tracking-wider"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-brand-primary-dark transition shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-[9px] font-bold ${couponApplied ? 'text-brand-success' : 'text-brand-primary'}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Estimate checkout total and Connection Fee Details */}
                {(() => {
                  const servicesTotal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
                  const calculatedBookingFee = Math.round(servicesTotal * (bookingFeePercentage / 100));
                  const gstAmount = Math.round(calculatedBookingFee * 0.18);
                  const finalPayableTotal = Math.max(0, calculatedBookingFee + gstAmount - couponDiscount);

                  return (
                    <div className="border-t border-dashed border-gray-100 pt-3 space-y-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>SERVICES EVENT VALUE:</span>
                          <span className="font-bold text-gray-800">₹{servicesTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>DIRECT CONNECTION / BOOKING ADVANCE FEE ({bookingFeePercentage}%):</span>
                          <span className="font-bold text-gray-800">₹{calculatedBookingFee.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>GST (18%):</span>
                          <span className="font-bold text-gray-800">₹{gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {couponDiscount > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 font-bold">
                            <span>COUPON DISCOUNT:</span>
                            <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-brand-primary-light/30 p-3 rounded-xl border border-brand-primary/10">
                        <div>
                          <span className="text-[9px] text-brand-primary-dark uppercase tracking-wider block font-black">Total Amount Due</span>
                          <span className="font-black text-brand-primary-dark text-base">
                            ₹{finalPayableTotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            let targetUser = currentUser;
                            if (!targetUser) {
                              const nameEl = document.getElementById('cart-user-name') as HTMLInputElement;
                              const phoneEl = document.getElementById('cart-user-phone') as HTMLInputElement;
                              const emailEl = document.getElementById('cart-user-email') as HTMLInputElement;

                              if (!nameEl?.value || !phoneEl?.value || !emailEl?.value) {
                                showNotification('⚠️ Please enter all connection details to unlock direct contact! 📲');
                                return;
                              }

                              const newUserObj = {
                                name: nameEl.value,
                                phone: phoneEl.value,
                                email: emailEl.value,
                                city: currentCity
                              };
                              setCurrentUser(newUserObj);
                              localStorage.setItem('parva_user', JSON.stringify(newUserObj));
                              targetUser = newUserObj;
                            }

                            const discountVal = bundledItems.length >= 4 ? Math.round(servicesTotal * 0.22) : bundledItems.length === 3 ? Math.round(servicesTotal * 0.15) : bundledItems.length === 2 ? Math.round(servicesTotal * 0.08) : 0;
                            const finalVal = servicesTotal - discountVal;

                            const newBooking: Booking = {
                              id: `b-new-${Date.now()}`,
                              vendor: bundledItems[0].vendor,
                              selectedServices: bundledItems.map(item => item.service),
                              eventDate: planningStartDate,
                              eventTimeSlot: planningTimeSlot || 'evening',
                              eventType: planningEventType,
                              status: 'Pending',
                              totalPrice: servicesTotal,
                              bundleDiscount: discountVal,
                              finalPrice: finalVal,
                              paymentStatus: 'Paid',
                              bookingIdString: `PRV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`
                            };


                            handlePayWithRazorpay({
                              vendorId: newBooking.vendor.id,
                              type: 'booking',
                              amount: finalPayableTotal,
                              bookingData: newBooking
                            });
                          }}
                          className="bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md shadow-brand-primary/10 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                        >
                          <span>Pay Booking Fee & Confirm</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="text-brand-primary" />
              <h3 className="font-extrabold text-brand-text text-base">Your Active Bookings</h3>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-brand-border p-10 text-center shadow-sm flex flex-col items-center">
                <img loading="lazy" 
                  src="/no-bookings.jpg" 
                  alt="No active bookings" 
                  className="w-full h-auto max-w-[280px] mx-auto mb-4 object-contain mix-blend-multiply"
                />
                <p className="text-sm font-semibold text-brand-text mb-1">No active bookings yet</p>
                <p className="text-xs text-brand-text-secondary mb-6 max-w-[240px] mx-auto">Add services to your bundle and book to track them live!</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="bg-brand-primary text-white px-8 py-3 rounded-xl text-xs font-bold transition shadow-md shadow-brand-primary/15 active:scale-95"
                >
                  Explore Vendors
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const isCompleted = b.status === 'Completed';
                  const isPending = b.status === 'Pending';
                  
                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-[24px] border border-brand-border p-5 shadow-sm overflow-hidden relative"
                      id={`booking-card-${b.id}`}
                    >
                      {/* Top row */}
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary-light text-brand-primary-dark">
                              {b.eventType}
                            </span>
                            <span className="text-[11px] font-mono text-brand-text-secondary">
                              ID: {b.bookingIdString}
                            </span>
                          </div>
                          <h4 className="font-bold text-brand-text text-sm mt-1">
                            {b.vendor.name}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isCompleted
                            ? 'bg-brand-success/10 text-brand-success'
                            : isPending
                            ? 'bg-brand-warning/10 text-brand-warning animate-pulse'
                            : 'bg-brand-primary-light text-brand-primary-dark'
                        }`}>
                          {b.status === 'Pending' ? 'Awaiting Confirmation' : b.status}
                        </span>
                      </div>

                      {/* Detailed list of services booked */}
                      <div className="space-y-2 mb-4">
                        <span className="text-[10px] font-semibold text-brand-text-secondary uppercase tracking-wider block">
                          Booked Services
                        </span>
                        {b.selectedServices.map((svc) => (
                          <div key={svc.name} className="flex justify-between items-center text-xs">
                            <span className="text-brand-text font-medium">{svc.name}</span>
                            <span className="font-bold text-brand-text">₹{svc.price.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Timeline status bar */}
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mb-4">
                        <span className="text-[9px] font-semibold text-brand-text-secondary uppercase tracking-wider block mb-2.5">
                          Booking Progress Tracker
                        </span>

                        <div className="relative flex justify-between items-center px-1">
                          {/* Horizontal backing line */}
                          <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                          <div
                            className="absolute top-1/2 left-3 h-0.5 bg-brand-success -translate-y-1/2 z-0 transition-all duration-500"
                            style={{
                              width: isCompleted ? '100%' : isPending ? '0%' : '50%'
                            }}
                          />

                          {/* Phase Steps */}
                          {[
                            { name: 'Request', active: true, done: !isPending },
                            { name: 'Vendor Match', active: !isPending, done: isCompleted },
                            { name: 'Celebration', active: isCompleted, done: isCompleted }
                          ].map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                step.done 
                                  ? 'bg-brand-success text-white' 
                                  : step.active 
                                  ? 'bg-brand-primary text-white border-2 border-white' 
                                  : 'bg-white border-2 border-gray-300 text-gray-400'
                              }`}>
                                {step.done ? '✓' : idx + 1}
                              </div>
                              <span className="text-[9px] font-medium text-brand-text-secondary mt-1">
                                {step.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price and Action details */}
                      <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3 text-xs">
                        <div>
                          <p className="text-[10px] text-brand-text-secondary">Invoice Total</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-extrabold text-brand-primary-dark text-base">
                              ₹{b.finalPrice.toLocaleString('en-IN')}
                            </span>
                            {b.bundleDiscount > 0 && (
                              <span className="text-[9px] text-brand-success font-medium">
                                (Saved ₹{b.bundleDiscount.toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleSelectThread(b.vendor.id)}
                            className="border border-brand-border hover:border-brand-primary text-brand-text font-semibold py-1.5 px-2.5 rounded-lg hover:bg-gray-50 transition text-xs"
                            id={`contact-vendor-booking-${b.id}`}
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => {
                              setSharingBooking(b);
                              setIsShareOpen(true);
                            }}
                            className="bg-emerald-55 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold py-1.5 px-2.5 rounded-lg transition text-xs flex items-center gap-1"
                            id={`share-booking-btn-${b.id}`}
                          >
                            <Share2 size={11} />
                            <span>Share</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReceiptPDF(b)}
                            className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-1.5 px-2.5 rounded-lg transition text-xs flex items-center gap-1.5"
                            id={`view-receipt-booking-${b.id}`}
                          >
                            <Download size={11} />
                            <span>Download Receipt</span>
                          </button>
                          {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to cancel this booking request?')) {
                                  try {
                                    showNotification('⏳ Processing cancellation request...');
                                    const cRes = await fetch(`${BACKEND_API_URL}/api/bookings/${b.id}/cancel`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        reason: 'Customer requested cancellation from Bookings Tab',
                                        customer: { name: currentUser?.name, email: currentUser?.email, phone: currentUser?.phone },
                                        vendor: b.vendor
                                      })
                                    });
                                    const cData = await cRes.json();
                                    if (cData.success) {
                                      showNotification('✓ Booking Cancelled successfully. Email notice dispatched.');
                                      trackBookingCancelled(b.id, 'Customer requested cancellation');
                                      setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'Cancelled' } : item));
                                    } else {

                                      showNotification('❌ Cancellation error: ' + (cData.error || 'Server rejected'));
                                    }
                                  } catch (e) {
                                    showNotification('❌ Could not process cancellation.');
                                  }
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-1.5 px-2.5 rounded-lg transition text-xs"
                              id={`cancel-booking-btn-${b.id}`}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            )}
          </div>
        )}

        {/* ==================== TAB: MESSAGES ==================== */}
        {activeTab === 'messages' && (
          <div className="h-[calc(100vh-140px)] flex flex-col" id="messages-view-container">
            {activeChatVendorId ? (
              /* ACTIVE INTERACTIVE CHAT SCREEN */
              (() => {
                const thread = chatThreads.find((t) => t.vendor.id === activeChatVendorId);
                if (!thread) return null;

                const messages = [...INITIAL_CHAT_MESSAGES.filter((m) => m.vendorId === activeChatVendorId), ...chatMessages.filter((m) => m.vendorId === activeChatVendorId)].sort((a,b) => (a.timestamp > b.timestamp ? 1 : -1));

                return (
                  <div className="flex-1 flex flex-col h-full bg-white rounded-3xl border border-brand-border overflow-hidden">
                    {/* Chat Header */}
                    <div className="bg-white px-4 py-3 border-b border-brand-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setActiveChatVendorId(null)}
                          className="p-1 hover:bg-gray-100 rounded-full text-brand-text"
                          id="chat-back-btn"
                        >
                          <X size={18} />
                        </button>
                        <img loading="lazy"
                          src={thread.vendor.images[0]}
                          alt={thread.vendor.name}
                          className="w-8 h-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-brand-text text-xs leading-tight">
                            {thread.vendor.name}
                          </h4>
                          <span className="text-[9px] text-brand-success font-semibold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-ping" />
                            <span>Online • Responds fast</span>
                          </span>
                        </div>
                      </div>

                      {/* View details quick launch */}
                      <button
                        onClick={() => setSelectedVendor(thread.vendor)}
                        className="text-[10px] text-brand-primary font-bold hover:underline"
                        id="chat-view-vendor-details"
                      >
                        View Info
                      </button>
                    </div>

                    {/* Chat message listing scrollpane */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {messages.map((m) => {
                        const isUser = m.sender === 'user';
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                                isUser
                                  ? 'bg-brand-primary text-white rounded-tr-none'
                                  : 'bg-white text-brand-text border border-brand-border rounded-tl-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                              <span className={`text-[8px] mt-1 block text-right ${isUser ? 'text-white/70' : 'text-brand-text-secondary'}`}>
                                {m.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Vendor typing placeholder */}
                      {isVendorTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-brand-border rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-0" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-150" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-300" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sample Suggested Quick Prompts to make it extremely interactive */}
                    <div className="bg-white p-2 border-t border-brand-border flex gap-1.5 overflow-x-auto no-scrollbar">
                      {[
                        'Can you send a full invoice?',
                        'Is our date available?',
                        'Let’s schedule a walkthrough!'
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => setNewMessageText(promptText)}
                          className="bg-gray-100 hover:bg-brand-primary-light text-brand-text border border-gray-200/60 rounded-xl px-2.5 py-1.5 text-[10px] font-medium shrink-0 transition"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input row */}
                    <div className="bg-white p-3 border-t border-brand-border flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ask anything about packages, date availability..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-gray-50 border border-brand-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none py-2.5 px-3.5 rounded-xl text-xs font-medium text-brand-text"
                        id="chat-input-field"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl transition shadow-md shadow-brand-primary/25 shrink-0"
                        id="chat-send-btn"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* LIST CHAT CONVERSATIONS VIEW */
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-extrabold text-brand-text text-base">Direct Messages</h3>
                  <span className="bg-brand-primary-light text-brand-primary-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Fast Responses
                  </span>
                </div>

                <div className="space-y-2">
                  {chatThreads.map((thread) => (
                    <div
                      key={thread.vendor.id}
                      onClick={() => handleSelectThread(thread.vendor.id)}
                      className="bg-white rounded-2xl border border-brand-border p-3.5 flex items-center justify-between cursor-pointer hover:border-brand-primary/45 transition shadow-sm"
                      id={`chat-thread-${thread.vendor.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative">
                          <img loading="lazy"
                            src={thread.vendor.images[0]}
                            alt={thread.vendor.name}
                            className="w-11 h-11 rounded-full object-cover border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-success border-2 border-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-brand-text text-xs truncate">
                              {thread.vendor.name}
                            </h4>
                            <span className="text-[9px] text-brand-text-secondary">
                              {thread.lastMessage.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-text-secondary truncate pr-2">
                            {thread.lastMessage.text}
                          </p>
                        </div>
                      </div>

                      {/* Unread indicator / Actions */}
                      {thread.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-brand-primary-light/40 rounded-2xl p-4 border border-brand-primary/10 flex items-start gap-3">
                  <Info className="text-brand-primary mt-0.5 shrink-0" size={16} />
                  <div>
                    <h5 className="font-semibold text-brand-primary-dark text-xs">Direct Support</h5>
                    <p className="text-[11px] text-brand-text-secondary leading-relaxed mt-0.5">
                      Need custom quotes or high-volume corporate contracts? Let our master event concierges coordinate everything. Click live chat or call anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6" id="profile-view-container">
            
              {/* ACCOUNT LOGGED IN VIEW */}
              <div className="space-y-6">
                
                {currentUser?.role === 'vendor' ? (
                  /* 💼 Bespoke Vendor Control Dashboard */
                  <div className="space-y-6" id="vendor-portal-container">
                    {/* Vendor Header info card */}
                    <div className="bg-white rounded-[24px] border border-brand-border p-5 text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-indigo-500/10 to-brand-primary/20" />
                      
                      <div className="relative pt-6 flex flex-col items-center">
                        <div className="w-18 h-18 rounded-full border-4 border-white bg-brand-primary text-white text-2xl font-extrabold flex items-center justify-center shadow-md mb-2.5">
                          {getUserInitials(currentUser)}
                        </div>
                        <h3 className="font-bold text-brand-text text-base">{currentUser?.name || 'Partner'}</h3>
                        <p className="text-xs text-brand-primary font-black mt-0.5">
                          MYPARVA PARTNER PORTAL 💼
                        </p>
                        <span className="text-[10px] bg-slate-900 text-amber-400 font-extrabold tracking-widest px-2.5 py-0.5 rounded-full mt-2">
                          ID: {currentUser?.vendorId || 'N/A'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          localStorage.removeItem('parva_user');
                          showNotification('Vendor logged out safely.');
                        }}
                        className="mt-5 text-xs font-bold text-brand-danger hover:underline"
                      >
                        🚪 Log Out Vendor Hub
                      </button>
                    </div>

                    {/* Vendor Sub-Tab selection */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-gray-50 rounded-xl border border-brand-border">
                      <button
                        onClick={() => setVendorSubTab('bookings')}
                        className={`py-2 rounded-lg text-xs font-black transition ${
                          vendorSubTab === 'bookings'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text'
                        }`}
                      >
                        Orders ({bookings.filter(b => b.vendor?.id === currentUser?.vendorId || (b as any).vendorId === currentUser?.vendorId).length})
                      </button>
                      <button
                        onClick={() => setVendorSubTab('catalogue')}
                        className={`py-2 rounded-lg text-xs font-black transition ${
                          vendorSubTab === 'catalogue'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text'
                        }`}
                      >
                        Catalogue
                      </button>
                      <button
                        onClick={() => setVendorSubTab('dates_leads')}
                        className={`py-2 rounded-lg text-xs font-black transition ${
                          vendorSubTab === 'dates_leads'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text'
                        }`}
                      >
                        Calendar
                      </button>
                    </div>

                    {/* SUB-TAB 0: DIRECT BOOKINGS & ORDERS */}
                    {vendorSubTab === 'bookings' && (
                      <div className="space-y-4 text-xs">
                        <div className="bg-white rounded-[24px] border border-brand-border p-5 space-y-3.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h4 className="font-black text-brand-primary uppercase tracking-wider text-[10px]">
                              Direct Customer Orders ({bookings.filter(b => b.vendor?.id === currentUser?.vendorId || (b as any).vendorId === currentUser?.vendorId).length})
                            </h4>
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border border-emerald-100">
                              Payment Secured
                            </span>
                          </div>

                          {bookings.filter(b => b.vendor?.id === currentUser?.vendorId || (b as any).vendorId === currentUser?.vendorId).length === 0 ? (
                            <div className="text-center py-8 space-y-1.5">
                              <p className="text-sm font-bold text-gray-700">No active direct orders yet.</p>
                              <p className="text-[11px] text-gray-400">When customers book your services and complete payment, their orders will appear here instantly for your review and confirmation!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {bookings.filter(b => b.vendor?.id === currentUser?.vendorId || (b as any).vendorId === currentUser?.vendorId).map((b) => (
                                <div key={b.id} className="bg-gray-50/80 rounded-2xl p-4 border border-brand-border space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-black text-brand-text text-sm">{b.customerName || 'Valued Customer'}</h5>
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                          b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                          b.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                          b.status === 'Cancelled' ? 'bg-gray-200 text-gray-700' :
                                          'bg-amber-100 text-amber-800'
                                        }`}>
                                          {b.status}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-brand-text-secondary mt-0.5">
                                        Phone: <a href={`tel:${b.customerPhone}`} className="font-bold text-brand-primary">{b.customerPhone || 'N/A'}</a> • Email: <b>{b.customerEmail || 'N/A'}</b>
                                      </p>
                                    </div>
                                    <span className="font-black text-brand-primary text-sm">
                                      ₹{Number(b.finalPrice || b.totalPrice || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>

                                  <div className="bg-white rounded-xl p-3 border border-gray-200/70 space-y-1.5">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Event Date</span>
                                        <span className="font-extrabold text-gray-800">{b.eventDate}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Time Slot</span>
                                        <span className="font-extrabold text-brand-primary">{formatTimeSlot(b.eventTimeSlot)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Event Type</span>
                                        <span className="font-bold text-gray-700">{b.eventType || 'Celebration'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Guests</span>
                                        <span className="font-bold text-gray-700">{b.guestCount || 100} Guests</span>
                                      </div>
                                    </div>

                                    {b.selectedServices && b.selectedServices.length > 0 && (
                                      <div className="border-t border-gray-100 pt-2 mt-2">
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block mb-1">Selected Services</span>
                                        <div className="space-y-1">
                                          {b.selectedServices.map((svc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-[10px]">
                                              <span className="text-gray-700 font-semibold">• {svc.name} {svc.unit ? `(${svc.unit})` : ''}</span>
                                              <span className="font-mono font-bold text-gray-900">₹{Number(svc.price).toLocaleString('en-IN')}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons for Vendor */}
                                  <div className="flex gap-2 pt-1">
                                    {b.customerPhone && (
                                      <a
                                        href={`https://wa.me/91${b.customerPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                                      >
                                        💬 WhatsApp
                                      </a>
                                    )}

                                    {b.status !== 'Rejected' && b.status !== 'Cancelled' && (
                                      <>
                                        {b.status !== 'Confirmed' && (
                                          <button
                                            onClick={async () => {
                                              try {
                                                showNotification('⏳ Confirming booking acceptance...');
                                                const res = await fetch(`${BACKEND_API_URL}/api/vendor/bookings/${b.id}/respond`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    action: 'accept',
                                                    vendorId: currentUser.vendorId
                                                  })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                  showNotification('🎉 Order accepted! Customer notified.');
                                                  setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'Confirmed' } : item));
                                                } else {
                                                  showNotification('❌ ' + (data.error || 'Could not accept order'));
                                                }
                                              } catch (e) {
                                                showNotification('❌ Network error accepting order');
                                              }
                                            }}
                                            className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black py-1.5 px-3.5 rounded-xl text-xs transition"
                                          >
                                            ✓ Accept Order
                                          </button>
                                        )}

                                        <button
                                          onClick={async () => {
                                            const reason = window.prompt('Please enter the reason for rejecting this order (e.g. fully booked):');
                                            if (reason !== null) {
                                              try {
                                                showNotification('⏳ Processing rejection & refund request...');
                                                const res = await fetch(`${BACKEND_API_URL}/api/vendor/bookings/${b.id}/respond`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    action: 'reject',
                                                    vendorId: currentUser.vendorId,
                                                    reason: reason || 'Vendor schedule conflict'
                                                  })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                  showNotification('⚠️ Order rejected. Refund request submitted for support@parvaevents.com.');
                                                  setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'Rejected' } : item));
                                                } else {
                                                  showNotification('❌ ' + (data.error || 'Could not reject order'));
                                                }
                                              } catch (e) {
                                                showNotification('❌ Network error rejecting order');
                                              }
                                            }
                                          }}
                                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-1.5 px-3 rounded-xl text-xs transition"
                                        >
                                          Decline Order
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 1: CATALOGUE & PORTFOLIO */}
                    {vendorSubTab === 'catalogue' && (
                      <div className="bg-white rounded-[24px] border border-brand-border p-5 space-y-4 animate-in fade-in duration-200 text-xs">
                        <h4 className="font-black text-brand-primary uppercase tracking-wider text-[10px]">Edit Business Profile</h4>

                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Business Display Name</label>
                            <input
                              type="text"
                              value={vendorEditName}
                              onChange={(e) => setVendorEditName(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Brand Tagline / Specialty</label>
                            <input
                              type="text"
                              value={vendorEditTagline}
                              onChange={(e) => setVendorEditTagline(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Business Biography / Experience</label>
                            <textarea
                              rows={3}
                              value={vendorEditDesc}
                              onChange={(e) => setVendorEditDesc(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 outline-none font-medium focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Phone Number</label>
                              <input
                               type="text"
                                value={vendorEditPhone}
                                onChange={(e) => setVendorEditPhone(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">WhatsApp No.</label>
                              <input
                                type="text"
                                value={vendorEditWhatsapp}
                                onChange={(e) => setVendorEditWhatsapp(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Instagram Link</label>
                              <input
                                type="text"
                                value={vendorEditInsta}
                                onChange={(e) => setVendorEditInsta(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Founder Name</label>
                              <input
                                type="text"
                                value={vendorEditFounder}
                                onChange={(e) => setVendorEditFounder(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                                placeholder="e.g. Aditya Deshmukh"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Experience</label>
                              <input
                                type="text"
                                value={vendorEditExperience}
                                onChange={(e) => setVendorEditExperience(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                                placeholder="e.g. 10 Years"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase block mb-1">Founder Profile Image URL</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={vendorEditFounderImage}
                                onChange={(e) => setVendorEditFounderImage(e.target.value)}
                                className="flex-1 bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white text-xs text-brand-text"
                                placeholder="https://images.unsplash.com/..."
                              />
                              {vendorEditFounderImage && (
                                <img loading="lazy" 
                                  src={vendorEditFounderImage} 
                                  className="w-8 h-8 rounded-full object-cover border border-brand-border shrink-0" 
                                  alt="Founder Profile Preview"
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'; }}
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Reels & Videos (Comma separated URLs)</label>
                            <input
                              type="text"
                              value={vendorEditVideos}
                              onChange={(e) => setVendorEditVideos(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 outline-none font-semibold focus:bg-white"
                              placeholder="https://youtube.com/..., https://instagram.com/reels/..."
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase mb-2 block">Service Occasions / Events Handled</label>
                            <div className="flex flex-wrap gap-2">
                              {['Wedding', 'Engagement', 'Birthday', 'Corporate', 'Anniversary', 'Baby Shower', 'Pre-Wedding', 'Other'].map(occ => {
                                const isSelected = vendorEditOccasions.includes(occ);
                                return (
                                  <button
                                    key={occ}
                                    onClick={() => {
                                      setVendorEditOccasions(prev => 
                                        isSelected ? prev.filter(o => o !== occ) : [...prev, occ]
                                      );
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-sm' : 'bg-gray-50 text-brand-text-secondary border-brand-border hover:bg-gray-100'}`}
                                  >
                                    {occ}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                const db = getDb();
                                const currentVendorDoc = vendors.find(item => item.id === currentUser.vendorId);
                                if (currentVendorDoc) {
                                  const updatedVendor = {
                                    ...currentVendorDoc,
                                    name: vendorEditName,
                                    tagline: vendorEditTagline,
                                    description: vendorEditDesc,
                                    phone: vendorEditPhone,
                                    whatsapp: vendorEditWhatsapp,
                                    instagram: vendorEditInsta,
                                    occasion: vendorEditOccasions,
                                    videos: vendorEditVideos ? vendorEditVideos.split(',').map(vid => vid.trim()).filter(Boolean) : [],
                                    founderName: vendorEditFounder,
                                    experience: vendorEditExperience,
                                    founderImage: vendorEditFounderImage
                                  };
                                  await setDoc(doc(db, 'vendors', currentUser.vendorId), updatedVendor);
                                  showNotification('✨ Business details successfully synced to Firestore!');
                                }
                              } catch (err) {
                                console.error(err);
                                showNotification('❌ Error syncing details.');
                              }
                            }}
                            className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl text-xs hover:bg-brand-primary-dark transition"
                          >
                            Sync Business Profile
                          </button>
                        </div>

                        {/* Portfolio Image Manager */}
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                          <h4 className="font-black text-brand-primary uppercase tracking-wider text-[10px]">Portfolio Showcase</h4>
                          
                          {/* List existing images */}
                          <div className="grid grid-cols-3 gap-2">
                            {(vendors.find(v => v.id === currentUser?.vendorId)?.images || []).map((imgUrl, i) => (
                              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-brand-border bg-gray-50">
                                <img loading="lazy" src={imgUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'; }} />
                                <button
                                  onClick={async () => {
                                    try {
                                      const v = vendors.find(item => item.id === currentUser.vendorId);
                                      if (v) {
                                        const updatedImgs = v.images.filter((_, idx) => idx !== i);
                                        const db = getDb();
                                        await setDoc(doc(db, 'vendors', currentUser.vendorId), {
                                          ...v,
                                          images: updatedImgs
                                        });
                                        showNotification('🗑️ Portfolio image deleted.');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                                  title="Delete Image"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Direct Phone Camera / Cloudinary Uploader */}
                          <div className="pt-2">
                            <CloudinaryImageUploader
                              label="📷 Take Phone Photo or Upload Portfolio Image"
                              onImageUploaded={async (uploadedUrl) => {
                                if (!uploadedUrl) return;
                                try {
                                  const v = vendors.find(item => item.id === currentUser.vendorId);
                                  if (v) {
                                    const updatedImgs = [...(v.images || []), uploadedUrl];
                                    const db = getDb();
                                    await setDoc(doc(db, 'vendors', currentUser.vendorId), {
                                      ...v,
                                      images: updatedImgs
                                    });
                                    showNotification('📸 Portfolio image uploaded & compressed to WebP!');
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: AVAILABILITY & LEADS */}
                    {vendorSubTab === 'dates_leads' && (
                      <div className="space-y-4 text-xs">
                        {/* Interactive Visual Monthly Calendar View */}
                        <VendorDashboardCalendar
                          vendorId={currentUser?.vendorId || ''}
                          busyDates={vendors.find(v => v.id === currentUser?.vendorId)?.busyDates || []}
                          busySlots={vendors.find(v => v.id === currentUser?.vendorId)?.busySlots || {}}
                          bookings={bookings}
                          onToggleDate={async (dateStr) => {
                            try {
                              const v = vendors.find(item => item.id === currentUser.vendorId);
                              if (v) {
                                const busyDates = v.busyDates || [];
                                let updated;
                                if (busyDates.includes(dateStr)) {
                                  updated = busyDates.filter(d => d !== dateStr);
                                  showNotification(`🔓 Date ${dateStr} is now marked as Available!`);
                                } else {
                                  updated = [...busyDates, dateStr];
                                  showNotification(`🔒 Date ${dateStr} is now Blocked!`);
                                }
                                const db = getDb();
                                await setDoc(doc(db, 'vendors', currentUser.vendorId), {
                                  ...v,
                                  busyDates: updated
                                });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          onToggleSlot={async (dateStr, slotId) => {
                            try {
                              const v = vendors.find(item => item.id === currentUser.vendorId);
                              if (v) {
                                const currentSlots = v.busySlots || {};
                                const dateSlots = currentSlots[dateStr] || [];
                                let updatedDateSlots;
                                if (dateSlots.includes(slotId)) {
                                  updatedDateSlots = dateSlots.filter(s => s !== slotId);
                                  showNotification(`🔓 Slot ${formatTimeSlot(slotId)} on ${dateStr} is now Available!`);
                                } else {
                                  updatedDateSlots = [...dateSlots, slotId];
                                  showNotification(`🔒 Slot ${formatTimeSlot(slotId)} on ${dateStr} is now Blocked!`);
                                }
                                const updatedSlotsMap = {
                                  ...currentSlots,
                                  [dateStr]: updatedDateSlots
                                };
                                const db = getDb();
                                await setDoc(doc(db, 'vendors', currentUser.vendorId), {
                                  ...v,
                                  busySlots: updatedSlotsMap
                                });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          showNotification={showNotification}
                        />


                        {/* Interested Leads/Enquiries List */}
                        <div className="bg-white rounded-[24px] border border-brand-border p-5 space-y-3.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h4 className="font-black text-brand-success uppercase tracking-wider text-[10px]">Interested Users ({leadsList.filter(l => l.vendorId === currentUser?.vendorId).length})</h4>
                            <span className="bg-brand-success/10 text-brand-success text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">Customer Leads</span>
                          </div>

                          {leadsList.filter(l => l.vendorId === currentUser?.vendorId).length > 0 && (
                            <div className="flex gap-2 pb-1.5">
                              <button
                                onClick={() => {
                                  const myLeads = leadsList.filter(l => l.vendorId === currentUser?.vendorId);
                                  const headers = ['Name', 'Phone', 'Email', 'City', 'Budget', 'Timestamp'];
                                  const rows = myLeads.map(l => [
                                    l.name || '',
                                    l.phone || '',
                                    l.email || '',
                                    l.city || '',
                                    `₹${l.budget || 0}`,
                                    l.timestamp || ''
                                  ]);
                                  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                                  
                                  const encodedUri = encodeURI(csvContent);
                                  const link = document.createElement("a");
                                  link.setAttribute("href", encodedUri);
                                  link.setAttribute("download", `customer_leads_${(currentUser?.name || 'vendor').replace(/\s+/g, '_')}_${Date.now()}.csv`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  showNotification('📥 CSV leads exported successfully!');
                                }}
                                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition active:scale-95 uppercase"
                              >
                                <Download size={12} />
                                <span>Download CSV</span>
                              </button>
                              <button
                                onClick={() => {
                                  const myLeads = leadsList.filter(l => l.vendorId === currentUser?.vendorId);
                                  const textLines = myLeads.map((l, idx) => 
                                    `${idx + 1}. NAME: ${l.name}\n   PHONE: ${l.phone}\n   EMAIL: ${l.email}\n   CITY: ${l.city}\n   BUDGET: ₹${l.budget}\n   DATE: ${l.timestamp}\n-------------------------`
                                  ).join('\n');
                                  
                                  const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
                                  const link = document.createElement("a");
                                  link.href = URL.createObjectURL(blob);
                                  link.setAttribute("download", `customer_leads_${(currentUser?.name || 'vendor').replace(/\s+/g, '_')}_${Date.now()}.txt`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  showNotification('📄 Text file leads exported successfully!');
                                }}
                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition active:scale-95 uppercase"
                              >
                                <FileText size={12} />
                                <span>Download Text</span>
                              </button>
                            </div>
                          )}

                          {leadsList.filter(l => l.vendorId === currentUser?.vendorId).length === 0 ? (
                            <div className="text-center py-5 space-y-1.5">
                              <p className="text-[11px] text-brand-text-secondary font-black">No dynamic enquiries received yet.</p>
                              <p className="text-[10px] text-gray-400 leading-relaxed">Interested users clicking "Check Availability" on your page will automatically populate here in real-time!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {leadsList.filter(l => l.vendorId === currentUser?.vendorId).map((lead, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-brand-border relative space-y-1">
                                  <span className="absolute top-2 right-2 text-[9px] text-brand-text-secondary font-medium">{lead.timestamp || 'Just now'}</span>
                                  <h5 className="font-extrabold text-brand-text text-xs">{lead.name}</h5>
                                  <p className="text-[10px] text-brand-text-secondary leading-relaxed">Email: <b>{lead.email}</b></p>
                                  <p className="text-[10px] text-brand-text-secondary leading-relaxed">City: <b>{lead.city}</b> • Budget: <b>₹{Number(lead.budget).toLocaleString('en-IN')}</b></p>
                                  
                                  <div className="pt-2">
                                    <a
                                      href={`https://wa.me/91${lead.phone}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg transition"
                                    >
                                      💬 Chat on WhatsApp
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !currentUser ? (
                  /* 👤 Guest / Sign In Profile View */
                  <div className="space-y-5">
                    <div className="bg-white rounded-[28px] border border-brand-border p-6 text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-brand-primary-light via-rose-100 to-amber-100" />
                      
                      <div className="relative pt-4 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-100 text-slate-400 text-2xl font-black flex items-center justify-center shadow-md mb-3">
                          👤
                        </div>
                        <h3 className="font-black text-gray-900 text-lg tracking-tight">Welcome to MyParva App</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 max-w-xs">
                          Sign in to manage bookings, unlock direct vendor WhatsApp chats, and save your wishlist.
                        </p>
                      </div>

                      {/* Google Sign-in Card inside Profile */}
                      <div className="mt-6 space-y-3 max-w-sm mx-auto text-left">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Your Full Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Devansh Kadam"
                            value={googleLoginName}
                            onChange={(e) => setGoogleLoginName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mobile Phone Number</label>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 px-3 py-2.5 rounded-xl">+91</span>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="10-digit number"
                              value={googleLoginPhone}
                              onChange={(e) => setGoogleLoginPhone(e.target.value.replace(/\D/g, ''))}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition font-mono tracking-wider"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            trackLoginStarted('google');
                            try {
                              const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
                              const provider = new GoogleAuthProvider();
                              const result = await signInWithPopup(getAuthInstance(), provider);
                              const user = result.user;

                              const db = getDb();
                              const { doc, getDoc, setDoc } = await import('firebase/firestore');
                              const userDoc = await getDoc(doc(db, 'users', user.uid));
                              const existingData = userDoc.exists() ? userDoc.data() : {};

                              const finalName = googleLoginName.trim() || user.displayName || existingData.name || 'Parva User';
                              const finalPhone = googleLoginPhone.trim() || existingData.phone || '';

                              const loggedUser = {
                                uid: user.uid,
                                name: finalName,
                                email: user.email || '',
                                phone: finalPhone,
                                photoURL: user.photoURL || '',
                                city: existingData.city || currentCity || 'Kolhapur',
                                address: existingData.address || '',
                                role: existingData.role || 'user'
                              };

                              await setDoc(doc(db, 'users', user.uid), loggedUser, { merge: true });
                              setCurrentUser(loggedUser);
                              localStorage.setItem('parva_user', JSON.stringify(loggedUser));
                              trackLoginSuccess('google');
                              showNotification(`🎉 Welcome, ${finalName}!`);
                            } catch (err: any) {
                              console.error("Google sign in error:", err);
                              trackLoginFailed('google', err.message);
                              showNotification(`⚠️ Sign-in failed: ${err.message}`);
                            }
                          }}
                          className="w-full bg-white hover:bg-gray-50 text-gray-900 font-black py-3.5 px-4 rounded-2xl border-2 border-gray-200 hover:border-brand-primary flex items-center justify-center gap-3 transition shadow-md active:scale-98 text-xs uppercase tracking-wider mt-2"

                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                          <span>Sign in with Google</span>
                        </button>
                      </div>
                    </div>

                    {/* Vendor Portal Switcher Banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-brand-primary/10 to-amber-500/10 rounded-[24px] p-5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <h4 className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                          <span>🏛️</span>
                          <span>Are you an Event Vendor?</span>
                        </h4>
                        <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                          Manage your banquet hall, catering, decor or photography services
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRole('vendor');
                          setIsLoginModalOpen(true);
                        }}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 uppercase tracking-wider shrink-0"
                      >
                        Vendor Login / Register
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 👤 Standard Premium Logged-In User Profile View */
                  <div className="space-y-5">
                    {/* User Header Info Card with Avatar Photo Upload */}
                    <div className="bg-white rounded-[28px] border border-brand-border p-6 text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-brand-primary-light via-rose-100 to-amber-100" />
                      
                      <div className="relative pt-4 flex flex-col items-center">
                        {/* Profile Avatar with Photo Upload Trigger */}
                        <div className="relative group mb-3">
                          <div className="w-20 h-20 rounded-full border-4 border-white bg-brand-primary text-white text-2xl font-black flex items-center justify-center shadow-lg overflow-hidden">
                            {currentUser?.photoURL ? (
                              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              getUserInitials(currentUser)
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-full shadow-md cursor-pointer transition active:scale-95">
                            <Camera size={13} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                showNotification('⏳ Uploading profile picture...');
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('upload_preset', 'ml_default');
                                  formData.append('cloud_name', 'k03rmhkg');
                                  
                                  let photoUrl = '';
                                  try {
                                    const cloudRes = await fetch('https://api.cloudinary.com/v1_1/k03rmhkg/image/upload', {
                                      method: 'POST',
                                      body: formData
                                    });
                                    const cloudData = await cloudRes.json();
                                    if (cloudData.secure_url) {
                                      photoUrl = cloudData.secure_url;
                                    }
                                  } catch (e) {}

                                  if (!photoUrl) {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(file);
                                    await new Promise<void>((resolve) => {
                                      reader.onload = () => {
                                        photoUrl = reader.result as string;
                                        resolve();
                                      };
                                    });
                                  }

                                  const updated = { ...currentUser, photoURL: photoUrl };
                                  setCurrentUser(updated);
                                  localStorage.setItem('parva_user', JSON.stringify(updated));
                                  const db = getDb();
                                  const { doc, setDoc } = await import('firebase/firestore');
                                  if (currentUser?.uid) {
                                    await setDoc(doc(db, 'users', currentUser.uid), { photoURL: photoUrl }, { merge: true });
                                  }
                                  showNotification('🎉 Profile picture updated successfully!');
                                } catch (err) {
                                  showNotification('⚠️ Failed to upload image.');
                                }
                              }}
                            />
                          </label>
                        </div>

                        <h3 className="font-black text-gray-900 text-lg tracking-tight">{getUserName(currentUser)}</h3>
                        <p className="text-xs text-brand-text-secondary font-semibold mt-0.5">
                          Verified Member • {currentUser?.city || currentCity || 'Kolhapur'}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {currentUser?.email || 'N/A'} • {currentUser?.phone || 'No phone added'}
                        </span>
                      </div>

                      {/* Personal metrics showcase */}
                      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Bookings</span>
                          <span className="font-black text-brand-primary text-sm">{bookings.length}</span>
                        </div>
                        <div className="text-center border-x border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Wishlist</span>
                          <span className="font-black text-gray-800 text-sm">{wishlist.length}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Logins</span>
                          <span className="font-black text-emerald-600 text-sm">{loginsCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile & Address Form */}
                    <div className="bg-white rounded-[24px] border border-brand-border p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Personal & Event Details</h4>
                          <p className="text-[10px] text-gray-500 font-medium">Update your contact information for vendor coordination</p>
                        </div>
                        <button
                          type="button"
                          disabled={isDetectingLocation}
                          onClick={() => {
                            if (!navigator.geolocation) {
                              showNotification('⚠️ Geolocation not supported on this browser.');
                              return;
                            }
                            setIsDetectingLocation(true);
                            navigator.geolocation.getCurrentPosition(
                              async (pos) => {
                                try {
                                  const lat = pos.coords.latitude;
                                  const lng = pos.coords.longitude;
                                  const updatedUser = {
                                    ...currentUser,
                                    latitude: lat,
                                    longitude: lng,
                                    address: `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`
                                  };
                                  setCurrentUser(updatedUser);
                                  localStorage.setItem('parva_user', JSON.stringify(updatedUser));
                                  const db = getDb();
                                  const { doc, setDoc } = await import('firebase/firestore');
                                  if (currentUser?.uid) {
                                    await setDoc(doc(db, 'users', currentUser.uid), updatedUser, { merge: true });
                                  }
                                  showNotification(`📍 Live GPS Verified: (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
                                } catch (e) {}
                                setIsDetectingLocation(false);
                              },
                              (err) => {
                                showNotification(`⚠️ GPS Error: ${err.message}`);
                                setIsDetectingLocation(false);
                              },
                              { timeout: 10000 }
                            );
                          }}
                          className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 transition active:scale-95"
                        >
                          <MapPin size={12} />
                          <span>{isDetectingLocation ? 'Locating...' : 'Detect GPS'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editProfileName}
                            onChange={(e) => setEditProfileName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mobile Phone Number</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={editProfilePhone}
                            onChange={(e) => setEditProfilePhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary font-mono transition"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={currentUser?.email || ''}
                            disabled
                            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-500 outline-none cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">City / Locality</label>
                          <input
                            type="text"
                            value={currentCity}
                            onChange={(e) => setCurrentCity(e.target.value)}
                            placeholder="Your current city"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Event Venue / Address</label>
                          <input
                            type="text"
                            placeholder="e.g. Near Rankala Lake, Rajarampuri, Kolhapur"
                            value={editProfileAddress}
                            onChange={(e) => setEditProfileAddress(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary transition"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const updatedUser = {
                            ...currentUser,
                            name: editProfileName || currentUser?.name || 'Parva User',
                            phone: editProfilePhone || currentUser?.phone || '',
                            city: currentCity,
                            address: editProfileAddress || currentUser?.address || ''
                          };
                          setCurrentUser(updatedUser);
                          localStorage.setItem('parva_user', JSON.stringify(updatedUser));
                          try {
                            const db = getDb();
                            const { doc, setDoc } = await import('firebase/firestore');
                            if (currentUser?.uid) {
                              await setDoc(doc(db, 'users', currentUser.uid), updatedUser, { merge: true });
                            }
                            showNotification('✓ Profile details saved successfully!');
                          } catch (e) {
                            showNotification('Saved locally.');
                          }
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs transition active:scale-98 uppercase tracking-wider"
                      >
                        Save Profile Changes
                      </button>
                    </div>

                    {/* Vendor Portal Switcher Banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-brand-primary/10 to-amber-500/10 rounded-[24px] p-5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <h4 className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                          <span>🏛️</span>
                          <span>Are you an Event Vendor?</span>
                        </h4>
                        <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                          Manage your banquet hall, catering, decor or photography services
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRole('vendor');
                          setIsLoginModalOpen(true);
                        }}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 uppercase tracking-wider shrink-0"
                      >
                        Vendor Login / Register
                      </button>
                    </div>

                    {/* Wishlist Header */}
                    <div className="flex justify-between items-center px-1 pt-2">
                      <h4 className="font-extrabold text-brand-text text-sm uppercase tracking-wider flex items-center gap-1">
                        <Heart size={14} className="text-brand-primary fill-brand-primary" />
                        <span>My Wishlisted Vendors ({wishlist.length})</span>
                      </h4>
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-xs text-brand-text-secondary">
                        No saved vendors. Tap the heart icon on any card to wishlist them!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {vendors.filter((v) => (wishlist || []).includes(v.id)).map((vendor) => (
                          <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            onSelect={(v) => handleVendorSelect(v)}
                            isWishlisted={true}
                            onToggleWishlist={handleToggleWishlist}
                            userCoords={activeOriginCoords}
                          />
                        ))}
                      </div>
                    )}

                    {/* Profile Settings Menu */}
                    <div className="bg-white rounded-2xl border border-brand-border divide-y divide-gray-100 overflow-hidden shadow-sm">
                      {[
                        { label: 'Booking Preferences', desc: 'Default city, contact phone, GST details' },
                        { label: 'Saved Event Templates', desc: 'Pre-selected packages and vendor drafts' },
                        { label: 'Financials & Invoices', desc: 'Download tax records and transaction logs' },
                        { label: 'Replay App Walkthrough', desc: 'Watch the onboarding splash and info slides again' },
                        { label: 'About MyParva App', desc: 'Version 1.0.0 • Terms of Service & Security' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.label === 'Replay App Walkthrough') {
                              setShowSplash(true);
                            } else {
                              showNotification(`${item.label} opened`);
                            }
                          }}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left transition"
                          id={`profile-setting-row-${idx}`}
                        >
                          <div>
                            <h5 className="font-bold text-brand-text text-xs">{item.label}</h5>
                            <p className="text-[10px] text-brand-text-secondary mt-0.5">{item.desc}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </button>
                      ))}
                    </div>

                    {/* Logout Button Card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[20px] p-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(null);
                          setIsAdmin(false);
                          localStorage.removeItem('parva_user');
                          showNotification('🚪 Logged out successfully.');
                        }}
                        className="text-xs font-black text-rose-600 hover:text-rose-800 hover:underline uppercase tracking-wider"
                      >
                        Log Out of Account
                      </button>
                    </div>
                  </div>
                )}
          </div>
        </div>
      )}

      </main>

      {/* 3. FLOATING BOTTOM NAVIGATION */}
      <nav className="fixed bottom-4 inset-x-4 max-w-sm mx-auto glass-panel border border-brand-border rounded-[24px] shadow-lg py-2.5 px-4 z-40 flex items-center justify-between" id="bottom-floating-navigation">
        {[
          { id: 'home', label: 'Home', icon: Home, badge: 0 },
          { id: 'explore', label: 'Explore', icon: Compass, badge: 0 },
          { id: 'bookings', label: 'Bookings', icon: Calendar, badge: 0 },
          { id: 'profile', label: 'Profile', icon: User, badge: 0 }
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                // Reset active chat thread if going to messages tab
                if (item.id === 'messages') {
                  setActiveChatVendorId(null);
                }
              }}
              className="flex flex-col items-center justify-center relative py-1 px-3.5 rounded-xl transition-all duration-300"
              id={`nav-tab-${item.id}`}
            >
              {/* Highlight Backdrop */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-glow"
                  className="absolute inset-0 bg-brand-primary/15 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}

              {/* Icon */}
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text'}`}>
                <IconComponent size={20} strokeWidth={isActive ? 3 : 2} />
              </div>

              {/* Label */}
              <span className={`text-[9px] mt-1 font-bold transition-colors ${isActive ? 'text-brand-primary font-black' : 'text-brand-text-secondary'}`}>
                {item.label}
              </span>

              {/* Active Underline Indicator */}
              {isActive && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-brand-primary"
                />
              )}

              {/* Unread indicators badge */}
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-0 right-1.5 w-4 h-4 bg-brand-primary text-white font-black text-[8px] rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* 4. DIALOGS & MODAL DRAWER PORTALS */}
      {/* Filter and Sorting Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(filters) => {
          setActiveSortOption(filters.sort || 'Distance');
          setActiveFilterMinPrice(filters.min ? Number(filters.min) : null);
          setActiveFilterMaxPrice(filters.max ? Number(filters.max) : null);
          setActiveFilterTypes(filters.types || []);
          setActiveTab('explore');
          trackFilterApplied({
            category: selectedExploreCategory,
            min_price: filters.min ? Number(filters.min) : null,
            max_price: filters.max ? Number(filters.max) : null,
            guest_count: planningGuestSize,
            filter_types: filters.types || [],
            sort_mode: filters.sort || 'Distance'
          });
          showNotification('Filters applied successfully');
        }}

      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onClearAll={() => setNotifications([])}
        onActionClick={(notif) => {
          if (notif.type === 'offer') {
            setActiveTab('explore');
            setIsNotificationCenterOpen(false);
          } else if (notif.type === 'slot') {
            setActiveTab('bookings');
            setIsNotificationCenterOpen(false);
          }
        }}
        onTriggerTestNotification={() => {
          sendNativePhoneNotification(
            'Slot Confirmed: Royal Grand Hall 🏛️',
            'Your wedding slot on Dec 12, 2026 is confirmed! Decorator setup dispatched.',
            'slot'
          );
        }}
        permissionStatus={permissionStatus}
        onRequestPermission={requestNotificationPermission}
      />
      <LocationSelector
        currentCity={currentCity}
        blockedCities={blockedCities}
        onSelectCity={(city) => setCurrentCity(city)}
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      {/* Help & Support Customer Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-brand-border z-10 space-y-4"
              id="help-support-modal"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
                    <Headphones size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-text text-base">Help & Support</h3>
                    <p className="text-[10px] text-brand-text-secondary font-bold">Official PARVA Assistance</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSupportModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Email Support */}
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Mail size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Email Support</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 font-mono">support@parva.com</p>
                  <p className="text-[10px] text-gray-500">For booking questions, vendor connections, or support-managed refunds.</p>
                  <a
                    href="mailto:support@parva.com?subject=PARVA%20Support%20Request"
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Mail size={12} />
                    <span>Send Query</span>
                  </a>
                </div>

                {/* Call Support */}
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Phone size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Call Support</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 font-mono">8554006073</p>
                  <p className="text-[10px] text-gray-500">Direct celebration concierge & assistance helpline.</p>
                  <a
                    href="tel:8554006073"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Phone size={12} />
                    <span>Call Support</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <VoiceSearchModal

        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceResult={handleVoiceSearchResult}
      />

      {/* 5. IMMERSIVE VENDOR DETAIL SHEET */}
      {selectedVendor && (
        <Helmet>
          <title>{selectedVendor.name} | Parva Events</title>
          <meta name="description" content={selectedVendor.description} />
        </Helmet>
      )}
      {selectedVendor && (
        <VendorDetailSheet
          vendor={selectedVendor}
          isOpen={selectedVendor !== null}
          onClose={() => setSelectedVendor(null)}
          bundledServices={bundledItems.filter(item => item.vendor.id === selectedVendor.id).map(item => item.service)}
          onAddServiceToBundle={(service) => handleAddServiceToBundle(selectedVendor, service)}
          onRemoveServiceFromBundle={(serviceName) => handleRemoveServiceFromBundle(selectedVendor.id, serviceName)}
          isWishlisted={(wishlist || []).includes(selectedVendor.id)}
          onToggleWishlist={() => handleToggleWishlist(selectedVendor.id)}
          onShowNotification={showNotification}
          currentUser={currentUser}
          onTriggerLogin={(onSuccess) => {
            const cached = localStorage.getItem('parva_user');
            if (cached) setCurrentUser(JSON.parse(cached));
            if (onSuccess) onSuccess();
          }}
          onAddLead={async (leadData: any) => {
            const newLead = {
              id: `lead-${Date.now()}`,
              name: leadData.name,
              phone: leadData.phone,
              email: leadData.email,
              city: currentCity,
              vendorName: leadData.vendorName || selectedVendor?.name || 'General Inquiry',
              vendorId: selectedVendor?.id || '',
              budget: leadData.budget,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            try {
              const db = getDb();
              await setDoc(doc(db, 'leads', newLead.id), newLead);
            } catch (err) {
              console.error('Error saving lead:', err);
            }
          }}
          onAddReview={async (rating: number, comment: string) => {
            if (!selectedVendor) return;
            const newReview = {
              id: `rev-${Date.now()}`,
              userName: currentUser?.name || 'Verified Customer',
              userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
              rating,
              comment,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            };
            
            const currentReviews = selectedVendor.reviews || [];
            const updatedReviews = [newReview, ...currentReviews];
            const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = Number((totalRating / updatedReviews.length).toFixed(1));
            
            const updatedVendor = {
              ...selectedVendor,
              rating: averageRating,
              reviewCount: updatedReviews.length,
              reviews: updatedReviews
            };
            
            try {
              const db = getDb();
              const { doc, setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'vendors', selectedVendor.id), updatedVendor, { merge: true });
            } catch (err) {
              console.warn("Could not save review to Firestore:", err);
            }
            
            const updatedVendorsList = vendors.map(v => v.id === selectedVendor.id ? updatedVendor : v);
            setVendors(updatedVendorsList);
            localStorage.setItem('parva_vendors_list', JSON.stringify(updatedVendorsList));
            setSelectedVendor(updatedVendor);
          }}
          planningEventType={planningEventType}
          planningStartDate={planningStartDate}
          planningEndDate={planningEndDate}
          planningTimeSlot={planningTimeSlot}
          onSelectDate={setPlanningStartDate}
          onSelectTimeSlot={setPlanningTimeSlot}
          planningGuestSize={planningGuestSize}
          bookingFeePercentage={bookingFeePercentage}
          onNavigateToBookings={() => setActiveTab('bookings')}
          handlePayWithRazorpay={(params: any) => {
            setRazorpayAmount(params.totalAmountDue);
            setRazorpayPurpose('connection');
            setPendingCheckoutBooking(params);
            setIsRazorpayOpen(true);
          }}
        />

      )}

      {/* 6. CASHFREE SECURE CHECKOUT TRIGGER OVERLAY */}
      {isRazorpayOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto text-xl font-black">
                💳
              </div>
              <h4 className="font-black text-sm text-gray-900">Secure Cashfree Checkout</h4>
              <p className="text-xs text-gray-500 font-medium">
                Amount payable: <span className="font-black text-brand-primary">₹{razorpayAmount.toLocaleString('en-IN')}.00</span>
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsRazorpayOpen(false);
                handlePayWithCashfree({
                  type: razorpayPurpose === 'premium' ? 'connection' : 'booking',
                  amount: razorpayAmount,
                  bookingData: pendingCheckoutBooking
                });
              }}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-brand-primary/20"
            >
              Launch Cashfree Payment Window ⚡
            </button>

            <button
              onClick={() => setIsRazorpayOpen(false)}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 text-center"
            >
              Cancel and return
            </button>
          </div>
        </div>
      )}


      {/* 6. PRIVACY POLICY MODAL */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col p-6 space-y-4 max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-brand-text text-base">Privacy Policy</h3>
              <button onClick={() => setIsPrivacyOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3.5 text-[10px] text-brand-text-secondary leading-relaxed">
              <p className="font-semibold text-brand-text">Effective Date: July 16, 2026</p>
              <p>At MyParva App, we value your privacy. We collect user information, including name, phone, email, and budget, to instantly match you with event vendors. This data is shared with the specific vendors you choose to book or connect with.</p>
              <h4 className="font-bold text-brand-text uppercase">1. Information We Collect</h4>
              <p>We collect personal information that you provide to us directly, such as your contact details, and transactions related to your event bookings and connection fees.</p>
              <h4 className="font-bold text-brand-text uppercase">2. How We Use Information</h4>
              <p>We use your information to operate our marketplace, process secure payments via Cashfree Payments, allow chat features, and prevent unauthorized operations.</p>

              <h4 className="font-bold text-brand-text uppercase">3. Security</h4>
              <p>Your database transactions and user profiles are stored securely in Firestore. We do not sell your personal data to third parties.</p>
            </div>
            <button 
              onClick={() => setIsPrivacyOpen(false)}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2.5 rounded-xl text-xs transition"
            >
              Close Policy
            </button>
          </div>
        </div>
      )}

      {/* ABOUT US MODAL */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col p-6 space-y-4 max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-brand-text text-base">About PARVA</h3>
              <button onClick={() => setIsAboutOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 text-[10px] text-brand-text-secondary leading-relaxed text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto mb-2">
                <Info size={24} />
              </div>
              <h4 className="font-bold text-brand-text text-xs">MyParva App</h4>
              <p className="text-[9px] uppercase tracking-widest text-brand-primary font-black">Plan • Bundle • Save</p>
              <p className="mt-2 text-left">PARVA is an all-in-one celebration booking platform designed to simplify event matching for weddings, birthdays, corporate meets, and anniversaries.</p>
              <p className="text-left">With Zomato-style matchmaking, clear standard pricing, multiplier bundle discounts, and real-time chat gates, PARVA is the first production-ready event-planning ecosystem in India.</p>
              <p className="text-left font-semibold text-brand-text">Version 2.0.1 (Production Ready)</p>
            </div>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2.5 rounded-xl text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Selection Bar */}
      <CartFloatingBar
        itemCount={bundledItems.length}
        totalPrice={bundledItems.reduce((acc, item) => acc + (item.vendor.category === 'Catering' ? item.service.price * (planningGuestSize || 100) : item.service.price), 0)}
        onClick={() => {
          const totalVal = bundledItems.reduce((acc, item) => acc + (item.vendor.category === 'Catering' ? item.service.price * (planningGuestSize || 100) : item.service.price), 0);
          trackCartOpened(bundledItems.length, totalVal);
          setActiveTab('bookings');
        }}
        isVisible={bundledItems.length > 0 && activeTab !== 'bookings' && activeTab !== 'profile' && !selectedVendor}
      />


      {/* 7. SHARE EVENT PLAN OVERLAYS */}
      <ShareBookingModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setSharingBooking(null);
        }}
        booking={sharingBooking}
        onShowNotification={showNotification}
      />

      {sharedBookingData && (
        <SharedPlanView
          sharedBooking={sharedBookingData}
          onClose={() => {
            setSharedBookingData(null);
            // Clean up the URL parameter gracefully
            const url = new URL(window.location.href);
            url.searchParams.delete('sharedBooking');
            window.history.replaceState({}, '', url.toString());
          }}
        />
      )}
    </div>
  );
}
