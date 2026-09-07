import React, { useState, useEffect } from 'react';
import { 
  Star, MapPin, ShieldCheck, Heart, Share2, Calendar as CalendarIcon, Clock, 
  CheckCircle, ArrowLeft, Users, ChevronRight, Phone, MessageSquare, 
  Grid, Check, Sparkles, AlertCircle, Info, HelpCircle
} from 'lucide-react';
import { Vendor, VendorServiceItem } from '../../types';
import AnimatedList from '../reactbits/AnimatedList';
import { PhotoGalleryLightbox } from './PhotoGalleryLightbox';
import { AmenitiesModal } from './AmenitiesModal';
import CalendarRangeSelect, { DateRange } from '../ui/calendar-range-select';
import { GlareHover } from '../ui/glare-hover';

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
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Initial service selection
  const initialServices = (vendor.services && vendor.services.length > 0)
    ? [vendor.services[0]]
    : [{
        id: 's1',
        name: 'Signature Celebration Package',
        price: vendor.basePrice,
        description: 'Complete setup, premium coordination, and guaranteed execution.',
        imageUrl: images[0]
      }];

  const [selectedServices, setSelectedServices] = useState<VendorServiceItem[]>(initialServices);
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; name: string; price: number }[]>([]);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening' | 'fullday'>('evening');
  const [availabilityState, setAvailabilityState] = useState<'checking' | 'available' | 'unavailable' | 'idle'>('idle');
  const [rangeConflicts, setRangeConflicts] = useState<string[]>([]);
  const [showFeeInfo, setShowFeeInfo] = useState(false);

  const isCatering = (vendor.category || '').toLowerCase() === 'catering';

  const toggleService = (svc: VendorServiceItem) => {
    const exists = selectedServices.some(s => (s.id && s.id === svc.id) || s.name === svc.name);
    if (exists) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => (s.id ? s.id !== svc.id : s.name !== svc.name)));
      } else {
        setSelectedServices([]);
      }
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };
  
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
  const baseServicePrice = selectedServices.length > 0
    ? selectedServices.reduce((sum, s) => sum + (isCatering ? s.price * (guestCount || 100) : s.price), 0)
    : (isCatering ? vendor.basePrice * (guestCount || 100) : vendor.basePrice);

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = baseServicePrice + addonsTotal;
  const bookingFee = Math.round(subtotal * 0.05); // 5% advance connection fee
  const gst = Math.round(bookingFee * 0.18); // 18% GST on connection fee
  const finalAdvanceDue = bookingFee + gst;
  const balanceDueAtEvent = subtotal - bookingFee;

  // Live Availability Checker using real vendor busyDates
  const checkAvailabilityLive = () => {
    setAvailabilityState('checking');
    setRangeConflicts([]);

    const isBusy = vendor.busyDates && Array.isArray(vendor.busyDates) && vendor.busyDates.includes(eventDate);
    if (isBusy) {
      setAvailabilityState('unavailable');
    } else {
      setAvailabilityState('available');
    }
  };

  useEffect(() => {
    if (eventDate) {
      checkAvailabilityLive();
    }
  }, [eventDate, timeSlot, vendor.busyDates]);

  // Fallback service placeholder
  const getServiceImage = (svc: any, idx: number) => {
    return svc.imageUrl || svc.image || images[idx % images.length] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 font-sans">
      {/* Top Breadcrumb & Title Bar */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-3 transition cursor-pointer"
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
              className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 transition cursor-pointer"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleWishlist(vendor.id, e)}
              className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 transition cursor-pointer"
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* 4 Supporting Photos */}
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
            {images.slice(1, 5).map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setIsGalleryOpen(true)}
                className="h-full bg-gray-100 cursor-pointer overflow-hidden group relative"
              >
                <img
                  src={img}
                  alt={`${vendor.name} gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-gray-900 border border-gray-200/80 shadow-md hover:bg-white active:scale-95 transition flex items-center gap-2 cursor-pointer"
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
                <h4 className="font-extrabold text-sm text-gray-900">Verified Specialist</h4>
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

          {/* Service Inclusions & Amenities */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 font-display">
                What this service offers
              </h3>
            </div>

            <div className="w-full">
              <AnimatedList
                items={vendor.features || [
                  'Complete Setup & Breakdown Included',
                  'Dedicated On-Site Coordination Supervisor',
                  'Commercial Grade Equipment & Redundancy',
                  'Aadhaar Verified Staff & Insured Service',
                  'Premium Backup Available'
                ]}
                showGradients={true}
                enableArrowNavigation={true}
                displayScrollbar={false}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAmenitiesOpen(true)}
              className="px-6 py-3 border border-gray-900 hover:bg-gray-50 text-gray-900 text-xs font-extrabold rounded-2xl transition cursor-pointer"
            >
              Show all amenities & inclusions
            </button>
          </div>

          {/* Service Packages with Dynamic Images */}
          {vendor.services && vendor.services.length > 0 && (
            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 font-display">
                  Available Service Packages
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {vendor.services.length} packages available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendor.services.map((svc, idx) => {
                  const isSelected = selectedServices.some(s => (s.id && s.id === svc.id) || s.name === svc.name);
                  const svcImg = getServiceImage(svc, idx);

                  return (
                    <div
                      key={svc.id || svc.name || idx}
                      onClick={() => toggleService(svc)}
                      className={`p-4 rounded-3xl border transition cursor-pointer select-none relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-600/30 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 bg-white shadow-2xs'
                      }`}
                    >
                      {/* Package Image Area */}
                      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img
                          src={svcImg}
                          alt={svc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = images[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600';
                          }}
                        />
                        <div className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-rose-600 bg-rose-600 text-white shadow-xs scale-105' 
                            : 'border-gray-300 bg-white/90 text-gray-400 hover:border-gray-400'
                        }`}>
                          {isSelected ? <Check size={14} className="stroke-[3]" /> : <span className="text-xs font-bold text-gray-500">+</span>}
                        </div>
                      </div>

                      {/* Package Title & Details */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">
                            {svc.name}
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                            isSelected ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isSelected ? '✓ Selected' : '+ Select'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-2">
                          {svc.description || 'Complete package inclusion with dedicated execution and verified team.'}
                        </p>
                      </div>

                      {/* Pricing Tag */}
                      <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                        <span className="text-base font-black text-gray-900">
                          ₹{svc.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          {isCatering ? '/ plate' : 'per event'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-on Options */}
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
                        ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
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

          {/* Month-wise Interactive Availability Calendar Section */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 font-display">
                Vendor Availability Calendar
              </h3>
              <span className="text-xs text-gray-500 font-medium">Real-time sync</span>
            </div>

            <CalendarRangeSelect
              selectedDate={eventDate}
              mode="single"
              busyDates={vendor.busyDates || []}
              onSelectDate={(d) => onDateChange(d)}
              onConflictDetected={(conflicts) => {
                setRangeConflicts(conflicts);
              }}
            />
          </div>

          {/* Customer Reviews Section */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-3">
              <Star size={24} className="fill-amber-400 text-amber-400" />
              <h3 className="text-2xl font-black text-gray-900 font-display">
                {(vendor.rating || 4.9).toFixed(1)} · 142 reviews
              </h3>
            </div>

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
                  "Absolutely stellar service! Setup was completed 2 hours ahead of time, and all guests were delighted."
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                    RS
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">Rohan Sharma</h5>
                    <p className="text-[11px] text-gray-400">Kolhapur • 1 month ago</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  "Seamless coordination and transparent pricing. Paying the 5% advance on Parva gave us complete peace of mind."
                </p>
              </div>
            </div>
          </div>

          {/* Where you'll be - Map Section */}
          <div className="pt-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 font-display">
              Where you'll be
            </h3>
            <p className="text-xs font-semibold text-gray-600">
              {vendor.location || 'Maharashtra, India'}
            </p>
            <div className="w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative">
              <iframe
                title="Service Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(vendor.location || 'Maharashtra, India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0"
                style={{ filter: 'grayscale(0.1) contrast(1.1)' }}
              />
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
                <div 
                  onClick={() => setIsCalendarModalOpen(true)}
                  className="p-3 bg-white hover:bg-gray-50 transition cursor-pointer"
                >
                  <label className="block text-[10px] font-black uppercase text-gray-500">Event Date</label>
                  <div className="text-xs font-extrabold text-gray-900 mt-0.5 truncate">
                    {eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                  </div>
                </div>

                <div className="p-3 bg-white">
                  <label className="block text-[10px] font-black uppercase text-gray-500">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
                    className="w-full text-xs font-extrabold text-gray-900 outline-none mt-0.5 bg-transparent cursor-pointer"
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
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onGuestCountChange((guestCount || 100) + 25)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 cursor-pointer"
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
                    <span>Specialist is available on {eventDate}</span>
                  </>
                ) : availabilityState === 'unavailable' ? (
                  <>
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>Date is blocked/booked. Please select another date.</span>
                  </>
                ) : (
                  <span>Checking live schedule...</span>
                )}
              </div>
            )}

            {/* Range Conflicts Warning */}
            {rangeConflicts.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>One or more selected dates are unavailable: {rangeConflicts.join(', ')}</span>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-3 pt-2 text-xs">
              {selectedServices.length > 0 ? (
                selectedServices.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-gray-600 font-medium">
                    <span className="truncate max-w-[180px]">{s.name} {isCatering ? `(₹${s.price} × ${guestCount || 100})` : ''}</span>
                    <span className="font-bold text-gray-900 shrink-0">₹{(isCatering ? s.price * (guestCount || 100) : s.price).toLocaleString('en-IN')}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between text-gray-600 font-medium">
                  <span>Standard Booking</span>
                  <span className="font-bold text-gray-900">₹{(isCatering ? vendor.basePrice * (guestCount || 100) : vendor.basePrice).toLocaleString('en-IN')}</span>
                </div>
              )}

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
                    className="text-gray-400 hover:text-gray-900 cursor-pointer"
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

            {/* Reserve CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedServices.length > 0) {
                  selectedServices.forEach(s => onAddServiceToBundle(s));
                } else {
                  onAddServiceToBundle({
                    id: 'default-pkg',
                    name: 'Signature Celebration Package',
                    price: vendor.basePrice,
                    description: 'Standard celebration package',
                    imageUrl: images[0]
                  });
                }
                onProceedToCheckout();
              }}
              disabled={availabilityState === 'unavailable' || rangeConflicts.length > 0}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg transition active:scale-95 cursor-pointer ${
                availabilityState === 'unavailable' || rangeConflicts.length > 0
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
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
export default AirbnbVendorDetailView;
