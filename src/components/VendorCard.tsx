/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Star, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Vendor } from '../types';

interface VendorCardProps {
  key?: any;
  vendor: Vendor;
  onSelect: (vendor: Vendor) => void;
  isWishlisted: boolean;
  onToggleWishlist: (vendorId: string, e: any) => void;
  layout?: 'grid' | 'horizontal';
  planningDate?: string;
  planningGuestSize?: number;
  isAvailable?: boolean;
  isSelectedInPlanner?: boolean;
  onChooseForPlanner?: (vendor: Vendor, e: any) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export default function VendorCard({
  vendor,
  onSelect,
  isWishlisted,
  onToggleWishlist,
  layout = 'grid',
  planningDate,
  planningGuestSize,
  isAvailable = true,
  isSelectedInPlanner = false,
  onChooseForPlanner,
  userCoords
}: VendorCardProps): any {
  // Simple layout variables
  const isHorizontal = layout === 'horizontal';

  // Geolocation-based Haversine Distance helper
  const getDistanceDisplay = () => {
    if (userCoords && vendor.latitude && vendor.longitude) {
      const R = 6371; // Earth radius in km
      const dLat = ((vendor.latitude - userCoords.lat) * Math.PI) / 180;
      const dLon = ((vendor.longitude - userCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userCoords.lat * Math.PI) / 180) *
          Math.cos((vendor.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceVal = R * c;
      return `${distanceVal.toFixed(1)} km`;
    }
    return vendor.distance || '1.5 km';
  };

  // Capacity calculations for Banquet Halls
  const maxCapacity = vendor.id === 'v1' ? 1200 : vendor.id === 'v7' ? 450 : 1000;
  const isOverCapacity = vendor.category === 'Banquet Hall' && (planningGuestSize || 0) > maxCapacity;

  // Catering dynamic total
  const cateringTotal = vendor.category === 'Catering' && planningGuestSize
    ? vendor.basePrice * planningGuestSize
    : null;

  return (
    <div className={isHorizontal ? 'w-[280px] shrink-0' : 'w-full'}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(vendor)}
        className={`bg-white/40 backdrop-blur-xl border border-white/60 overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 flex flex-col h-full rounded-[32px] shadow-xl shadow-brand-primary/5 ${
          isSelectedInPlanner 
            ? 'border-brand-success ring-4 ring-brand-success/20 scale-[1.01]' 
            : 'border-white/60'
        }`}
        id={`vendor-card-${vendor.id}`}
      >
        {/* Cover Image & Badges */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <img
            src={(vendor.images && vendor.images.length > 0 && vendor.images[0]) ? vendor.images[0] : 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600'}
            alt={vendor.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600';
            }}
          />

          {/* Wishlist Button */}
          <button
            onClick={(e) => onToggleWishlist(vendor.id, e)}
            className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-white/60 backdrop-blur-sm text-brand-text hover:text-brand-primary active:scale-90 transition shadow-sm border border-white/20"
            title="Add to wishlist"
            id={`wishlist-btn-${vendor.id}`}
          >
            <Heart
              size={16}
              className={`transition-colors ${isWishlisted ? 'fill-brand-primary text-brand-primary' : 'text-gray-400'}`}
            />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {vendor.verified && (
              <div className="flex items-center gap-1 bg-brand-primary-dark/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">
                <ShieldCheck size={12} className="text-white" />
                <span>VERIFIED</span>
              </div>
            )}
            <div className="bg-white/95 text-brand-text text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Star size={11} className="text-brand-warning fill-brand-warning" />
              <span>{vendor.rating}</span>
            </div>
          </div>

          {/* Category Pill top left */}
          <span className="absolute top-3 left-3 text-[10px] font-bold text-white uppercase bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg tracking-wider">
            {vendor.category}
          </span>

          {/* Plan Match Overlay indicator if planning parameters are active */}
          {planningDate && (
            <div className={`absolute top-12 left-3 text-[9px] font-extrabold px-2 py-1 rounded-md shadow-md flex items-center gap-1 ${
              isAvailable 
                ? 'bg-brand-success text-white' 
                : 'bg-brand-danger text-white'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-white'}`} />
              <span>{isAvailable ? 'AVAILABLE ON DATE' : 'FULLY BOOKED'}</span>
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            {/* Header row */}
            <div className="flex justify-between items-start gap-1 mb-1">
              <h4 className="font-semibold text-brand-text text-sm line-clamp-1 leading-tight flex-1">
                {vendor.name}
              </h4>
              <div className="flex items-center gap-1 text-brand-success font-semibold text-[10px] bg-brand-success/10 px-1.5 py-0.5 rounded shrink-0">
                <Sparkles size={10} />
                <span>{vendor.trustScore}% Score</span>
              </div>
            </div>

            <p className="text-xs text-brand-text-secondary line-clamp-1 mb-2">
              {vendor.tagline}
            </p>

            {vendor.category === 'Event Planner' && (vendor.founderName || vendor.experience) && (
              <div className="flex gap-2 text-[10px] mb-2 bg-indigo-50/50 text-indigo-700 font-medium px-2 py-1 rounded-lg border border-indigo-100/60 w-fit">
                {vendor.founderName && <span>Founder: <strong>{vendor.founderName}</strong></span>}
                {vendor.founderName && vendor.experience && <span className="text-indigo-300">|</span>}
                {vendor.experience && <span>Exp: <strong>{vendor.experience}</strong></span>}
              </div>
            )}

            {/* Location & Response Time */}
            <div className="flex items-center justify-between text-[11px] text-brand-text-secondary mb-2.5 border-b border-gray-50 pb-2">
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-brand-primary" />
                <span>{getDistanceDisplay()}</span>
              </div>
              <div className="flex items-center gap-1 text-brand-primary font-medium">
                <Sparkles size={11} className="animate-pulse" />
                <span>⚡ {vendor.responseTime} response</span>
              </div>
            </div>

            {/* Live Interactive Matcher Feedback row */}
            {planningDate && (
              <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-xl mb-3 space-y-1">
                {vendor.category === 'Banquet Hall' && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-text-secondary font-medium">Capacity Match:</span>
                    {isOverCapacity ? (
                      <span className="text-brand-danger font-bold flex items-center gap-0.5">
                        ⚠️ Over Capacity (Max {maxCapacity})
                      </span>
                    ) : (
                      <span className="text-brand-success-dark font-semibold">
                        ✓ Fits {planningGuestSize} Guests (Max {maxCapacity})
                      </span>
                    )}
                  </div>
                )}

                {vendor.category === 'Catering' && cateringTotal && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-text-secondary font-medium">Dynamic Total ({planningGuestSize} guests):</span>
                    <span className="text-brand-primary-dark font-extrabold text-xs">
                      ₹{cateringTotal >= 100000 
                        ? `${(cateringTotal / 100000).toFixed(2)} Lakh` 
                        : cateringTotal.toLocaleString('en-IN')
                      }
                    </span>
                  </div>
                )}

                {vendor.category !== 'Banquet Hall' && vendor.category !== 'Catering' && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-text-secondary font-medium">Availability Match:</span>
                    <span className={isAvailable ? "text-brand-success-dark font-semibold" : "text-brand-danger font-semibold"}>
                      {isAvailable ? "✓ Instant Match Active" : "✗ Booked on Date"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing row */}
          <div className="flex items-baseline justify-between mt-auto">
            <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
              {vendor.category === 'Catering' ? 'Meal Starts At' : vendor.category === 'Event Planner' ? 'Consultation Base' : 'Venue Base Price'}
            </p>
            <div className="text-right">
              <span className="font-bold text-lg text-brand-primary">
                ₹{vendor.basePrice >= 100000 
                  ? `${(vendor.basePrice / 100000).toFixed(1)}L` 
                  : vendor.basePrice.toLocaleString('en-IN')
                }
              </span>
              <span className="text-[10px] text-gray-500 font-medium ml-0.5">
                /{vendor.category === 'Catering' ? 'plate' : vendor.category === 'Event Planner' ? 'event' : 'day'}
              </span>
            </div>
          </div>

          {/* Interactive planner drawer action */}
          {planningDate && onChooseForPlanner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChooseForPlanner(vendor, e);
              }}
              disabled={!isAvailable}
              className={`w-full text-xs font-bold py-2.5 px-3 mt-3.5 rounded-xl transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                isSelectedInPlanner
                  ? 'bg-brand-success/10 border-brand-success text-brand-success-dark font-extrabold'
                  : !isAvailable
                  ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-brand-primary/5 border-brand-primary/10 hover:bg-brand-primary hover:text-white hover:border-brand-primary text-brand-primary hover:shadow-md'
              }`}
              id={`planner-slot-select-${vendor.id}`}
            >
              {isSelectedInPlanner ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse shrink-0" />
                  <span>Selected in Plan</span>
                </>
              ) : (
                <span>
                  {!isAvailable 
                    ? 'Unavailable on Selected Date' 
                    : `+ Choose as ${vendor.category === 'Banquet Hall' ? 'Hall' : vendor.category === 'Catering' ? 'Caterer' : vendor.category === 'DJ' ? 'DJ' : 'Decorator'}`
                  }
                </span>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
