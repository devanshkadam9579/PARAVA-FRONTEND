/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Star, ShieldCheck, MapPin, Sparkles, Clock, CalendarCheck, Check, Video, ChevronLeft, ChevronRight, Play } from 'lucide-react';
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
  rankIndex?: number;
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
  userCoords,
  rankIndex
}: VendorCardProps): any {
  const isHorizontal = layout === 'horizontal';
  const images = (vendor.images && vendor.images.length > 0) 
    ? vendor.images 
    : ['https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600'];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Auto-cycle image loop when hovered or periodically
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [images.length]);

  // Geolocation Distance Calculator
  const getDistanceDisplay = () => {
    if (userCoords && vendor.latitude && vendor.longitude) {
      const R = 6371;
      const dLat = ((vendor.latitude - userCoords.lat) * Math.PI) / 180;
      const dLon = ((vendor.longitude - userCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userCoords.lat * Math.PI) / 180) *
          Math.cos((vendor.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return `${(R * c).toFixed(1)} km`;
    }
    if (vendor.distance) {
      return vendor.distance.replace('away', '').trim();
    }
    const pseudoDist = ((vendor.id.charCodeAt(vendor.id.length - 1) % 40) / 10 + 1.2).toFixed(1);
    return `${pseudoDist} km`;
  };

  const trustScore = vendor.trustScore || 97;
  const bookingsCount = vendor.bookingsCount || (vendor.id.charCodeAt(0) * 3) % 250 + 120;
  const responseTime = vendor.responseTime || '< 15 mins';
  const hasVideo = vendor.videos && vendor.videos.length > 0 && vendor.videos[0];
  const rankNumber = (rankIndex !== undefined ? rankIndex + 1 : (Number((vendor as any).regionRank || (vendor as any).rank) || 1));

  return (
    <div className={isHorizontal ? 'w-[280px] shrink-0' : 'w-full'}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(vendor)}
        className={`bg-white border border-gray-200/90 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm relative ${
          isSelectedInPlanner 
            ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-[1.01]' 
            : 'hover:border-gray-300'
        }`}
        id={`vendor-card-${vendor.id}`}
      >
        {/* Cover Image & Overlays */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 group">
          {isPlayingVideo && hasVideo ? (
            <div className="w-full h-full bg-black relative" onClick={(e) => e.stopPropagation()}>
              {vendor.videos![0].includes('youtube') || vendor.videos![0].includes('youtu.be') ? (
                <iframe
                  src={`${vendor.videos![0].replace('watch?v=', 'embed/').replace('shorts/', 'embed/')}?autoplay=1&mute=1&controls=0&loop=1`}
                  className="w-full h-full object-cover"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <video src={vendor.videos![0]} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlayingVideo(false);
                }}
                className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-md"
              >
                Close Video ✕
              </button>
            </div>
          ) : (
            <img
              src={images[activeImgIdx]}
              alt={vendor.name}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600';
              }}
            />
          )}

          {/* Rank Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-lg border border-amber-300/30 flex items-center gap-1 shadow-md">
            <span>🏆</span>
            <span>#{rankNumber} in {vendor.location || 'City'}</span>
          </div>

          {/* Video Preview Button Badge */}
          {hasVideo && !isPlayingVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlayingVideo(true);
              }}
              className="absolute bottom-2.5 left-2.5 z-10 bg-black/75 hover:bg-black text-white text-[9px] font-black px-2 py-1 rounded-md border border-white/20 flex items-center gap-1 shadow-md transition active:scale-95"
            >
              <Play size={10} className="fill-white" />
              <span>10s Reel</span>
            </button>
          )}

          {/* Image Dots Indicator */}
          {images.length > 1 && !isPlayingVideo && (
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeImgIdx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => onToggleWishlist(vendor.id, e)}
            className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-gray-700 hover:text-brand-primary active:scale-90 transition-all shadow-sm border border-white/40"
            title="Save to wishlist"
          >
            <Heart size={15} className={isWishlisted ? 'fill-brand-primary text-brand-primary' : ''} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-brand-primary tracking-wider uppercase bg-brand-primary/10 px-2 py-0.5 rounded-md">
                {vendor.category}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 text-xs font-black">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{vendor.rating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400 font-normal">({vendor.reviewCount})</span>
              </div>
            </div>

            <h3 className="font-extrabold text-sm text-gray-900 leading-snug line-clamp-1">
              {vendor.name}
            </h3>

            <p className="text-[11px] text-gray-500 line-clamp-1 font-medium">
              {vendor.tagline || vendor.description}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase">
                {vendor.category === 'Catering' ? 'Per Plate Rate' : 'Starting From'}
              </span>
              <span className="font-black text-gray-900 text-sm">
                ₹{vendor.basePrice.toLocaleString('en-IN')}
                {vendor.category === 'Catering' && <span className="text-[10px] text-gray-500 font-medium">/plate</span>}
              </span>
            </div>

            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/60 flex items-center gap-1">
              <MapPin size={10} className="text-gray-400" />
              <span>{getDistanceDisplay()}</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
