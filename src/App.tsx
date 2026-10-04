/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb, handleFirestoreError, OperationType } from './lib/firebase';
import { authenticatedFetch } from './lib/apiClient';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { Helmet } from 'react-helmet-async';
import { 
  Home, Compass, Calendar, MessageSquare, User, MapPin, Bell, 
  ShoppingCart, Mic, Sparkles, Filter, ArrowRight, ChevronRight, ChevronLeft,
  Star, Check, CheckCircle2, Trash2, Send, X, Heart, ShieldCheck, 
  Info, DollarSign, Gift, ExternalLink, CalendarDays, Users, Smartphone, Download, FileText,
  ChevronUp, ChevronDown, Camera, Headphones, Phone, Mail, Database, Activity, Server
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
import CartFloatingBar from './components/CartFloatingBar';
import ShareBookingModal from './components/ShareBookingModal';
import SlidablePromoBanner from './components/SlidablePromoBanner';
import { AirbnbDesktopMarketplace } from './components/airbnb/AirbnbDesktopMarketplace';
import AuthModal from './components/AuthModal';
import { signOutUser, isMasterAdminEmail, CustomerProfileData } from './services/authService';
import VendorDashboardFull from './components/vendor/VendorDashboardFull';
import ChatTab from './components/ChatTab';
import { AdminKycReviewModal } from './components/admin/AdminKycReviewModal';
import { AdminDatabaseHealthModal } from './components/admin/AdminDatabaseHealthModal';
import { AdminChatLogsViewer } from './components/admin/AdminChatLogsViewer';
import { AdminChatLogsModal } from './components/admin/AdminChatLogsModal';
import { PaymentProcessingModal } from './components/PaymentProcessingModal';
import { PaymentSuccessCelebrationModal } from './components/PaymentSuccessCelebrationModal';

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
  { id: 'morning', label: '09:00 AM - 01:00 PM', time: '09:00 AM - 01:00 PM' },
  { id: 'afternoon', label: '01:00 PM - 05:00 PM', time: '01:00 PM - 05:00 PM' },
  { id: 'evening', label: '05:00 PM - 10:00 PM', time: '05:00 PM - 10:00 PM' },
];

export const formatTimeSlot = (slotId?: string, customTime?: string): string => {
  if (customTime && customTime.trim()) {
    return customTime.trim();
  }
  const s = (slotId || '').toLowerCase().trim();
  if (s === 'morning') return '09:00 AM - 01:00 PM';
  if (s === 'afternoon') return '01:00 PM - 05:00 PM';
  if (s === 'evening') return '05:00 PM - 10:00 PM';
  if (s.includes('am') || s.includes('pm') || s.includes(':')) return slotId!;
  return '24 Hr Full Day';
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

const isUserLoggedInHelper = (user: any): boolean => {
  return Boolean(
    user && (
      (typeof user.uid === 'string' && user.uid.trim().length > 0) ||
      (typeof user.email === 'string' && user.email.trim().length > 0) ||
      (typeof user.phone === 'string' && user.phone.trim().length > 0) ||
      (typeof user.name === 'string' && user.name.trim().length > 0 && user.name.toLowerCase() !== 'guest') ||
      (typeof user.displayName === 'string' && user.displayName.trim().length > 0)
    )
  );
};

const getUserName = (user: any) => {
  if (!isUserLoggedInHelper(user)) return 'Guest Planner';
  return user.name || user.displayName || user.email?.split('@')[0] || 'Guest Planner';
};

const getUserInitials = (user: any) => {
  if (!isUserLoggedInHelper(user)) return 'G';
  const name = getUserName(user);
  return name ? name.charAt(0).toUpperCase() : 'G';
};

const getFirstName = (user: any) => {
  if (!isUserLoggedInHelper(user)) return 'Guest Planner';
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
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'bookings' | 'messages' | 'profile' | 'cart'>(() => {
    return (sessionStorage.getItem('parva_activeTab') as any) || 'home';
  });

  useEffect(() => {
    sessionStorage.setItem('parva_activeTab', activeTab);
  }, [activeTab]);

  const handleNavigateToTab = (tab: 'home' | 'explore' | 'bookings' | 'messages' | 'chat' | 'profile' | 'cart') => {
    if (tab === 'cart') {
      setActiveTab('cart');
      setSelectedVendor(null);
      if (location.pathname !== '/cart') {
        navigate('/cart');
      }
      return;
    }
    const normalizedTab = (tab === 'chat' ? 'messages' : tab) as 'home' | 'explore' | 'bookings' | 'messages' | 'profile' | 'cart';
    setActiveTab(normalizedTab);
    setSelectedVendor(null);
    const targetPath = normalizedTab === 'home' ? '/' : `/${normalizedTab}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const handleCloseVendor = () => {
    setSelectedVendor(null);
    const targetPath = activeTab === 'home' ? '/' : `/${activeTab}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const [currentCity, setCurrentCity] = useState('Kolhapur');

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);




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

  // Authentication persistence - Single Source of Truth via Firebase Auth
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
            name: user.displayName || user.email?.split('@')[0] || 'Parva Client',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
          };
          const isAdminUser = isMasterAdminEmail(user.email);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (isAdminUser && userData.role !== 'master_admin') {
              userData.role = 'master_admin';
              setDoc(userRef, { role: 'master_admin' }, { merge: true }).catch(() => {});
            }
            const merged = { ...cleanUser, ...userData };
            setCurrentUser(merged);
            try {
              localStorage.setItem('parva_user', JSON.stringify(merged));
            } catch (e) {}
            setIsAdmin(userData.role === 'admin' || userData.role === 'master_admin');
            setIsMasterAdmin(userData.role === 'master_admin');
          } else {
            // Default user profile
            const defaultRole = isAdminUser ? 'master_admin' : 'customer';
            const defaultUser = { ...cleanUser, role: defaultRole, city: 'Kolhapur' };
            setDoc(userRef, defaultUser, { merge: true }).catch(() => {});
            setCurrentUser(defaultUser);
            try {
              localStorage.setItem('parva_user', JSON.stringify(defaultUser));
            } catch (e) {}
            setIsAdmin(isAdminUser);
            setIsMasterAdmin(isAdminUser);
          }
        }, (error) => {
          console.warn("Profile fetch error (might be offline):", error);
          const isAdminUser = isMasterAdminEmail(user.email);
          const fallbackUser = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'Parva Client',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: isAdminUser ? 'master_admin' : 'customer',
            city: 'Kolhapur'
          };
          setCurrentUser(fallbackUser);
          setIsAdmin(isAdminUser);
          setIsMasterAdmin(isAdminUser);
        });

        return () => unsubProfile();
      } else {
        let isLocal = false;
        try {
          const cached = localStorage.getItem('parva_user');
          if (cached) isLocal = Boolean(JSON.parse(cached)?.isLocalSession);
        } catch (e) {}

        if (!isLocal) {
          setCurrentUser(null);
          setIsAdmin(false);
          setIsMasterAdmin(false);
          try {
            localStorage.removeItem('parva_user');
          } catch (e) {}
        }
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
      const cached = localStorage.getItem('parva_vendors_list') || localStorage.getItem('parva_cached_vendors');
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
    
    // Seed database if empty and user is master admin
    const seedDatabase = async () => {
      if (!isMasterAdmin) return;
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
        }
        
        // Seed default vendors if empty
        const vendorsSnap = await getDocs(collection(db, 'vendors'));
        if (vendorsSnap.empty) {
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
          for (const promo of HERO_PROMOS) {
            await setDoc(doc(db, 'promos', promo.id), promo);
          }
        }
      } catch (err) {
        console.debug('Database seed check complete.');
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
      console.debug("Vendors sync info (offline fallback active):", error?.message);
      setIsLoadingVendors(false);
    });

    
    // Listen for Coupons collection
    const unsubscribeCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCouponsList(couponsData);
    }, () => {});
    
    // Listen for Promos collection
    const unsubscribePromos = onSnapshot(collection(db, 'promos'), (snapshot) => {
      const promosData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setPromosList(promosData);
      localStorage.setItem('parva_promos_list', JSON.stringify(promosData));
    }, (error) => {
      console.debug("Promos sync info:", error?.message);
    });

    // Listen for Admins collection (only for admins)
    let unsubscribeAdmins: (() => void) | undefined;
    if (isAdmin || isMasterAdmin) {
      unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
        const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAdminsList(adminsData);
      }, (error) => {
        console.debug("Admins sync info:", error?.message);
      });
    }

    // Initial bookings listener placeholder (authoritative scoped listener is mounted below)
    const unsubscribeBookings: (() => void) | undefined = undefined;

    // Listen for Leads collection (only for admins)
    let unsubscribeLeads: (() => void) | undefined;
    if (isAdmin || isMasterAdmin) {
      unsubscribeLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeadsList(leadsData);
      }, (error) => {
        console.debug("Leads sync info:", error?.message);
      });
    }

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
            status: d.status || 'active',
            displayOrder: Number(d.displayOrder) || 100,
            description: d.description || '',
            services: Array.isArray(d.services) ? d.services : [],
            icon: d.icon || d.iconName || 'Sparkles',
            iconName: d.iconName || d.icon || 'Sparkles',
            image: d.image || (typeof d.icon === 'string' && d.icon.startsWith('http') ? d.icon : defaultImg)
          };
        })
        .filter(c => c.status !== 'inactive')
        .sort((a, b) => (a.displayOrder || 100) - (b.displayOrder || 100));

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

    // Listen for Settings Cities (Single Source of Truth from Admin & Backend)
    const unsubscribeSettingsCities = onSnapshot(doc(db, 'settings', 'cities'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const operational = Array.isArray(data.operationalCities) ? data.operationalCities : [];
        const blocked = Array.isArray(data.blockedCities) ? data.blockedCities : [];
        const activeCities = operational.filter(c => !blocked.includes(c));
        if (activeCities.length > 0) {
          setCitiesList(activeCities);
        }
      }
    }, (error) => {
      console.debug("Settings cities sync info:", error?.message);
    });

    return () => {
      unsubscribeVendors();
      unsubscribePromos();
      if (unsubscribeAdmins) unsubscribeAdmins();
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeLeads) unsubscribeLeads();
      unsubscribeSettings();
      unsubscribeGlobalSettings();
      unsubscribeCategories();
      unsubscribeCities();
      unsubscribeSettingsCities();
      unsubscribeConnections();
    };
  }, []);

  // Real-time Authoritative Scoped Bookings Listener (Customer / Vendor / Admin)
  useEffect(() => {
    const db = getDb();
    if (!db) return;
    let unsubscribe: (() => void) | undefined;

    if (isAdmin || isMasterAdmin) {
      unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(bookingsData as any);
      }, (error) => {
        console.debug("Admin bookings sync info:", error?.message);
      });
    } else if (currentUser?.uid) {
      const isVendor = currentUser.role === 'vendor' && (currentUser as any).vendorId;
      const bookingsQuery = isVendor
        ? query(collection(db, 'bookings'), where('vendorId', '==', (currentUser as any).vendorId))
        : query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));

      unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(bookingsData as any);
      }, (error) => {
        console.debug("Scoped bookings sync info:", error?.message);
      });
    } else {
      setBookings([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, (currentUser as any)?.vendorId, (currentUser as any)?.role, isAdmin, isMasterAdmin]);

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
  const [isVendorAuthModalOpen, setIsVendorAuthModalOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });


  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const userCached = localStorage.getItem('parva_user');
      const parsedUser = userCached ? JSON.parse(userCached) : null;
      if (parsedUser?.uid) {
        const saved = localStorage.getItem(`parva_app_notifications_${parsedUser.uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((n: any) => !n.id?.startsWith('notif_init_'));
          }
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (currentUser?.uid) {
      localStorage.setItem(`parva_app_notifications_${currentUser.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser?.uid]);

  // Real-time Firestore Scoped Notifications Listener (Customer / Vendor / Admin)
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setNotifications([]);
      return;
    }

    // Load user-scoped cache immediately upon user switch
    try {
      const saved = localStorage.getItem(`parva_app_notifications_${currentUser.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.filter((n: any) => !n.id?.startsWith('notif_init_')));
        }
      } else {
        setNotifications([]);
      }
    } catch (e) {}

    let unsubscribe: (() => void) | undefined;
    try {
      const db = getDb();
      import('firebase/firestore').then(({ collection, query, where, limit, onSnapshot }) => {
        const targetRecipient = (isAdmin || isMasterAdmin)
          ? 'admin'
          : (currentUser.role === 'vendor' && (currentUser as any).vendorId ? (currentUser as any).vendorId : currentUser.uid);

        // Resilient single-field query without orderBy (avoids requiring composite index in Firestore)
        const notifQuery = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', targetRecipient),
          limit(50)
        );

        unsubscribe = onSnapshot(notifQuery, (snapshot) => {
          const freshNotifs: (AppNotification & { _millis?: number })[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let timeStr = 'Just now';
            let millis = 0;
            if (data.createdAt?.toDate) {
              const d = data.createdAt.toDate();
              timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              millis = d.getTime();
            } else if (data.createdAt) {
              try {
                const d = new Date(data.createdAt);
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                millis = d.getTime();
              } catch (e) {}
            }

            freshNotifs.push({
              id: docSnap.id,
              type: data.type === 'BOOKING_CONFIRMED' || data.type === 'slot' ? 'slot' : data.type === 'offer' ? 'offer' : 'system',
              title: data.title || 'Notification',
              message: data.message || '',
              timestamp: timeStr,
              read: Boolean(data.read),
              actionPayload: data.bookingId ? { bookingId: data.bookingId } : undefined,
              _millis: millis
            });
          });

          // Sort client-side descending by creation timestamp
          freshNotifs.sort((a, b) => (b._millis || 0) - (a._millis || 0));

          setNotifications(freshNotifs);
          if (currentUser?.uid) {
            localStorage.setItem(`parva_app_notifications_${currentUser.uid}`, JSON.stringify(freshNotifs));
          }
        }, (err) => {
          console.debug('[Notifications Scoped Listener Info]:', err?.message);
        });
        // Also subscribe to platform-wide Admin Broadcast Notifications
        const bQuery = query(collection(db, 'broadcast_notifications'), limit(25));
        const unsubBroadcast = onSnapshot(bQuery, (snapshot) => {
          const broadcasts: (AppNotification & { _millis?: number })[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let timeStr = 'Just now';
            let millis = 0;
            if (data.createdAt?.toDate) {
              const d = data.createdAt.toDate();
              timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              millis = d.getTime();
            } else if (data.createdAt) {
              try {
                const d = new Date(data.createdAt);
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                millis = d.getTime();
              } catch (e) {}
            }

            broadcasts.push({
              id: docSnap.id,
              type: data.type === 'slot' ? 'slot' : data.type === 'offer' ? 'offer' : 'system',
              title: data.title || 'Platform Announcement',
              message: data.message || '',
              timestamp: timeStr,
              read: false,
              actionText: data.actionText || 'Explore Now',
              _millis: millis
            });
          });

          if (broadcasts.length > 0) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newBroadcasts = broadcasts.filter(b => !existingIds.has(b.id));
              if (newBroadcasts.length === 0) return prev;
              const combined = [...newBroadcasts, ...prev];
              combined.sort((a, b) => ((b as any)._millis || 0) - ((a as any)._millis || 0));
              return combined;
            });
          }
        }, (bErr) => {
          console.debug('[Broadcasts Listener Info]:', bErr?.message);
        });

        const origUnsub = unsubscribe;
        unsubscribe = () => {
          if (origUnsub) origUnsub();
          unsubBroadcast();
        };
      });
    } catch (e) {
      console.warn('Notifications listener init error:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, (currentUser as any)?.vendorId, (currentUser as any)?.role, isAdmin, isMasterAdmin]);


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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authContextTitle, setAuthContextTitle] = useState<string | undefined>(undefined);
  const [authContextSubtitle, setAuthContextSubtitle] = useState<string | undefined>(undefined);
  const [pendingBookingDetails, setPendingBookingDetails] = useState<any>(null);
  const [pendingAuthAction, setPendingAuthAction] = useState<((user: CustomerProfileData) => void) | null>(null);
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
  const [customDeliveryTime, setCustomDeliveryTime] = useState<string>('');
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

  // Bidirectional URL Routing & Deep-Linking Synchronizer
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase();
    const path = rawPath.replace(/\/+$/, '') || '/';

    // 1. Vendor profile deep links: /vendor/:vendorKey or /vendors/:vendorKey or ?vendor=:vendorKey
    const searchParams = new URLSearchParams(location.search);
    const queryVendor = searchParams.get('vendor') || searchParams.get('v');
    const isVendorRoute = path.startsWith('/vendor/') || path.startsWith('/vendors/') || Boolean(queryVendor);
    if (isVendorRoute) {
      const rawVendorKey = queryVendor || path.replace(/^\/vendors?\//i, '').split('/')[0].split('?')[0];
      const vendorKey = decodeURIComponent(rawVendorKey).trim();
      if (vendorKey) {
        const normalizedKey = vendorKey.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (vendors.length > 0) {
          const found = vendors.find((v) => {
            if (!v) return false;
            if (v.id && v.id.toLowerCase() === vendorKey.toLowerCase()) return true;
            if (v.name && v.name.toLowerCase() === vendorKey.toLowerCase()) return true;
            const vNameNorm = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (vNameNorm && vNameNorm === normalizedKey) return true;
            const vIdNorm = (v.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (vIdNorm && vIdNorm === normalizedKey) return true;
            return false;
          });

          if (found) {
            if (selectedVendor?.id !== found.id) {
              setSelectedVendor(found);
            }
            if (queryVendor && location.pathname !== `/vendor/${found.id}`) {
              navigate(`/vendor/${found.id}`, { replace: true });
            }
            return;
          }
        }

        // Direct fetch from Firestore if vendors list not ready yet or specific doc needed
        try {
          const db = getDb();
          import('firebase/firestore').then(async ({ doc, getDoc, collection, query, where, getDocs }) => {
            // 1. Try by exact document ID
            try {
              const snap = await getDoc(doc(db, 'vendors', vendorKey));
              if (snap.exists()) {
                const vData = { id: snap.id, ...snap.data() } as Vendor;
                setSelectedVendor(vData);
                return;
              }
            } catch (e) {}

            // 2. Try by exact name match
            try {
              const nameQ = query(collection(db, 'vendors'), where('name', '==', vendorKey));
              const nameSnap = await getDocs(nameQ);
              if (!nameSnap.empty) {
                const docSnap = nameSnap.docs[0];
                const vData = { id: docSnap.id, ...docSnap.data() } as Vendor;
                setSelectedVendor(vData);
                return;
              }
            } catch (e) {}

            // 3. Fallback: match by normalized name across collection
            try {
              const allSnap = await getDocs(collection(db, 'vendors'));
              for (const docSnap of allSnap.docs) {
                const data = docSnap.data();
                const dNameNorm = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (dNameNorm && dNameNorm === normalizedKey) {
                  setSelectedVendor({ id: docSnap.id, ...data } as Vendor);
                  return;
                }
              }
            } catch (e) {}
          }).catch((e) => console.warn('[Direct Vendor DeepLink] Fetch error:', e));
        } catch (e) {}
      }
      return;
    }

    // Clear selected vendor if navigating away from /vendor/ or /vendors/
    if (selectedVendor && !path.startsWith('/vendor/') && !path.startsWith('/vendors/')) {
      setSelectedVendor(null);
    }

    // 2. Admin Deep Links
    if (path === '/admin/kyc') {
      setIsAdminKycOpen(true);
      if (activeTab !== 'profile') setActiveTab('profile');
      return;
    }
    if (path === '/admin/health' || path === '/admin/database') {
      setIsAdminDbHealthOpen(true);
      if (activeTab !== 'profile') setActiveTab('profile');
      return;
    }
    if (path === '/admin/chats' || path === '/admin/logs') {
      setIsAdminChatsOpen(true);
      if (activeTab !== 'profile') setActiveTab('profile');
      return;
    }

    // 3. Tab & Auth Routes
    if (path === '/login' || path === '/signin') {
      setAuthModalTab('signin');
      setIsAuthModalOpen(true);
      return;
    }
    if (path === '/signup' || path === '/register') {
      setAuthModalTab('signup');
      setIsAuthModalOpen(true);
      return;
    }

    if (path === '/' || path === '/home') {
      if (activeTab !== 'home') setActiveTab('home');
    } else if (path === '/explore') {
      if (activeTab !== 'explore') setActiveTab('explore');
    } else if (path === '/cart') {
      if (activeTab !== 'cart') setActiveTab('cart');
    } else if (path === '/bookings' || path === '/reservations') {
      if (activeTab !== 'bookings') setActiveTab('bookings');
    } else if (path === '/messages' || path === '/chat') {
      if (activeTab !== 'messages') setActiveTab('messages');
      const params = new URLSearchParams(window.location.search);
      const bId = params.get('bookingId');
      const vId = params.get('vendorId');
      if (bId) setActiveChatBookingId(bId);
      if (vId) setActiveChatVendorId(vId);
    } else if (path === '/profile' || path === '/account' || path === '/admin') {
      if (activeTab !== 'profile') setActiveTab('profile');
    }
  }, [location.pathname, location.search, vendors]);

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
  // Bookings State with resilient cache fallback
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('parva_bookings') || localStorage.getItem('parva_user_bookings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const isUserLoggedIn = useMemo(() => isUserLoggedInHelper(currentUser), [currentUser]);

  // Scoped bookings for the currently authenticated user
  const userBookings = useMemo(() => {
    if (!isUserLoggedIn || !currentUser) return [];
    const cPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const cEmail = (currentUser.email || '').toLowerCase().trim();
    const cUid = currentUser.uid || '';

    return bookings.filter(b => {
      if (b.userId && cUid && b.userId === cUid) return true;
      if ((b as any).customerUid && cUid && (b as any).customerUid === cUid) return true;
      if (b.customerEmail && cEmail && cEmail.includes('@') && !cEmail.includes('customer@parva') && b.customerEmail.toLowerCase().trim() === cEmail && !b.customerEmail.toLowerCase().includes('customer@parva')) return true;
      if (b.customerPhone && cPhone && cPhone.length === 10 && cPhone !== '9999999999') {
        const bPhone = b.customerPhone.replace(/\D/g, '').slice(-10);
        if (bPhone && bPhone === cPhone && bPhone !== '9999999999') return true;
      }
      return false;
    });
  }, [bookings, currentUser, isUserLoggedIn]);

  // Derived authorized vendors for messaging (customer cannot select unauthorized vendors)
  const eligibleChatVendors = useMemo(() => {
    if (isAdmin || isMasterAdmin) return vendors;
    const ALLOWED_STATUSES = ['confirmed', 'accepted', 'in progress', 'pending', 'paid'];
    const validBookings = userBookings.filter(b => {
      const s = (b.status || (b as any).bookingStatus || '').toLowerCase();
      return !s || ALLOWED_STATUSES.includes(s);
    });
    const validVendorIds = Array.from(new Set(validBookings.map(b => b.vendor?.id || (b as any).vendorId).filter(Boolean)));
    return vendors.filter(v => validVendorIds.includes(v.id));
  }, [vendors, userBookings, isAdmin, isMasterAdmin]);

  // Messages / Chat State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChatVendorId, setActiveChatVendorId] = useState<string | null>(null);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('bookingId');
    }
    return null;
  });
  const [newMessageText, setNewMessageText] = useState('');
  const [isVendorTyping, setIsVendorTyping] = useState(false);

  // Cashfree Pending Verification / Retry State
  const [pendingVerificationOrder, setPendingVerificationOrder] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
    vendorName: string;
    serviceName: string;
    params: any;
  } | null>(null);
  const [isVerifyingPending, setIsVerifyingPending] = useState(false);

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
  const [vendorEditFounderImage, setVendorEditFounderImage] = useState('');
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
      authenticatedFetch(`${BACKEND_API_URL}/api/admin/dashboard`)
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
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/reset-defaults`, { method: 'POST' });
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
  const [isAdminKycOpen, setIsAdminKycOpen] = useState(false);
  const [isAdminDbHealthOpen, setIsAdminDbHealthOpen] = useState(false);
  const [isAdminChatsOpen, setIsAdminChatsOpen] = useState(false);
  const [isPaymentProcessingModalOpen, setIsPaymentProcessingModalOpen] = useState(false);
  const [processingPaymentDetails, setProcessingPaymentDetails] = useState<{ amount: number; vendorName: string; serviceName: string } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successPaymentData, setSuccessPaymentData] = useState<any>(null);
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
        const servicesStr = (newBookingObj.selectedServices || []).map((s: any) => `• ${s.name} (₹${s.price.toLocaleString('en-IN')})`).join('\n');
        const waText = `Hello ${newBookingObj.vendor.name},\n\nI have locked a Direct Booking with your services via Parva Celebrations (Connection Fee PAID)! 📲\n\nEvent Details:\n- Name: ${targetUser?.name}\n- Contact: ${targetUser?.phone}\n- Event Date: ${newBookingObj.eventDate}\n- Type: ${newBookingObj.eventType}\n\nSelected Services:\n${servicesStr}\n\nEstimated Event Value: ₹${newBookingObj.finalPrice.toLocaleString('en-IN')}\n\nPlease confirm availability & package customizations! Thank you!`;
        const waUrl = `https://wa.me/${vendorPhone}?text=${encodeURIComponent(waText)}`;

        // Store wafer link so user can open WhatsApp immediately
        setPendingCheckoutBooking({
          booking: newBookingObj,
          waUrl
        });

        // Close Razorpay after a brief success delay and trigger PhonePe celebration popup
        setIsRazorpayOpen(false);
        setSuccessPaymentData({
          amount: razorpayAmount,
          orderId: newBookingObj.id || `PRV-${Date.now()}`,
          vendorName: newBookingObj.vendor?.name || 'Parva Verified Partner',
          serviceName: newBookingObj.selectedServices?.[0]?.name || 'Direct Connection Fee',
          eventDate: newBookingObj.eventDate || planningStartDate,
          timeSlot: newBookingObj.eventType || 'Event Reservation',
          customerName: targetUser?.name || currentUser?.name || 'Valued Customer'
        });
        setIsSuccessModalOpen(true);
      }
    }, 2200);
  };

  const handleVendorSelect = async (v: Vendor) => {
    setSelectedVendor(v);
    const targetPath = `/vendor/${v.id}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
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

  const performVerification = async (
    orderId: string,
    paymentId: string,
    amount: number,
    vendorName: string,
    serviceName: string,
    params: any
  ): Promise<boolean> => {
    let idToken: string | null = null;
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (tokErr) {
      console.debug('Could not get idToken:', tokErr);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const verifyRes = await authenticatedFetch(`${BACKEND_API_URL}/api/payments/cashfree/verify`, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId,
        userId: currentUser?.uid || 'guest-uid',
        vendorId: params.vendorId || params.bookingData?.vendor?.id || 'system',
        type: params.type,
        totalAmount: amount,
        bookingData: params.bookingData || null,
        customerData: {
          name: params.bookingData?.customerName || currentUser?.name || 'Valued Customer',
          email: params.bookingData?.customerEmail || currentUser?.email || 'customer@parvaevents.com',
          phone: params.bookingData?.customerPhone || currentUser?.phone || 'N/A',
          age: params.bookingData?.customerAge || '',
          eventLocationAddress: params.bookingData?.eventLocationAddress || '',
          eventLocationCoords: params.bookingData?.eventLocationCoords || null,
          styleSuggestions: params.bookingData?.styleSuggestions || ''
        }
      })
    });

    const verifyData = await verifyRes.json();
    if (verifyData.success) {
      trackPaymentSuccess(orderId, verifyData.transaction?.id || orderId, amount);
      trackBookingConfirmed(verifyData.booking?.id || orderId, params.vendorId || params.bookingData?.vendor?.id || 'vendor', amount);

      // Clear draft cart only on verified payment confirmation
      setBundledItems([]);
      sessionStorage.removeItem('parva_bundled_items');

      if (verifyData.booking) {
        setBookings(prev => [verifyData.booking, ...prev.filter(b => b.id !== verifyData.booking.id)]);
      }

      setPendingVerificationOrder(null);

      // Launch PhonePe-Style Celebration Popup
      setSuccessPaymentData({
        amount: amount,
        orderId,
        vendorName,
        serviceName,
        eventDate: params.bookingData?.eventDate || planningStartDate,
        timeSlot: params.bookingData?.eventTimeSlot || planningTimeSlot || 'Evening',
        customerName: params.bookingData?.customerName || currentUser?.name || 'Valued Customer'
      });
      setIsSuccessModalOpen(true);
      return true;
    } else {
      showNotification('⚠️ Payment verified with notice: ' + (verifyData.error || 'Pending gateway sync'));
      trackPaymentFailed(orderId, verifyData.error || 'unverified');
      return false;
    }
  };

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

    const vendorObj = vendors.find(v => v.id === (params.vendorId || params.bookingData?.vendor?.id)) || params.bookingData?.vendor;
    const vendorName = vendorObj?.name || 'Parva Partner';
    const serviceName = params.bookingData?.selectedServices?.[0]?.name || params.bookingData?.serviceName || vendorObj?.category || 'Event Reservation';

    setProcessingPaymentDetails({
      amount: params.amount || 0,
      vendorName,
      serviceName
    });
    setIsPaymentProcessing(true);
    setIsPaymentProcessingModalOpen(true);
    trackCheckoutStarted(params.bookingData?.selectedServices?.length || 1, params.amount || 0);

    const CashfreeSDK = await loadCashfreeScript();
    if (!CashfreeSDK) {
      setIsPaymentProcessing(false);
      setIsPaymentProcessingModalOpen(false);
      showNotification('❌ Could not load Cashfree Web SDK. Please check your connection.');
      return;
    }

    try {
      // 1. Request Order & Payment Session ID from Secure Backend
      const response = await authenticatedFetch(`${BACKEND_API_URL}/api/payments/cashfree/create-order`, {
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
          customerName: params.bookingData?.customerName || currentUser?.name || 'Parva Customer',
          customerPhone: params.bookingData?.customerPhone || currentUser?.phone || '9999999999',
          customerEmail: params.bookingData?.customerEmail || currentUser?.email || 'customer@parva.com',
          customerAge: params.bookingData?.customerAge || '',
          eventLocationAddress: params.bookingData?.eventLocationAddress || '',
          eventLocationCoords: params.bookingData?.eventLocationCoords || null,
          styleSuggestions: params.bookingData?.styleSuggestions || '',
          eventDate: params.bookingData?.eventDate || planningStartDate,
          eventTimeSlot: params.bookingData?.eventTimeSlot || planningTimeSlot || 'evening'
        })
      });

      const orderData = await response.json();
      if (!orderData.success || !orderData.paymentSessionId) {
        setIsPaymentProcessing(false);
        setIsPaymentProcessingModalOpen(false);
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
        setIsPaymentProcessingModalOpen(false);
        console.log(`[Cashfree Result]:`, result);

        if (result.error) {
          showNotification(`⚠️ Payment cancelled or failed: ${result.error.message || 'Dismissed'}`);
          trackPaymentFailed(orderId, result.error.message || 'dismissed');
          return;
        }

        // 4. Verify Payment Server-side Upon Successful Payment
        showNotification('⏳ Verifying payment with Cashfree...');
        try {
          const success = await performVerification(
            orderId,
            result?.paymentDetails?.paymentId || `cf_pay_${Date.now()}`,
            amount,
            vendorName,
            serviceName,
            params
          );
          if (!success) {
            setPendingVerificationOrder({
              orderId,
              paymentId: result?.paymentDetails?.paymentId || `cf_pay_${Date.now()}`,
              amount,
              vendorName,
              serviceName,
              params
            });
          }
        } catch (vErr: any) {
          console.error('[Cashfree Verify Error]:', vErr);
          trackPaymentFailed(orderId, 'verification_network_error');
          // Offer idempotent status verification retry
          setPendingVerificationOrder({
            orderId,
            paymentId: result?.paymentDetails?.paymentId || `cf_pay_${Date.now()}`,
            amount,
            vendorName,
            serviceName,
            params
          });
        }
      }).catch((chkErr: any) => {
        setIsPaymentProcessing(false);
        setIsPaymentProcessingModalOpen(false);
        console.error('[Cashfree Checkout Modal Error]:', chkErr);
        showNotification('⚠️ Payment window closed.');
        trackPaymentFailed(orderId, 'modal_closed');
      });

    } catch (error: any) {
      setIsPaymentProcessing(false);
      setIsPaymentProcessingModalOpen(false);
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

  // Centralized Single Customer Authentication Gate
  const requireCustomerAuth = (
    onSuccessCallback: (user: CustomerProfileData) => void,
    title?: string,
    subtitle?: string
  ): boolean => {
    if (currentUser) {
      onSuccessCallback(currentUser);
      return true;
    }
    setPendingAuthAction(() => onSuccessCallback);
    setAuthModalTab('signin');
    setAuthContextTitle(title || 'Sign in required');
    setAuthContextSubtitle(subtitle || 'Please sign in or create an account to proceed with your reservation.');
    setIsAuthModalOpen(true);
    return false;
  };

  const handleBookPlannerPackage = () => {
    if (!currentUser) {
      requireCustomerAuth(
        () => handleBookPlannerPackage(),
        'Sign in to book celebration plan',
        'Your selected vendors and dates are preserved. Sign in or create an account to finalize your booking.'
      );
      return;
    }

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
        status: 'Pending',
        totalPrice: price,
        bundleDiscount: discountPct,
        finalPrice: finalPrice,
        paymentStatus: 'Unpaid',
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
    handleNavigateToTab('bookings');
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
      const servicesTotal = bundledItems.reduce((sum, item) => {
                    const itemVal = item.vendor.category === 'Catering'
                      ? item.service.price * (planningGuestSize || 100)
                      : item.service.price;
                    return sum + itemVal;
                  }, 0);
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
    if (!currentUser) {
      requireCustomerAuth(
        () => handleBookDirectPlan(planName, totalCost, vendors),
        'Sign in to book package',
        'Your celebration plan is saved. Sign in or create an account to finalize your booking.'
      );
      return;
    }

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
        status: 'Pending',
        totalPrice: price,
        bundleDiscount: discountPct,
        finalPrice: finalPrice,
        paymentStatus: 'Unpaid',
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
    handleNavigateToTab('bookings');
    showNotification(`🎉 Congratulations! Your AI ${planName} has been booked!`);
  };

  // Handle Voice results
  const handleVoiceSearchResult = (result: string) => {
    setSearchQuery(result);
    setSelectedExploreCategory('all');
    handleNavigateToTab('explore');
    showNotification(`Voice query: "${result}"`);
  };

  // Confirm booking checkout
  const handleConfirmBooking = (eventType: string) => {
    if (bundledItems.length === 0) return;

    if (!currentUser) {
      requireCustomerAuth(
        () => handleConfirmBooking(eventType),
        'Sign in to confirm booking',
        'Your services are held. Sign in or register to complete your reservation.'
      );
      return;
    }

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
    handleNavigateToTab('bookings');
    showNotification('Premium Event Bundle Booked Successfully!');
  };

  // Centralized payment and booking reservation execution
  const executeBookingPayment = async (bookingDetails: any, activeUser?: any) => {
    const userToUse = activeUser || currentUser;

    if (!userToUse) {
      setPendingBookingDetails(bookingDetails);
      try {
        sessionStorage.setItem('parva_pending_booking_draft', JSON.stringify({
          bookingDetails,
          bundledItems,
          planningStartDate,
          planningEventType,
          planningTimeSlot,
          customDeliveryTime
        }));
      } catch (e) {}
      setAuthModalTab('signin');
      setAuthContextTitle('Sign in to complete booking');
      setAuthContextSubtitle('Your selected event services and dates are saved. Sign in or create an account to finalize your reservation.');
      setIsAuthModalOpen(true);
      return;
    }

    const servicesTotal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
    const bookingFee = Math.round(servicesTotal * 0.05);
    const gst = Math.round(bookingFee * 0.18);
    const finalPayableTotal = Math.max(0, bookingFee + gst - couponDiscount);

    const custName = bookingDetails?.clientName || userToUse?.name || userToUse?.displayName || 'Valued Client';
    const custPhone = bookingDetails?.clientPhone || userToUse?.phone || '';
    const custEmail = bookingDetails?.clientEmail || userToUse?.email || '';
    const custAge = bookingDetails?.clientAge || '';
    const eventAddr = bookingDetails?.eventAddress || '';
    const eventCoords = bookingDetails?.gpsCoords || null;
    const styleNotes = bookingDetails?.styleSuggestions || '';
    const primaryVendor = bundledItems[0]?.vendor || vendors[0];

    const newBooking: Booking = {
      id: `b-new-${Date.now()}`,
      vendor: primaryVendor,
      vendorId: primaryVendor?.id,
      serviceName: bundledItems[0]?.service?.name || primaryVendor?.category || 'Celebration Service',
      selectedServices: bundledItems.map(item => item.service),
      eventDate: planningStartDate,
      eventTimeSlot: customDeliveryTime || planningTimeSlot || 'evening',
      customTime: customDeliveryTime || '',
      eventType: planningEventType || 'Celebration',
      status: 'Pending',
      totalPrice: servicesTotal,
      bundleDiscount: couponDiscount,
      finalPrice: servicesTotal - couponDiscount,
      paymentStatus: 'Unpaid',
      bookingIdString: `PRV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAge: custAge,
      eventLocationAddress: eventAddr,
      eventLocationCoords: eventCoords,
      styleSuggestions: styleNotes,
      notes: styleNotes,
      createdAt: new Date().toISOString()
    };

    // Launch Cashfree Payment Modal
    try {
      await handlePayWithCashfree({
        vendorId: primaryVendor?.id,
        type: 'booking',
        amount: finalPayableTotal,
        bookingData: newBooking
      });
    } catch (pErr) {
      console.warn('Payment gateway launch error:', pErr);
      showNotification('Payment initialization error. Please try again.');
    }
  };

  // Auth Success Handler: updates user, closes modal, resumes pending actions
  const handleAuthSuccess = async (loggedUser: CustomerProfileData) => {
    setCurrentUser(loggedUser);
    try {
      localStorage.setItem('parva_user', JSON.stringify(loggedUser));
    } catch (e) {}
    setIsAuthModalOpen(false);

    // 1. If an action callback was pending, run it
    if (pendingAuthAction) {
      const action = pendingAuthAction;
      setPendingAuthAction(null);
      action(loggedUser);
      return;
    }

    // 2. If a booking was pending in state or sessionStorage, resume it
    let detailsToResume = pendingBookingDetails;
    if (!detailsToResume) {
      try {
        const savedDraft = sessionStorage.getItem('parva_pending_booking_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          detailsToResume = parsed.bookingDetails;
          sessionStorage.removeItem('parva_pending_booking_draft');
        }
      } catch (e) {}
    }

    if (detailsToResume) {
      setPendingBookingDetails(null);
      showNotification(`Welcome, ${loggedUser.name || 'valued customer'}! Resuming your booking reservation...`);
      await executeBookingPayment(detailsToResume, loggedUser);
    }
  };

  // Centralized Logout Handler
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setIsMasterAdmin(false);
    setNotifications([]);
    setActiveChatVendorId(null);
    setActiveChatBookingId(null);
    setPendingBookingDetails(null);
    setPendingAuthAction(null);
    try {
      localStorage.removeItem('parva_user');
      localStorage.removeItem('parva_token');
      sessionStorage.removeItem('parva_checkout_draft');
      sessionStorage.removeItem('parva_pending_booking_draft');
    } catch (e) {}
    showNotification('Logged out successfully.');
  };

  // Chat/Messaging Navigation Handler
  const handleOpenChatWithVendor = (vendorId?: string, bookingId?: string) => {
    if (!currentUser) {
      requireCustomerAuth(
        () => handleOpenChatWithVendor(vendorId, bookingId),
        'Sign in to message vendor',
        'Sign in to chat directly with vendors and coordinators.'
      );
      return;
    }
    if (vendorId) setActiveChatVendorId(vendorId);
    if (bookingId) setActiveChatBookingId(bookingId);
    setActiveTab('messages');
    const queryParts = [];
    if (bookingId) queryParts.push(`bookingId=${encodeURIComponent(bookingId)}`);
    if (vendorId) queryParts.push(`vendorId=${encodeURIComponent(vendorId)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    navigate(`/messages${qs}`);
  };

  const handleSelectThread = (vendorId: string, bookingId?: string) => {
    const matched = userBookings.find(b => (b.vendor?.id === vendorId || (b as any).vendorId === vendorId));
    handleOpenChatWithVendor(vendorId, bookingId || matched?.id);
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

  // Canonical category normalizer for safe, exact taxonomy matching
  const normalizeCategory = (cat: string): string => {
    if (!cat) return '';
    const c = cat.toLowerCase().trim();
    if (c.includes('cater')) return 'catering';
    if (c.includes('decor')) return 'decoration';
    if (c.includes('photo') || c.includes('video')) return 'photography';
    if (c.includes('dj') || c.includes('sound') || c.includes('music')) return 'dj';
    if (c.includes('venue') || c.includes('hall') || c.includes('lawn') || c.includes('banquet') || c.includes('resort')) return 'venue';
    if (c.includes('makeup') || c.includes('beauty') || c.includes('bridal makeup')) return 'makeup';
    if (c.includes('pandit') || c.includes('priest')) return 'pandit';
    if (c.includes('cake') || c.includes('bakery')) return 'cake';
    if (c.includes('planner') || c.includes('organizer') || c.includes('event planner')) return 'planner';
    if (c.includes('mehendi') || c.includes('mehndi')) return 'mehendi';
    return c;
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

    const normSelectedCat = normalizeCategory(selectedCat);
    const normVendorCat = normalizeCategory(vendorCat);

    const matchesCategory =
      selectedCat === 'all' ||
      vendorCat === selectedCat ||
      (normSelectedCat !== '' && normSelectedCat === normVendorCat) ||
      vendorCats.some((c: string) => c === selectedCat || (normSelectedCat !== '' && normalizeCategory(c) === normSelectedCat));

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

    const checkVendorMatchesType = (v: any, t: string) => {
      const typeLower = t.toLowerCase().trim();
      const features = (v.features || []).map((f: string) => f.toLowerCase());
      const cat = (v.category || '').toLowerCase();
      const services = (v.services || []).map((s: any) => `${s.name || ''} ${s.category || ''}`.toLowerCase());
      const desc = (v.description || '').toLowerCase();
      const tagline = (v.tagline || '').toLowerCase();

      if (typeLower === 'ac hall') {
        return features.some((f: string) => f.includes('ac') || f.includes('hall')) || cat.includes('hall') || desc.includes('ac');
      }
      if (typeLower === 'lawn') {
        return features.some((f: string) => f.includes('lawn')) || cat.includes('lawn') || desc.includes('lawn');
      }
      if (typeLower === 'veg only') {
        return features.some((f: string) => f.includes('veg') && !f.includes('non-veg')) || desc.includes('veg only') || desc.includes('pure veg');
      }
      if (typeLower === 'non-veg allowed') {
        return features.some((f: string) => f.includes('non-veg') || f.includes('non veg')) || desc.includes('non-veg');
      }
      if (typeLower === 'photography') {
        return cat.includes('photo') || services.some((s: string) => s.includes('photo')) || tagline.includes('photo');
      }
      if (typeLower === 'decoration') {
        return cat.includes('decor') || services.some((s: string) => s.includes('decor')) || tagline.includes('decor');
      }
      if (typeLower === 'catering') {
        return cat.includes('cater') || services.some((s: string) => s.includes('cater')) || tagline.includes('cater');
      }
      if (typeLower === 'dj & sound') {
        return cat.includes('dj') || cat.includes('sound') || services.some((s: string) => s.includes('dj') || s.includes('sound')) || tagline.includes('dj');
      }
      if (typeLower === 'bridal makeup') {
        return cat.includes('makeup') || cat.includes('bridal') || services.some((s: string) => s.includes('makeup'));
      }
      if (typeLower === 'rooms available') {
        return features.some((f: string) => f.includes('room')) || desc.includes('room');
      }
      return (
        features.some((f: string) => f.includes(typeLower)) ||
        cat.includes(typeLower) ||
        tagline.includes(typeLower) ||
        desc.includes(typeLower) ||
        services.some((s: string) => s.includes(typeLower))
      );
    };

    const matchesTypes = activeFilterTypes.length === 0 || activeFilterTypes.every(t => checkVendorMatchesType(vendor, t));

    return matchesCity && matchesCategory && matchesSearch && matchesPrice && matchesMinPrice && matchesMaxPrice && matchesTypes && matchesOccasion && vendor.approved !== false;
    }).sort((a, b) => {
    // 1. If amenities/types filter is active, rank vendors with highest match score first
    if (activeFilterTypes.length > 0) {
      const scoreA = activeFilterTypes.filter(t => (
        (a.features || []).some((f: string) => f.toLowerCase().includes(t.toLowerCase())) ||
        (a.category || '').toLowerCase().includes(t.toLowerCase()) ||
        (a.tagline || '').toLowerCase().includes(t.toLowerCase())
      )).length;
      const scoreB = activeFilterTypes.filter(t => (
        (b.features || []).some((f: string) => f.toLowerCase().includes(t.toLowerCase())) ||
        (b.category || '').toLowerCase().includes(t.toLowerCase()) ||
        (b.tagline || '').toLowerCase().includes(t.toLowerCase())
      )).length;
      if (scoreB !== scoreA) return scoreB - scoreA;
    }

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

    // Booking management helpers for Customer Web & Airbnb Experience
  const handleDownloadVoucher = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotification('Please allow popups to download voucher.');
      return;
    }
    const totalPrice = Number(booking.totalPrice || booking.finalPrice || 0);
    const platformFee = Math.round(totalPrice * 0.05);
    const gstFee = Math.round(platformFee * 0.18);
    const advancePaid = platformFee + gstFee;
    const remainingAmount = totalPrice - platformFee;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Parva Booking Confirmation Voucher - ${booking.bookingIdString || booking.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #fff; color: #1a0812; padding: 36px; line-height: 1.5; font-size: 13px; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #f2e4ec; border-radius: 24px; padding: 32px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #a21c54; padding-bottom: 20px; margin-bottom: 24px; }
            .logo-wrap { display: flex; align-items: center; gap: 12px; }
            .logo-img { height: 44px; width: auto; object-fit: contain; }
            .voucher-badge { background: #faf5f8; border: 1px solid #f2e4ec; color: #a21c54; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .title-section { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .voucher-title { font-size: 22px; font-weight: 900; color: #1a0812; }
            .voucher-sub { font-size: 12px; color: #745b68; font-weight: 600; margin-top: 2px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .card { background: #faf5f8; border: 1px solid #f2e4ec; border-radius: 16px; padding: 18px; }
            .card-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #a21c54; margin-bottom: 12px; border-bottom: 1px solid #f2e4ec; padding-bottom: 6px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12.5px; }
            .row:last-child { margin-bottom: 0; }
            .label { color: #745b68; font-weight: 600; }
            .val { font-weight: 800; color: #1a0812; text-align: right; }
            .status-tag { display: inline-block; background: #e6f9f0; color: #047857; font-weight: 800; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
            .payment-card { background: #fff; border: 2px solid #a21c54; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
            .highlight-row { background: #faf5f8; padding: 10px 14px; border-radius: 10px; margin-top: 8px; }
            .due-row { background: #fdf2f8; padding: 12px 14px; border-radius: 12px; border: 1px dashed #a21c54; margin-top: 10px; }
            .policy-box { background: #fdfbf7; border: 1px solid #fef3c7; border-radius: 14px; padding: 16px; margin-bottom: 24px; font-size: 11px; color: #78350f; }
            .policy-title { font-weight: 800; margin-bottom: 6px; color: #92400e; font-size: 12px; }
            .policy-list { list-style: disc; padding-left: 18px; line-height: 1.6; }
            .footer { border-top: 1px solid #f2e4ec; padding-top: 18px; text-align: center; color: #745b68; font-size: 11px; }
            .btn-print { margin-top: 16px; background: #a21c54; color: #fff; border: none; padding: 10px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; }
            @media print { .btn-print { display: none; } body { padding: 0; } .container { border: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-wrap">
                <img src="/parva-logo.png" alt="Parva" class="logo-img" onerror="this.style.display='none'" />
                <span style="font-size:24px; font-weight:900; color:#a21c54; letter-spacing:-0.5px;">parva</span>
              </div>
              <div class="voucher-badge">Verified Booking Voucher</div>
            </div>

            <div class="title-section">
              <div>
                <h1 class="voucher-title">Official Event Confirmation</h1>
                <p class="voucher-sub">Issued under 100% Parva Escrow Guarantee</p>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px; color:#745b68; font-weight:700;">BOOKING ID</div>
                <div style="font-size:15px; font-weight:900; font-family:monospace; color:#a21c54;">${booking.bookingIdString || booking.id}</div>
              </div>
            </div>

            <div class="grid-2">
              <!-- Customer Details -->
              <div class="card">
                <div class="card-title">Customer & Event Details</div>
                <div class="row"><span class="label">Customer Name:</span><span class="val">${booking.customerName || (booking as any).userName || 'Valued Client'}</span></div>
                <div class="row"><span class="label">Contact Phone:</span><span class="val">${booking.customerPhone || (booking as any).userPhone || 'Provided'}</span></div>
                <div class="row"><span class="label">Email Address:</span><span class="val">${booking.customerEmail || (booking as any).userEmail || 'Registered'}</span></div>
                <div class="row"><span class="label">Event Date:</span><span class="val" style="color:#a21c54;">${booking.eventDate}</span></div>
                <div class="row"><span class="label">Time Slot:</span><span class="val">${booking.eventTimeSlot || 'Standard Slot'}</span></div>
                <div class="row"><span class="label">Event Venue:</span><span class="val">${booking.eventLocationAddress || (booking as any).location || 'Customer Selected Address'}</span></div>
                ${booking.guestCount ? `<div class="row"><span class="label">Guest Count:</span><span class="val">${booking.guestCount} Guests</span></div>` : ''}
              </div>

              <!-- Vendor Details -->
              <div class="card">
                <div class="card-title">Vendor & Service Partner</div>
                <div class="row"><span class="label">Vendor Name:</span><span class="val">${booking.vendor?.name || 'Verified Partner'}</span></div>
                <div class="row"><span class="label">Category:</span><span class="val">${booking.vendor?.category || 'Celebration Service'}</span></div>
                <div class="row"><span class="label">Service Name:</span><span class="val">${booking.serviceName || 'Standard Package'}</span></div>
                <div class="row"><span class="label">Vendor Location:</span><span class="val">${booking.vendor?.location || 'Registered Partner City'}</span></div>
                <div class="row"><span class="label">Partner Phone:</span><span class="val">${booking.vendor?.phone || '+91 Concierge Support'}</span></div>
                <div class="row"><span class="label">Booking Status:</span><span class="val"><span class="status-tag">${booking.status}</span></span></div>
                <div class="row"><span class="label">Escrow Protection:</span><span class="val" style="color:#047857;">Active & Insured</span></div>
              </div>
            </div>

            <!-- Payment Breakdown -->
            <div class="payment-card">
              <div class="card-title" style="color:#1a0812; font-size:13px; margin-bottom:14px;">Authoritative Payment Ledger & Balance Summary</div>
              <div class="row"><span class="label">Agreed Gross Booking Price:</span><span class="val">₹${totalPrice.toLocaleString('en-IN')}</span></div>
              <div class="row"><span class="label">Platform Commitment Token (5%):</span><span class="val">₹${platformFee.toLocaleString('en-IN')}</span></div>
              <div class="row"><span class="label">GST (18% on platform fee):</span><span class="val">₹${gstFee.toLocaleString('en-IN')}</span></div>
              
              <div class="row highlight-row">
                <span class="label" style="font-weight:800; color:#047857;">Total Advance Paid Online via Parva:</span>
                <span class="val" style="font-size:14px; color:#047857;">₹${advancePaid.toLocaleString('en-IN')} [Paid ✓]</span>
              </div>

              <div class="row due-row">
                <div>
                  <div style="font-weight:900; font-size:14px; color:#a21c54;">Remaining Balance Due at Venue:</div>
                  <div style="font-size:10.5px; color:#745b68; font-weight:600;">Pay directly to ${booking.vendor?.name || 'vendor'} on event date upon arrival</div>
                </div>
                <span class="val" style="font-size:18px; font-weight:900; color:#a21c54;">₹${remainingAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Policies & Protection -->
            <div class="policy-box">
              <div class="policy-title">🛡️ Parva Escrow Rules & Cancellation Policy</div>
              <ul class="policy-list">
                <li><strong>Slot Lock Guarantee:</strong> Your advance payment locks the vendor's exclusive calendar slot for the date and time specified above.</li>
                <li><strong>On-Site Settlement:</strong> The remaining balance of ₹${remainingAmount.toLocaleString('en-IN')} is payable directly to the service partner on the event date upon setup/commencement.</li>
                <li><strong>Cancellation Policy:</strong> Free cancellation with 100% advance refund (less standard PG gateway fees) is applicable if cancelled at least 7 days prior to the event date.</li>
                <li><strong>Concierge Escalation:</strong> For any immediate venue coordination or rescheduling, reach our 24/7 dedicated support team.</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>Parva Celebrations India Private Limited</strong> • www.myparva.com</p>
              <p>24x7 Partner & Client Concierge Helpline: <strong>support@myparva.com</strong> | <strong>+91 91724 99195</strong></p>
              <button class="btn-print" onclick="window.print()">🖨️ Print / Download PDF Voucher</button>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date().toISOString()
        });
      }
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
      showNotification('Booking cancelled successfully.');
    } catch (error) {
      console.error('Cancel booking error:', error);
      showNotification('Failed to cancel booking. Please try again.');
    }
  };

  const handleApproveKyc = async (vendorId: string) => {
    try {
      const db = getDb();
      const now = new Date().toISOString();
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'vendors', vendorId), {
        isVerified: true,
        verified: true,
        'kyc.status': 'VERIFIED',
        'kyc.verifiedAt': now,
        updatedAt: now
      });
      setVendors(prev => prev.map(v => v.id === vendorId ? {
        ...v,
        isVerified: true,
        verified: true,
        kyc: { ...(v.kyc || { status: 'VERIFIED' }), status: 'VERIFIED', verifiedAt: now }
      } : v));
      showNotification('✅ Vendor KYC Approved & Verified Partner Badge Granted!');
    } catch (err) {
      console.error('Error approving KYC:', err);
      showNotification('Failed to approve KYC. Please try again.');
    }
  };

  const handleRejectKyc = async (vendorId: string, reason: string) => {
    try {
      const db = getDb();
      const now = new Date().toISOString();
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'vendors', vendorId), {
        isVerified: false,
        verified: false,
        'kyc.status': 'REJECTED',
        'kyc.rejectionReason': reason,
        updatedAt: now
      });
      setVendors(prev => prev.map(v => v.id === vendorId ? {
        ...v,
        isVerified: false,
        verified: false,
        kyc: { ...(v.kyc || { status: 'REJECTED' }), status: 'REJECTED', rejectionReason: reason }
      } : v));
      showNotification('KYC Rejection notice saved and vendor profile updated.');
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      showNotification('Failed to reject KYC.');
    }
  };

  const handleSubmitReview = async (bookingId: string, vendorId: string, rating: number, comment: string) => {
    try {
      if (db) {
        await addDoc(collection(db, 'reviews'), {
          bookingId,
          vendorId,
          customerUid: currentUser?.uid || 'guest',
          customerName: currentUser?.name || 'Client',
          rating,
          comment,
          createdAt: new Date().toISOString()
        });
      }
      showNotification('⭐ Review submitted successfully. Thank you!');
    } catch (error) {
      console.error('Review submit error:', error);
      showNotification('Failed to submit review.');
    }
  };

  const isDashboardExpanded = false;

  
  // Compute active categories in current city
  const activeCategoriesInCity = categoriesList.filter(cat => 
    vendors.some(v => 
      (v.location || '').toLowerCase().includes((currentCity || '').toLowerCase()) && 
      (v.category || '').toLowerCase() === cat.name.toLowerCase()
    )
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* AIRBNB-INSPIRED DESKTOP & WEB MARKETPLACE (Visible ONLY on Desktop >= lg) */}
      {/* ========================================================================= */}
      <div className="hidden lg:block min-h-screen bg-white">
        <AirbnbDesktopMarketplace
          promos={promosList}
          vendors={vendors}
          categories={categoriesList.map(c => ({ 
            id: c.name, 
            name: c.name, 
            image: c.image || (c as any).imageUrl,
            description: (c as any).description 
          }))}
          currentCity={currentCity}
          onSelectCity={(c) => setCurrentCity(c)}
          cities={citiesList}
          selectedCategory={selectedExploreCategory}
          onSelectCategory={(cat) => setSelectedExploreCategory(cat)}
          planningStartDate={planningStartDate}
          onDateChange={(d) => setPlanningStartDate(d)}
          planningGuestSize={planningGuestSize}
          onGuestCountChange={(g) => setPlanningGuestSize(g)}
          currentUser={currentUser}
          onOpenLogin={(tab) => {
            const safeTab = tab === 'signup' ? 'signup' : tab === 'forgot' ? 'forgot' : 'signin';
            setAuthModalTab(safeTab);
            setAuthContextTitle(undefined);
            setAuthContextSubtitle(undefined);
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          onNavigateTab={(tab) => handleNavigateToTab(tab as any)}
          activeTab={activeTab}
          cartCount={bundledItems.length}
          onOpenCart={() => handleNavigateToTab('cart')}
          onOpenSupport={() => setIsSupportModalOpen(true)}
          onOpenNotifications={() => {
            if (!currentUser) {
              requireCustomerAuth(() => setIsNotificationCenterOpen(true), 'Sign in for notifications', 'View booking confirmations and live updates.');
              return;
            }
            setIsNotificationCenterOpen(true);
          }}
          unreadCount={unreadNotificationsCount}
          wishlist={wishlist || []}
          onToggleWishlist={handleToggleWishlist}
          onSelectVendor={(v) => handleVendorSelect(v)}
          selectedVendor={selectedVendor}
          onCloseVendorDetail={() => handleCloseVendor()}
          onAddServiceToBundle={(service) => handleAddServiceToBundle(selectedVendor || vendors[0], service)}
          bundledItems={bundledItems}
          onPay={async (bookingDetails) => {
            if (!currentUser) {
              setPendingBookingDetails(bookingDetails);
              setAuthModalTab('signin');
              setAuthContextTitle('Sign in to complete booking');
              setAuthContextSubtitle('Your selected event services and dates are saved. Sign in or create an account to finalize your reservation.');
              setIsAuthModalOpen(true);
              return;
            }
            await executeBookingPayment(bookingDetails);
          }}
          couponDiscount={couponDiscount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          onApplyCoupon={handleApplyCoupon}
          couponMessage={couponMessage}
          bookings={userBookings}
          onOpenAdminKyc={() => setIsAdminKycOpen(true)}
          onOpenAdminHealth={() => setIsAdminDbHealthOpen(true)}
          onOpenAdminChats={() => setIsAdminChatsOpen(true)}
          onOpenLocationSelector={() => setIsLocationOpen(true)}
          onOpenVendorAuth={() => setIsRegisteringVendor(true)}
          onDownloadVoucher={handleDownloadVoucher}
          onCancelBooking={handleCancelBooking}
          onSubmitReview={handleSubmitReview}
          onOpenChatWithVendor={handleOpenChatWithVendor}
        />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE APPLICATION INTERFACE (Visible ONLY on Mobile < lg)                */}
      {/* ========================================================================= */}
      <div className="block lg:hidden min-h-screen bg-brand-bg">
        <div className="min-h-screen bg-brand-bg flex flex-col w-full relative pb-24" id="parva-app-container">

          <Helmet>
            <title>{!selectedExploreCategory || selectedExploreCategory === 'all' ? 'Explore Vendors | Parva Events' : `${(selectedExploreCategory || '').charAt(0).toUpperCase() + (selectedExploreCategory || '').slice(1)} Vendors | Parva Events`}</title>
            <meta name="description" content={`Find and book the best ${!selectedExploreCategory || selectedExploreCategory === 'all' ? 'event' : selectedExploreCategory} vendors on Parva Events.`} />
          </Helmet>
          
          {/* 1. TOP APP BAR */}
          <header className="bg-white px-3 sm:px-5 py-2.5 sm:py-3 border-b border-brand-border sticky top-0 z-30 flex items-center justify-between shadow-xs h-14" id="top-app-bar">
            {/* Left: Official Parva Logo & City Selector */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                type="button"
                onClick={() => handleNavigateToTab('home')}
                className="shrink-0 flex items-center focus:outline-none cursor-pointer"
                aria-label="Parva Home"
              >
                <img 
                  src="/parva-logo.png" 
                  alt="Parva" 
                  className="h-7 sm:h-8 w-auto object-contain" 
                />
              </button>

              {/* Location selector trigger */}
              <button
                type="button"
                onClick={() => setIsLocationOpen(true)}
                className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 px-2 py-1 rounded-full text-[11px] font-bold text-gray-800 transition shrink-0 cursor-pointer"
                id="top-location-trigger"
                title="Select City"
              >
                <MapPin size={11} className="text-rose-600 shrink-0" />
                <span className="max-w-[70px] sm:max-w-[90px] truncate">{currentCity}</span>
                <ChevronDown size={11} className="text-gray-400 shrink-0" />
              </button>
            </div>

            {/* Right side Action icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {!isUserLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setAuthContextTitle(undefined);
                    setAuthContextSubtitle(undefined);
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs px-3 py-1.5 rounded-full transition shadow-xs active:scale-95 cursor-pointer"
                >
                  Log In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigateToTab('profile')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary font-black text-xs shadow-inner cursor-pointer"
                  title="Profile"
                >
                  {getUserInitials(currentUser)}
                </button>
              )}

              {/* Help & Support */}
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-brand-text transition relative cursor-pointer"
                id="support-help-button"
                aria-label="Help and Support"
                title="Help and Support"
              >
                <Headphones size={17} />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    requireCustomerAuth(() => setIsNotificationCenterOpen(true), 'Sign in for notifications', 'View booking confirmations and live updates.');
                    return;
                  }
                  setIsNotificationCenterOpen(true);
                  if (permissionStatus === 'default') {
                    requestNotificationPermission();
                  }
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full text-brand-text transition relative cursor-pointer"
                id="notification-bell"
                title="Open Notifications"
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-brand-primary text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Cart showing bundle count */}
              <button
                type="button"
                onClick={() => {
                  handleNavigateToTab('cart');
                }}
                className="p-1.5 bg-brand-primary-light text-brand-primary hover:bg-brand-primary hover:text-white rounded-full transition relative shadow-xs cursor-pointer"
                id="cart-trigger"
                title="Cart"
              >
                <ShoppingCart size={17} />
                {bundledItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-primary-dark text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">
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
      <main className="flex-1 bg-brand-bg px-4 pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
        
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
                  handleNavigateToTab('explore');
                }}
                onOpenVoiceSearch={() => setIsVoiceOpen(true)}
                onOpenFilters={() => setIsFilterModalOpen(true)}
                activeFilterCount={(activeFilterMinPrice !== null ? 1 : 0) + (activeFilterMaxPrice !== null ? 1 : 0) + activeFilterTypes.length + (activeSortOption !== 'Distance' ? 1 : 0)}
              />
            </div>

            {/* Real-time Hero Carousel from Firestore */}
            {promosList.length > 0 && currentPromo && (
              <div className="relative rounded-[24px] overflow-hidden h-[200px] bg-slate-100 group cursor-pointer shadow-sm border border-slate-200/50" onClick={() => handleNavigateToTab('explore')}>
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
                      handleNavigateToTab('explore');
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
                  onClick={() => { setSelectedExploreCategory('all'); handleNavigateToTab('explore'); }}
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

            {/* Section: Recommended Verified Vendors in City */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 font-display">
                    {filteredVendors.length} Verified {filteredVendors.length === 1 ? 'Partner' : 'Partners'} in {currentCity}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedExploreCategory === 'all' ? 'Showing all categories' : `Filtered by: ${selectedExploreCategory}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={activeSortOption}
                    onChange={(e) => setActiveSortOption(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="Distance">📍 Nearest Distance</option>
                    <option value="Popularity">🏆 Most Popular</option>
                    <option value="Rating - High to Low">⭐ Top Rated</option>
                    <option value="Price - Low to High">₹ Price: Low to High</option>
                    <option value="Price - High to Low">₹ Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredVendors.map((vendor) => (
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
                {filteredVendors.length === 0 && (
                  <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-xs text-brand-text-secondary space-y-2">
                    <p className="font-bold text-gray-800 text-sm">No vendors found matching your criteria in {currentCity}</p>
                    <p className="text-gray-500">Try changing your search query or selecting "All Services".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedExploreCategory('all');
                        setActiveSortOption('Distance');
                        setActiveFilterMinPrice(null);
                        setActiveFilterMaxPrice(null);
                        setActiveFilterTypes([]);
                      }}
                      className="px-4 py-2 bg-brand-primary text-white font-bold rounded-xl text-xs hover:bg-brand-primary-dark transition"
                    >
                      Reset All Filters
                    </button>
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

        {/* ==================== TAB: CART (EMPTY STATE) ==================== */}
        {activeTab === 'cart' && bundledItems.length === 0 && (
          <div className="space-y-5" id="cart-view-container">
            <div className="bg-white rounded-[24px] border border-brand-border p-10 text-center shadow-sm flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                <ShoppingCart size={28} />
              </div>
              <h3 className="font-extrabold text-base text-brand-text">Your Cart is Empty</h3>
              <p className="text-xs text-brand-text-secondary max-w-xs">
                Explore our verified vendors and add services to your celebration bundle to get started.
              </p>
              <button
                onClick={() => handleNavigateToTab('home')}
                className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-brand-primary/15 active:scale-95 cursor-pointer"
              >
                Explore Services
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB: BOOKINGS & CART BUNDLE ==================== */}
        {(activeTab === 'bookings' || (activeTab === 'cart' && bundledItems.length > 0)) && (
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
                            ₹{item.service.price.toLocaleString('en-IN')}
                          </span>
                          {item.service.unit && (
                            <span className="text-[8.5px] font-bold text-amber-800 block">
                              {item.service.unit}
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
                        const isSelected = planningTimeSlot === slot.id && !customDeliveryTime;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setCustomDeliveryTime('');
                              setPlanningTimeSlot(slot.id);
                            }}
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

                    {/* Exact On-Time Schedule Custom Input */}
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-gray-700 font-extrabold uppercase tracking-wider block">
                          Exact On-Time Schedule (12-Hour AM / PM)
                        </span>
                        <p className="text-[10px] text-gray-500">Pick exact delivery or custom start time (e.g., cake delivery)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={customDeliveryTime ? (() => {
                            const [t, p] = customDeliveryTime.split(' ');
                            if (!t) return '';
                            let [h, m] = t.split(':').map(Number);
                            if (p === 'PM' && h < 12) h += 12;
                            if (p === 'AM' && h === 12) h = 0;
                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                          })() : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [h, m] = val.split(':');
                              const hour = parseInt(h, 10);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const formattedHour = hour % 12 || 12;
                              const timeStr = `${String(formattedHour).padStart(2, '0')}:${m} ${ampm}`;
                              setCustomDeliveryTime(timeStr);
                              setPlanningTimeSlot(timeStr);
                            } else {
                              setCustomDeliveryTime('');
                              setPlanningTimeSlot('evening');
                            }
                          }}
                          className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 outline-none focus:border-brand-primary"
                        />
                        {customDeliveryTime && (
                          <span className="text-xs font-black text-brand-primary bg-white px-2 py-1 rounded-lg border border-brand-primary/20 shadow-xs">
                            {customDeliveryTime}
                          </span>
                        )}
                      </div>
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
                            const processCartBooking = (activeUser?: any) => {
                              const user = activeUser || currentUser;
                              const nameEl = document.getElementById('cart-user-name') as HTMLInputElement;
                              const phoneEl = document.getElementById('cart-user-phone') as HTMLInputElement;
                              const emailEl = document.getElementById('cart-user-email') as HTMLInputElement;

                              const bookingDetails = {
                                clientName: user?.name || user?.displayName || nameEl?.value || 'Valued Customer',
                                clientPhone: user?.phone || phoneEl?.value || '',
                                clientEmail: user?.email || emailEl?.value || '',
                                eventAddress: `${currentCity}, Maharashtra`,
                                gpsCoords: null,
                                styleSuggestions: `Mobile Cart Booking for ${planningEventType}`
                              };

                              executeBookingPayment(bookingDetails, user);
                            };

                            if (!currentUser) {
                              requireCustomerAuth(
                                (loggedUser) => processCartBooking(loggedUser),
                                'Sign in to confirm booking',
                                'Sign in or register to lock your date and confirm services with Parva Escrow Guarantee.'
                              );
                              return;
                            }

                            processCartBooking(currentUser);
                          }}
                          className="bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md shadow-brand-primary/10 flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
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

            {activeTab === 'bookings' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="text-brand-primary" />
                  <h3 className="font-extrabold text-brand-text text-base">Your Active Bookings</h3>
                </div>

                {!currentUser ? (
                  <div className="bg-white rounded-[24px] border border-brand-border p-8 text-center shadow-sm flex flex-col items-center space-y-3">
                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                      <CalendarDays size={26} />
                    </div>
                    <h4 className="font-black text-gray-900 text-base">Sign in to view bookings</h4>
                    <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                      Your reserved dates, vouchers and contracts are securely tied to your Parva account.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('signin');
                        setAuthContextTitle('Sign in to view bookings');
                        setAuthContextSubtitle('Access your confirmed celebrations, vouchers and payments.');
                        setIsAuthModalOpen(true);
                      }}
                      className="bg-brand-primary text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="bg-white rounded-[24px] border border-brand-border p-10 text-center shadow-sm flex flex-col items-center">
                    <img loading="lazy" 
                      src="/no-bookings.jpg" 
                      alt="No active bookings" 
                      className="w-full h-auto max-w-[280px] mx-auto mb-4 object-contain mix-blend-multiply"
                    />
                    <p className="text-sm font-semibold text-brand-text mb-1">No active bookings yet</p>
                    <p className="text-xs text-brand-text-secondary mb-6 max-w-[240px] mx-auto">Add services to your bundle and book to track them live!</p>
                    <button
                      type="button"
                      onClick={() => handleNavigateToTab('explore')}
                      className="bg-brand-primary text-white px-8 py-3 rounded-xl text-xs font-bold transition shadow-md shadow-brand-primary/15 active:scale-95 cursor-pointer"
                    >
                      Explore Vendors
                    </button>
                  </div>
                ) : (
              <div className="space-y-4">
                {userBookings.map((b) => {
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
                        <div className="flex justify-end w-full">
                          <button onClick={() => handleNavigateToTab('chat')} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold mt-2 py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm">💬 Message Vendor</button>
                        </div>
                      </div>

                      {/* Event Schedule & Exact Time */}
                      <div className="bg-brand-primary-light/10 border border-brand-primary/15 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase block">Event / Delivery Schedule</span>
                          <span className="font-extrabold text-brand-primary-dark">
                            {b.eventDate} • {formatTimeSlot(b.eventTimeSlot, (b as any).customTime)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          {b.eventType || 'Celebration'}
                        </span>
                      </div>

                      {/* Detailed list of services booked */}
                      <div className="space-y-2 mb-4">

                        <span className="text-[10px] font-semibold text-brand-text-secondary uppercase tracking-wider block">
                          Booked Services
                        </span>
                        {(b.selectedServices || []).map((svc) => (
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
                            onClick={() => handleOpenChatWithVendor(b.vendor?.id, b.id)}
                            className="bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 text-brand-primary font-bold py-1.5 px-3 rounded-xl transition text-xs flex items-center gap-1.5"
                            id={`contact-vendor-booking-${b.id}`}
                          >
                            <MessageSquare size={12} className="text-brand-primary" />
                            <span>Chat with Vendor</span>
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
                                    const cRes = await authenticatedFetch(`${BACKEND_API_URL}/api/bookings/${b.id}/cancel`, {
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
              </>
            )}
          </div>
        )}

        {/* ==================== TAB: MESSAGES ==================== */}
        {(activeTab === 'messages' || (activeTab as any) === 'chat') && (
          <div className="h-[calc(100vh-140px)] flex flex-col" id="messages-view-container">
            <ChatTab
              vendors={eligibleChatVendors}
              bookings={userBookings}
              currentUser={currentUser}
              initialBookingId={activeChatBookingId}
              initialVendorId={activeChatVendorId}
              onOpenLogin={() => {
                setAuthModalTab('signin');
                setIsAuthModalOpen(true);
              }}
              onShowNotification={showNotification}
              onNavigateToExplore={() => handleNavigateToTab('explore')}
              onNavigateToReservations={() => handleNavigateToTab('bookings')}
              onSelectVendor={(v) => setSelectedVendor(v)}
            />
          </div>
        )}

        {/* ==================== TAB: PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6" id="profile-view-container">
            {!currentUser ? (
              <div className="bg-white rounded-[28px] border border-brand-border p-6 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto shadow-inner">
                  <User size={30} />
                </div>
                <div>
                  <h3 className="font-extrabold text-brand-text text-base">Your Parva Profile</h3>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Sign in to view your celebration bookings, wishlist, saved vendors, and invoices.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition active:scale-95 uppercase tracking-wider"
                  >
                    Sign In / Register
                  </button>
                </div>
                <div className="pt-4 border-t border-brand-border">
                  <a
                    href="https://parva-vendor-app.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center justify-center gap-1"
                  >
                    <span>Looking for Vendor Hub? Click here</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            ) : (
              /* ACCOUNT LOGGED IN VIEW */
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
                        onClick={async () => {
                          await signOutUser();
                          setCurrentUser(null);
                          setNotifications([]);
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

                                  <div className="bg-white rounded-xl p-3 border border-gray-200/70 space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Event Date</span>
                                        <span className="font-extrabold text-gray-800">{b.eventDate}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Delivery / Time</span>
                                        <span className="font-extrabold text-brand-primary">{formatTimeSlot(b.eventTimeSlot, (b as any).customTime)}</span>
                                      </div>

                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Location / Address</span>
                                        <span className="font-bold text-gray-700">{(b as any).customerLocation || 'Venue / Provided Address'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block">Guests / Age Group</span>
                                        <span className="font-bold text-gray-700">{b.guestCount || 100} Guests { (b as any).customerAge ? `• ${(b as any).customerAge} yrs` : '' }</span>
                                      </div>
                                    </div>

                                    {b.selectedServices && b.selectedServices.length > 0 && (
                                      <div className="border-t border-gray-100 pt-2 mt-2">
                                        <span className="text-gray-400 text-[9px] uppercase font-bold block mb-1">Selected Services & Add-ons</span>
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

                                    <div className="border-t border-gray-100 pt-2 mt-2">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-600 font-bold">Total Amount</span>
                                        <span className="font-extrabold text-gray-900">₹{Number(b.finalPrice || b.totalPrice || 0).toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] mt-1">
                                        <span className="text-rose-600 font-bold">Amount to take (Pending)</span>
                                        <span className="font-extrabold text-rose-600">₹{Number((b.finalPrice || b.totalPrice || 0) * 0.95).toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons for Vendor */}
                                  <div className="flex gap-2 pt-3">
                                    {b.customerPhone && (
                                      <button
                                        onClick={() => {
                                          handleNavigateToTab('chat');
                                        }}
                                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                                      >
                                        💬 Message Customer
                                      </button>
                                    )}

                                    {b.status !== 'Rejected' && b.status !== 'Cancelled' && (
                                      <>
                                        {b.status !== 'Confirmed' && (
                                          <button
                                            onClick={async () => {
                                              try {
                                                showNotification('⏳ Confirming booking acceptance...');
                                                const res = await authenticatedFetch(`${BACKEND_API_URL}/api/vendor/bookings/${b.id}/respond`, {
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
                                                const res = await authenticatedFetch(`${BACKEND_API_URL}/api/vendor/bookings/${b.id}/respond`, {
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

                      {/* Sign In & Create Account triggers for Mobile Profile */}
                      <div className="mt-6 space-y-3 max-w-sm mx-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalTab('signin');
                            setAuthContextTitle(undefined);
                            setAuthContextSubtitle(undefined);
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition active:scale-98 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <User size={16} />
                          <span>Sign In to Your Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalTab('signup');
                            setAuthContextTitle(undefined);
                            setAuthContextSubtitle(undefined);
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-2xl transition active:scale-98 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Create New Account</span>
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
                          setIsRegisteringVendor(false);
                          setIsVendorAuthModalOpen(true);
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
                          setIsRegisteringVendor(false);
                          setIsVendorAuthModalOpen(true);
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
                      {/* Admin KYC Access */}
                      <button
                        onClick={() => setIsAdminKycOpen(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-amber-50/60 bg-amber-50/20 text-left transition border-b border-amber-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-brand-text text-xs flex items-center gap-1.5">
                              <span>Admin KYC & Partner Document Review</span>
                              <span className="text-[9px] bg-brand-primary text-white px-2 py-0.5 rounded-full font-black">ADMIN</span>
                            </h5>
                            <p className="text-[10px] text-brand-text-secondary mt-0.5">Review submitted Aadhaar, PAN & Business licenses to approve verified badges</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>

                      {/* Admin Database & Cloudflare Storage Health */}
                      <button
                        onClick={() => setIsAdminDbHealthOpen(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-sky-50/60 bg-sky-50/20 text-left transition border-b border-sky-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                            <Database size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-brand-text text-xs flex items-center gap-1.5">
                              <span>Database Health & Cloudflare Storage Status</span>
                              <span className="text-[9px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-black">HEALTH</span>
                            </h5>
                            <p className="text-[10px] text-brand-text-secondary mt-0.5">Live storage meter, edge rules, document limits & customer data traverser</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>

                      {/* Admin Live Chat Logs & Customer Inquiries */}
                      <button
                        onClick={() => setIsAdminChatsOpen(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/60 bg-emerald-50/20 text-left transition border-b border-emerald-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                            <MessageSquare size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-brand-text text-xs flex items-center gap-1.5">
                              <span>Admin Live Chat Logs & Communications Hub</span>
                              <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">CHATS</span>
                            </h5>
                            <p className="text-[10px] text-brand-text-secondary mt-0.5">Real-time transcripts, customer demands, vendor responses & conversation audit</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>

                      {[
                        { label: 'Booking Preferences', desc: 'Default city, contact phone, GST details' },
                        { label: 'Saved Event Templates', desc: 'Pre-selected packages and vendor drafts' },
                        { label: 'Financials & Invoices', desc: 'Download tax records and transaction logs' },
                        { label: 'About MyParva App', desc: 'Version 1.0.0 • Terms of Service & Security' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            showNotification(`${item.label} opened`);
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
                        onClick={handleLogout}
                        className="text-xs font-black text-rose-600 hover:text-rose-800 hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        Log Out of Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. FLOATING BOTTOM NAVIGATION */}
      <nav 
        className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 max-w-md mx-auto glass-panel border border-brand-border rounded-[24px] shadow-xl py-2 px-3 z-40 flex items-center justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]" 
        id="bottom-floating-navigation"
      >
        {[
          { id: 'home', label: 'Home', icon: Home, badge: 0 },
          { id: 'explore', label: 'Explore', icon: Compass, badge: 0 },
          { id: 'bookings', label: 'Bookings', icon: Calendar, badge: 0 },
          { id: 'chat', label: 'Chat', icon: MessageSquare, badge: 0 },
          { id: 'profile', label: 'Profile', icon: User, badge: 0 }
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id || (item.id === 'chat' && activeTab === 'messages');

          return (
            <button
              key={item.id}
              onClick={() => {
                handleNavigateToTab(item.id as any);
                if (item.id === 'messages' || item.id === 'chat') {
                  setActiveChatVendorId(null);
                }
              }}
              className="flex flex-col items-center justify-center relative py-1 px-2.5 sm:px-3 rounded-xl transition-all duration-200"
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
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text'}`}>
                <IconComponent size={19} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-bold transition-colors ${isActive ? 'text-brand-primary font-black' : 'text-brand-text-secondary'}`}>
                {item.label}
              </span>

              {/* Active Underline Indicator */}
              {isActive && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-primary"
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
    </div>
  </div>

      {/* 4. DIALOGS & MODAL DRAWER PORTALS (Rendered at Root Level for Desktop & Mobile) */}

      {/* Filter and Sorting Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialSort={activeSortOption}
        initialMin={activeFilterMinPrice !== null ? String(activeFilterMinPrice) : ''}
        initialMax={activeFilterMaxPrice !== null ? String(activeFilterMaxPrice) : ''}
        initialTypes={activeFilterTypes}
        onApply={(filters) => {
          setActiveSortOption(filters.sort || 'Distance');
          setActiveFilterMinPrice(filters.min ? Number(filters.min) : null);
          setActiveFilterMaxPrice(filters.max ? Number(filters.max) : null);
          setActiveFilterTypes(filters.types || []);
          handleNavigateToTab('explore');
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
            handleNavigateToTab('explore');
            setIsNotificationCenterOpen(false);
          } else if (notif.type === 'slot') {
            handleNavigateToTab('bookings');
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
        citiesList={citiesList}
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

      {currentUser?.role === 'vendor' && (
        <VendorDashboardFull
          currentUser={currentUser}
          vendors={vendors}
          bookings={bookings}
          onLogout={async () => {
            await signOutUser();
            setCurrentUser(null);
            setNotifications([]);
            showNotification('Vendor logged out safely.');
          }}
          showNotification={showNotification}
          onNavigateToMessages={() => handleNavigateToTab('messages')}
        />
      )}

      {/* 5. IMMERSIVE VENDOR DETAIL SHEET */}
      {selectedVendor && (
        <Helmet>
          <title>{selectedVendor.name} | Parva Events</title>
          <meta name="description" content={selectedVendor.description} />
        </Helmet>
      )}
      {selectedVendor && (
        <div className="block lg:hidden">
          <VendorDetailSheet
            vendor={selectedVendor}
            isOpen={selectedVendor !== null}
            onClose={() => handleCloseVendor()}
          bundledServices={bundledItems.filter(item => item.vendor.id === selectedVendor.id).map(item => item.service)}
          onAddServiceToBundle={(service) => handleAddServiceToBundle(selectedVendor, service)}
          onRemoveServiceFromBundle={(serviceName) => handleRemoveServiceFromBundle(selectedVendor.id, serviceName)}
          isWishlisted={(wishlist || []).includes(selectedVendor.id)}
          onToggleWishlist={() => handleToggleWishlist(selectedVendor.id)}
          onShowNotification={showNotification}
          currentUser={currentUser}
          onTriggerLogin={() => {
            setIsAuthModalOpen(true);
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
          onNavigateToBookings={() => handleNavigateToTab('bookings')}
          onNavigateToMessages={(vid) => { handleSelectThread(vid); handleNavigateToTab('messages'); }}
          handlePayWithRazorpay={(params: any) => {
            setRazorpayAmount(params.totalAmountDue);
            setRazorpayPurpose('connection');
            setPendingCheckoutBooking(params);
            setIsRazorpayOpen(true);
          }}
        />
        </div>
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
        totalPrice={bundledItems.reduce((acc, item) => acc + item.service.price, 0)}
        onClick={() => {
          const totalVal = bundledItems.reduce((acc, item) => acc + item.service.price, 0);
          trackCartOpened(bundledItems.length, totalVal);
          handleNavigateToTab('cart');
        }}
        isVisible={bundledItems.length > 0 && activeTab !== 'cart' && activeTab !== 'bookings' && activeTab !== 'profile' && !selectedVendor}
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
      {/* ADMIN KYC REVIEW MODAL */}
      <AdminKycReviewModal
        isOpen={isAdminKycOpen}
        onClose={() => setIsAdminKycOpen(false)}
        vendors={vendors}
        onApproveKyc={handleApproveKyc}
        onRejectKyc={handleRejectKyc}
      />

      {/* ADMIN DATABASE & CLOUDFLARE HEALTH MODAL */}
      <AdminDatabaseHealthModal
        isOpen={isAdminDbHealthOpen}
        onClose={() => setIsAdminDbHealthOpen(false)}
        vendors={vendors}
        bookings={bookings}
        leads={leadsList}
        currentUser={currentUser}
      />

      {/* ADMIN CHAT LOGS & COMMUNICATIONS HUB MODAL */}
      <AdminChatLogsModal
        isOpen={isAdminChatsOpen}
        onClose={() => setIsAdminChatsOpen(false)}
        vendors={vendors}
        bookings={bookings}
      />

      {/* STEP-BY-STEP PAYMENT PROCESSING ANIMATION MODAL */}
      <PaymentProcessingModal
        isOpen={isPaymentProcessingModalOpen}
        amount={processingPaymentDetails?.amount}
        vendorName={processingPaymentDetails?.vendorName}
        serviceName={processingPaymentDetails?.serviceName}
      />

      {/* PENDING PAYMENT VERIFICATION & RETRY MODAL */}
      {pendingVerificationOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock size={32} className="animate-spin text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-lg text-gray-900 font-display">
                Payment Verification In Progress
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Payment verification is taking longer than expected. If your account was debited, your reservation will not be lost. Click below to verify status idempotently.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={isVerifyingPending}
                onClick={async () => {
                  if (!pendingVerificationOrder) return;
                  setIsVerifyingPending(true);
                  try {
                    showNotification('⏳ Checking payment status with Cashfree...');
                    const success = await performVerification(
                      pendingVerificationOrder.orderId,
                      pendingVerificationOrder.paymentId,
                      pendingVerificationOrder.amount,
                      pendingVerificationOrder.vendorName,
                      pendingVerificationOrder.serviceName,
                      pendingVerificationOrder.params
                    );
                    if (!success) {
                      showNotification('Payment is still processing with bank. Please try again in a few moments.');
                    }
                  } catch (err) {
                    showNotification('Network error checking payment status. Please try again.');
                  } finally {
                    setIsVerifyingPending(false);
                  }
                }}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingPending ? 'Checking Status...' : 'Check Payment Status'}
              </button>
              <button
                type="button"
                disabled={isVerifyingPending}
                onClick={() => setPendingVerificationOrder(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Back to Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHONEPE-STYLE PAYMENT SUCCESS CELEBRATION MODAL */}
      <PaymentSuccessCelebrationModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onViewReservations={() => {
          setIsSuccessModalOpen(false);
          handleNavigateToTab('bookings');
        }}
        onContinueExploring={() => {
          setIsSuccessModalOpen(false);
          handleNavigateToTab('home');
        }}
        amount={successPaymentData?.amount || 0}
        orderId={successPaymentData?.orderId}
        vendorName={successPaymentData?.vendorName}
        serviceName={successPaymentData?.serviceName}
        eventDate={successPaymentData?.eventDate}
        timeSlot={successPaymentData?.timeSlot}
        customerName={successPaymentData?.customerName}
      />

      {/* CENTRAL CUSTOMER AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingBookingDetails(null);
          setPendingAuthAction(null);
          setAuthContextTitle(undefined);
          setAuthContextSubtitle(undefined);
        }}
        initialTab={authModalTab}
        contextTitle={authContextTitle}
        contextSubtitle={authContextSubtitle}
        onSuccess={handleAuthSuccess}
        onShowNotification={showNotification}
      />
    </>
  );
}
