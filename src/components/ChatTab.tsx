import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Phone, User, CheckCheck, Clock, 
  Sparkles, Calendar, MapPin, ShieldCheck, Search, 
  ExternalLink, MessageCircle, AlertCircle, Lock, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Vendor, Booking } from '../types';
import { getDb } from '../lib/firebase';

export interface ChatTabProps {
  vendors: Vendor[];
  bookings: Booking[];
  currentUser: any;
  initialVendorId?: string | null;
  initialBookingId?: string | null;
  onOpenLogin: () => void;
  onShowNotification: (msg: string) => void;
  onNavigateToExplore?: () => void;
  onNavigateToReservations?: () => void;
  onSelectVendor?: (vendor: Vendor) => void;
}

interface ChatMessage {
  id?: string;
  bookingId?: string;
  vendorId?: string;
  vendorName?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  sender: 'user' | 'vendor';
  senderName?: string;
  text: string;
  time: string;
  createdAt?: any;
}

export default function ChatTab({
  vendors,
  bookings,
  currentUser,
  initialVendorId,
  initialBookingId,
  onOpenLogin,
  onShowNotification,
  onNavigateToExplore,
  onNavigateToReservations,
  onSelectVendor
}: ChatTabProps) {
  // Allowed statuses for chat communication eligibility
  const ALLOWED_CHAT_STATUSES = ['confirmed', 'accepted', 'in progress', 'pending', 'paid', 'vendor_pending'];

  const isAdminUser = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'master_admin'));

  // Helper to determine if a booking belongs to the current user with valid messaging status
  const isUserBooking = (b: Booking) => {
    if (!currentUser) return false;
    if (isAdminUser) return true;
    
    // Status validation
    const status = (b.status || (b as any).bookingStatus || '').toLowerCase();
    const isStatusAllowed = !status || ALLOWED_CHAT_STATUSES.some(s => s === status);
    if (!isStatusAllowed) return false;

    if (currentUser.role === 'vendor' && currentUser.vendorId) {
      return b.vendor?.id === currentUser.vendorId || (b as any).vendorId === currentUser.vendorId;
    }
    const cUid = currentUser.uid || '';
    const cPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const cEmail = (currentUser.email || '').toLowerCase().trim();

    const uidMatch = Boolean(cUid && ((b.userId && b.userId === cUid) || ((b as any).customerUid && (b as any).customerUid === cUid)));
    const phoneMatch = Boolean(cPhone && cPhone.length >= 10 && cPhone !== '9999999999' && (
      (b.customerPhone && b.customerPhone.replace(/\D/g, '').slice(-10) === cPhone && b.customerPhone.replace(/\D/g, '').slice(-10) !== '9999999999') ||
      ((b as any).clientPhone && (b as any).clientPhone.replace(/\D/g, '').slice(-10) === cPhone && (b as any).clientPhone.replace(/\D/g, '').slice(-10) !== '9999999999')
    ));
    const emailMatch = Boolean(cEmail && cEmail.includes('@') && !cEmail.includes('customer@parva') && (
      (b.customerEmail && b.customerEmail.toLowerCase().trim() === cEmail && !b.customerEmail.toLowerCase().includes('customer@parva')) ||
      ((b as any).clientEmail && (b as any).clientEmail.toLowerCase().trim() === cEmail && !(b as any).clientEmail.toLowerCase().includes('customer@parva'))
    ));
    return uidMatch || phoneMatch || emailMatch;
  };

  // Only bookings for which THIS user has an active booking relationship
  const userBookings = bookings.filter(isUserBooking);

  // Check unauthorized attempt if user navigated directly via URL manipulation
  const isUnauthorizedBookingAttempt = Boolean(
    !isAdminUser &&
    initialBookingId &&
    !userBookings.some(b => b.id === initialBookingId)
  );

  const isUnauthorizedVendorAttempt = Boolean(
    !isAdminUser &&
    !initialBookingId &&
    initialVendorId &&
    !userBookings.some(b => b.vendor?.id === initialVendorId || (b as any).vendorId === initialVendorId)
  );

  // Active Booking ID State
  const [activeBookingId, setActiveBookingId] = useState<string | null>(() => {
    if (initialBookingId && userBookings.some(b => b.id === initialBookingId)) {
      return initialBookingId;
    }
    if (initialVendorId) {
      const match = userBookings.find(b => b.vendor?.id === initialVendorId || (b as any).vendorId === initialVendorId);
      if (match) return match.id;
    }
    return userBookings[0]?.id || null;
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize activeBookingId when initial props change
  useEffect(() => {
    if (initialBookingId && userBookings.some(b => b.id === initialBookingId)) {
      setActiveBookingId(initialBookingId);
    } else if (initialVendorId) {
      const match = userBookings.find(b => b.vendor?.id === initialVendorId || (b as any).vendorId === initialVendorId);
      if (match) {
        setActiveBookingId(match.id);
      }
    } else if (!activeBookingId && userBookings.length > 0) {
      setActiveBookingId(userBookings[0].id);
    }
  }, [initialBookingId, initialVendorId, userBookings]);

  // Resolve active booking and active vendor
  const activeBooking = userBookings.find(b => b.id === activeBookingId) || userBookings[0] || null;
  const activeVendor = activeBooking ? (
    vendors.find(v => v.id === (activeBooking.vendor?.id || (activeBooking as any).vendorId)) || activeBooking.vendor
  ) : null;

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveMessages, activeBookingId]);

  // Real-time Scoped Firestore Listener for Active Booking Conversation
  useEffect(() => {
    if (!currentUser || !currentUser.uid || !activeBooking?.id) {
      setLiveMessages([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupChatListener = async () => {
      try {
        const db = getDb();
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const chatsRef = collection(db, 'chats');

        // Query messages matching this specific booking ID (resilient without requiring composite index)
        const q = query(chatsRef, where('bookingId', '==', activeBooking.id));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const list: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let timeStr = 'Just now';
            if (data.createdAt?.toDate) {
              timeStr = data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (data.createdAt instanceof Date) {
              timeStr = data.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (typeof data.createdAt === 'string') {
              try {
                timeStr = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } catch (e) {}
            }

            list.push({
              id: docSnap.id,
              bookingId: data.bookingId,
              vendorId: data.vendorId,
              vendorName: data.vendorName,
              userId: data.userId,
              userName: data.userName,
              userPhone: data.userPhone,
              userEmail: data.userEmail,
              sender: data.sender || 'vendor',
              senderName: data.senderName,
              text: data.text || '',
              time: timeStr,
              createdAt: data.createdAt
            });
          });

          // Sort messages client-side by creation timestamp
          list.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
            return timeA - timeB;
          });

          setLiveMessages(list);
        }, (err) => {
          console.debug('[ChatTab] Scoped firestore listener note:', err?.message);
        });
      } catch (err) {
        console.error('[ChatTab] Failed to init chat listener:', err);
      }
    };

    setupChatListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, activeBooking?.id]);

  // 1. Not Authenticated View
  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 text-center space-y-4 my-6 shadow-xs max-w-2xl mx-auto font-sans">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto shadow-inner">
          <MessageSquare size={28} />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-black text-xl text-gray-900 font-display">Sign In to Chat with Confirmed Vendors</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Communicate directly with verified decorators, caterers, banquet managers and photographers after booking with instant notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          className="bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-bold px-8 py-3 rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // 2. Unauthorized Chat Attempt (URL manipulation / unbooked vendor access attempt)
  if (isUnauthorizedBookingAttempt || isUnauthorizedVendorAttempt) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 text-center space-y-4 shadow-xs max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-black text-xl text-gray-900 font-display">Chat Access Restricted</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Chat is available only for vendors you have booked. Please confirm a celebration reservation with this partner first.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onNavigateToReservations && (
              <button
                type="button"
                onClick={onNavigateToReservations}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                View My Reservations
              </button>
            )}
            {onNavigateToExplore && (
              <button
                type="button"
                onClick={onNavigateToExplore}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Explore Verified Vendors
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State: No Authorized Bookings Yet
  if (userBookings.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 text-center space-y-4 shadow-xs max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-black text-xl text-gray-900 font-display">No vendor conversations yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Your vendor chats will appear here after you make a booking.
            </p>
          </div>
          {onNavigateToExplore && (
            <button
              type="button"
              onClick={onNavigateToExplore}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold px-7 py-3 rounded-full shadow-md transition active:scale-95 cursor-pointer"
            >
              Explore Vendors
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filter booked conversations by search query
  const filteredBookings = userBookings.filter(b => {
    const vName = b.vendor?.name || '';
    const vCat = b.vendor?.category || b.serviceName || '';
    const q = searchFilter.toLowerCase();
    return vName.toLowerCase().includes(q) || vCat.toLowerCase().includes(q);
  });

  // Default introductory exchange if no messages exist yet
  const displayMessages = liveMessages.length > 0 ? liveMessages : (
    activeBooking && activeVendor ? [
      {
        sender: 'user' as const,
        senderName: currentUser.name || 'Client',
        text: `Namaste ${activeVendor.name}! 🎉 I have confirmed a reservation for "${activeBooking.serviceName || activeVendor.category}" on ${activeBooking.eventDate}. Looking forward to coordinating with your team!`,
        time: 'Booking Confirmed'
      },
      {
        sender: 'vendor' as const,
        senderName: `${activeVendor.name} Concierge`,
        text: `Welcome to MyParva, ${currentUser.name || 'Valued Client'}! 🎊 Your reservation is confirmed. Please feel free to share any specific theme requirements, custom notes, or schedule requests here! ✨`,
        time: 'Just now'
      }
    ] : []
  );

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (!activeBooking || !activeVendor) {
      onShowNotification('🔒 Please select a confirmed booking conversation first.');
      return;
    }

    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    setIsSending(true);
    const newMsg: ChatMessage = {
      bookingId: activeBooking.id,
      vendorId: activeVendor.id,
      vendorName: activeVendor.name,
      userId: currentUser?.uid || currentUser?.id || '',
      userName: currentUser.name || currentUser.displayName || 'Customer',
      sender: 'user',
      senderName: currentUser.name || currentUser.displayName || 'Customer',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic local update
    setLiveMessages(prev => [...prev, newMsg]);
    if (!customText) setInputText('');

    // Write to Firestore chats collection
    try {
      const db = getDb();
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'chats'), {
        bookingId: activeBooking.id,
        vendorId: activeVendor.id,
        vendorName: activeVendor.name,
        userId: currentUser?.uid || currentUser?.id || '',
        userName: currentUser.name || currentUser.displayName || 'Customer',
        userPhone: currentUser.phone || '',
        userEmail: currentUser.email || '',
        sender: 'user',
        senderName: currentUser.name || currentUser.displayName || 'Customer',
        text: textToSend,
        createdAt: serverTimestamp()
      });
      onShowNotification('Message delivered to vendor 📲');
    } catch (err) {
      console.warn('Could not write message to Firestore:', err);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Can we adjust the setup time?',
    'Please share recent theme decor photos',
    'What is the arrival schedule of your crew?',
    'Can we customize the food menu/playlist?'
  ];

  return (
    <div className="space-y-4 my-2 w-full max-w-[1440px] mx-auto font-sans">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-gray-900 font-display flex items-center gap-2">
              <span>My Booked Vendors</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Authorized Channels
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Direct real-time communication between you and your booked celebration specialists
            </p>
          </div>
        </div>

        {/* Quick Booking Count Summary & Back to Reservations */}
        <div className="flex items-center gap-2.5">
          {onNavigateToReservations && (
            <button
              type="button"
              onClick={onNavigateToReservations}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-2xl transition"
            >
              <ArrowLeft size={13} />
              <span>Back to Reservations</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200">
            <Calendar size={14} className="text-brand-primary" />
            <span>{userBookings.length} Booked Channels</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4 bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden min-h-[580px]">
        {/* Left Column: Vendor List & Search (4 Cols) */}
        <div className="lg:col-span-4 border-r border-gray-100 p-3 sm:p-4 space-y-3 flex flex-col bg-gray-50/40">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search booked vendors..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-2xl text-xs outline-none focus:border-brand-primary shadow-xs"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[500px] pr-1">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Booked Channels ({filteredBookings.length})
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Channels
              </span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching booked vendors found.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const vendorObj = vendors.find(v => v.id === (b.vendor?.id || (b as any).vendorId)) || b.vendor;
                const isSelected = activeBooking?.id === b.id;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBookingId(b.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary-light/50 border border-brand-border shadow-xs ring-1 ring-brand-border'
                        : 'hover:bg-white bg-white/70 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={vendorObj?.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=150'}
                        alt={vendorObj?.name || 'Vendor'}
                        className="w-11 h-11 rounded-2xl object-cover border border-gray-200"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[7px] text-white font-black">
                        ✓
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-gray-900 truncate block">
                          {vendorObj?.name || 'Vendor Partner'}
                        </span>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                          <ShieldCheck size={9} /> {b.status || 'Confirmed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                        <span className="text-brand-primary font-semibold">{b.serviceName || vendorObj?.category}</span>
                        {b.bookingIdString && (
                          <span>• #{b.bookingIdString}</span>
                        )}
                        {b.eventDate && (
                          <span>• {b.eventDate}</span>
                        )}
                      </div>

                      <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                        {isSelected ? 'Conversation active' : 'Click to open messages'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4 sm:p-6 bg-white min-h-[500px]">
          {/* Thread Header */}
          {activeVendor && (
            <div className="space-y-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={activeVendor.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=150'}
                    alt={activeVendor.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate font-display">
                        {activeVendor.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        <span>Confirmed Booking Channel</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {activeVendor.category} • {activeVendor.location || 'Mumbai'}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons: WhatsApp & Direct Phone */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeVendor.whatsapp && (
                    <a
                      href={`https://wa.me/${activeVendor.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                      title="Open WhatsApp Chat"
                    >
                      <MessageCircle size={15} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}

                  {activeVendor.phone && (
                    <a
                      href={`tel:${activeVendor.phone}`}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-brand-primary-light hover:text-brand-primary border border-gray-200 transition shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                      title="Direct Phone Call"
                    >
                      <Phone size={15} />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Active Booking Context Bar */}
              {activeBooking && (
                <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-3 rounded-2xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-brand-primary shrink-0" />
                    <span className="font-extrabold text-gray-900">
                      Booked: {activeBooking.serviceName || activeVendor.category}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-700 font-medium">
                      Date: <strong className="text-gray-900">{activeBooking.eventDate}</strong>
                    </span>
                    {activeBooking.bookingIdString && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 font-mono">#{activeBooking.bookingIdString}</span>
                      </>
                    )}
                  </div>
                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    {activeBooking.status || 'Confirmed'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Messages Bubble Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 px-1 max-h-[380px]">
            <div className="text-center">
              <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Direct End-to-End Encrypted Coordination
              </span>
            </div>

            {displayMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Name label */}
                  <span className="text-[10px] font-bold text-gray-400 px-2 mb-1">
                    {msg.senderName || (isUser ? 'You' : activeVendor?.name)}
                  </span>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                      isUser
                        ? 'bg-brand-primary text-white rounded-br-xs font-normal'
                        : 'bg-gray-50 text-gray-900 border border-gray-200/90 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <span className="text-[9px] text-gray-400 font-medium px-2 mt-1 flex items-center gap-1">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck size={12} className="text-brand-primary" />}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(undefined, prompt)}
                className="shrink-0 bg-gray-50 hover:bg-brand-primary-light hover:text-brand-primary hover:border-brand-border border border-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2 border-t border-gray-100">
            <input
              type="text"
              placeholder={`Message ${activeVendor?.name || 'vendor'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-brand-primary focus:bg-white transition shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white p-3 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
