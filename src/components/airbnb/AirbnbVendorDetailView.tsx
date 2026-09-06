import React, { useState, useEffect } from 'react';
import { 
  Star, MapPin, ShieldCheck, Heart, Share2, Calendar, Clock, 
  CheckCircle, ArrowLeft, Users, ChevronRight, Phone, MessageSquare, 
  Grid, Check, Sparkles, AlertCircle 
} from 'lucide-react';
import { Vendor, VendorServiceItem } from '../../types';
import { PhotoGalleryLightbox } from './PhotoGalleryLightbox';

export interface AirbnbVendorDetailViewProps {
  vendor: Vendor;
  onBack: () => void;
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onAddServiceToBundle: (service: VendorServiceItem) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string, e: any) => void;
  onProceedToCheckout: () => void;
}

export function AirbnbVendorDetailView({
  vendor,
  onBack,
  eventDate,
  onDateChange,
  guestCount,
  onGuestCountChange,
  onAddServiceToBundle,
  isWishlisted,
  onToggleWishlist,
  onProceedToCheckout
}: AirbnbVendorDetailViewProps) {
  const images = (vendor.images && vendor.images.length > 0)
    ? vendor.images
    : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'];

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VendorServiceItem>(
    vendor.services?.[0] || {
      id: 's1',
      name: 'Standard Package',
      price: vendor.basePrice,
      description: 'Comprehensive package'
    }
  );

  const [selectedAddons, setSelectedAddons] = useState<{ id: string; name: string; price: number }[]>([]);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening' | 'fullday'>('evening');
  const [availabilityState, setAvailabilityState] = useState<'checking' | 'available' | 'unavailable' | 'idle'>('idle');

  const isCatering = (vendor.category || '').toLowerCase() === 'catering';
  
  // Available Add-ons Mock/Config
  const availableAddons = [
    { id: 'addon_1', name: 'Premium Floral Stage Upgrade', price: 5000, desc: 'Exotic orchids & carnations' },
    { id: 'addon_2', name: 'Fairy Lighting & Chandelier Set', price: 3000, desc: 'Warm ambient LED illuminations' },
    { id: 'addon_3', name: 'Gourmet Dessert & Mocktail Counter', price: 4500, desc: 'Live signature mocktails station' }
  ];

  const toggleAddon = (addon: { id: string; name: string; price: number }) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Base Package & Add-on Calculations
  const baseServicePrice = isCatering ? selectedService.price * (guestCount || 100) : selectedService.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = baseServicePrice + addonsTotal;
  const bookingFee = Math.round(subtotal * 0.05);
  const gst = Math.round(bookingFee * 0.18);
  const finalAdvanceDue = bookingFee + gst;
  const balanceDueAtEvent = subtotal - bookingFee;

  // Live Availability Checker
  const checkAvailabilityLive = () => {
    setAvailabilityState('checking');
    setTimeout(() => {
      if (vendor.busyDates && vendor.busyDates.includes(eventDate)) {
        setAvailabilityState('unavailable');
      } else {
        setAvailabilityState('available');
      }
    }, 400);
  };

  useEffect(() => {
    if (eventDate) {
      checkAvailabilityLive();
    }
  }, [eventDate, timeSlot]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 mb-3 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to marketplace</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
            {vendor.name}
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => onToggleWishlist(vendor.id, e)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 transition"
            >
              <Heart size={14} className={isWishlisted ? 'fill-brand-primary text-brand-primary' : ''} />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
          <Star size={13} className="fill-gray-900 text-gray-900" />
          <span className="font-extrabold text-gray-900">{vendor.rating.toFixed(1)}</span>
          <span>•</span>
          <span className="underline font-semibold">{vendor.reviewCount || 24} reviews</span>
          <span>•</span>
          <span className="font-semibold">{vendor.location || 'Maharashtra'}</span>
        </div>
      </div>

      {/* 5-Photo Bento Grid Gallery */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[340px] sm:h-[400px] bg-gray-100">
        <div className="md:col-span-2 h-full" onClick={() => setIsGalleryOpen(true)}>
          <img
            src={images[0]}
            alt={vendor.name}
            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
          />
        </div>
        <div className="hidden md:grid grid-rows-2 gap-2 h-full" onClick={() => setIsGalleryOpen(true)}>
          <img
            src={images[1] || images[0]}
            alt={vendor.name}
            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
          />
          <img
            src={images[2] || images[0]}
            alt={vendor.name}
            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
          />
        </div>
        <div className="hidden md:grid grid-rows-2 gap-2 h-full" onClick={() => setIsGalleryOpen(true)}>
          <img
            src={images[3] || images[0]}
            alt={vendor.name}
            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
          />
          <img
            src={images[4] || images[0]}
            alt={vendor.name}
            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
          />
        </div>

        {/* Show all photos button */}
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-900 text-xs font-extrabold px-4 py-2 rounded-xl shadow-lg border border-gray-200/80 flex items-center gap-2 transition active:scale-95"
        >
          <Grid size={14} />
          <span>Show all {images.length} photos</span>
        </button>
      </div>

      {/* 2-Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Host snippet */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">
                {vendor.category} specialist hosted by {vendor.founderName || vendor.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {vendor.experience || '10+ Years Experience'} • Verified Parva Partner
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-extrabold text-base flex items-center justify-center shadow-xs">
              {vendor.name.charAt(0)}
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <div className="flex items-start gap-3.5">
              <Star size={20} className="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">Guest favourite</h4>
                <p className="text-xs text-gray-500">One of the highest-rated celebration partners on Parva.</p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <ShieldCheck size={20} className="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">100% Verified Partner</h4>
                <p className="text-xs text-gray-500">Aadhaar, GST & on-site event execution verified.</p>
              </div>
            </div>
          </div>

          {/* About description */}
          <div className="space-y-2 pb-6 border-b border-gray-200">
            <h3 className="font-extrabold text-base text-gray-900 font-display">About this Partner</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {vendor.description || 'Verified premier celebration specialist offering royal decor, gourmet catering and seamless event management.'}
            </p>
          </div>

          {/* Services & Packages List */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <h3 className="font-extrabold text-base text-gray-900 font-display">Select Service Package</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(vendor.services || []).map((svc) => {
                const isSelected = selectedService.name === svc.name;
                return (
                  <div
                    key={svc.name}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary-light/40 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-gray-900">{svc.name}</span>
                        {isSelected && <CheckCircle size={14} className="text-brand-primary" />}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2">{svc.description}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="font-black text-xs text-gray-900">
                        ₹{svc.price.toLocaleString('en-IN')}
                        {isCatering && <span className="text-[10px] text-gray-500 font-normal"> /plate</span>}
                      </span>
                      <span className="text-[10px] font-bold text-brand-primary">
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Add-ons */}
          <div className="space-y-3 pb-6 border-b border-gray-200">
            <h3 className="font-extrabold text-base text-gray-900 font-display">Customizable Add-ons</h3>
            <div className="space-y-2">
              {availableAddons.map((addon) => {
                const isChecked = selectedAddons.some(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'border-brand-primary bg-brand-primary-light/30 shadow-2xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isChecked ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check size={12} />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-900">{addon.name}</h4>
                        <p className="text-[10px] text-gray-500">{addon.desc}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-gray-900 shrink-0">
                      +₹{addon.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sticky Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl sticky top-28 space-y-4">
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-2xl font-black text-gray-900">
                  ₹{selectedService.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {isCatering ? ' / plate' : ' package'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold">
                <Star size={12} className="fill-gray-900 text-gray-900" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Date & Time Slot Box */}
            <div className="border border-gray-300 rounded-2xl overflow-hidden divide-y divide-gray-300">
              <div className="p-3">
                <label className="text-[9px] font-black uppercase text-gray-800 tracking-wider block">Event Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={eventDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer mt-0.5"
                />
              </div>

              {/* Time Slot Selector */}
              <div className="p-3 space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-800 tracking-wider block">Event Time Slot</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['morning', 'evening', 'fullday'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold capitalize transition ${
                        timeSlot === slot
                          ? 'bg-brand-primary text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {isCatering && (
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <label className="text-[9px] font-black uppercase text-gray-800 tracking-wider block">Guests</label>
                    <span className="text-xs font-bold text-gray-900">{guestCount} Guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onGuestCountChange(Math.max(10, guestCount - 25))}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => onGuestCountChange(guestCount + 25)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Availability Indicator */}
            {availabilityState === 'available' && (
              <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                <span>Available for your selected date & time slot!</span>
              </div>
            )}
            {availabilityState === 'unavailable' && (
              <div className="bg-red-50 text-red-800 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-red-200">
                <AlertCircle size={13} className="text-red-600 shrink-0" />
                <span>Vendor is unavailable for this date. Please pick another date.</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={() => {
                const finalServiceItem = isCatering 
                  ? { ...selectedService, price: subtotal, unit: `₹${selectedService.price}/plate × ${guestCount} Guests` }
                  : { ...selectedService, price: subtotal };
                onAddServiceToBundle(finalServiceItem);
                onProceedToCheckout();
              }}
              disabled={availabilityState === 'unavailable'}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition active:scale-95 text-center disabled:opacity-50"
            >
              Reserve & Book Now
            </button>

            <p className="text-[10px] text-gray-400 text-center font-medium">5% Escrow Advance to lock your date</p>

            {/* Transparent Breakdown */}
            <div className="space-y-2 pt-2 text-xs border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Base Package:</span>
                <span className="font-bold text-gray-900">₹{baseServicePrice.toLocaleString('en-IN')}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Selected Add-ons ({selectedAddons.length}):</span>
                  <span className="font-bold text-gray-900">+₹{addonsTotal.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 font-bold pt-1 border-t border-gray-100">
                <span>Subtotal Event Value:</span>
                <span className="text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>5% Escrow Advance Fee:</span>
                <span className="font-bold text-gray-900">₹{bookingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18% on fee):</span>
                <span className="font-bold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Advance Due Now:</span>
                <span className="text-brand-primary text-base">₹{finalAdvanceDue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Remaining at Event:</span>
                <span className="font-bold text-gray-700">₹{balanceDueAtEvent.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Gallery Modal */}
      <PhotoGalleryLightbox
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        vendorName={vendor.name}
      />
    </div>
  );
}
