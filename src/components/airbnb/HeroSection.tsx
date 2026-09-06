import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';

export interface HeroSectionProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onSearch: () => void;
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
    <div className="relative w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 pt-4 pb-8">
      {/* Hero Card Container with Real Curated Event Photography */}
      <div className="relative w-full rounded-3xl sm:rounded-4xl overflow-hidden min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col items-center justify-center p-6 sm:p-12 text-center text-white shadow-xl">
        {/* Background Event Imagery with Subtle Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=85&w=2000"
            alt="Grand Indian Wedding & Celebration"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Multi-layered cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/35" />
          <div className="absolute inset-0 bg-rose-950/20 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-xs font-black uppercase tracking-widest text-white shadow-xs">
            <Sparkles size={14} className="text-amber-300" />
            <span>Plan Your Perfect Celebration</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.1] text-white drop-shadow-md">
            Extraordinary events,<br />made simple
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-xs">
            Discover trusted celebration specialists, palatial venues, and bespoke services for your weddings, birthdays, and milestones.
          </p>

          {/* Floating Search Experience Embedded in Hero */}
          <div className="pt-2 sm:pt-4 w-full text-left">
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
      </div>
    </div>
  );
}
