/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { Helmet } from 'react-helmet-async';
import { 
  Home, Compass, Calendar, MessageSquare, User, MapPin, Bell, 
  ShoppingCart, Mic, Sparkles, Filter, ArrowRight, ChevronRight, ChevronLeft,
  Star, Check, CheckCircle2, Trash2, Send, X, Heart, ShieldCheck, 
  Info, DollarSign, Gift, ExternalLink, CalendarDays, Users, Smartphone, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Data and types imports
import { Vendor, Booking, ChatMessage, ChatThread, QuickCategory, VendorServiceItem } from './types';
import { VENDORS, QUICK_CATEGORIES, HERO_PROMOS, INITIAL_CHAT_MESSAGES, CITIES, SUGGESTED_RECENT_SEARCHES, TRENDING_SEARCHES } from './data';

// Component imports
import LocationSelector from './components/LocationSelector';
import VoiceSearchModal from './components/VoiceSearchModal';
import VendorCard from './components/VendorCard';
import VendorDetailSheet from './components/VendorDetailSheet';
import SplashCarousel from './components/SplashCarousel';
import CartFloatingBar from './components/CartFloatingBar';
import ShareBookingModal from './components/ShareBookingModal';
import SharedPlanView from './components/SharedPlanView';
import { Share2 } from 'lucide-react';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Deterministic availability evaluator
export const isVendorAvailable = (vendorId: string, startDateStr: string, endDateStr?: string, vendorsList?: any[]): boolean => {
  if (!startDateStr) return true;
  
  if (vendorsList) {
    const v = vendorsList.find(item => item.id === vendorId);
    if (v && v.busyDates && v.busyDates.length > 0) {
      const start = new Date(startDateStr);
      const end = endDateStr ? new Date(endDateStr) : start;
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (v.busyDates.includes(dateStr)) {
          return false;
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }

  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : start;
  
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDate();
    if (!isNaN(day)) {
      if (vendorId === 'v1' && (day % 10 === 5 || day % 10 === 0)) return false;
      if (vendorId === 'v7' && (day % 10 === 3 || day % 10 === 7)) return false;
      if (vendorId === 'v3' && day % 10 === 0) return false;
      if (vendorId === 'v4' && day % 10 === 8) return false;
      if (vendorId === 'v5' && day % 10 === 4) return false;
      if (vendorId === 'v6' && day % 10 === 9) return false;
      if (vendorId === 'v8' && day % 10 === 6) return false;
    }
    current.setDate(current.getDate() + 1);
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

const VendorDashboardCalendar = ({ vendorId, busyDates, bookings, onToggleDate, showNotification }: {
  vendorId: string;
  busyDates: string[];
  bookings: Booking[];
  onToggleDate: (date: string) => void;
  showNotification: (msg: string) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get booked dates for this vendor
  const bookedDates = bookings
    .filter(b => b.vendor.id === vendorId)
    .map(b => b.eventDate)
    .filter(Boolean);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // First day of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Prev month filler days
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
            <span>Operational Schedule Manager</span>
          </h4>
          <p className="text-[10px] text-brand-text-secondary mt-0.5">Green = Booked, Red = Blocked. Tap dates to toggle block state.</p>
        </div>
        
        {/* Month Selector Controls */}
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
        {/* Day Header names */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-brand-text-secondary uppercase tracking-wider">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {fillerDays.map((_, i) => (
            <div key={`fill-${i}`} className="aspect-square bg-gray-50/50 rounded-lg" />
          ))}

          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const isBooked = bookedDates.includes(dateStr);
            const isBlocked = busyDates.includes(dateStr);

            let dayStyle = "bg-gray-50 hover:bg-gray-100 text-brand-text border border-transparent";
            let statusText = "";

            if (isBooked) {
              dayStyle = "bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-500/20 border border-emerald-400 scale-[1.03]";
              statusText = "Booked Celebration! 🎉";
            } else if (isBlocked) {
              dayStyle = "bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/20 border border-rose-400 scale-[1.03]";
              statusText = "Blocked Out 🔒";
            }

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  if (isBooked) {
                    showNotification(`🎉 This date is locked for an active customer booking: ${dateStr}. Cannot manually block/unblock!`);
                  } else {
                    onToggleDate(dateStr);
                  }
                }}
                className={`aspect-square rounded-xl text-[11px] flex flex-col items-center justify-center relative transition active:scale-90 ${dayStyle}`}
                title={`${dateStr} ${statusText}`}
              >
                <span>{day}</span>
                {isBooked && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white animate-pulse" />
                )}
                {isBlocked && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend key indicators */}
      <div className="flex gap-4 justify-center items-center text-[9px] font-black uppercase tracking-wider text-brand-text-secondary pt-2 border-t border-dashed border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>Booked Date</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
          <span>Blocked Date</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-brand-border" />
          <span>Available Date</span>
        </div>
      </div>
    </div>
  );
};

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'bookings' | 'messages' | 'profile'>('home');
  const [currentCity, setCurrentCity] = useState('Kolhapur');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Splash screen tour state
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return localStorage.getItem('parva_onboarded') !== 'true';
  });

  // User State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const cached = localStorage.getItem('parva_user');
    return cached ? JSON.parse(cached) : null;
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

  // Dynamic Vendors, Categories, Promos State
  const [vendors, setVendors] = useState<Vendor[]>(VENDORS);
  const [appLogo, setAppLogo] = useState('https://i.postimg.cc/mgk6dNNd/parva-logo.png');

  const [categoriesList, setCategoriesList] = useState<QuickCategory[]>(QUICK_CATEGORIES);

  const [promosList, setPromosList] = useState<any[]>(HERO_PROMOS);
  const [unlockedConnections, setUnlockedConnections] = useState<string[]>([]);

  // Leads list for CSV extraction
  const [leadsList, setLeadsList] = useState<any[]>(() => {
    const cached = localStorage.getItem('parva_leads_list');
    if (cached) return JSON.parse(cached);
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
      localStorage.setItem('parva_vendors_list', JSON.stringify(vendorsData));
    }, (error) => {
      console.warn("Vendors sync error (might be offline):", error);
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

    // Listen for Connections collection
    const unsubscribeConnections = onSnapshot(collection(db, 'connections'), (snapshot) => {
      const connsData = snapshot.docs.map(doc => doc.data());
      const userConns = connsData
        .filter(c => c.userId === authInstance.currentUser?.uid)
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
        // Seed initial categories if empty
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          for (const cat of QUICK_CATEGORIES) {
            await setDoc(doc(getDb(), 'categories', cat.name.replace(/\s+/g, '-')), cat);
          }
        } catch (e) {
          console.warn("Failed to seed categories:", e);
        }
      } else {
        const catsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategoriesList(catsData as any);
      }
    }, (error) => {
      console.warn("Categories sync error:", error);
    });

    return () => {
      unsubscribeVendors();
      unsubscribePromos();
      unsubscribeAdmins();
      unsubscribeBookings();
      unsubscribeLeads();
      unsubscribeSettings();
      unsubscribeChats();
      unsubscribeCategories();
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

  // Debounce search query input to improve filtering performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedExploreCategory, setSelectedExploreCategory] = useState<string>('all');
  const [exploreOccasion, setExploreOccasion] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<number>(200000);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'trust' | 'priceAsc' | 'priceDesc'>('trust');

  // Event planning matcher states
  const [planningEventType, setPlanningEventType] = useState('Wedding');
  const [planningStartDate, setPlanningStartDate] = useState<string>(() => {
    return localStorage.getItem('parva_planning_start_date') || new Date().toISOString().split('T')[0];
  });
  const [planningEndDate, setPlanningEndDate] = useState<string>(() => {
    return localStorage.getItem('parva_planning_end_date') || new Date().toISOString().split('T')[0];
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
    localStorage.setItem('parva_planning_guest_size', String(planningGuestSize));
    localStorage.setItem('parva_planning_budget', String(planningBudget));
  }, [planningStartDate, planningEndDate, planningGuestSize, planningBudget]);

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
  const [bundledItems, setBundledItems] = useState<{ vendor: Vendor; service: VendorServiceItem }[]>([]);
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
  const [vendorEditFounderImage, setVendorEditFounderImage] = useState('');
  const [vendorSubTab, setVendorSubTab] = useState<'catalogue' | 'dates_leads'>('catalogue');

  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'onboard' | 'categories' | 'leads' | 'approval'>('dashboard');
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
  const [wizardCity, setWizardCity] = useState('Mumbai');
  const [wizardTagline, setWizardTagline] = useState('');
  const [wizardPhone, setWizardPhone] = useState('');
  const [wizardWhatsapp, setWizardWhatsapp] = useState('');
  const [wizardBasePrice, setWizardBasePrice] = useState('');
  const [wizardMaxCapacity, setWizardMaxCapacity] = useState('');
  const [wizardService1Name, setWizardService1Name] = useState('');
  const [wizardService1Price, setWizardService1Price] = useState('');
  const [wizardService2Name, setWizardService2Name] = useState('');
  const [wizardService2Price, setWizardService2Price] = useState('');
  const [wizardFounderName, setWizardFounderName] = useState('');
  const [wizardExperience, setWizardExperience] = useState('');
  const [wizardDescription, setWizardDescription] = useState('');
  const [wizardFeatures, setWizardFeatures] = useState('');
  const [wizardCoverImage, setWizardCoverImage] = useState('');
  const [wizardImage2, setWizardImage2] = useState('');
  const [wizardImage3, setWizardImage3] = useState('');
  const [wizardVideoUrl, setWizardVideoUrl] = useState('');

  // User Coordinates and Geolocation for Dynamic Distance Calculations
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
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
        showNotification('👑 Welcome to PARVA Elite Premium Member club!');
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
        const leadId = `lead-${currentUser.name.replace(/\s+/g, '')}-${v.id}-${Date.now()}`;
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

  const handlePayWithRazorpay = async (params: {
    vendorId?: string;
    type: 'connection' | 'booking';
    amount?: number;
    bookingData?: any;
  }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      showNotification('❌ Failed to load Razorpay SDK. Please check your internet connection.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid || 'guest-uid',
          vendorId: params.vendorId || 'system',
          type: params.type,
          amount: params.amount || 0
        })
      });
      
      const orderData = await response.json();
      if (!orderData.success) {
        showNotification(`❌ Error initiating payment: ${orderData.error}`);
        return;
      }

      const { orderId, keyId, amount, connectionFee, commissionAmount, gstAmount } = orderData;

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "PARVA Celebrations",
        description: params.type === 'connection' ? 'Vendor Connection Fee' : 'Booking Commission Fee',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch(`${BACKEND_API_URL}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser?.uid || 'guest-uid',
                vendorId: params.vendorId || 'system',
                type: params.type,
                commissionAmount,
                gstAmount,
                connectionFee,
                totalAmount: amount
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              showNotification('🎉 Payment Secured and Transaction Logged successfully!');
              
              if (params.type === 'booking' && params.bookingData) {
                const db = getDb();
                const { doc, setDoc } = await import('firebase/firestore');
                const finalBooking = {
                  ...params.bookingData,
                  status: 'Confirmed',
                  paymentStatus: 'Paid'
                };
                await setDoc(doc(db, 'bookings', params.bookingData.id), finalBooking);
              }
            } else {
              showNotification('❌ Payment verification failed on server.');
            }
          } catch (err) {
            console.error(err);
            showNotification('❌ Error verifying payment.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || ''
        },
        theme: {
          color: "#9d174d"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay Error:', error);
      showNotification('❌ Payment initiation error.');
    }
  };

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
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setCouponApplied(true);
      setCouponDiscount(10);
      setCouponMessage('🎟️ Coupon "WELCOME10" applied! ₹10 flat discount on connection fee.');
      showNotification('🎟️ Coupon applied successfully!');
    } else if (code === 'FREE99' || code === 'PARVA100') {
      setCouponApplied(true);
      setCouponDiscount(99);
      setCouponMessage('🎟️ Coupon "FREE99" applied! Connection fee is now 100% FREE!');
      showNotification('🎉 Connection fee is now free!');
    } else if (code === 'PARVA50') {
      setCouponApplied(true);
      setCouponDiscount(50);
      setCouponMessage('🎟️ Coupon "PARVA50" applied! ₹50 flat discount on connection fee.');
      showNotification('🎟️ Coupon applied successfully!');
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage('❌ Invalid coupon code. Try WELCOME10, PARVA50 or FREE99!');
    }
  };

  // Bundling Actions
  const handleAddServiceToBundle = (vendor: Vendor, service: VendorServiceItem) => {
    // Check if service already added
    const alreadyAdded = bundledItems.some(
      (item) => item.vendor.id === vendor.id && item.service.name === service.name
    );
    if (alreadyAdded) return;

    setBundledItems((prev) => [...prev, { vendor, service }]);

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
      showNotification('📥 Transaction receipt PDF downloaded successfully with official branding!');
    } catch (e) {
      console.error(e);
      showNotification('❌ Error exporting receipt to PDF.');
    }
  };

  // Filter & Search computation
  const filteredVendors = vendors.filter((vendor) => {
    // City filter match (flexible includes for onboarding detailed locations)
    const matchesCity = (vendor.location || '').toLowerCase().includes((currentCity || '').toLowerCase());

    // Suitability check based on selected event type
    const matchesSuitability = isVendorSuitedForEvent(vendor, planningEventType);

    const matchesSearch =
      (vendor.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (vendor.category || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (vendor.tagline || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const matchesCategory =
      selectedExploreCategory === 'all' ||
      (vendor.category || '').toLowerCase() === selectedExploreCategory.toLowerCase();

    const matchesPrice = (vendor.basePrice || 0) <= priceRange;
    const matchesOccasion = exploreOccasion === 'All' || (Array.isArray(vendor.occasion) && vendor.occasion.some(o => o.toLowerCase() === exploreOccasion.toLowerCase()));

    // Filter by date availability
    const matchesAvailability = isVendorAvailable(vendor.id, planningStartDate, planningEndDate, vendors);
    
    // Filter by budget
    const matchesBudget = vendor.basePrice <= planningBudget;

    // Filter by guest size (for venues)
    const matchesGuestSize = vendor.category !== 'Banquet Hall' || 
      (!vendor.capacity || planningGuestSize <= vendor.capacity);

    return matchesCity && matchesSuitability && matchesSearch && matchesCategory && matchesPrice && matchesAvailability && matchesOccasion && matchesBudget && matchesGuestSize && vendor.approved !== false;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'trust') return b.trustScore - a.trustScore;
    if (sortBy === 'priceAsc') return a.basePrice - b.basePrice;
    if (sortBy === 'priceDesc') return b.basePrice - a.basePrice;
    if (sortBy === 'distance') {
      let distA = parseFloat(a.distance) || 0;
      let distB = parseFloat(b.distance) || 0;
      if (userCoords && a.latitude && a.longitude) {
        distA = calculateHaversineDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
      }
      if (userCoords && b.latitude && b.longitude) {
        distB = calculateHaversineDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
      }
      return distA - distB;
    }
    return 0;
  });

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
                <h3 className="font-extrabold text-brand-text text-base">Welcome to PARVA</h3>
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
                  /* User Portal Form */
                  <div className="space-y-3.5">
                    {/* Google Sign-In Button */}
                    <button
                      onClick={async () => {
                        try {
                          const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
                          const provider = new GoogleAuthProvider();
                          const result = await signInWithPopup(getAuthInstance(), provider);
                          const user = result.user;
                          
                          const isMasterAdminEmail = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com'].includes(user.email || '');
                          const newUser = {
                            uid: user.uid,
                            name: user.displayName || 'User',
                            email: user.email || '',
                            phone: '',
                            city: 'Mumbai',
                            role: isMasterAdminEmail ? 'master_admin' : 'user'
                          };
                          setCurrentUser(newUser);
                          localStorage.setItem('parva_user', JSON.stringify(newUser));
                          
                          // Save user to Firestore
                          const db = getDb();
                          const { doc, setDoc } = await import('firebase/firestore');
                          await setDoc(doc(db, 'users', user.uid), newUser, { merge: true });
                          
                          showNotification('🎉 Google Sign-In Successful! Welcome to PARVA.');
                        } catch (error) {
                          console.error('Error signing in:', error);
                          showNotification('Error signing in. Please try again.');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 border border-brand-border rounded-xl py-2.5 px-4 text-xs font-bold text-brand-text shadow-sm transition active:scale-[0.99]"
                      type="button"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-3 my-1">
                      <div className="h-px bg-gray-100 flex-1" />
                      <span className="text-[8px] font-bold text-brand-text-secondary uppercase tracking-widest">or email login</span>
                      <div className="h-px bg-gray-100 flex-1" />
                    </div>

                    {!isSigningUp ? (
                      /* Manual Sign In Form */
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Email Address</label>
                          <input
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Password</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!loginEmail || !loginPassword) {
                              showNotification('⚠️ Please enter email and password!');
                              return;
                            }
                            try {
                              const { signInWithEmailAndPassword } = await import('firebase/auth');
                              const auth = getAuthInstance();
                              const userCredential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
                              const user = userCredential.user;
                              
                              const db = getDb();
                              const { doc, getDoc } = await import('firebase/firestore');
                              const userDoc = await getDoc(doc(db, 'users', user.uid));
                              
                              let loggedInUser: any = null;
                              if (userDoc.exists()) {
                                const data = userDoc.data();
                                loggedInUser = {
                                  uid: user.uid,
                                  name: data.name || 'User',
                                  email: data.email || user.email || '',
                                  phone: data.phone || '',
                                  city: data.city || 'Mumbai',
                                  role: data.role || 'user',
                                  vendorId: data.vendorId || ''
                                };
                              } else {
                                const isMasterAdminEmail = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com'].includes(user.email || '');
                                loggedInUser = {
                                  uid: user.uid,
                                  name: user.displayName || user.email?.split('@')[0] || 'User',
                                  email: user.email || '',
                                  phone: '',
                                  city: 'Mumbai',
                                  role: isMasterAdminEmail ? 'master_admin' : 'user'
                                };
                              }
                              
                              setCurrentUser(loggedInUser);
                              localStorage.setItem('parva_user', JSON.stringify(loggedInUser));
                              if (loggedInUser.city) setCurrentCity(loggedInUser.city);
                              
                              showNotification(`🎉 Welcome back, ${loggedInUser.name}!`);
                            } catch (err: any) {
                              console.error(err);
                              showNotification(`❌ Login Failed: ${err.message || 'Check credentials'}`);
                            }
                          }}
                          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-brand-primary/10 mt-1"
                        >
                          Sign In
                        </button>

                        <p className="text-center text-[10px] text-brand-text-secondary mt-2">
                          Don't have an account?{' '}
                          <button onClick={() => setIsSigningUp(true)} className="text-brand-primary font-bold hover:underline">
                            Register Here
                          </button>
                        </p>
                      </div>
                    ) : (
                      /* Manual Sign Up Form */
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Full Name</label>
                          <input
                            type="text"
                            placeholder="Devansh Sharma"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">WhatsApp Phone</label>
                            <input
                              type="tel"
                              placeholder="9999912345"
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                              className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Target City</label>
                            <select
                              value={loginCity}
                              onChange={(e) => setLoginCity(e.target.value)}
                              className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                            >
                              {['Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Kolhapur'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Email Address</label>
                          <input
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Password</label>
                          <input
                            type="password"
                            placeholder="Create Password (min 6 chars)"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-[#FCFBF8] border border-brand-border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!loginName || !loginPhone || !loginEmail || !loginPassword) {
                              showNotification('⚠️ Please complete all fields!');
                              return;
                            }
                            try {
                              const { createUserWithEmailAndPassword } = await import('firebase/auth');
                              const auth = getAuthInstance();
                              const userCredential = await createUserWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
                              const user = userCredential.user;
                              
                              const newUserObj = { 
                                uid: user.uid,
                                name: loginName, 
                                phone: loginPhone, 
                                email: loginEmail.trim(), 
                                city: loginCity,
                                budget: loginBudget || '< ₹50,000',
                                role: 'user'
                              };
                              
                              const db = getDb();
                              const { doc, setDoc } = await import('firebase/firestore');
                              await setDoc(doc(db, 'users', user.uid), newUserObj);
                              
                              setCurrentUser(newUserObj);
                              localStorage.setItem('parva_user', JSON.stringify(newUserObj));
                              setCurrentCity(loginCity);
                              
                              showNotification(`🎉 Account created successfully! Welcome ${loginName}!`);
                            } catch (err: any) {
                              console.error(err);
                              showNotification(`❌ Signup Failed: ${err.message || 'Error occurred'}`);
                            }
                          }}
                          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-brand-primary/10 mt-1"
                        >
                          Register & Sign Up
                        </button>

                        <p className="text-center text-[10px] text-brand-text-secondary mt-2">
                          Already have an account?{' '}
                          <button onClick={() => setIsSigningUp(false)} className="text-brand-primary font-bold hover:underline">
                            Log In Here
                          </button>
                        </p>
                      </div>
                    )}
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
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Category</label>
                                <select
                                  value={wizardCategory}
                                  onChange={(e) => setWizardCategory(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-2 py-2 text-xs font-semibold outline-none"
                                >
                                  {['Banquet Hall', 'Decorator', 'Photographer', 'DJ', 'Catering', 'Makeup Artist', 'Cake & Desserts', 'Fun & Entertainment', 'Event Planner'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">City Location</label>
                                <select
                                  value={wizardCity}
                                  onChange={(e) => setWizardCity(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-2 py-2 text-xs font-semibold outline-none"
                                >
                                  {['Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Kolhapur'].map(c => (
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

                            <div className="border-t border-brand-primary/5 pt-2">
                              <span className="text-[9px] uppercase tracking-wider text-brand-primary font-extrabold block mb-1.5">Add Services (Package Packages)</span>
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Service 1 Name"
                                    value={wizardService1Name}
                                    onChange={(e) => setWizardService1Name(e.target.value)}
                                    className="col-span-2 bg-white border border-brand-border rounded-xl px-3 py-2 text-xs outline-none"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={wizardService1Price}
                                    onChange={(e) => setWizardService1Price(e.target.value)}
                                    className="bg-white border border-brand-border rounded-xl px-2 py-2 text-xs outline-none"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Service 2 Name"
                                    value={wizardService2Name}
                                    onChange={(e) => setWizardService2Name(e.target.value)}
                                    className="col-span-2 bg-white border border-brand-border rounded-xl px-3 py-2 text-xs outline-none"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={wizardService2Price}
                                    onChange={(e) => setWizardService2Price(e.target.value)}
                                    className="bg-white border border-brand-border rounded-xl px-2 py-2 text-xs outline-none"
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

                        {/* Step 4: Media Uploads */}
                        {vendorWizardStep === 4 && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Cover Image URL</label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={wizardCoverImage}
                                onChange={(e) => setWizardCoverImage(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-[10px]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Image 2 URL</label>
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  value={wizardImage2}
                                  onChange={(e) => setWizardImage2(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs outline-none text-[10px]"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Image 3 URL</label>
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  value={wizardImage3}
                                  onChange={(e) => setWizardImage3(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs outline-none text-[10px]"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Video Shorts / Reel URL</label>
                              <input
                                type="text"
                                placeholder="https://www.youtube.com/shorts/..."
                                value={wizardVideoUrl}
                                onChange={(e) => setWizardVideoUrl(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-[10px]"
                              />
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
                                    category: wizardCategory,
                                    tagline: wizardTagline,
                                    description: wizardDescription || `Premium ${wizardCategory} based in ${wizardCity}`,
                                    rating: 4.8,
                                    reviewCount: 1,
                                    trustScore: 90,
                                    distance: 'Local Partner',
                                    responseTime: '< 30 mins',
                                    verified: false,
                                    approved: false, // Wait for admin approval!
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


  const isDashboardExpanded = (isAdmin || isMasterAdmin) && activeTab === 'profile' && adminSubTab === 'dashboard';

  return (
    <div className={`min-h-screen bg-brand-bg flex flex-col mx-auto shadow-2xl relative border-x border-brand-border overflow-hidden pb-24 transition-all duration-500 ${
      isDashboardExpanded ? 'max-w-6xl w-full' : 'max-w-md w-full'
    }`} id="parva-app-container">
      {currentUser && !isAdmin && !isMasterAdmin && currentUser.role !== 'admin' && currentUser.role !== 'master_admin' && currentUser.role !== 'vendor' && (!currentUser.phone || !currentUser.name || !currentUser.email) && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-[#FAF9F5] w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-brand-border flex flex-col space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto shadow-inner">
                <Smartphone size={22} className="animate-bounce text-brand-primary" />
              </div>
              <h3 className="font-black text-brand-text text-base tracking-tight">Complete Your Profile 🌸</h3>
              <p className="text-[10px] text-brand-text-secondary leading-relaxed">
                Namaste! Please provide your direct contact details. This allows us to instantly match calendars, unlock rates, and share details with vendors you select.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-brand-text-secondary uppercase tracking-widest block mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Devansh Sharma"
                  id="force-profile-name"
                  defaultValue={currentUser.name || ''}
                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-brand-text-secondary uppercase tracking-widest block mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  id="force-profile-phone"
                  defaultValue={currentUser.phone || ''}
                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-brand-text-secondary uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. devansh@gmail.com"
                  id="force-profile-email"
                  defaultValue={currentUser.email || ''}
                  className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                const nameIn = document.getElementById('force-profile-name') as HTMLInputElement;
                const phoneIn = document.getElementById('force-profile-phone') as HTMLInputElement;
                const emailIn = document.getElementById('force-profile-email') as HTMLInputElement;
                
                if (!nameIn?.value.trim() || !phoneIn?.value.trim() || !emailIn?.value.trim()) {
                  showNotification('⚠️ All fields are required to continue!');
                  return;
                }

                const cleanedPhone = phoneIn.value.replace(/\D/g, '');
                if (cleanedPhone.length < 10) {
                  showNotification('⚠️ Please enter a valid 10-digit WhatsApp number.');
                  return;
                }

                const updatedUser = {
                  uid: currentUser?.uid || '',
                  role: currentUser?.role || 'user',
                  city: currentUser?.city || 'Mumbai',
                  vendorId: currentUser?.vendorId || '',
                  name: nameIn.value.trim(),
                  phone: cleanedPhone,
                  email: emailIn.value.trim()
                };

                try {
                  const db = getDb();
                  const { doc, setDoc } = await import('firebase/firestore');
                  if (currentUser.uid) {
                    await setDoc(doc(db, 'users', currentUser.uid), updatedUser, { merge: true });
                  } else {
                    const tempUid = `user-${Date.now()}`;
                    await setDoc(doc(db, 'users', tempUid), updatedUser, { merge: true });
                  }
                  
                  setCurrentUser(updatedUser);
                  localStorage.setItem('parva_user', JSON.stringify(updatedUser));
                  showNotification('🎉 Welcome to PARVA! Profile verified.');
                } catch (err) {
                  console.error(err);
                  showNotification('❌ Failed to update profile, please try again.');
                }
              }}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs py-3 rounded-xl transition shadow-md shadow-brand-primary/10 uppercase tracking-widest"
            >
              Unlock Ecosystem
            </button>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => showNotification('No new notifications')}
            className="p-2.5 hover:bg-gray-100 rounded-full text-brand-text transition relative"
            id="notification-bell"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-primary animate-ping" />
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
      <main className="flex-1 bg-brand-bg px-5 py-4 overflow-x-hidden">
        
        {/* ==================== TAB: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6" id="home-view-container">
            {/* Search area with Voice Search */}
            <div className="space-y-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search for Wedding, Birthday, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setActiveTab('explore');
                  }}
                  className="w-full bg-white/60 backdrop-blur-md border border-white/60 hover:border-brand-primary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none py-4 pl-4 pr-12 rounded-[20px] text-sm font-bold text-brand-text shadow-lg shadow-black/[0.02] placeholder-gray-400 transition-all"
                  id="home-search-input"
                />
                <button
                  onClick={() => setIsVoiceOpen(true)}
                  className="absolute right-3.5 p-2 rounded-full hover:bg-gray-100 text-brand-primary transition"
                  title="Voice Search"
                  id="home-mic-btn"
                >
                  <Mic size={20} />
                </button>
              </div>

              {/* Quick trending tags */}
              <div className="flex gap-2 items-center overflow-x-auto py-1 no-scrollbar text-[11px]">
                <span className="text-brand-text-secondary font-black uppercase tracking-tighter shrink-0">Hot:</span>
                {["Luxe Wedding", "Birthday Decor", "Pool Party", "Cocktail DJ"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setActiveTab('explore');
                    }}
                    className="bg-white/80 backdrop-blur-sm border border-white text-brand-text px-3.5 py-1.5 rounded-xl hover:bg-brand-primary hover:text-white hover:border-brand-primary transition shrink-0 font-bold shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Hero Carousel from Firestore */}
            {promosList.length > 0 && currentPromo && (
              <div className="relative rounded-[24px] overflow-hidden shadow-xl h-[200px] bg-brand-primary group cursor-pointer" onClick={() => setActiveTab('explore')}>
                <div className="absolute inset-0">
                  <img 
                    key={safeHeroIndex}
                    src={currentPromo.image} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                    alt={currentPromo.title}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-6 flex gap-1.5 z-10">
                  {promosList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === safeHeroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Horizontal Scroll Categories */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-brand-text text-base uppercase tracking-wider">Occasion Categories</h3>
                <span className="text-sm text-brand-primary font-semibold hover:underline cursor-pointer">View All</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedExploreCategory('all');
                      setExploreOccasion(cat.name); // Set occasion filter too
                      setActiveTab('explore');
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

            {/* Second Banner above Trending Vendors */}
            <div className="relative rounded-[24px] overflow-hidden shadow-xl h-[120px] bg-brand-primary group cursor-pointer" onClick={() => setActiveTab('explore')}>
              <img 
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                alt="Banner 2"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Curated List</span>
                <h3 className="text-xl font-black italic">Verified Wedding Professionals</h3>
                <p className="text-xs font-bold text-white/80">Book with trust and zero hidden charges.</p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ArrowRight size={20} />
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
                {vendors
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
                        userCoords={userCoords}
                      />
                    </div>
                  ))}
                {vendors.filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false).length === 0 && (
                  <div className="text-center py-8 text-xs text-brand-text-secondary w-full bg-white/50 rounded-2xl border border-brand-border border-dashed">
                    No trending vendors listed in {currentCity} yet.
                  </div>
                )}
              </div>
            </div>

            {/* Extra Section: Top Decorators & Halls near You */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-brand-text text-sm uppercase tracking-wider">Top Halls & Decorators</h3>
                <span 
                  onClick={() => { setSelectedExploreCategory('Banquet Hall'); setActiveTab('explore'); }}
                  className="text-xs text-brand-primary font-semibold hover:underline cursor-pointer"
                >
                  View All
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {vendors
                  .filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false && (v.category === 'Banquet Hall' || v.category === 'Decorator'))
                  .map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      onSelect={(v) => handleVendorSelect(v)}
                      isWishlisted={(wishlist || []).includes(vendor.id)}
                      onToggleWishlist={handleToggleWishlist}
                      layout="grid"
                      userCoords={userCoords}
                    />
                  ))}
                {vendors.filter(v => v.location.toLowerCase() === currentCity.toLowerCase() && v.approved !== false && (v.category === 'Banquet Hall' || v.category === 'Decorator')).length === 0 && (
                  <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-xs text-brand-text-secondary">
                    No active banquet halls or decorators in {currentCity} yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: EXPLORE ==================== */}
        {activeTab === 'explore' && (
          <div className="space-y-5" id="explore-view-container">
            {/* Unified Planning & Search Header */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-4 shadow-xl shadow-brand-primary/5 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find Hall, DJ, Catering..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-brand-border outline-none py-4 pl-4 pr-12 rounded-[20px] text-sm font-black text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                  id="explore-search-input"
                />
                <button
                  onClick={() => setIsVoiceOpen(true)}
                  className="absolute right-4 p-2 text-brand-primary"
                >
                  <Mic size={20} />
                </button>
              </div>

              {/* Advanced Planning Funnel integrated into Explore Header */}
              <div className="bg-white/80 rounded-2xl p-4 border border-white/60 shadow-inner space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Calendar size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Select Event Period</h4>
                  </div>
                  <span className="text-[9px] font-bold text-brand-text-secondary">Instant Availability Check</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50/50 border border-brand-border rounded-xl p-2.5">
                    <p className="text-[8px] text-brand-text-secondary font-black uppercase tracking-wider mb-1">Starts</p>
                    <input 
                      type="date"
                      value={planningStartDate}
                      onChange={(e) => setPlanningStartDate(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[11px] font-extrabold text-brand-text cursor-pointer"
                    />
                  </div>
                  <div className="bg-gray-50/50 border border-brand-border rounded-xl p-2.5">
                    <p className="text-[8px] text-brand-text-secondary font-black uppercase tracking-wider mb-1">Ends</p>
                    <input 
                      type="date"
                      value={planningEndDate}
                      onChange={(e) => setPlanningEndDate(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[11px] font-extrabold text-brand-text cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5 text-brand-text-secondary">
                      <Users size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">Estimated Guest Size</p>
                    </div>
                    <span className="text-xs font-black text-brand-primary">{planningGuestSize} Guests</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="2000" 
                    step="10"
                    value={planningGuestSize}
                    onChange={(e) => setPlanningGuestSize(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5"
                  />
                </div>
              </div>
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
              {['Banquet Hall', 'Decorator', 'Photographer', 'DJ', 'Catering', 'Makeup Artist', 'Cake & Desserts', 'Fun & Entertainment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedExploreCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                    selectedExploreCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                      : 'bg-white border border-brand-border text-brand-text hover:bg-gray-50'
                  }`}
                  id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat}
                </button>
              ))}
            </div>


            {/* Interactive sliders for pricing and Sort option */}
            <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-3.5">
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
                id="price-range-slider"
              />

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                <span className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">Sort by</span>
                <div className="flex gap-1.5">
                  {(['trust', 'rating', 'priceAsc'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSortBy(mode)}
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

            {/* Search Results count & listings */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
                  Available Matches ({filteredVendors.length})
                </span>
                <span className="text-[10px] text-brand-text-secondary">Location: {currentCity}</span>
              </div>

              {filteredVendors.length === 0 ? (
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
                  {filteredVendors.map((vendor) => {
                    const isAvailable = isVendorAvailable(vendor.id, planningStartDate, planningEndDate, vendors);

                    return (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        onSelect={(v) => handleVendorSelect(v)}
                        isWishlisted={(wishlist || []).includes(vendor.id)}
                        onToggleWishlist={handleToggleWishlist}
                        layout="grid"
                        planningDate={planningStartDate}
                        isAvailable={isAvailable}
                        userCoords={userCoords}
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
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-brand-text">₹{item.service.price.toLocaleString('en-IN')}</span>
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
                <div className="border-t border-dashed border-gray-100 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-left">
                      <span className="text-[9px] text-brand-text-secondary uppercase tracking-wider block font-bold">Services Event Value</span>
                      <span className="font-extrabold text-brand-text-secondary">
                        ₹{bundledItems.reduce((sum, item) => sum + item.service.price, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-brand-text-secondary uppercase tracking-wider block font-bold">Direct Connection Fee</span>
                      <span className="font-extrabold text-brand-text">₹99.00</span>
                    </div>
                  </div>

                  {couponApplied && (
                    <div className="flex justify-between items-center text-xs text-brand-success font-bold">
                      <span>Coupon Discount:</span>
                      <span>-₹{couponDiscount}.00</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-brand-primary-light/30 p-3 rounded-xl border border-brand-primary/10">
                    <div>
                      <span className="text-[9px] text-brand-primary-dark uppercase tracking-wider block font-black">Total Connection Fee Due</span>
                      <span className="font-black text-brand-primary-dark text-base">
                        ₹{Math.max(0, 99 - couponDiscount)}.00
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        // Gather or register current user
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

                        // Build pending booking
                        const totalVal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
                        const discountVal = bundledItems.length >= 4 ? Math.round(totalVal * 0.22) : bundledItems.length === 3 ? Math.round(totalVal * 0.15) : bundledItems.length === 2 ? Math.round(totalVal * 0.08) : 0;
                        const finalVal = totalVal - discountVal;

                        const newBooking: Booking = {
                          id: `b-new-${Date.now()}`,
                          vendor: bundledItems[0].vendor,
                          selectedServices: bundledItems.map(item => item.service),
                          eventDate: planningStartDate,
                          eventType: planningEventType,
                          status: 'Pending',
                          totalPrice: totalVal,
                          bundleDiscount: discountVal,
                          finalPrice: finalVal,
                          paymentStatus: 'Paid',
                          bookingIdString: `PRV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`
                        };

                        const dueAmount = Math.max(0, 499 - couponDiscount);
                        if (dueAmount === 0) {
                          const db = getDb();
                          import('firebase/firestore').then(async ({ doc, setDoc }) => {
                            await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
                          });
                          setBundledItems([]);
                          setCouponCode('');
                          setCouponApplied(false);
                          setCouponDiscount(0);
                          setCouponMessage('');

                          const vendorPhone = newBooking.vendor.whatsapp || newBooking.vendor.phone || '919999999999';
                          const servicesStr = newBooking.selectedServices.map(s => `• ${s.name} (₹${s.price.toLocaleString('en-IN')})`).join('\n');
                          const waText = `Hello ${newBooking.vendor.name},\n\nI have locked a Direct Booking with your services via Parva Celebrations (Connection Fee PAID)! 📲\n\nEvent Details:\n- Name: ${targetUser.name}\n- Contact: ${targetUser.phone}\n- Event Date: ${newBooking.eventDate}\n- Type: ${newBooking.eventType}\n\nSelected Services:\n${servicesStr}\n\nEstimated Event Value: ₹${newBooking.finalPrice.toLocaleString('en-IN')}\n\nPlease confirm availability & package customizations! Thank you!`;
                          
                          setPendingCheckoutBooking({
                            booking: newBooking,
                            waUrl: `https://wa.me/${vendorPhone}?text=${encodeURIComponent(waText)}`
                          });
                          showNotification(`🎉 Checkout Complete! Booking confirmed and connection unlocked!`);
                        } else {
                          handlePayWithRazorpay({
                            vendorId: newBooking.vendor.id,
                            type: 'booking',
                            amount: newBooking.finalPrice,
                            bookingData: newBooking
                          });
                        }
                      }}
                      className="bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md shadow-brand-primary/10 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                    >
                      <span>Pay Connection Fee & Connect</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="text-brand-primary" />
              <h3 className="font-extrabold text-brand-text text-base">Your Active Bookings</h3>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-brand-border p-10 text-center shadow-sm flex flex-col items-center">
                <img 
                  src="/src/assets/images/no_bookings_illustration_1783773107501.jpg" 
                  alt="No bookings yet" 
                  className="w-48 h-48 mb-6 object-contain"
                  referrerPolicy="no-referrer"
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

                        <div className="flex gap-1.5">
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
                        <img
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
                          <img
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
                        <h3 className="font-bold text-brand-text text-base">{currentUser.name}</h3>
                        <p className="text-xs text-brand-primary font-black mt-0.5">
                          PARVA PARTNER PORTAL 💼
                        </p>
                        <span className="text-[10px] bg-slate-900 text-amber-400 font-extrabold tracking-widest px-2.5 py-0.5 rounded-full mt-2">
                          ID: {currentUser.vendorId}
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
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-brand-border">
                      <button
                        onClick={() => setVendorSubTab('catalogue')}
                        className={`py-2 rounded-lg text-xs font-black transition ${
                          vendorSubTab === 'catalogue'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text'
                        }`}
                      >
                        Catalogue & Portfolio
                      </button>
                      <button
                        onClick={() => setVendorSubTab('dates_leads')}
                        className={`py-2 rounded-lg text-xs font-black transition ${
                          vendorSubTab === 'dates_leads'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text'
                        }`}
                      >
                        Enquiries & Calendar
                      </button>
                    </div>

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
                                <img 
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
                            {(vendors.find(v => v.id === currentUser.vendorId)?.images || []).map((imgUrl, i) => (
                              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-brand-border bg-gray-50">
                                <img src={imgUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'; }} />
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

                          {/* Add image form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Paste new portfolio image URL link"
                              value={vendorNewImage}
                              onChange={(e) => setVendorNewImage(e.target.value)}
                              className="flex-1 bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:bg-white text-xs"
                            />
                            <button
                              onClick={async () => {
                                if (!vendorNewImage) return;
                                try {
                                  const v = vendors.find(item => item.id === currentUser.vendorId);
                                  if (v) {
                                    const updatedImgs = [...(v.images || []), vendorNewImage];
                                    const db = getDb();
                                    await setDoc(doc(db, 'vendors', currentUser.vendorId), {
                                      ...v,
                                      images: updatedImgs
                                    });
                                    setVendorNewImage('');
                                    showNotification('📸 Portfolio image added successfully!');
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="bg-brand-primary text-white font-bold px-4 py-1.5 rounded-lg hover:bg-brand-primary-dark transition text-xs shrink-0"
                            >
                              Add Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: AVAILABILITY & LEADS */}
                    {vendorSubTab === 'dates_leads' && (
                      <div className="space-y-4 text-xs">
                        {/* Interactive Visual Monthly Calendar View */}
                        <VendorDashboardCalendar
                          vendorId={currentUser.vendorId}
                          busyDates={vendors.find(v => v.id === currentUser.vendorId)?.busyDates || []}
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
                          showNotification={showNotification}
                        />

                        {/* Interested Leads/Enquiries List */}
                        <div className="bg-white rounded-[24px] border border-brand-border p-5 space-y-3.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h4 className="font-black text-brand-success uppercase tracking-wider text-[10px]">Interested Users ({leadsList.filter(l => l.vendorId === currentUser.vendorId).length})</h4>
                            <span className="bg-brand-success/10 text-brand-success text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">Customer Leads</span>
                          </div>

                          {leadsList.filter(l => l.vendorId === currentUser.vendorId).length > 0 && (
                            <div className="flex gap-2 pb-1.5">
                              <button
                                onClick={() => {
                                  const myLeads = leadsList.filter(l => l.vendorId === currentUser.vendorId);
                                  const headers = ['Name', 'Phone', 'Email', 'City', 'Budget', 'Timestamp'];
                                  const rows = myLeads.map(l => [
                                    l.name || '',
                                    l.phone || '',
                                    l.email || '',
                                    l.city || '',
                                    `₹${l.budget || 0}`,
                                    l.timestamp || ''
                                  ]);
                                  const csvContent = "data:text/csv;charset=utf-8," 
                                    + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                                  
                                  const encodedUri = encodeURI(csvContent);
                                  const link = document.createElement("a");
                                  link.setAttribute("href", encodedUri);
                                  link.setAttribute("download", `customer_leads_${currentUser.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
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
                                  const myLeads = leadsList.filter(l => l.vendorId === currentUser.vendorId);
                                  const textLines = myLeads.map((l, idx) => 
                                    `${idx + 1}. NAME: ${l.name}\n   PHONE: ${l.phone}\n   EMAIL: ${l.email}\n   CITY: ${l.city}\n   BUDGET: ₹${l.budget}\n   DATE: ${l.timestamp}\n-------------------------`
                                  ).join('\n');
                                  
                                  const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
                                  const link = document.createElement("a");
                                  link.href = URL.createObjectURL(blob);
                                  link.setAttribute("download", `customer_leads_${currentUser.name.replace(/\s+/g, '_')}_${Date.now()}.txt`);
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

                          {leadsList.filter(l => l.vendorId === currentUser.vendorId).length === 0 ? (
                            <div className="text-center py-5 space-y-1.5">
                              <p className="text-[11px] text-brand-text-secondary font-black">No dynamic enquiries received yet.</p>
                              <p className="text-[10px] text-gray-400 leading-relaxed">Interested users clicking "Check Availability" on your page will automatically populate here in real-time!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {leadsList.filter(l => l.vendorId === currentUser.vendorId).map((lead, i) => (
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
                ) : (
                  /* 👤 Standard Premium User Profile View */
                  <div className="space-y-6">
                    {/* User Header Info Card */}
                    <div className="bg-white rounded-[24px] border border-brand-border p-5 text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-brand-primary-light to-brand-accent/20" />
                      
                      <div className="relative pt-6 flex flex-col items-center">
                        <div className="w-18 h-18 rounded-full border-4 border-white bg-brand-primary text-white text-2xl font-extrabold flex items-center justify-center shadow-md mb-2.5">
                          {getUserInitials(currentUser)}
                        </div>
                        <h3 className="font-bold text-brand-text text-base">{getUserName(currentUser)}</h3>
                        <p className="text-xs text-brand-text-secondary">
                          {isAdmin ? 'System Administrator 👑' : `Premium Member • ${currentUser.city || 'N/A'}`}
                        </p>
                        <span className="text-[10px] text-brand-text-secondary mt-1">{currentUser.email || 'N/A'} • {currentUser.phone || 'N/A'}</span>
                      </div>

                  {/* Personal metrics showcase */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-0.5">Bookings</span>
                      <span className="font-extrabold text-brand-primary text-sm">{bookings.length} Saved</span>
                    </div>
                    <div className="text-center border-x border-gray-100">
                      <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-0.5">Wishlist</span>
                      <span className="font-extrabold text-brand-text text-sm">{wishlist.length} Saved</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-0.5">Logins Count</span>
                      <span className="font-extrabold text-brand-success text-sm">{loginsCount} Entries</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-dashed border-gray-100 text-center">
                    <button 
                      onClick={() => setIsAboutOpen(true)}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center justify-center gap-1.5"
                    >
                      <Info size={12} />
                      About PARVA Celebrations
                    </button>
                    <button 
                      onClick={() => setIsPrivacyOpen(true)}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={12} />
                      Privacy Policy
                    </button>
                    
                    {!isAdmin && (
                      <button 
                        onClick={() => setIsAdminLoginOpen(true)}
                        className="text-xs font-semibold text-amber-600 hover:underline flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        🛡️ System Admin Access
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setIsAdmin(false);
                      localStorage.removeItem('parva_user');
                      showNotification('Logged out successfully.');
                    }}
                    className="mt-4 text-xs font-bold text-brand-primary hover:underline"
                  >
                    🚪 Log Out Account
                  </button>
                </div>



                {/* ==================== SYSTEM ADMIN CONSOLE CONTAINER ==================== */}
                {isAdmin && (
                  <div className="bg-[#FAF9F5] rounded-[28px] border border-brand-primary/25 p-5 space-y-4" id="admin-management-terminal">
                    <div className="flex items-center justify-between border-b border-brand-primary/10 pb-2.5">
                      <div className="flex items-center gap-1.5 text-brand-primary">
                        <Sparkles size={16} />
                        <h4 className="font-black text-xs uppercase tracking-wider text-brand-primary-dark">Admin Console</h4>
                      </div>
                      <span className="bg-brand-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Super User
                      </span>
                    </div>

                    {/* Console Tab Toggles */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-white rounded-xl border border-brand-border text-center">
                      {[
                        { id: 'dashboard', label: 'Stats' },
                        { id: 'onboard', label: 'CRUD' },
                        { id: 'approval', label: 'Approve' },
                        { id: 'categories', label: 'Cats' },
                        { id: 'leads', label: 'Leads' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAdminSubTab(t.id as any)}
                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                            adminSubTab === t.id
                              ? 'bg-brand-primary text-white shadow-sm'
                              : 'text-brand-text-secondary hover:text-brand-text'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* SUB-TAB 1: STATS & DASHBOARD & OFFER BANNERS */}
                    {adminSubTab === 'dashboard' && (
                      <div className="space-y-4 text-xs animate-in fade-in duration-200">
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white p-4.5 rounded-2xl border border-brand-border shadow-sm">
                            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block mb-1">Commission Earned (1%)</span>
                            <span className="font-black text-brand-primary text-lg">₹{adminDashboardStats?.stats?.totalCommission || 0}</span>
                          </div>
                          <div className="bg-white p-4.5 rounded-2xl border border-brand-border shadow-sm">
                            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block mb-1">Connection Fees (₹499)</span>
                            <span className="font-black text-brand-text text-lg">₹{adminDashboardStats?.stats?.totalConnectionFees || 0}</span>
                          </div>
                          <div className="bg-white p-4.5 rounded-2xl border border-brand-border shadow-sm">
                            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block mb-1">GST Collected (18%)</span>
                            <span className="font-black text-brand-success text-lg">₹{adminDashboardStats?.stats?.totalGST || 0}</span>
                          </div>
                          <div className="bg-white p-4.5 rounded-2xl border border-brand-border shadow-sm bg-indigo-50/50">
                            <span className="text-[10px] text-indigo-700 uppercase font-bold block mb-1">Total Platform Net</span>
                            <span className="font-black text-indigo-900 text-lg">₹{adminDashboardStats?.stats?.totalRevenue || 0}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
                            <span className="text-[9px] text-brand-text-secondary uppercase font-bold block mb-0.5">Total Registered Users</span>
                            <span className="font-bold text-brand-text text-base">{adminDashboardStats?.stats?.totalUsers || loginsCount}</span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
                            <span className="text-[9px] text-brand-text-secondary uppercase font-bold block mb-0.5">Total Onboarded Vendors</span>
                            <span className="font-bold text-brand-text text-base">{adminDashboardStats?.stats?.totalVendors || vendors.length}</span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
                            <span className="text-[9px] text-brand-text-secondary uppercase font-bold block mb-0.5">Direct Event Bookings</span>
                            <span className="font-bold text-brand-text text-base">{adminDashboardStats?.stats?.totalBookings || bookings.length}</span>
                          </div>
                        </div>

                        {/* Database Operations & Reset */}
                        <div className="bg-white p-4.5 rounded-2xl border border-rose-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-bold text-rose-800 block">Database Maintenance</span>
                            <p className="text-[10px] text-brand-text-secondary">Reset all custom configurations, bookings, transactions, categories and promos back to default system seeds.</p>
                          </div>
                          <button
                            onClick={handleResetDatabase}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 whitespace-nowrap"
                          >
                            Reset to Default Seeds
                          </button>
                        </div>

                        {/* Recent Transactions Log */}
                        <div className="bg-white p-4 rounded-2xl border border-brand-border space-y-3">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block text-left">Live Transaction Logs</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr className="border-b border-gray-100 text-brand-text-secondary">
                                  <th className="py-2">Transaction ID</th>
                                  <th className="py-2">User / Vendor ID</th>
                                  <th className="py-2">Type</th>
                                  <th className="py-2">Commission (1%)</th>
                                  <th className="py-2">GST (18%)</th>
                                  <th className="py-2">Connection Fee</th>
                                  <th className="py-2 text-right">Total Paid</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminDashboardStats?.recentTransactions && adminDashboardStats.recentTransactions.length > 0 ? (
                                  adminDashboardStats.recentTransactions.map((txn: any) => (
                                    <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                      <td className="py-2 font-mono font-bold text-gray-500">{txn.id}</td>
                                      <td className="py-2">{txn.userId.substring(0, 8)}... / {txn.vendorId}</td>
                                      <td className="py-2">
                                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                          txn.type === 'booking' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                          {txn.type}
                                        </span>
                                      </td>
                                      <td className="py-2">₹{txn.commissionAmount}</td>
                                      <td className="py-2">₹{txn.gstAmount}</td>
                                      <td className="py-2">₹{txn.connectionFee}</td>
                                      <td className="py-2 text-right font-black text-brand-text">₹{txn.totalAmount}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={7} className="py-4 text-center text-gray-400 font-semibold">No recent transactions logged in this session.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Global Logo Creator (CRUD) */}
                        <div className="bg-white p-3 rounded-2xl border border-brand-border space-y-3">
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest block">Update Global App Logo</span>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="New Logo Image URL (Square transparent PNG recommended)"
                              value={adminAppLogo}
                              onChange={(e) => setAdminAppLogo(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                            <button
                              onClick={async () => {
                                if (!adminAppLogo) {
                                  showNotification('Please enter a valid Logo URL');
                                  return;
                                }
                                try {
                                  const { setDoc, doc } = await import('firebase/firestore');
                                  await setDoc(doc(getDb(), 'settings', 'app_config'), { appLogo: adminAppLogo }, { merge: true });
                                  showNotification('🎉 Global App Logo updated successfully!');
                                  setAdminAppLogo('');
                                } catch (error) {
                                  console.error("Error updating logo:", error);
                                  showNotification('Error updating global logo');
                                }
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 rounded-lg text-[10px] transition"
                            >
                              Sync Logo to App
                            </button>
                          </div>
                        </div>

                        {/* Offers Creator (CRUD) */}
                        <div className="bg-white p-3 rounded-2xl border border-brand-border space-y-3">
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest block">Add Promo Offer Banner</span>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Offer Banner Title (e.g. Grand Venue Launch)"
                              value={adminPromoTitle}
                              onChange={(e) => setAdminPromoTitle(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Discount (e.g. 20% Off)"
                                value={adminPromoDiscount}
                                onChange={(e) => setAdminPromoDiscount(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Badge (e.g. Special Offer)"
                                value={adminPromoBadge}
                                onChange={(e) => setAdminPromoBadge(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Image URL link (Recommended: 600x400 px)"
                              value={adminPromoImage}
                              onChange={(e) => setAdminPromoImage(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                            <button
                              onClick={async () => {
                                if (!adminPromoTitle) {
                                  showNotification('Please enter promotional offer title');
                                  return;
                                }
                                const newPromo = {
                                  title: adminPromoTitle,
                                  subtitle: `Claim immediate ${adminPromoDiscount} on elite booking bookings`,
                                  badge: adminPromoBadge,
                                  tag: adminPromoTag,
                                  image: adminPromoImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600',
                                  gradient: 'from-pink-900/90 via-purple-900/80 to-transparent',
                                  createdAt: new Date().toISOString()
                                };
                                
                                try {
                                  const { addDoc, collection } = await import('firebase/firestore');
                                  await addDoc(collection(getDb(), 'promos'), newPromo);
                                  showNotification('🎉 New marketing promo banner added to LIVE ecosystem!');
                                  
                                  // Reset fields
                                  setAdminPromoTitle('');
                                  setAdminPromoImage('');
                                } catch (error) {
                                  console.error("Error adding promo:", error);
                                  showNotification('Error updating live banners');
                                }
                              }}
                              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2 rounded-lg text-[10px] transition"
                            >
                              Add Marketing Offer Banner
                            </button>
                          </div>

                          {/* List of current promos to delete */}
                          <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100">
                            <span className="text-[9px] font-bold text-brand-text-secondary block">Active Promo Banners ({promosList.length})</span>
                            <div className="flex gap-2 mb-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const { addDoc, collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
                                    // Clear existing
                                    const snapshot = await getDocs(collection(getDb(), 'promos'));
                                    for (const d of snapshot.docs) {
                                      await deleteDoc(doc(getDb(), 'promos', d.id));
                                    }
                                    // Seed new
                                    for (const promo of HERO_PROMOS) {
                                      const { id, ...promoData } = promo as any;
                                      await addDoc(collection(getDb(), 'promos'), {
                                        ...promoData,
                                        createdAt: new Date().toISOString()
                                      });
                                    }
                                    showNotification('🚀 Live Banners synced with Static Data!');
                                  } catch (error) {
                                    console.error("Seed error:", error);
                                    showNotification('Sync failed');
                                  }
                                }}
                                className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-black uppercase tracking-wider hover:bg-indigo-100 transition"
                              >
                                Sync with Static Data
                              </button>
                            </div>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto">
                              {promosList.map((p, idx) => (
                                <div key={p.id || idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-[10px]">
                                  <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded" />
                                  <span className="font-bold truncate max-w-[150px]">{p.title}</span>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const { doc, deleteDoc } = await import('firebase/firestore');
                                        await deleteDoc(doc(getDb(), 'promos', p.id));
                                        showNotification('Promo banner deleted from LIVE ecosystem');
                                      } catch (error) {
                                        console.error("Error deleting promo:", error);
                                        showNotification('Error deleting banner');
                                      }
                                    }}
                                    className="text-brand-primary font-bold hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: VENDOR ONBOARDING & MODIFICATION (CRUD) */}
                    {adminSubTab === 'onboard' && (
                      <div className="bg-white p-3.5 rounded-2xl border border-brand-border space-y-4 text-xs animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">
                            {editingVendorId ? 'Modify Selected Vendor' : 'Onboard New Service Vendor'}
                          </span>
                          {editingVendorId && (
                            <button
                              onClick={() => {
                                setEditingVendorId(null);
                                setAdminVendorName('');
                                setAdminVendorPrice('');
                                setAdminVendorVideoUrl('');
                                setAdminVendorImage1('');
                                setAdminVendorImage2('');
                                setAdminVendorImage3('');
                                setAdminVendorIdField('');
                              }}
                              className="text-[9px] text-brand-primary font-black hover:underline"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        {/* Onboard form fields */}
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Vendor Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Saffron & Spice Catering"
                                value={adminVendorName}
                                onChange={(e) => setAdminVendorName(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[9px] font-black text-indigo-700 uppercase">6-Digit Access ID</label>
                                <button
                                  type="button"
                                  onClick={() => setAdminVendorIdField(Math.floor(100000 + Math.random() * 900000).toString())}
                                  className="text-[8px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest scale-90"
                                >
                                  🎲 Gen
                                </button>
                              </div>
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="6-digit unique number"
                                value={adminVendorIdField}
                                onChange={(e) => setAdminVendorIdField(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-indigo-50/50 border border-indigo-200 text-indigo-800 font-black rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Category</label>
                              <select
                                value={adminVendorCategory}
                                onChange={(e) => setAdminVendorCategory(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                              >
                                {['Banquet Hall', 'Decorator', 'Photographer', 'DJ', 'Catering', 'Makeup Artist', 'Cake & Desserts', 'Fun & Entertainment', 'Event Planner'].map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">City Location</label>
                              <select
                                value={adminVendorLocation}
                                onChange={(e) => setAdminVendorLocation(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                              >
                                {CITIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Starting Cost (₹)</label>
                              <input
                                type="number"
                                placeholder="12000"
                                value={adminVendorPrice}
                                onChange={(e) => setAdminVendorPrice(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Rating (0-5)</label>
                              <input
                                type="text"
                                placeholder="4.9"
                                value={adminVendorRating}
                                onChange={(e) => setAdminVendorRating(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Trust Score (%)</label>
                              <input
                                type="number"
                                placeholder="97"
                                value={adminVendorTrust}
                                onChange={(e) => setAdminVendorTrust(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Tagline</label>
                            <input
                              type="text"
                              placeholder="e.g. Elegant heritage catering with premium service"
                              value={adminVendorTagline}
                              onChange={(e) => setAdminVendorTagline(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Professional Bio / Description</label>
                            <textarea
                              rows={2}
                              placeholder="Describe the services, heritage, capacity, background..."
                              value={adminVendorDescription}
                              onChange={(e) => setAdminVendorDescription(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Amenities / Features (Comma separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Free Valet, AC, Sound System, Multi-cuisine"
                              value={adminVendorFeatures}
                              onChange={(e) => setAdminVendorFeatures(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Distance display (e.g. 1.2 km)</label>
                              <input
                                type="text"
                                placeholder="e.g. 1.5 km"
                                value={adminVendorDistance}
                                onChange={(e) => setAdminVendorDistance(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Response Time (e.g. &lt; 10 mins)</label>
                              <input
                                type="text"
                                placeholder="e.g. < 15 mins"
                                value={adminVendorResponseTime}
                                onChange={(e) => setAdminVendorResponseTime(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Mobile Number</label>
                              <input
                                type="text"
                                placeholder="e.g. 9876543210"
                                value={adminVendorPhone}
                                onChange={(e) => setAdminVendorPhone(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">WhatsApp No.</label>
                              <input
                                type="text"
                                placeholder="e.g. 9876543210"
                                value={adminVendorWhatsapp}
                                onChange={(e) => setAdminVendorWhatsapp(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Instagram Link</label>
                              <input
                                type="text"
                                placeholder="e.g. https://instagram.com/..."
                                value={adminVendorInstagram}
                                onChange={(e) => setAdminVendorInstagram(e.target.value)}
                                className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* Dynamic GPS Location Coordinates */}
                          <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 animate-in slide-in-from-top-1">
                            <div>
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1">GPS Latitude (e.g. 19.0760)</label>
                              <input
                                type="number"
                                step="any"
                                placeholder="e.g. 19.0760"
                                value={adminVendorLatitude}
                                onChange={(e) => setAdminVendorLatitude(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-400"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1">GPS Longitude (e.g. 72.8777)</label>
                              <input
                                type="number"
                                step="any"
                                placeholder="e.g. 72.8777"
                                value={adminVendorLongitude}
                                onChange={(e) => setAdminVendorLongitude(e.target.value)}
                                className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-400"
                              />
                            </div>
                          </div>

                          {/* Service Occasions */}
                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase mb-2 block">Service Occasions / Events Handled</label>
                            <div className="flex flex-wrap gap-2">
                              {(categoriesList.length > 0 ? categoriesList.map(c => c.name) : ['Wedding', 'Engagement', 'Birthday', 'Corporate', 'Anniversary', 'Baby Shower', 'Pre-Wedding', 'Other']).map(occ => {
                                const isSelected = adminVendorOccasion.includes(occ);
                                return (
                                  <button
                                    key={occ}
                                    onClick={() => {
                                      setAdminVendorOccasion(prev => 
                                        isSelected ? prev.filter(o => o !== occ) : [...prev, occ]
                                      );
                                    }}
                                    className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-50 text-brand-text-secondary border-brand-border'}`}
                                  >
                                    {occ}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Event Planner Specific Fields */}
                          {(true) && (
                            <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 animate-in slide-in-from-top-1">
                              <div>
                                <label className="text-[9px] font-bold text-indigo-700 uppercase">Founder / Principal Planner</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Aditya Deshmukh"
                                  value={adminVendorFounder}
                                  onChange={(e) => setAdminVendorFounder(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-indigo-700 uppercase">Experience (e.g. 10 Years)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 12 Years"
                                  value={adminVendorExperience}
                                  onChange={(e) => setAdminVendorExperience(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1.5 text-xs outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* Custom Services Pricing */}
                          <div className="bg-brand-primary-light/30 p-2.5 rounded-xl border border-brand-primary/10 space-y-2">
                            <span className="text-[9px] font-black text-brand-primary uppercase block">Configure Catalog Services (Optional)</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-bold text-brand-text-secondary uppercase">Service 1 Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Full Day Hall Booking"
                                  value={adminVendorService1Name}
                                  onChange={(e) => setAdminVendorService1Name(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-brand-text-secondary uppercase">Service 1 Price (₹)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 120000"
                                  value={adminVendorService1Price}
                                  onChange={(e) => setAdminVendorService1Price(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-bold text-brand-text-secondary uppercase">Service 2 Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Half Day Hall Booking"
                                  value={adminVendorService2Name}
                                  onChange={(e) => setAdminVendorService2Name(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-brand-text-secondary uppercase">Service 2 Price (₹)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 70000"
                                  value={adminVendorService2Price}
                                  onChange={(e) => setAdminVendorService2Price(e.target.value)}
                                  className="w-full bg-white border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase">Instagram Reel / YouTube Short Video Link</label>
                            <input
                              type="text"
                              placeholder="e.g. https://youtube.com/shorts/..."
                              value={adminVendorVideoUrl}
                              onChange={(e) => setAdminVendorVideoUrl(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-brand-text-secondary uppercase block">Portfolio Image URL Links</label>
                            <input
                              type="text"
                              placeholder="Paste image URL here"
                              value={adminVendorImage1}
                              onChange={(e) => setAdminVendorImage1(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Paste image URL here"
                              value={adminVendorImage2}
                              onChange={(e) => setAdminVendorImage2(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Paste image URL here"
                              value={adminVendorImage3}
                              onChange={(e) => setAdminVendorImage3(e.target.value)}
                              className="w-full bg-gray-50 border border-brand-border rounded-lg px-2 py-1 text-xs outline-none"
                            />
                          </div>

                          {/* Submit Onboard button */}
                          <button
                            onClick={() => {
                              if (!adminVendorName || !adminVendorPrice) {
                                showNotification('Please complete vendor name and baseline price');
                                return;
                              }

                              const finalImages = [
                                adminVendorImage1 || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600',
                                adminVendorImage2 || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
                                adminVendorImage3 || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600'
                              ];

                              const parsedFeatures = adminVendorFeatures
                                ? adminVendorFeatures.split(',').map(f => f.trim()).filter(Boolean)
                                : ['Highly Recommended', 'Sanitized Setup', 'Transparent Pricing'];

                              const parsedServices = [];
                              if (adminVendorService1Name && adminVendorService1Price) {
                                parsedServices.push({
                                  name: adminVendorService1Name,
                                  price: Number(adminVendorService1Price),
                                  description: 'Primary verified custom selection service',
                                  unit: 'Event'
                                });
                              }
                              if (adminVendorService2Name && adminVendorService2Price) {
                                parsedServices.push({
                                  name: adminVendorService2Name,
                                  price: Number(adminVendorService2Price),
                                  description: 'Secondary optional custom selection service',
                                  unit: 'Event'
                                });
                              }
                              if (parsedServices.length === 0) {
                                parsedServices.push(
                                  { name: 'Heritage Full Package', price: Number(adminVendorPrice), description: 'Complete verified premium slot execution', unit: 'Event' },
                                  { name: 'Essential Half Session', price: Math.round(Number(adminVendorPrice) * 0.6), description: 'Hourly standard custom backup slots', unit: 'Event' }
                                );
                              }

                              if (editingVendorId) {
                                // EDIT MODE
                                const targetId = adminVendorIdField || editingVendorId;
                                const updatedVendor = {
                                  ...vendors.find(v => v.id === editingVendorId),
                                  id: targetId,
                                  name: adminVendorName,
                                  category: adminVendorCategory,
                                  location: adminVendorLocation,
                                  basePrice: Number(adminVendorPrice),
                                  rating: Number(adminVendorRating) || 4.8,
                                  trustScore: Number(adminVendorTrust) || 95,
                                  videos: adminVendorVideoUrl ? adminVendorVideoUrl.split(',').map(v => v.trim()).filter(Boolean) : [],
                                  images: finalImages,
                                  tagline: adminVendorTagline || 'Premier tailored service provider',
                                  description: adminVendorDescription || 'Elite verified customized booking setups with native backline production.',
                                  features: parsedFeatures,
                                  distance: adminVendorDistance || '1.5 km',
                                  responseTime: adminVendorResponseTime || '< 15 mins',
                                  phone: adminVendorPhone || '',
                                  whatsapp: adminVendorWhatsapp || '',
                                  instagram: adminVendorInstagram || '',
                                  founderName: adminVendorFounder,
                                  experience: adminVendorExperience,
                                  occasion: adminVendorOccasion.length > 0 ? adminVendorOccasion : (vendors.find(v => v.id === editingVendorId)?.occasion || [adminVendorCategory]),
                                  services: parsedServices,
                                  latitude: adminVendorLatitude ? Number(adminVendorLatitude) : undefined,
                                  longitude: adminVendorLongitude ? Number(adminVendorLongitude) : undefined
                                };

                                import('firebase/firestore').then(async ({ doc, setDoc, deleteDoc }) => {
                                  try {
                                    if (!isAdmin && !isMasterAdmin) {
                                      showNotification('Unauthorized: Admins only');
                                      return;
                                    }
                                    if (targetId !== editingVendorId) {
                                      await deleteDoc(doc(getDb(), 'vendors', editingVendorId));
                                    }
                                    await setDoc(doc(getDb(), 'vendors', targetId), updatedVendor);
                                    showNotification(`✅ Vendor ${adminVendorName} synced to Firebase successfully.`);
                                    setEditingVendorId(null);
                                  } catch (error) {
                                    console.error("Firebase Sync Error (Edit):", error);
                                    showNotification(`❌ Failed to sync ${adminVendorName} to backend.`);
                                  }
                                });

                              } else {
                                // CREATE MODE
                                const generatedId = adminVendorIdField || Math.floor(100000 + Math.random() * 900000).toString();
                                const newVendor: Vendor = {
                                  id: generatedId,
                                  name: adminVendorName,
                                  category: adminVendorCategory as any,
                                  location: adminVendorLocation,
                                  rating: Number(adminVendorRating) || 4.8,
                                  reviewCount: 1,
                                  trustScore: Number(adminVendorTrust) || 95,
                                  basePrice: Number(adminVendorPrice),
                                  images: finalImages,
                                  occasion: adminVendorOccasion.length > 0 ? adminVendorOccasion : [adminVendorCategory],
                                  videos: adminVendorVideoUrl ? adminVendorVideoUrl.split(',').map(v => v.trim()).filter(Boolean) : [],
                                  services: parsedServices,
                                  features: parsedFeatures,
                                  tagline: adminVendorTagline || 'Premier tailored service provider',
                                  description: adminVendorDescription || 'Elite verified customized booking setups with native backline production.',
                                  distance: adminVendorDistance || '1.5 km',
                                  responseTime: adminVendorResponseTime || '< 15 mins',
                                  verified: true,
                                  reviews: [],
                                  bookingsCount: 0,
                                  phone: adminVendorPhone || '',
                                  whatsapp: adminVendorWhatsapp || '',
                                  instagram: adminVendorInstagram || '',
                                  founderName: adminVendorFounder,
                                  experience: adminVendorExperience,
                                  latitude: adminVendorLatitude ? Number(adminVendorLatitude) : undefined,
                                  longitude: adminVendorLongitude ? Number(adminVendorLongitude) : undefined
                                };

                                import('firebase/firestore').then(async ({ doc, setDoc }) => {
                                  try {
                                    if (!isAdmin && !isMasterAdmin) {
                                      showNotification('Unauthorized: Admins only');
                                      return;
                                    }
                                    await setDoc(doc(getDb(), 'vendors', generatedId), newVendor);
                                    showNotification(`🎉 Onboarded new vendor: ${adminVendorName} to Firebase (ID: ${generatedId})!`);
                                  } catch (error) {
                                    console.error("Firebase Sync Error (Create):", error);
                                    showNotification(`❌ Failed to onboard ${adminVendorName} to backend.`);
                                  }
                                });
                              }

                              // Reset Form
                              setAdminVendorName('');
                              setAdminVendorPrice('');
                              setAdminVendorVideoUrl('');
                              setAdminVendorImage1('');
                              setAdminVendorImage2('');
                              setAdminVendorImage3('');
                              setAdminVendorTagline('');
                              setAdminVendorDescription('');
                              setAdminVendorFeatures('');
                              setAdminVendorDistance('1.5 km');
                              setAdminVendorResponseTime('< 15 mins');
                              setAdminVendorPhone('');
                              setAdminVendorWhatsapp('');
                              setAdminVendorInstagram('');
                              setAdminVendorFounder('');
                              setAdminVendorExperience('');
                              setAdminVendorLatitude('');
                              setAdminVendorLongitude('');
                              setAdminVendorIdField('');
                              setAdminVendorOccasion([]);
                              setAdminVendorService1Name('');
                              setAdminVendorService1Price('');
                              setAdminVendorService2Name('');
                              setAdminVendorService2Price('');
                            }}
                            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2.5 rounded-xl transition"
                          >
                            {editingVendorId ? 'Update Vendor Details' : 'Onboard & Register Vendor'}
                          </button>
                        </div>

                        {/* Onboarded lists table with Modify/Delete controls */}
                        <div className="space-y-2 pt-3 border-t border-dashed border-gray-100">
                          <span className="text-[10px] font-black text-brand-text-secondary block">Onboarded Vendors Database ({vendors.length})</span>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                            {vendors.map((v) => (
                              <div key={v.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl text-[10px] border border-gray-100">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="font-extrabold text-brand-text truncate block">{v.name}</span>
                                  <span className="text-[8px] text-brand-text-secondary uppercase block">{v.category} • {v.location} • ₹{v.basePrice.toLocaleString('en-IN')}</span>
                                  <span className="text-[8px] text-indigo-600 font-extrabold block mt-0.5 uppercase">🔑 ACCESS ID: {v.id}</span>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => {
                                      // populate form for edit
                                      setEditingVendorId(v.id);
                                      setAdminVendorName(v.name);
                                      setAdminVendorCategory(v.category);
                                      setAdminVendorLocation(v.location);
                                      setAdminVendorPrice(String(v.basePrice));
                                      setAdminVendorRating(String(v.rating));
                                      setAdminVendorTrust(String(v.trustScore));
                                      setAdminVendorVideoUrl(v.videos?.[0] || '');
                                      setAdminVendorImage1(v.images?.[0] || '');
                                      setAdminVendorImage2(v.images?.[1] || '');
                                      setAdminVendorImage3(v.images?.[2] || '');
                                      setAdminVendorTagline(v.tagline || '');
                                      setAdminVendorDescription(v.description || '');
                                      setAdminVendorFeatures(v.features ? v.features.join(', ') : '');
                                      setAdminVendorDistance(v.distance || '1.5 km');
                                      setAdminVendorResponseTime(v.responseTime || '< 15 mins');
                                      setAdminVendorPhone(v.phone || '');
                                      setAdminVendorWhatsapp(v.whatsapp || '');
                                      setAdminVendorInstagram(v.instagram || '');
                                      setAdminVendorFounder(v.founderName || '');
                                      setAdminVendorExperience(v.experience || '');
                                      setAdminVendorLatitude(v.latitude ? String(v.latitude) : '');
                                      setAdminVendorLongitude(v.longitude ? String(v.longitude) : '');
                                      setAdminVendorIdField(v.id || '');
                                      setAdminVendorOccasion(v.occasion || []);
                                      setAdminVendorService1Name(v.services?.[0]?.name || '');
                                      setAdminVendorService1Price(v.services?.[0]?.price ? String(v.services[0].price) : '');
                                      setAdminVendorService2Name(v.services?.[1]?.name || '');
                                      setAdminVendorService2Price(v.services?.[1]?.price ? String(v.services[1].price) : '');
                                      showNotification(`Editing details of: ${v.name}`);
                                    }}
                                    className="text-indigo-600 font-extrabold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      import('firebase/firestore').then(async ({ doc, deleteDoc }) => {
                                        try {
                                          await deleteDoc(doc(getDb(), 'vendors', v.id));
                                          showNotification(`Vendor ${v.name} deleted from Firebase`);
                                        } catch (error) {
                                          console.error("Delete error:", error);
                                          showNotification('❌ Delete failed');
                                        }
                                      });
                                    }}
                                    className="text-brand-primary font-extrabold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 3: OCCASION CATEGORIES (CRUD) */}
                    {adminSubTab === 'categories' && (
                      <div className="bg-white p-3.5 rounded-2xl border border-brand-border space-y-3.5 text-xs animate-in fade-in duration-200">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">Add Occasions Category</span>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Occasion Category Name (e.g. Sangeet Party)"
                            value={adminCategoryName}
                            onChange={(e) => setAdminCategoryName(e.target.value)}
                            className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Cover image url link (Recommended: 300x200 px)"
                            value={adminCategoryImage}
                            onChange={(e) => setAdminCategoryImage(e.target.value)}
                            className="w-full bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                          />
                          <button
                            onClick={() => {
                              if (!adminCategoryName) {
                                showNotification('Please enter occasion category name');
                                return;
                              }
                              
                              if (!isAdmin && !isMasterAdmin) {
                                showNotification('Unauthorized: Admins only');
                                return;
                              }

                              const newCat = {
                                id: adminCategoryName.replace(/\s+/g, '-'),
                                name: adminCategoryName,
                                image: adminCategoryImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600'
                              };
                              
                              import('firebase/firestore').then(async ({ doc, setDoc }) => {
                                try {
                                  await setDoc(doc(getDb(), 'categories', newCat.id), newCat);
                                  showNotification(`🎉 Created category: ${adminCategoryName}`);
                                  setAdminCategoryName('');
                                  setAdminCategoryImage('');
                                } catch (error) {
                                  console.error("Error creating category:", error);
                                  showNotification('❌ Failed to create category.');
                                }
                              });
                            }}
                            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold py-2 rounded-lg text-[10px]"
                          >
                            Create Occasions Category
                          </button>
                        </div>

                        {/* List of categories to delete */}
                        <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100">
                          <span className="text-[9px] font-bold text-brand-text-secondary block">Active Categories ({categoriesList.length})</span>
                          <div className="space-y-1 max-h-[120px] overflow-y-auto">
                            {categoriesList.map((c, idx) => (
                              <div key={c.id || idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-[10px]">
                                <img src={c.image} alt={c.name} className="w-10 h-10 object-cover rounded" onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=200';
                                }} />
                                <span className="font-bold truncate">{c.name}</span>
                                <button
                                  onClick={() => {
                                    if (!isAdmin && !isMasterAdmin) {
                                      showNotification('Unauthorized: Admins only');
                                      return;
                                    }
                                    
                                    import('firebase/firestore').then(async ({ doc, deleteDoc }) => {
                                      try {
                                        await deleteDoc(doc(getDb(), 'categories', c.id || c.name.replace(/\s+/g, '-')));
                                        showNotification('Category removed');
                                      } catch (error) {
                                        console.error("Error removing category:", error);
                                        showNotification('Failed to remove category');
                                      }
                                    });
                                  }}
                                  className="text-brand-primary font-bold hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* SUB-TAB 4: USER LEADS SHEET & CSV GENERATOR */}
                    {adminSubTab === 'leads' && (
                      <div className="bg-white p-3.5 rounded-2xl border border-brand-border space-y-3.5 text-xs animate-in fade-in duration-200">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">Customer Enquiries Leads ({leadsList.length})</span>
                          <span className="text-[9px] font-extrabold text-brand-text-secondary">Capture Rate: 92%</span>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {leadsList.length === 0 ? (
                            <div className="text-center py-6 text-brand-text-secondary font-medium">No customer enquiry leads recorded yet.</div>
                          ) : (
                            leadsList.map((lead) => (
                              <div key={lead.id} className="p-3 bg-[#FCFBF8] border border-brand-border rounded-xl space-y-1 relative shadow-sm">
                                <div className="flex justify-between items-start">
                                  <span className="font-extrabold text-brand-text text-[11px]">{lead.name}</span>
                                  <span className="text-[8px] bg-brand-primary text-white font-extrabold px-1.5 py-0.5 rounded">{lead.vendorName}</span>
                                </div>
                                <div className="text-[10px] text-brand-text-secondary space-y-0.5">
                                  <div>📞 Phone: <span className="font-semibold text-brand-text">{lead.phone}</span></div>
                                  <div>✉️ Email: <span className="font-semibold text-brand-text">{lead.email}</span></div>
                                  <div>💰 Budget: <span className="font-semibold text-brand-text">{lead.budget}</span></div>
                                  <div className="text-[8px] text-gray-400 mt-1">{lead.timestamp || '2026-07-08'}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (leadsList.length === 0) {
                              showNotification('No leads available to export yet!');
                              return;
                            }
                            
                            // Build standard CSV string
                            let csvContent = 'data:text/csv;charset=utf-8,';
                            csvContent += 'Lead ID,User Name,Phone,Email,Target Vendor,Estimated Budget,Captured Timestamp\n';
                            
                            leadsList.forEach(lead => {
                              const row = [
                                lead.id || '',
                                `"${lead.name || ''}"`,
                                lead.phone || '',
                                lead.email || '',
                                `"${lead.vendorName || ''}"`,
                                lead.budget || '',
                                lead.timestamp || '2026-07-08'
                              ].join(',');
                              csvContent += row + '\n';
                            });

                            // Trigger dynamic file download
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement('a');
                            link.setAttribute('href', encodedUri);
                            link.setAttribute('download', `parva_wedding_leads_${Date.now()}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            showNotification('📥 CSV leads spreadsheet downloaded successfully!');
                          }}
                          className="w-full bg-brand-success hover:bg-brand-success/90 text-white font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
                          id="admin-csv-leads-downloader"
                        >
                          <span>📥 Download Form Leads (CSV Spreadsheet)</span>
                        </button>
                      </div>
                    )}

                    {adminSubTab === 'approval' && (
                      <div className="bg-white p-3.5 rounded-2xl border border-brand-border space-y-4 text-xs animate-in fade-in duration-200">
                        <div>
                          <h4 className="font-extrabold text-[11px] text-brand-primary uppercase tracking-widest mb-1">
                            Pending Vendor Registrations
                          </h4>
                          <p className="text-[10px] text-brand-text-secondary leading-tight">
                            Review and approve self-registered vendor business listings before they are displayed publicly on the app.
                          </p>
                        </div>

                        {/* List of pending vendors */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {vendors.filter(v => v.approved === false).length === 0 ? (
                            <div className="text-center py-6 text-brand-text-secondary font-medium border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                              No pending business registrations found.
                            </div>
                          ) : (
                            vendors.filter(v => v.approved === false).map((v) => (
                              <div key={v.id} className="p-3 bg-[#FCFBF8] border border-brand-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:shadow-md transition">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded text-[8px] uppercase">
                                      {v.category}
                                    </span>
                                    <span className="text-[9px] text-brand-text-secondary font-semibold">
                                      {v.location}
                                    </span>
                                  </div>
                                  <h5 className="font-black text-brand-text text-xs leading-tight mb-0.5">{v.name}</h5>
                                  <p className="text-[10px] text-brand-text-secondary line-clamp-1 italic">{v.tagline}</p>
                                  <div className="text-[9px] text-brand-text-secondary mt-1 font-semibold flex gap-2">
                                    <span>Price: ₹{v.basePrice.toLocaleString('en-IN')}</span>
                                    <span>• Phone: {v.phone}</span>
                                    {v.id.startsWith('v_reg_') && <span className="text-amber-600 font-extrabold">(Self Registered)</span>}
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0 md:self-center">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const db = getDb();
                                        const { doc, updateDoc } = await import('firebase/firestore');
                                        await updateDoc(doc(db, 'vendors', v.id), {
                                          approved: true,
                                          verified: true
                                        });
                                        showNotification(`✅ Approved: ${v.name} is now live on the home page!`);
                                      } catch (err) {
                                        console.error(err);
                                        showNotification('❌ Failed to approve vendor.');
                                      }
                                    }}
                                    className="bg-brand-success hover:bg-brand-success-dark text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition"
                                  >
                                    Approve & Publish
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to reject and delete ${v.name}?`)) {
                                        try {
                                          const db = getDb();
                                          const { doc, deleteDoc } = await import('firebase/firestore');
                                          await deleteDoc(doc(db, 'vendors', v.id));
                                          showNotification(`❌ Rejected & Deleted: ${v.name}`);
                                        } catch (err) {
                                          console.error(err);
                                          showNotification('❌ Failed to delete vendor.');
                                        }
                                      }
                                    }}
                                    className="bg-brand-danger hover:bg-brand-danger-dark text-white font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] transition"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Manage / Delete Existing Vendors Section */}
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="font-extrabold text-[11px] text-brand-text uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            <span>Manage Active Database Listings</span>
                            <span className="text-[9px] bg-brand-success/15 text-brand-success-dark font-black px-2 py-0.5 rounded-full">
                              {vendors.filter(v => v.approved !== false).length} Active
                            </span>
                          </h4>
                          <p className="text-[10px] text-brand-text-secondary leading-tight mb-2.5">
                            Quickly remove dummy vendors or listings from the platform.
                          </p>

                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {vendors.filter(v => v.approved !== false).map((v) => (
                              <div key={v.id} className="p-2 bg-gray-50 border border-brand-border rounded-xl flex items-center justify-between gap-2">
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5 mb-0.5 truncate">
                                    <span className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                      {v.category}
                                    </span>
                                    <span className="font-bold text-brand-text text-[11px] truncate">{v.name}</span>
                                  </div>
                                  <span className="text-[9px] text-brand-text-secondary block">
                                    Location: {v.location} • ID: {v.id}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to permanently delete active vendor ${v.name}? This action is irreversible.`)) {
                                      try {
                                        const db = getDb();
                                        const { doc, deleteDoc } = await import('firebase/firestore');
                                        await deleteDoc(doc(db, 'vendors', v.id));
                                        showNotification(`🗑️ Successfully deleted vendor ${v.name}`);
                                      } catch (err) {
                                        console.error(err);
                                        showNotification('❌ Failed to delete vendor.');
                                      }
                                    }
                                  }}
                                  className="text-brand-danger hover:text-brand-danger-dark font-extrabold text-[10px] p-2 hover:bg-brand-danger/10 rounded-lg transition"
                                  title="Delete Vendor"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                  <div className="flex justify-between items-center px-1">
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
                          userCoords={userCoords}
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
                    { label: 'About PARVA App', desc: 'Version 1.0.0 • Terms of Service & Security' }
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
      <LocationSelector
        currentCity={currentCity}
        onSelectCity={(city) => setCurrentCity(city)}
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

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
          planningGuestSize={planningGuestSize}
        />
      )}

      {/* 6. HIGH-FIDELITY SIMULATED RAZORPAY PAYMENT GATEWAY OVERLAY */}
      {isRazorpayOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Razorpay Slate Header */}
            <div className="bg-[#1F2430] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                  R
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] leading-tight text-gray-300">PARVA CELEBRATIONS</h4>
                  <p className="text-[10px] text-gray-400 font-medium">elite concierge upgrade</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400 uppercase font-bold block">Amount due</span>
                <span className="font-black text-xs text-white">₹{razorpayAmount.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-[10px] text-brand-text-secondary">
              <span>Order Ref: PRV-ELITE-920</span>
              <span>support@parva.com</span>
            </div>

            {/* Content Portal */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {razorpayStatus === 'idle' ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-brand-text-secondary uppercase tracking-widest block">Choose Payment Method</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRazorpayMethod('upi')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                          razorpayMethod === 'upi'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-brand-border text-brand-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        ⚡ UPI / GPay
                      </button>
                      <button
                        onClick={() => setRazorpayMethod('card')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                          razorpayMethod === 'card'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-brand-border text-brand-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        💳 Credit/Debit Card
                      </button>
                    </div>
                  </div>

                  {razorpayMethod === 'upi' ? (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-100 animate-in fade-in duration-150">
                      <div>
                        <label className="text-[9px] font-bold text-brand-text-secondary uppercase block mb-1">Enter your UPI ID</label>
                        <input
                          type="text"
                          value={razorpayUpi}
                          onChange={(e) => setRazorpayUpi(e.target.value)}
                          placeholder="devansh@okhdfcbank"
                          className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                      <p className="text-[9px] text-brand-text-secondary leading-normal">
                        💡 Razorpay Secure UPI: A push notification request will be triggered instantly to your UPI app once you click Pay.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-100 animate-in fade-in duration-150">
                      <div>
                        <label className="text-[9px] font-bold text-brand-text-secondary uppercase block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          defaultValue="4111 2222 3333 4444"
                          disabled
                          className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-gray-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-brand-text-secondary uppercase block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            defaultValue="12/28"
                            disabled
                            className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-text-secondary uppercase block mb-1">CVV / Code</label>
                          <input
                            type="password"
                            placeholder="•••"
                            defaultValue="123"
                            disabled
                            className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Lock assurance */}
                  <div className="flex items-center gap-1.5 justify-center text-gray-400 text-[9px] font-bold">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span>RAZORPAY SECURE • PCI-DSS CERTIFIED</span>
                  </div>

                  <button
                    onClick={async () => {
                      setRazorpayStatus('processing');

                      // Dynamically load Razorpay SDK if not already in window
                      if (!(window as any).Razorpay) {
                        const loaded = await new Promise((resolve) => {
                          const script = document.createElement('script');
                          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                          script.onload = () => resolve(true);
                          script.onerror = () => resolve(false);
                          document.body.appendChild(script);
                        });
                        if (!loaded) {
                          showNotification('❌ Failed to load Razorpay SDK. Falling back to offline simulation.');
                          setTimeout(() => {
                            handlePaymentSuccess(razorpayPurpose);
                          }, 1500);
                          return;
                        }
                      }

                      const options = {
                        key: 'rzp_test_TE7IEPsVrpMrj7',
                        amount: razorpayAmount * 100, // paise
                        currency: 'INR',
                        name: 'PARVA Events',
                        description: razorpayPurpose === 'premium' ? 'PARVA Elite Concierge Upgrade' : 'Unlock Vendor Connection Fee',
                        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200',
                        handler: function (response: any) {
                          showNotification(`🎉 Razorpay Payment Authorized! ID: ${response.razorpay_payment_id}`);
                          handlePaymentSuccess(razorpayPurpose);
                        },
                        prefill: {
                          name: currentUser?.name || 'Devansh',
                          email: currentUser?.email || 'devansh@parva.com',
                          contact: currentUser?.phone || '9579000000'
                        },
                        notes: {
                          address: 'PARVA Office, Mumbai'
                        },
                        theme: {
                          color: '#B08E5B'
                        },
                        modal: {
                          ondismiss: function () {
                            showNotification('⚠️ Payment gateway closed by user.');
                            setRazorpayStatus('idle');
                          }
                        }
                      };

                      try {
                        const rzp = new (window as any).Razorpay(options);
                        rzp.open();
                      } catch (err) {
                        console.error('Razorpay Instance Error:', err);
                        showNotification('❌ Gateway error. Falling back to simulated verification.');
                        handlePaymentSuccess(razorpayPurpose);
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition duration-300 shadow-md shadow-blue-600/10"
                  >
                    Pay ₹{razorpayAmount.toLocaleString('en-IN')}.00 Securely
                  </button>
                </>
              ) : razorpayStatus === 'processing' ? (
                <div className="py-10 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  <div>
                    <h5 className="font-extrabold text-xs text-brand-text">Authenticating Payment Gateway</h5>
                    <p className="text-[10px] text-brand-text-secondary mt-1">Waiting for UPI bank response callback... Do not refresh</p>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-emerald-800">Payment Successfully Received!</h5>
                    <p className="text-[10px] text-brand-text-secondary mt-1">Transaction Ref: pay_RU94J31M0D3N2</p>
                    <p className="text-[10px] text-brand-text font-extrabold mt-1">
                      {razorpayPurpose === 'premium' ? 'Premium Account Activated! 👑' : 'Direct Vendor Connection Unlocked! 📲'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer close */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
              <button
                onClick={() => setIsRazorpayOpen(false)}
                className="text-[10px] font-bold text-brand-text-secondary hover:text-brand-text"
              >
                Cancel and return to PARVA
              </button>
            </div>

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
              <p>At PARVA Celebrations, we value your privacy. We collect user information, including name, phone, email, and budget, to instantly match you with event vendors. This data is shared with the specific vendors you choose to book or connect with.</p>
              <h4 className="font-bold text-brand-text uppercase">1. Information We Collect</h4>
              <p>We collect personal information that you provide to us directly, such as your contact details, and transactions related to your event bookings and connection fees.</p>
              <h4 className="font-bold text-brand-text uppercase">2. How We Use Information</h4>
              <p>We use your information to operate our marketplace, process secure payments via Razorpay, allow chat features, and prevent unauthorized operations.</p>
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
              <h4 className="font-bold text-brand-text text-xs">PARVA Celebrations</h4>
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

      {/* SYSTEM ADMIN LOGIN OVERLAY */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-slate-955 text-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-white/10 flex flex-col p-6 space-y-4 max-h-[90vh] bg-slate-950">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sparkles size={16} />
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-amber-400">Admin Secure Entry</h3>
              </div>
              <button onClick={() => setIsAdminLoginOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1">Administrator Username/Email</label>
                <input
                  type="text"
                  placeholder="devansh@parva.com"
                  value={loginAdminEmail}
                  onChange={(e) => setLoginAdminEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-amber-400 focus:bg-white/10 text-white transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1">Security Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginAdminPassword}
                  onChange={(e) => setLoginAdminPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-amber-400 focus:bg-white/10 text-white transition"
                />
                <span className="text-[9px] text-gray-400 mt-2 block">💡 Admin credentials: <b>devansh@parva.com</b> / <b>devansh@9579</b></span>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!loginAdminEmail || !loginAdminPassword) {
                  showNotification('⚠️ Please enter your credentials.');
                  return;
                }
                try {
                  const db = getDb();
                  const { doc, getDoc, collection, getDocs, query, where, setDoc } = await import('firebase/firestore');
                  
                  const enteredEmail = loginAdminEmail.trim().toLowerCase();
                  const enteredPassword = loginAdminPassword.trim();
                  
                  let matched = false;
                  let adminData: any = null;

                  // Emergency hardcoded fallback
                  if (enteredEmail === 'devansh@parva.com' && enteredPassword === 'devansh@9579') {
                    matched = true;
                    adminData = { username: 'devansh@parva.com', password: 'devansh@9579', isMaster: true };
                  }

                  if (!matched) {
                    try {
                      const masterAdminRef = doc(db, 'admins', 'master_admin');
                      const masterAdminDoc = await getDoc(masterAdminRef);
                      
                      if (masterAdminDoc.exists()) {
                        const data = masterAdminDoc.data();
                        if (data?.username?.trim().toLowerCase() === enteredEmail && data?.password?.trim() === enteredPassword) {
                          matched = true;
                          adminData = data;
                        }
                      }
                    } catch (dbErr) {
                      console.warn("Failed to check master_admin document:", dbErr);
                    }
                  }

                  if (matched && adminData) {
                    const adminUserObj = {
                      name: adminData.isMaster ? 'Master Administrator' : 'System Administrator',
                      email: adminData.username,
                      role: adminData.isMaster ? 'master_admin' : 'admin'
                    };
                    
                    setCurrentUser(adminUserObj);
                    localStorage.setItem('parva_user', JSON.stringify(adminUserObj));
                    setIsAdmin(true);
                    setIsMasterAdmin(adminData.isMaster || false);
                    setIsAdminLoginOpen(false);
                    showNotification('👑 Secure Admin Terminal Unlocked!');
                  } else {
                    showNotification('❌ Access Denied. Username/Password incorrect.');
                  }
                } catch (err) {
                  console.error(err);
                  showNotification('❌ Secure verification failed.');
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 rounded-xl transition shadow-md shadow-amber-500/10 mt-2"
            >
              Authenticate & Enter Console
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Selection Bar */}
      <CartFloatingBar
        itemCount={bundledItems.length}
        totalPrice={bundledItems.reduce((acc, item) => acc + item.service.price, 0)}
        onClick={() => setActiveTab('bookings')}
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
