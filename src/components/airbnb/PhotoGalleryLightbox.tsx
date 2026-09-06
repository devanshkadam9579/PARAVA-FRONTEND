import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';

export interface PhotoGalleryLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  vendorName: string;
  initialIndex?: number;
}

export function PhotoGalleryLightbox({
  isOpen,
  onClose,
  images,
  vendorName,
  initialIndex = 0
}: PhotoGalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white max-w-7xl mx-auto w-full">
        <span className="text-xs font-bold tracking-wider text-gray-300">
          {vendorName} — Photo {currentIndex + 1} of {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Large Image Container */}
      <div className="relative flex items-center justify-center max-w-5xl mx-auto w-full h-[70vh]">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition z-10"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          src={images[currentIndex]}
          alt={`${vendorName} gallery`}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition duration-300"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition z-10"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition ${
              idx === currentIndex ? 'border-brand-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} alt="thumb" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
