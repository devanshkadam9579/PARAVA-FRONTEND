import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { Vendor } from '../../types';

export interface AirbnbVendorCardProps {
  vendor: Vendor;
  onSelect: (vendor: Vendor) => void;
  isWishlisted: boolean;
  onToggleWishlist: (vendorId: string, e: any) => void;
}

export function AirbnbVendorCard({
  vendor,
  onSelect,
  isWishlisted,
  onToggleWishlist
}: AirbnbVendorCardProps) {
  const images = (vendor.images && vendor.images.length > 0)
    ? vendor.images
    : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'];

  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  return (
    <div 
      onClick={() => onSelect(vendor)}
      className="group flex flex-col space-y-2.5 cursor-pointer select-none"
    >
      {/* Photo Container */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 shadow-xs">
        <img
          src={images[currentImgIndex]}
          alt={vendor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Guest favourite pill badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-gray-900 border border-gray-200/60 shadow-xs">
          Guest favourite
        </div>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={(e) => onToggleWishlist(vendor.id, e)}
          className="absolute top-3 right-3 p-2 rounded-full text-white/90 hover:text-white hover:scale-110 active:scale-95 transition"
          title="Save to wishlist"
        >
          <Heart 
            size={18} 
            className={isWishlisted ? 'fill-brand-primary text-brand-primary' : 'stroke-[2.2] drop-shadow-md'} 
          />
        </button>

        {/* Carousel Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {images.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === currentImgIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details info */}
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-gray-900 truncate pr-2">{vendor.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={12} className="fill-gray-900 text-gray-900" />
            <span className="font-extrabold text-gray-900">{vendor.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 truncate font-medium">
          {vendor.category} in {vendor.location || 'Maharashtra'}
        </p>

        <p className="text-xs font-black text-gray-900 pt-1">
          ₹{vendor.basePrice.toLocaleString('en-IN')}{' '}
          <span className="text-gray-500 font-normal">
            {vendor.category === 'Catering' ? 'per plate' : 'starting package'}
          </span>
        </p>
      </div>
    </div>
  );
}
