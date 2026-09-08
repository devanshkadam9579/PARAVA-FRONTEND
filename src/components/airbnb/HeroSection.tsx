import React from 'react';
import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';
import BlurText from '../reactbits/BlurText';

export interface HeroSectionProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onSearch: () => void;
  onSelectCategory?: (category: string) => void;
}

export function HeroSection({
  currentCity,
  onSelectCity,
  cities,
  eventDate,
  onDateChange,
  guestCount,
  onGuestCountChange,
  onSearch
}: HeroSectionProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 font-sans text-center">
      {/* Clean Open Marketplace Hero */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 text-xs font-extrabold text-rose-700 shadow-xs">
          <Sparkles size={14} className="text-rose-600" />
          <span>India's Curated Celebration Marketplace</span>
        </div>

        {/* Logo and Main Headline */}
        <div className="flex justify-center mb-2">
          <img src="/parva-logo.png" alt="MyParva" className="h-14 sm:h-18 object-contain" />
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black font-display tracking-tight leading-[1.15] text-gray-900 justify-center flex">
          Plan less, celebrate more.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Discover trusted vendors, services and experiences for your event.
        </p>

        {/* Trust points */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-1 text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Aadhaar Verified Vendors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>5% Advance Lock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>100% Price Transparency</span>
          </div>
        </div>

        {/* Search Experience - Clean and Highly Visible */}
        <div className="pt-6 w-full text-left">
          <AirbnbSearchCapsule
            currentCity={currentCity}
            onSelectCity={onSelectCity}
            cities={cities}
            eventDate={eventDate}
            onDateChange={onDateChange}
            guestCount={guestCount}
            onGuestCountChange={onGuestCountChange}
            onSearch={onSearch}
          />
        </div>
      </div>
    </section>
  );
}
export default HeroSection;
