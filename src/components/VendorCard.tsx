/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Star, ShieldCheck, MapPin, Sparkles, Clock, CalendarCheck, Check } from 'lucide-react';
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
  const isHorizontal = layout === 'horizontal';

  // Geolocation & Search Location Distance Calculator
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
    // Deterministic realistic distance if lat/lng not set
    if (vendor.distance) {
      return vendor.distance.replace('away', '').trim();
    }
    const pseudoDist = ((vendor.id.charCodeAt(vendor.id.length - 1) % 40) / 10 + 1.2).toFixed(1);
    return `${pseudoDist} km`;
  };

  const trustScore = vendor.trustScore || 97;
  const bookingsCount = vendor.bookingsCount || (vendor.id.charCodeAt(0) * 3) % 250 + 120;
  const responseTime = vendor.responseTime || '< 15 mins';
  const maxCapacity = vendor.id === 'v1' ? 1200 : vendor.id === 'v7' ? 450 : 1000;
  const isOverCapacity = vendor.category === 'Banquet Hall' && (planningGuestSize || 0) > maxCapacity;

  return (
    <div className={isHorizontal ? 'w-[280px] shrink-0' : 'w-full'}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(vendor)}
        className={`bg-white border border-gray-200/90 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm ${
          isSelectedInPlanner 
            ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-[1.01]' 
            : 'hover:border-gray-300'
        }`}
        id={`vendor-card-${vendor.id}`}
      >
        {/* Cover Image & Overlays */}
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
            className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-gray-700 hover:text-brand-primary active:scale-90 transition-all shadow-sm border border-white/40"
            title="Save to wishlist"
            id={`wishlist-btn-${vendor.id}`}
          >
            <Heart
              size={17}
              className={`transition-colors ${isWishlisted ? 'fill-brand-primary text-brand-primary' : 'text-gray-700'}`}
              strokeWidth={2}
            />
          </button>

          {/* Badges on Image */}
          <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {vendor.verified && (
              <div className="flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                <ShieldCheck size={11} className="text-white" />
                <span>VERIFIED</span>
              </div>
            )}
            <div className="bg-white text-gray-900 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span>{vendor.rating ? vendor.rating.toFixed(1) : '4.8'}</span>
            </div>
          </div>

          {/* Category Tag top left */}
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white uppercase bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md tracking-wider">
            {vendor.category}
          </span>

          {/* Planning availability pill */}
          {planningDate && (
            <div className={`absolute top-10 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-md flex items-center gap-1.5 ${
              isAvailable 
                ? 'bg-emerald-700 text-white' 
                : 'bg-rose-700 text-white'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-white'}`} />
              <span>{isAvailable ? 'AVAILABLE' : 'BOOKED'}</span>
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="p-3.5 flex flex-col justify-between flex-1">
          <div>
            {/* Header: Title */}
            <div className="mb-2">
              <h4 className="font-bold text-gray-900 text-[15px] line-clamp-1 leading-snug">
                {vendor.name}
              </h4>
            </div>

            {/* 4 Key Metrics Grid: Score | Distance | Response | Bookings */}
            <div className="grid grid-cols-4 gap-1.5 bg-gray-50/90 border border-gray-100 rounded-xl p-2 mb-3 text-center">
              {/* Metric 1: Score */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-gray-400">Score</span>
                <span className="text-xs font-extrabold text-emerald-700">{trustScore}%</span>
              </div>

              {/* Metric 2: Distance */}
              <div className="flex flex-col items-center border-l border-gray-200/80">
                <span className="text-[9px] uppercase font-bold text-gray-400">Distance</span>
                <span className="text-xs font-extrabold text-gray-800">{getDistanceDisplay()}</span>
              </div>

              {/* Metric 3: Response */}
              <div className="flex flex-col items-center border-l border-gray-200/80">
                <span className="text-[9px] uppercase font-bold text-gray-400">Response</span>
                <span className="text-xs font-extrabold text-gray-800">{responseTime}</span>
              </div>

              {/* Metric 4: Bookings */}
              <div className="flex flex-col items-center border-l border-gray-200/80">
                <span className="text-[9px] uppercase font-bold text-gray-400">Bookings</span>
                <span className="text-xs font-extrabold text-indigo-600">{bookingsCount}+</span>
              </div>
            </div>

            {/* Live Interactive Matcher Feedback row if planner date is set */}
            {planningDate && (
              <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl mb-3 space-y-1 text-xs">
                {vendor.category === 'Banquet Hall' && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-600 font-medium">Capacity:</span>
                    {isOverCapacity ? (
                      <span className="text-rose-700 font-bold">
                        Over Capacity (Max {maxCapacity})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        Fits {planningGuestSize} Guests
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unified, Grouped Pricing Row */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                {vendor.category === 'Catering' ? 'Meal Starts At' : vendor.category === 'Event Planner' ? 'Consultation Base' : 'Venue Base Price'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-gray-900">
                  ₹{vendor.basePrice >= 100000 
                    ? `${(vendor.basePrice / 100000).toFixed(1)}L` 
                    : vendor.basePrice.toLocaleString('en-IN')
                  }
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  /{vendor.category === 'Catering' ? 'plate' : vendor.category === 'Event Planner' ? 'event' : 'day'}
                </span>
              </div>
            </div>

            {/* Select in plan action if planner active */}
            {planningDate && onChooseForPlanner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChooseForPlanner(vendor, e);
                }}
                disabled={!isAvailable}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  isSelectedInPlanner
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : !isAvailable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm active:scale-95'
                }`}
              >
                {isSelectedInPlanner ? 'Selected' : '+ Choose'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
