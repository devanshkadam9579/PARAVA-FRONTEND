import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, Users, Sparkles, X, ChevronDown, Check } from 'lucide-react';
import CalendarRangeSelect, { DateRange } from '../ui/calendar-range-select';

export interface AirbnbSearchCapsuleProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onSearch: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  className?: string;
}

export function AirbnbSearchCapsule({
  currentCity,
  onSelectCity,
  cities,
  eventDate,
  onDateChange,
  guestCount,
  onGuestCountChange,
  onSearch,
  searchQuery = '',
  onSearchQueryChange,
  className = ''
}: AirbnbSearchCapsuleProps) {
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'location' | 'date' | 'guests'>('none');
  const [localSearchText, setLocalSearchText] = useState(searchQuery);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const defaultCities = cities && cities.length > 0 
    ? cities 
    : ['Kolhapur', 'Pune', 'Mumbai', 'Satara', 'Sangli', 'Nagpur', 'Nashik', 'Goa'];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (capsuleRef.current && !capsuleRef.current.contains(e.target as Node)) {
        setActiveDropdown('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelected = (d: string) => {
    onDateChange(d);
    setActiveDropdown('none');
  };

  const handleRangeSelected = (range: DateRange) => {
    if (range.startDate) {
      onDateChange(range.startDate);
      if (range.endDate && range.endDate !== range.startDate) {
        // Can be multi-day
      }
    }
  };

  return (
    <div ref={capsuleRef} className={`relative w-full max-w-4xl mx-auto ${className}`}>
      {/* Floating Pill Search Bar */}
      <div className="bg-white rounded-[32px] md:rounded-full border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all p-2 flex flex-col md:flex-row items-center gap-2 md:gap-0 shadow-gray-200/50 relative z-40">
        {/* 1. Location / Where */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'location' ? 'none' : 'location')}
          className={`w-full md:w-1/3 px-6 py-3 rounded-full transition-all duration-200 cursor-pointer select-none text-left border-2 ${activeDropdown === 'location' ? 'bg-white border-rose-500 shadow-[0_4px_12px_rgba(225,29,72,0.15)] ring-4 ring-rose-50' : 'border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md bg-transparent'}`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <MapPin size={14} className="text-rose-600" />
            <span>Where</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 truncate mt-0.5">
            {currentCity ? `${currentCity}, MH` : 'Search city or area'}
          </div>
        </div>

        {/* 2. When / Date */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'date' ? 'none' : 'date')}
          className={`w-full md:w-1/3 px-6 py-3 rounded-full transition-all duration-200 cursor-pointer select-none text-left border-2 ${activeDropdown === 'date' ? 'bg-white border-rose-500 shadow-[0_4px_12px_rgba(225,29,72,0.15)] ring-4 ring-rose-50' : 'border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md bg-transparent'}`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-rose-600" />
            <span>When</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 truncate mt-0.5">
            {eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Add event date'}
          </div>
        </div>

        {/* 3. Who / Guests & Search Button */}
        <div 
          onClick={() => setActiveDropdown(activeDropdown === 'guests' ? 'none' : 'guests')}
          className={`w-full md:w-1/3 px-6 py-2.5 rounded-full transition cursor-pointer select-none text-left flex items-center justify-between ${
            activeDropdown === 'guests' ? 'bg-rose-50/60 ring-2 ring-rose-500/20' : 'hover:bg-gray-50'
          }`}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Users size={14} className="text-rose-600" />
              <span>Who</span>
            </div>
            <div className="text-sm font-extrabold text-gray-900 truncate mt-0.5">
              {guestCount || 100} Guests
            </div>
          </div>

          {/* Search CTA Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown('none');
              onSearch();
            }}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Search celebration vendors"
            title="Search"
          >
            <Search size={18} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Popover 1: Location Picker */}
      {activeDropdown === 'location' && (
        <div 
          className="absolute top-full left-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Select Celebration City
            </h4>
            <button
              type="button"
              onClick={() => setActiveDropdown('none')}
              className="text-gray-400 hover:text-gray-700 p-1"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3">
            {defaultCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onSelectCity(city);
                  setActiveDropdown('date'); // Flow to next step
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                  currentCity === city
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-transparent'
                }`}
              >
                <span>{city}</span>
                {currentCity === city && (
                  <Check size={13} className="text-rose-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popover 2: Month-wise Range Calendar */}
      {activeDropdown === 'date' && (
        <div 
          className="absolute top-full left-0 sm:left-1/4 mt-3 w-full sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarRangeSelect
            selectedDate={eventDate}
            mode="single"
            onSelectDate={handleDateSelected}
            onSelectRange={handleRangeSelected}
          />
        </div>
      )}

      {/* Popover 3: Guests Counter Stepper */}
      {activeDropdown === 'guests' && (
        <div 
          className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Estimated Guest Count
            </h4>
            <button
              type="button"
              onClick={() => setActiveDropdown('none')}
              className="text-gray-400 hover:text-gray-700 p-1"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-gray-900">Total Attendees</p>
              <p className="text-[11px] text-gray-500">For per-plate & hall sizing</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onGuestCountChange(Math.max(10, (guestCount || 100) - 25))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="font-black text-sm text-gray-900 w-10 text-center">
                {guestCount || 100}
              </span>
              <button
                type="button"
                onClick={() => onGuestCountChange((guestCount || 100) + 25)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:border-gray-900 active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setActiveDropdown('none');
                onSearch();
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Apply & Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AirbnbSearchCapsule;
