/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Star, ShieldCheck, MapPin, Sparkles, Clock, Check } from 'lucide-react';
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
    return vendor.distance ? vendor.distance.replace('away', '').trim() : '1.5 km';
  };

  const maxCapacity = vendor.id === 'v1' ? 1200 : vendor.id === 'v7' ? 450 : 1000;
  const isOverCapacity = vendor.category === 'Banquet Hall' && (planningGuestSize || 0) > maxCapacity;

  return (
    <div className={isHorizontal ? 'w-[280px] shrink-0' : 'w-full'}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(vendor)}
        className={`bg-white border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm ${
          isSelectedInPlanner 
            ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-[1.01]' 
            : 'hover:border-gray-200'
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

          {/* Badges on Image (High Contrast) */}
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
              <span>{isAvailable ? 'AVAILABLE ON DATE' : 'FULLY BOOKED'}</span>
            </div>
          )}
        </div>

        {/* Details Area with Generous Whitespace */}
        <div className="p-3.5 flex flex-col justify-between flex-1">
          <div>
            {/* Header: Title & High-Contrast Trust Score */}
            <div className="flex justify-between items-start gap-2 mb-2">
              <h4 className="font-bold text-gray-900 text-[15px] line-clamp-1 leading-snug flex-1">
                {vendor.name}
              </h4>
              {vendor.trustScore && (
                <div className="flex items-center gap-1 bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0 shadow-xs">
                  <Sparkles size={10} className="text-emerald-200" />
                  <span>{vendor.trustScore}% Score</span>
                </div>
              )}
            </div>

            {/* Critical Metadata: High-Contrast & Larger Legible Typography */}
            <div className="flex items-center gap-3 text-xs text-gray-700 font-medium mb-3 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1">
                <MapPin size={13} className="text-brand-primary shrink-0" />
                <span className="font-semibold text-gray-800">{getDistanceDisplay()}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-gray-700">
                <Clock size={13} className="text-gray-500 shrink-0" />
                <span>{vendor.responseTime || '< 15 mins'} response</span>
              </div>
            </div>

            {/* Live Interactive Matcher Feedback row if planner date is set */}
            {planningDate && (
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl mb-3 space-y-1 text-xs">
                {vendor.category === 'Banquet Hall' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Capacity:</span>
                    {isOverCapacity ? (
                      <span className="text-rose-700 font-bold">
                        Over Capacity (Max {maxCapacity})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        Fits {planningGuestSize} Guests (Max {maxCapacity})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unified, Grouped Pricing Row (No disconnect) */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
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
