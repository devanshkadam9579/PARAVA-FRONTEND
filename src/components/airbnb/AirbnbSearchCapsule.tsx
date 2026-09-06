import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, X } from 'lucide-react';

export interface AirbnbSearchCapsuleProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onSearch: () => void;
}

export function AirbnbSearchCapsule({
  currentCity,
  onSelectCity,
  cities,
  eventDate,
  onDateChange,
  guestCount,
  onGuestCountChange,
  onSearch
}: AirbnbSearchCapsuleProps) {
  const [activeSegment, setActiveSegment] = useState<'where' | 'when' | 'who' | null>(null);

  return (
    <div className="relative max-w-4xl mx-auto my-6 px-4">
      {/* Floating Capsule Container */}
      <div className="bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center p-2 divide-x divide-gray-200">
        {/* WHERE */}
        <div 
          onClick={() => setActiveSegment(activeSegment === 'where' ? null : 'where')}
          className="flex-1 px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition"
        >
          <span className="text-[10px] font-black uppercase text-gray-800 tracking-wider block">Where</span>
          <span className="text-xs font-semibold text-gray-600 truncate block">
            {currentCity || 'Search destinations'}
          </span>
        </div>

        {/* WHEN */}
        <div 
          onClick={() => setActiveSegment(activeSegment === 'when' ? null : 'when')}
          className="flex-1 px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition"
        >
          <span className="text-[10px] font-black uppercase text-gray-800 tracking-wider block">When</span>
          <span className="text-xs font-semibold text-gray-600 truncate block">
            {eventDate || 'Add event dates'}
          </span>
        </div>

        {/* WHO */}
        <div 
          onClick={() => setActiveSegment(activeSegment === 'who' ? null : 'who')}
          className="flex-1 px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-black uppercase text-gray-800 tracking-wider block">Who</span>
            <span className="text-xs font-semibold text-gray-600 truncate block">
              {guestCount ? `${guestCount} guests` : 'Add guests'}
            </span>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSearch();
              setActiveSegment(null);
            }}
            className="w-12 h-12 rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
            title="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Popovers for active segment */}
      {activeSegment === 'where' && (
        <div className="absolute top-full left-6 mt-3 w-72 bg-white rounded-3xl border border-gray-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-900">Popular Destinations</span>
            <button type="button" onClick={() => setActiveSegment(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onSelectCity(city);
                  setActiveSegment('when');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition ${
                  currentCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-brand-primary-light text-brand-primary'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MapPin size={14} className="text-brand-primary shrink-0" />
                <span>{city}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSegment === 'when' && (
        <div className="absolute top-full left-1/3 mt-3 w-80 bg-white rounded-3xl border border-gray-200 shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-900">Select Event Date</span>
            <button type="button" onClick={() => setActiveSegment(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={eventDate}
            onChange={(e) => {
              onDateChange(e.target.value);
              setActiveSegment('who');
            }}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-900 outline-none focus:border-brand-primary"
          />
        </div>
      )}

      {activeSegment === 'who' && (
        <div className="absolute top-full right-6 mt-3 w-80 bg-white rounded-3xl border border-gray-200 shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-900">Guests / Attendees</span>
            <button type="button" onClick={() => setActiveSegment(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-extrabold text-gray-900">Event Gathering Size</p>
              <p className="text-[10px] text-gray-400">For catering & banquet seating</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onGuestCountChange(Math.max(10, guestCount - 25))}
                className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-400 flex items-center justify-center font-bold text-gray-700 active:scale-95"
              >
                -
              </button>
              <span className="font-extrabold text-xs text-gray-900 w-8 text-center">{guestCount}</span>
              <button
                type="button"
                onClick={() => onGuestCountChange(guestCount + 25)}
                className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-400 flex items-center justify-center font-bold text-gray-700 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
