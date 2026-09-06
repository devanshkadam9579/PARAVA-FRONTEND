import React, { useState, useEffect } from 'react';
import { 
  Star, MapPin, ShieldCheck, Heart, Share2, Calendar, Clock, 
  CheckCircle, ArrowLeft, Users, ChevronRight, Phone, MessageSquare, 
  Grid, Check, Sparkles, AlertCircle, Info, HelpCircle
} from 'lucide-react';
import { Vendor, VendorServiceItem } from '../../types';
import { PhotoGalleryLightbox } from './PhotoGalleryLightbox';
import { AmenitiesModal } from './AmenitiesModal';

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
    : [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1522413416052-4065f8a8de35?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=800'
      ];

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VendorServiceItem>(
    vendor.services?.[0] || {
      id: 's1',
      name: 'Signature Celebration Package',
      price: vendor.basePrice,
      description: 'Complete setup, premium coordination, and guaranteed execution.'
    }
  );

  const [selectedAddons, setSelectedAddons] = useState<{ id: string; name: string; price: number }[]>([]);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening' | 'fullday'>('evening');
  const [availabilityState, setAvailabilityState] = useState<'checking' | 'available' | 'unavailable' | 'idle'>('idle');
  const [showFeeInfo, setShowFeeInfo] = useState(false);

  const isCatering = (vendor.category || '').toLowerCase() === 'catering';
  
  // Available Add-ons
  const availableAddons = [
    { id: 'addon_1', name: 'Premium Floral Stage Upgrade', price: 5000, desc: 'Exotic orchids & carnations with custom mood lighting' },
    { id: 'addon_2', name: 'Fairy Lighting & Chandelier Set', price: 3000, desc: 'Warm ambient LED illuminations and ceiling drapes' },
    { id: 'addon_3', name: 'Gourmet Dessert & Mocktail Counter', price: 4500, desc: 'Live signature mocktails & artisanal sweets station' }
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
  const bookingFee = Math.round(subtotal * 0.05); // 5% advance connection fee
  const gst = Math.round(bookingFee * 0.18); // 18% GST on connection fee
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
    }, 300);
  };

  useEffect(() => {
    if (eventDate) {
      checkAvailabilityLive();
    }
  }, [eventDate, timeSlot]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-6 space-y-8">
      {/* Top Breadcrumb & Title Bar */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-3 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to marketplace</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 font-display tracking-tight">
              {vendor.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600 mt-2 font-medium">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-gray-900">{(vendor.rating || 4.9).toFixed(1)}</span>
                <span className="text-gray-400">·</span>
                <span className="underline font-bold text-gray-900">142 reviews</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 font-bold text-gray-900">
                <ShieldCheck size={15} className="text-rose-600" />
                <span>Verified Specialist</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" />
                <span className="underline font-bold text-gray-900">{vendor.location || 'Maharashtra'}, India</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: vendor.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Listing link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 transition"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleWishlist(vendor.id, e)}
              className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 transition"
            >
              <Heart size={15} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Photo Bento Grid Hero */}
      <div className="relative rounded-3xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[380px] sm:h-[480px]">
          {/* Main Large Photo */}
          <div 
            onClick={() => setIsGalleryOpen(true)}
            className="md:col-span-2 h-full bg-gray-100 cursor-pointer overflow-hidden group relative"
          >
            <img
              src={images[0]}
              alt={vendor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>

          {/* 2 Middle Supporting Photos */}
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div 
              onClick={() => setIsGalleryOpen(true)}
              className="h-1/2 bg-gray-100 cursor-pointer overflow-hidden group"
            >
              <img
                src={images[1] || images[0]}
                alt={`${vendor.name} 2`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div 
              onClick={() => setIsGalleryOpen(true)}
              className="h-1/2 bg-gray-100 cursor-pointer overflow-hidden group"
            >
              <img
                src={images[2] || images[0]}
                alt={`${vendor.name} 3`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* 2 Right Supporting Photos */}
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div 
              onClick={() => setIsGalleryOpen(true)}
              className="h-1/2 bg-gray-100 cursor-pointer overflow-hidden group"
            >
              <img
                src={images[3] || images[0]}
                alt={`${vendor.name} 4`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div 
              onClick={() => setIsGalleryOpen(true)}
              className="h-1/2 bg-gray-100 cursor-pointer overflow-hidden group"
            >
              <img
                src={images[4] || images[0]}
                alt={`${vendor.name} 5`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* View All Photos Badge */}
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-gray-900 border border-gray-200/80 shadow-md hover:bg-white active:scale-95 transition flex items-center gap-2"
        >
          <Grid size={15} />
          <span>Show all {images.length} photos</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        {/* Left Column (60% on Desktop) */}
        <div className="lg:col-span-7 space-y-10 divide-y divide-gray-200">
          {/* Host & Specialist Info */}
          <div className="flex items-center justify-between pb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900 font-display">
                Hosted by {vendor.founderName || vendor.name}
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {vendor.experience || '8+ years'} celebration experience · &lt; 15 mins response time
              </p>
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-rose-50 border border-gray-200 shadow-xs shrink-0">
              <img
                src={vendor.founderImage || images[0]}
                alt={vendor.founderName || vendor.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Key Highlights */}
          <div className="pt-8 space-y-5">
            <div className="flex items-start gap-4">
              <ShieldCheck size={24} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Guest Favourite</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  One of the most loved celebration specialists on Parva based on ratings and reliability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Sparkles size={24} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Escrow Protected Advance</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lock your date with only a 5% advance fee. Balance payable directly to vendor on event day.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-8 space-y-4">
            <h3 className="text-xl font-black text-gray-900 font-display">
              About this service
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
              {vendor.description || `${vendor.name} delivers exceptional celebration services in ${vendor.location || 'Maharashtra'}. With bespoke styling, verified equipment, and dedicated on-site coordination.`}
            </p>
          </div>

          {/* What this place/service offers */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 font-display">
                What this service offers
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(vendor.features || [
                'Complete Setup & Breakdown Included',
                'Dedicated On-Site Coordination Supervisor',
                'Commercial Grade Equipment & Redundancy',
                'Aadhaar Verified Staff & Insured Service'
              ]).slice(0, 6).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Check size={13} className="stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{feat}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAmenitiesOpen(true)}
              className="px-6 py-3 border border-gray-900 hover:bg-gray-50 text-gray-900 text-xs font-extrabold rounded-2xl transition"
            >
              Show all amenities & inclusions
            </button>
          </div>

          {/* Available Packages */}
          {vendor.services && vendor.services.length > 0 && (
            <div className="pt-8 space-y-6">
              <h3 className="text-xl font-black text-gray-900 font-display">
                Service Packages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendor.services.map((svc) => {
                  const isSelected = selectedService.id === svc.id || selectedService.name === svc.name;
                  return (
                    <div
                      key={svc.id || svc.name}
                      onClick={() => setSelectedService(svc)}
                      className={`p-5 rounded-3xl border transition cursor-pointer select-none relative space-y-3 ${
                        isSelected
                          ? 'border-gray-900 bg-rose-50/30 ring-2 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-extrabold text-sm text-gray-900">{svc.name}</h4>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        {svc.description || 'Complete package inclusion with professional supervision'}
                      </p>
                      <div className="pt-2 flex items-baseline gap-1">
                        <span className="text-base font-black text-gray-900">
                          ₹{svc.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500 font-normal">
                          {isCatering ? '/ plate' : 'package rate'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-on Services */}
          <div className="pt-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 font-display">
              Custom Add-on Options
            </h3>
            <div className="space-y-3">
              {availableAddons.map((addon) => {
                const isChecked = selectedAddons.some(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900">{addon.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{addon.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-gray-900">
                        +₹{addon.price.toLocaleString('en-IN')}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-rose-600 rounded-md border-gray-300 focus:ring-rose-500 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-3">
              <Star size={24} className="fill-amber-400 text-amber-400" />
              <h3 className="text-2xl font-black text-gray-900 font-display">
                {(vendor.rating || 4.9).toFixed(1)} · 142 reviews
              </h3>
            </div>

            {/* Review Insight Mention Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3.5 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
                Hospitality 112
              </span>
              <span className="px-3.5 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
                Quality Setup 89
              </span>
              <span className="px-3.5 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
                Punctuality 74
              </span>
              <span className="px-3.5 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
                Value for Money 65
              </span>
            </div>

            {/* Customer Review Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                    AK
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">Ananya Kulkarni</h5>
                    <p className="text-[11px] text-gray-400">Pune · 3 weeks ago</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  "Absolutely stellar decoration for our engagement! The florals were fresh, setup was completed 2 hours ahead of time, and guests couldn't stop taking pictures."
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                    RS
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">Rohan Sharma</h5>
                    <p className="text-[11px] text-gray-400">Kolhapur · 1 month ago</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  "Seamless coordination and transparent pricing. Paying the 5% advance on Parva gave us total peace of mind for the wedding."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card (40% on Desktop) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xl space-y-6">
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500 font-medium ml-1">
                  {isCatering ? `(${guestCount || 100} guests)` : 'total event value'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{(vendor.rating || 4.9).toFixed(1)}</span>
              </div>
            </div>

            {/* Inputs Box */}
            <div className="border border-gray-300 rounded-2xl overflow-hidden divide-y divide-gray-300">
              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                <div className="p-3 bg-white">
                  <label className="block text-[10px] font-black uppercase text-gray-500">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full text-xs font-extrabold text-gray-900 outline-none mt-0.5 bg-transparent"
                  />
                </div>
                <div className="p-3 bg-white">
                  <label className="block text-[10px] font-black uppercase text-gray-500">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
                    className="w-full text-xs font-extrabold text-gray-900 outline-none mt-0.5 bg-transparent"
                  >
                    <option value="evening">Evening (5 PM - 11 PM)</option>
                    <option value="morning">Morning (9 AM - 2 PM)</option>
                    <option value="fullday">Full Day (9 AM - 11 PM)</option>
                  </select>
                </div>
              </div>

              {/* Guest Count */}
              <div className="p-3 bg-white flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500">Attendees / Guests</label>
                  <span className="text-xs font-extrabold text-gray-900">{guestCount || 100} Attendees</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onGuestCountChange(Math.max(10, (guestCount || 100) - 25))}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onGuestCountChange((guestCount || 100) + 25)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Live Availability Status */}
            {eventDate && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                availabilityState === 'available'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : availabilityState === 'unavailable'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}>
                {availabilityState === 'available' ? (
                  <>
                    <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                    <span>Specialist is available for {timeSlot} slot</span>
                  </>
                ) : availabilityState === 'unavailable' ? (
                  <>
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>Slot is fully booked. Please select another date.</span>
                  </>
                ) : (
                  <span>Checking live schedule...</span>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between text-gray-600 font-medium">
                <span>{selectedService.name} {isCatering ? `(₹${selectedService.price} × ${guestCount || 100})` : ''}</span>
                <span className="font-bold text-gray-900">₹{baseServicePrice.toLocaleString('en-IN')}</span>
              </div>

              {selectedAddons.length > 0 && (
                <div className="flex items-center justify-between text-gray-600 font-medium">
                  <span>Custom Add-ons ({selectedAddons.length})</span>
                  <span className="font-bold text-gray-900">+₹{addonsTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-gray-600 font-medium">
                <div className="flex items-center gap-1">
                  <span>5% Date Lock Advance Fee</span>
                  <button 
                    type="button" 
                    onClick={() => setShowFeeInfo(!showFeeInfo)}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <Info size={12} />
                  </button>
                </div>
                <span className="font-bold text-gray-900">₹{bookingFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between text-gray-600 font-medium">
                <span>GST (18% on advance fee)</span>
                <span className="font-bold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
              </div>

              {/* Fee explanation box */}
              {showFeeInfo && (
                <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-600 leading-relaxed border border-gray-200">
                  You only pay ₹{finalAdvanceDue.toLocaleString('en-IN')} now to lock your date under Parva Escrow Guarantee. The remaining ₹{balanceDueAtEvent.toLocaleString('en-IN')} is paid directly to the vendor on event execution.
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex items-baseline justify-between">
                <div>
                  <p className="font-black text-sm text-gray-900">Advance Payable Now</p>
                  <p className="text-[11px] text-gray-400">Balance ₹{balanceDueAtEvent.toLocaleString('en-IN')} due at event</p>
                </div>
                <span className="font-black text-xl text-rose-600 font-display">
                  ₹{finalAdvanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Reserve CTA */}
            <button
              type="button"
              onClick={() => {
                onAddServiceToBundle(selectedService);
                onProceedToCheckout();
              }}
              disabled={availabilityState === 'unavailable'}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg transition active:scale-95 ${
                availabilityState === 'unavailable'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-rose-500/25'
              }`}
            >
              Reserve with 5% Advance
            </button>

            <p className="text-center text-[11px] text-gray-400 font-medium">
              You won't be charged full amount now · 100% Refundable per policy
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox & Amenities Modals */}
      <PhotoGalleryLightbox
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        vendorName={vendor.name}
      />

      <AmenitiesModal
        isOpen={isAmenitiesOpen}
        onClose={() => setIsAmenitiesOpen(false)}
        vendorName={vendor.name}
        category={vendor.category}
        features={vendor.features}
      />
    </div>
  );
}
