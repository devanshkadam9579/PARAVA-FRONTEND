import React, { useState } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, Users, Sparkles, X, ChevronDown } from 'lucide-react';

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
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'location' | 'date' | 'guests'>('none');

  const defaultCities = cities && cities.length > 0 ? cities : ['Pune', 'Mumbai', 'Kolhapur', 'Nagpur', 'Goa'];

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 pt-6 pb-2">
      {/* Floating Capsule Container */}
      <div className="relative max-w-4xl mx-auto bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* 1. Location / City */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'location' ? 'none' : 'location')}
          className="w-full md:w-1/3 px-6 py-2.5 rounded-full hover:bg-gray-100/80 transition cursor-pointer select-none text-left"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-800 flex items-center gap-1">
            <MapPin size={12} className="text-rose-600" />
            <span>Celebration Location</span>
          </div>
          <div className="text-xs font-extrabold text-gray-900 truncate mt-0.5">
            {currentCity ? `${currentCity}, Maharashtra` : 'Select City'}
          </div>
        </div>

        {/* 2. When / Date */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'date' ? 'none' : 'date')}
          className="w-full md:w-1/3 px-6 py-2.5 rounded-full hover:bg-gray-100/80 transition cursor-pointer select-none text-left"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-800 flex items-center gap-1">
            <CalendarIcon size={12} className="text-rose-600" />
            <span>Event Date</span>
          </div>
          <div className="text-xs font-extrabold text-gray-900 truncate mt-0.5">
            {eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Add Date'}
          </div>
        </div>

        {/* 3. Guests / Capacity */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'guests' ? 'none' : 'guests')}
          className="w-full md:w-1/3 px-6 py-2.5 rounded-full hover:bg-gray-100/80 transition cursor-pointer select-none text-left flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-800 flex items-center gap-1">
              <Users size={12} className="text-rose-600" />
              <span>Attendees</span>
            </div>
            <div className="text-xs font-extrabold text-gray-900 truncate mt-0.5">
              {guestCount || 100} Guests
            </div>
          </div>

          {/* Search CTA Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSearch();
            }}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform"
            aria-label="Search celebration services"
          >
            <Search size={16} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Dropdown 1: Location Picker Modal */}
        {activeDropdown === 'location' && (
          <div 
            className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
              Search by City
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {defaultCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    setActiveDropdown('none');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold text-left transition ${
                    currentCity === city
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-transparent'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown 2: Date Picker Modal */}
        {activeDropdown === 'date' && (
          <div 
            className="absolute top-full left-1/3 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
              Select Celebration Date
            </h4>
            <input
              type="date"
              value={eventDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                onDateChange(e.target.value);
                setActiveDropdown('none');
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-rose-500"
            />
          </div>
        )}

        {/* Dropdown 3: Guests Counter Stepper */}
        {activeDropdown === 'guests' && (
          <div 
            className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
              Estimated Guest Count
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-gray-900">Total Attendees</p>
                <p className="text-[11px] text-gray-500">Catering & Hall sizing</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onGuestCountChange(Math.max(10, (guestCount || 100) - 25))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 active:scale-95"
                >
                  -
                </button>
                <span className="font-black text-sm text-gray-900 w-10 text-center">
                  {guestCount || 100}
                </span>
                <button
                  type="button"
                  onClick={() => onGuestCountChange((guestCount || 100) + 25)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
