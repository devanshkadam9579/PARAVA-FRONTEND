import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, Phone, User, CheckCheck, Clock, 
  Sparkles, Calendar, MapPin, ShieldCheck, Search, 
  ExternalLink, MessageCircle, AlertCircle, Lock, ArrowRight
} from 'lucide-react';
import { Vendor, Booking } from '../types';
import { getDb } from '../lib/firebase';

export interface ChatTabProps {
  vendors: Vendor[];
  bookings: Booking[];
  currentUser: any;
  initialVendorId?: string | null;
  onOpenLogin: () => void;
  onShowNotification: (msg: string) => void;
  onNavigateToExplore?: () => void;
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
  onOpenLogin,
  onShowNotification,
  onNavigateToExplore,
  onSelectVendor
}: ChatTabProps) {
  // Helper to determine if a booking belongs to the current user
  const isUserBooking = (b: Booking) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'master_admin') return true;
    if (currentUser.role === 'vendor' && currentUser.vendorId) {
      return b.vendor?.id === currentUser.vendorId || (b as any).vendorId === currentUser.vendorId;
    }
    const uidMatch = Boolean(b.userId && b.userId === currentUser.uid);
    const phoneMatch = Boolean(currentUser.phone && (b.customerPhone === currentUser.phone || (b as any).clientPhone === currentUser.phone));
    const emailMatch = Boolean(currentUser.email && (b.customerEmail === currentUser.email || (b as any).clientEmail === currentUser.email));
    const nameMatch = Boolean(currentUser.name && b.customerName && b.customerName.toLowerCase() === currentUser.name.toLowerCase());
    return uidMatch || phoneMatch || emailMatch || nameMatch;
  };

  // Only confirmed vendors for which THIS user has an active/paid reservation
  const userBookings = bookings.filter(isUserBooking);
  const bookedVendorIds = userBookings.map(b => b.vendor?.id || (b as any).vendorId).filter(Boolean);
  const bookedVendors = vendors.filter(v => bookedVendorIds.includes(v.id));
  const otherVendors = vendors.filter(v => !bookedVendorIds.includes(v.id));
  const allPartners = [...bookedVendors, ...otherVendors];

  const [activeVendorId, setActiveVendorId] = useState<string | null>(
    initialVendorId || bookedVendors[0]?.id || vendors[0]?.id || null
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messagesByVendor, setMessagesByVendor] = useState<Record<string, ChatMessage[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialVendorId if changed externally
  useEffect(() => {
    if (initialVendorId) {
      setActiveVendorId(initialVendorId);
    }
  }, [initialVendorId]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesByVendor, activeVendorId]);

  // Real-time Firestore Subscription for chats
  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe: (() => void) | undefined;

    const setupChatListener = async () => {
      try {
        const db = getDb();
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, orderBy('createdAt', 'asc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const grouped: Record<string, ChatMessage[]> = {};

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const vId = data.vendorId || 'general';
            if (!grouped[vId]) grouped[vId] = [];

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

            grouped[vId].push({
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

          setMessagesByVendor(grouped);
        }, (err) => {
          console.warn('[ChatTab] Firestore listener warning:', err);
        });
      } catch (err) {
        console.error('[ChatTab] Failed to init chat listener:', err);
      }
    };

    setupChatListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 text-center space-y-4 my-6 shadow-xs max-w-2xl mx-auto font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
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
          className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-8 py-3 rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const activeVendor = vendors.find(v => v.id === activeVendorId) || bookedVendors[0] || allPartners[0];
  const activeBooking = bookings.find(b => (b.vendor?.id === activeVendor?.id) || ((b as any).vendorId === activeVendor?.id));
  const isVendorConfirmed = Boolean(activeBooking) || bookedVendorIds.includes(activeVendor?.id || '');

  // Filter partners by search
  const filteredPartners = allPartners.filter(v => 
    v.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    v.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (v.location && v.location.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Active messages thread
  const currentMessages = activeVendor ? (messagesByVendor[activeVendor.id] || []) : [];

  // Default fallback if no messages exist yet
  const displayMessages = currentMessages.length > 0 ? currentMessages : (
    activeBooking ? [
      {
        sender: 'user' as const,
        senderName: currentUser.name || 'Client',
        text: `Namaste ${activeVendor?.name}! 🎉 I have confirmed a reservation for "${activeBooking.serviceName || activeVendor?.category}" on ${activeBooking.eventDate}. Looking forward to coordinating with your team!`,
        time: 'Booking Confirmed'
      },
      {
        sender: 'vendor' as const,
        senderName: `${activeVendor?.name} Concierge`,
        text: `Welcome to MyParva, ${currentUser.name || 'Valued Client'}! 🎊 Your reservation is protected under MyParva Escrow. Please feel free to share any specific theme requirements, custom playlists, or schedule notes here! ✨`,
        time: 'Just now'
      }
    ] : [
      {
        sender: 'vendor' as const,
        senderName: activeVendor?.name || 'Vendor Team',
        text: `Namaste ${currentUser.name || 'Valued Client'}! Once your booking is confirmed, direct priority chat and calendar sync will activate here.`,
        time: 'Just now'
      }
    ]
  );

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (!isVendorConfirmed) {
      onShowNotification('🔒 Chat is exclusively unlocked for confirmed bookings. Please confirm your reservation first!');
      return;
    }

    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeVendor) return;

    setIsSending(true);
    const newMsg: ChatMessage = {
      bookingId: activeBooking?.id || '',
      vendorId: activeVendor.id,
      vendorName: activeVendor.name,
      userId: currentUser?.uid || currentUser?.id || '',
      userName: currentUser.name || currentUser.displayName || 'Customer',
      userPhone: currentUser.phone || '',
      userEmail: currentUser.email || '',
      sender: 'user',
      senderName: currentUser.name || currentUser.displayName || 'Customer',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI update
    setMessagesByVendor(prev => ({
      ...prev,
      [activeVendor.id]: [...(prev[activeVendor.id] || []), newMsg]
    }));
    if (!customText) setInputText('');

    // Write to Firestore
    try {
      const db = getDb();
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'chats'), {
        bookingId: activeBooking?.id || '',
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
    <div className="space-y-4 my-2 max-w-7xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-gray-900 font-display flex items-center gap-2">
              <span>Celebration Messages & Live Coordination</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Confirmed Partners
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Direct real-time communication between you and your booked celebration specialists
            </p>
          </div>
        </div>

        {/* Quick Booking Count Summary */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200">
          <Calendar size={14} className="text-rose-600" />
          <span>{bookedVendors.length} Confirmed Vendor Channels</span>
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
              placeholder="Search confirmed partner..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-2xl text-xs outline-none focus:border-rose-600 shadow-xs"
            />
          </div>

          {/* Partner List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[500px] pr-1">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Partners ({filteredPartners.length})
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {bookedVendors.length} Unlocked
              </span>
            </div>

            {filteredPartners.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching event partners found.
              </div>
            ) : (
              filteredPartners.map((vendor) => {
                const isSelected = activeVendor?.id === vendor.id;
                const hasBooking = bookedVendorIds.includes(vendor.id);
                const vendorMsgs = messagesByVendor[vendor.id] || [];
                const lastMsg = vendorMsgs[vendorMsgs.length - 1];

                return (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => setActiveVendorId(vendor.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/80 border border-rose-200 shadow-xs ring-1 ring-rose-200'
                        : 'hover:bg-white bg-white/70 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=150'}
                        alt={vendor.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-gray-200"
                      />
                      {hasBooking ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[7px] text-white font-black">
                          ✓
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-gray-900 truncate block">
                          {vendor.name}
                        </span>
                        {hasBooking ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                            <ShieldCheck size={9} /> Confirmed
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400 font-bold shrink-0 flex items-center gap-0.5">
                            <Lock size={9} /> Locked
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-rose-600 font-semibold truncate block">
                        {vendor.category}
                      </span>

                      {lastMsg ? (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {lastMsg.sender === 'user' ? 'You: ' : ''}{lastMsg.text}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {hasBooking ? 'Click to open conversation' : 'Booking required to chat'}
                        </p>
                      )}
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
                      {isVendorConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Confirmed Booking Channel</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          <Lock size={11} className="text-amber-600" />
                          <span>Booking Required</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {activeVendor.category} • {activeVendor.location || 'Mumbai'}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons: WhatsApp & Direct Phone */}
                {isVendorConfirmed && (
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
                        className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 transition shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                        title="Direct Phone Call"
                      >
                        <Phone size={15} />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Active Booking Context Bar */}
              {activeBooking && (
                <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-3 rounded-2xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-rose-600 shrink-0" />
                    <span className="font-extrabold text-gray-900">
                      Booked: {activeBooking.serviceName || activeVendor.category}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-700 font-medium">
                      Date: <strong className="text-gray-900">{activeBooking.eventDate}</strong>
                    </span>
                  </div>
                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    {activeBooking.status || 'Confirmed'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Conditional: If Not Confirmed, Show Dedicated Lock Screen */}
          {!isVendorConfirmed ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Lock size={30} />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base font-black text-gray-900 font-display">
                  Booking Required to Unlock Direct Chat
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  To ensure 100% verified calendar availability and priority crew dispatch, direct customer-to-vendor messaging is activated once a booking is confirmed on Parva.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activeVendor && onSelectVendor) {
                    onSelectVendor(activeVendor);
                  } else if (onNavigateToExplore) {
                    onNavigateToExplore();
                  }
                }}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <span>Book {activeVendor?.name || 'Vendor'} Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
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
                            ? 'bg-rose-600 text-white rounded-br-xs font-normal'
                            : 'bg-gray-50 text-gray-900 border border-gray-200/90 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <span className="text-[9px] text-gray-400 font-medium px-2 mt-1 flex items-center gap-1">
                        <span>{msg.time}</span>
                        {isUser && <CheckCheck size={12} className="text-rose-600" />}
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
                    className="shrink-0 bg-gray-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2 border-t border-gray-100">
            <input
              type="text"
              disabled={!isVendorConfirmed}
              placeholder={isVendorConfirmed ? `Message ${activeVendor?.name || 'vendor'}...` : '🔒 Book this vendor to unlock direct chat messaging'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-gray-50 disabled:bg-gray-100/80 disabled:cursor-not-allowed border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-rose-600 focus:bg-white transition shadow-xs"
            />
            <button
              type="submit"
              disabled={!isVendorConfirmed || !inputText.trim() || isSending}
              className="bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
