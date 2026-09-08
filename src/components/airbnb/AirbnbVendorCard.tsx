import React, { useState } from 'react';
import { Heart, Star, ShieldCheck, MapPin } from 'lucide-react';
import { Vendor } from '../../types';
import { GlareHover } from '../ui/glare-hover';

export interface AirbnbVendorCardProps {
  vendor: Vendor;
  onSelect: (vendor: Vendor) => void;
  isWishlisted: boolean;
  onToggleWishlist: (vendorId: string, e: any) => void;
  className?: string;
}

export function AirbnbVendorCard({
  vendor,
  onSelect,
  isWishlisted,
  onToggleWishlist,
  className = ''
}: AirbnbVendorCardProps) {
  const images = (vendor.images && vendor.images.length > 0)
    ? vendor.images
    : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'];

  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const reviewCount = vendor.reviewCount || vendor.reviews?.length || 48;
  const isCatering = (vendor.category || '').toLowerCase() === 'catering';

  // Calculate lowest service price provided
  const servicePrices = (vendor.services || [])
    .map((s: any) => (typeof s.price === 'number' ? s.price : Number(s.price || 0)))
    .filter((p: number) => p > 0);

  const lowestPrice = servicePrices.length > 0 
    ? Math.min(...servicePrices) 
    : (vendor.basePrice || vendor.minBudget || 0);

  const lowestService = (vendor.services || []).find((s: any) => Number(s.price) === lowestPrice);

  return (
    <div 
      onClick={() => onSelect(vendor)}
      className={`group flex flex-col space-y-3 cursor-pointer select-none snap-start shrink-0 w-[270px] sm:w-[285px] md:w-[295px] ${className}`}
    >
      {/* 4:3 Strict Aspect Ratio Photo Container with Subtle Glare */}
      <GlareHover borderRadius="1.25rem" className="w-full">
        <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-2xs border border-gray-200/60">
          <img
            src={images[currentImgIndex]}
            alt={vendor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Guest favourite pill badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-gray-900 border border-gray-200/60 shadow-xs flex items-center gap-1">
            <ShieldCheck size={12} className="text-rose-600" />
            <span>Verified Specialist</span>
          </div>

          {/* Wishlist Heart */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(vendor.id, e);
            }}
            className="absolute top-3 right-3 p-2 rounded-full text-white hover:scale-110 active:scale-90 transition bg-black/20 backdrop-blur-xs cursor-pointer"
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist button"
          >
            <Heart 
              size={16} 
              className={isWishlisted ? 'fill-rose-500 text-rose-500' : 'stroke-[2.5] text-white drop-shadow-md'} 
            />
          </button>

          {/* Carousel Dots on Hover */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </GlareHover>

      {/* Details Info with Consistent Heights & Clamping */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-start justify-between text-xs gap-2 min-h-[22px]">
          <h3 className="font-extrabold text-sm text-gray-900 truncate leading-snug group-hover:text-rose-600 transition-colors">
            {vendor.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-black text-xs text-gray-900">
              {(vendor.rating || 4.9).toFixed(1)}
            </span>
            <span className="text-gray-400 text-[11px]">({reviewCount})</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 truncate font-medium flex items-center gap-1">
          <span>{vendor.category}</span>
          <span>·</span>
          <span>{vendor.location || 'Maharashtra'}</span>
        </p>

        <p className="text-xs font-black text-gray-900 pt-0.5">
          ₹{lowestPrice.toLocaleString('en-IN')}{' '}
          <span className="text-gray-500 font-normal">
            {lowestService?.unit 
              ? (lowestService.unit.startsWith('/') ? lowestService.unit : `per ${lowestService.unit}`) 
              : (isCatering ? 'per plate' : 'onwards')}
          </span>
        </p>
      </div>
    </div>
  );
}
export default AirbnbVendorCard;
