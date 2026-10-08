import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShieldCheck, Gem, Tag, MapPin, Navigation, User, Phone, Mail, Calendar, Palette, Sparkles, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export interface BookingFormDetails {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAge: string;
  eventAddress: string;
  gpsCoords?: { lat: number; lng: number } | null;
  styleSuggestions: string;
}

export interface AirbnbCheckoutViewProps {
  bundledItems: { vendor: any; service: any }[];
  planningDate: string;
  planningTimeSlot: string;
  guestCount: number;
  currentUser: any;
  onPay: (details?: BookingFormDetails) => void;
  onBack: () => void;
  onOpenLogin?: (tab?: 'signin' | 'signup') => void;
  couponDiscount: number;
  couponCode: string;
  setCouponCode: (c: string) => void;
  onApplyCoupon: () => void;
  couponMessage: string;
}

export function AirbnbCheckoutView({
  bundledItems,
  planningDate,
  planningTimeSlot,
  guestCount,
  currentUser,
  onPay,
  onBack,
  onOpenLogin,
  couponDiscount,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  couponMessage
}: AirbnbCheckoutViewProps) {
  // Restore saved draft if available
  const getInitialDraft = () => {
    try {
      const saved = sessionStorage.getItem('parva_checkout_draft');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };
  const draft = getInitialDraft();

  // Form State
  const [clientName, setClientName] = useState(currentUser?.name || currentUser?.displayName || draft?.clientName || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || draft?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || draft?.clientEmail || '');
  const [clientAge, setClientAge] = useState(currentUser?.age ? String(currentUser.age) : (draft?.clientAge || '28'));
  const [eventAddress, setEventAddress] = useState(draft?.eventAddress || '');
  const [styleSuggestions, setStyleSuggestions] = useState(draft?.styleSuggestions || '');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(draft?.gpsCoords || null);
  const [isScanningGps, setIsScanningGps] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto save draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('parva_checkout_draft', JSON.stringify({
        clientName,
        clientPhone,
        clientEmail,
        clientAge,
        eventAddress,
        styleSuggestions,
        gpsCoords
      }));
    } catch (e) {}
  }, [clientName, clientPhone, clientEmail, clientAge, eventAddress, styleSuggestions, gpsCoords]);

  // Sync with currentUser if they login while on this view
  useEffect(() => {
    if (currentUser) {
      if (!clientName) setClientName(currentUser.name || currentUser.displayName || '');
      if (!clientPhone && currentUser.phone) setClientPhone(currentUser.phone);
      if (!clientEmail && currentUser.email) setClientEmail(currentUser.email);
    }
  }, [currentUser]);

  // GPS Geolocation Scanner
  const handleScanLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }

    setIsScanningGps(true);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        
        // Formatted address preview
        const detectedAddress = `GPS Coordinates: Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)} (Verified via Device GPS)`;
        
        if (!eventAddress || eventAddress.startsWith('GPS Coordinates:')) {
          setEventAddress(detectedAddress);
        }
        setIsScanningGps(false);
      },
      (error) => {
        console.warn('Geolocation scan error:', error);
        setIsScanningGps(false);
        setFormError('Unable to detect GPS location. Please type your complete address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const servicesTotal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
  const bookingFee = Math.round(servicesTotal * 0.05);
  const gst = Math.round(bookingFee * 0.18);
  const finalDue = Math.max(0, bookingFee + gst - couponDiscount);

  const primaryItem = bundledItems[0] || {
    vendor: { name: 'Verified Vendor', category: 'Services', rating: 5.0, reviewCount: 20 },
    service: { name: 'Package', price: 0 }
  };

  const handleProceedPay = () => {
    // Validation
    if (!clientName.trim()) {
      setFormError('Please enter your complete name.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.trim().length < 10) {
      setFormError('Please provide a valid 10-digit contact / WhatsApp number.');
      return;
    }
    if (!eventAddress.trim()) {
      setFormError('Please provide the complete event location address or scan your GPS location.');
      return;
    }

    setFormError(null);

    if (!currentUser && onOpenLogin) {
      onOpenLogin('signin');
      return;
    }

    onPay({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      clientAge: clientAge.trim(),
      eventAddress: eventAddress.trim(),
      gpsCoords,
      styleSuggestions: styleSuggestions.trim()
    });
  };

  return (
    <div className="max-w-[1240px] 2xl:max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-10 py-8 font-sans">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 mb-6 transition cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>Back to vendor listing</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column (Confirm and pay actions & Additional Info Form) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-sans tracking-tight">
              Confirm and pay
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1.5 font-normal">
              Provide event and contact details to notify your vendor and secure instant booking confirmation.
            </p>
          </div>

          {!currentUser && (
            <div className="bg-amber-50/95 p-5 rounded-3xl border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={22} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-amber-900">Sign In or Create Account to Confirm</h4>
                  <p className="text-xs sm:text-sm text-amber-800 mt-0.5 leading-relaxed">
                    You can fill out your event details below. Sign in with Google or Email to unlock direct communication with the vendor.
                  </p>
                </div>
              </div>

              {/* Direct Redirect to Login and Sign Up */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenLogin?.('signin')}
                  className="flex items-center gap-2 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Sign In to Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLogin?.('signup')}
                  className="flex items-center gap-2 bg-white hover:bg-amber-100/60 text-amber-950 border border-amber-300 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Create New Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-bold flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Additional Event & Booking Information Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <Sparkles size={20} className="text-rose-600" />
              <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-wider font-sans">
                1. Contact & Planner Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Complete Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <User size={15} className="text-gray-400" />
                  <span>Complete Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-gray-900 outline-none transition"
                  required
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={15} className="text-gray-400" />
                  <span>Age (Client / Host) *</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  min="18"
                  max="100"
                  value={clientAge}
                  onChange={(e) => setClientAge(e.target.value)}
                  className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-gray-900 outline-none transition"
                  required
                />
              </div>

              {/* Contact Info (WhatsApp / Mobile) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Phone size={15} className="text-gray-400" />
                  <span>Contact Phone / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9823456789"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-gray-900 outline-none transition"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Mail size={15} className="text-gray-400" />
                  <span>Confirmation Email</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-gray-900 outline-none transition"
                />
              </div>
            </div>

            {/* Event Location Complete Address Section */}
            <div className="pt-5 border-t border-gray-100 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <MapPin size={15} className="text-rose-600" />
                  <span>Event Venue / Complete Address *</span>
                </label>

                {/* Scan Location by GPS Button */}
                <button
                  type="button"
                  onClick={handleScanLocation}
                  disabled={isScanningGps}
                  className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Detect coordinates from device GPS"
                >
                  <Navigation size={14} className={isScanningGps ? 'animate-spin' : ''} />
                  <span>{isScanningGps ? 'Scanning GPS...' : '📍 Scan Location by GPS'}</span>
                </button>
              </div>

              {gpsCoords && (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                  <span>✓ GPS Coordinates Locked:</span>
                  <span className="font-mono text-emerald-900">{gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</span>
                </div>
              )}

              <textarea
                rows={3}
                placeholder="Enter complete venue address (Hall / Lawn Name, Street, Landmark, City, Pincode) or use Scan GPS above..."
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl p-4 text-sm sm:text-base font-medium text-gray-900 outline-none transition resize-none"
                required
              />
            </div>

            {/* Additional Info / Style Suggestions */}
            <div className="pt-5 border-t border-gray-100 space-y-2.5">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Palette size={15} className="text-indigo-600" />
                <span>Style Suggestions & Custom Notes (Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Share your preferred color palette, event themes, song choices, dietary preferences, or specific timings for the vendor..."
                value={styleSuggestions}
                onChange={(e) => setStyleSuggestions(e.target.value)}
                className="w-full bg-gray-50/90 border border-gray-200 focus:border-rose-500 focus:bg-white rounded-2xl p-4 text-sm sm:text-base font-medium text-gray-900 outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 font-medium">
                This information will be forwarded directly to the vendor's hub and included in your booking voucher.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>100% Escrow Protected: Only 5% advance connection fee charged now.</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              By selecting the button below, I agree to the Parva Booking Terms and Vendor Cancellation Policy.
            </p>

            <button
              type="button"
              onClick={handleProceedPay}
              className="w-full sm:w-auto px-10 bg-[#EC003F] hover:bg-[#D40038] text-white font-black text-base sm:text-lg py-4 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
            >
              {!currentUser ? 'Log in & Confirm Booking' : `Confirm and pay ₹${finalDue.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>

        {/* Right Column (Order summary card) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-xl space-y-6 sticky top-28">
            {/* Rare find tag */}
            <div className="bg-rose-50 text-rose-700 text-sm font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-2 border border-rose-200">
              <Gem size={16} />
              <span>Rare find! Specialists are in high demand</span>
            </div>

            {/* Vendor List Snippet */}
            <div className="space-y-3 pb-5 border-b border-gray-100 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span>Selected Vendors ({bundledItems.length})</span>
                <span>Services Included</span>
              </div>
              {bundledItems.map((item, idx) => (
                <div key={item.vendor?.id || `${item.vendor?.name}-${idx}`} className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/80 border border-gray-200/80">
                  <img
                    src={item.vendor?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'}
                    alt={item.vendor?.name || 'Vendor'}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">{item.vendor?.name || 'Vendor'}</h4>
                    <p className="text-xs text-gray-600 font-medium truncate">
                      {item.service?.name || 'Service'} • <span className="font-bold text-gray-900">₹{(item.service?.price || 0).toLocaleString('en-IN')}</span>
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-700 font-bold mt-0.5">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span>{(item.vendor?.rating || 4.9).toFixed(1)}</span>
                      <span className="text-gray-400 font-normal">({item.vendor?.reviewCount || 142})</span>
                      <span className="text-gray-300 mx-1">•</span>
                      <span className="text-gray-500 font-medium truncate">{item.vendor?.category || 'Specialist'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dates & Guests */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-bold">Event Date</span>
                  <span className="font-extrabold text-gray-900">{planningDate || 'Selected Date'}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-xs uppercase font-bold">Time Slot</span>
                  <span className="font-extrabold text-gray-900 capitalize">{planningTimeSlot || 'Evening'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-gray-100">
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-bold">Attendees / Guests</span>
                  <span className="font-extrabold text-gray-900">{guestCount || 100} Guests</span>
                </div>
              </div>
            </div>

            {/* Coupon Code input */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold outline-none focus:border-rose-500 uppercase"
                />
                <button
                  type="button"
                  onClick={onApplyCoupon}
                  className="bg-[#EC003F] hover:bg-[#D40038] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMessage && <p className="text-xs font-bold text-rose-600">{couponMessage}</p>}
            </div>

            {/* Price Details */}
            <div className="space-y-2.5 pt-3 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Services Total:</span>
                <span className="font-bold text-gray-900">₹{servicesTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>5% Escrow Advance Fee:</span>
                <span className="font-bold text-gray-900">₹{bookingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18% on fee):</span>
                <span className="font-bold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 pt-3 border-t border-gray-100 text-base">
                <span>Advance Payable Now:</span>
                <span className="text-[#EC003F] text-lg font-black">₹{finalDue.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs text-gray-400 text-right font-medium">
                Remaining balance payable directly to vendor on event day
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirbnbCheckoutView;

