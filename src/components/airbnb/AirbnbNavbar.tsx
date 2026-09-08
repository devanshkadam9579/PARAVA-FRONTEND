import React, { useState, useEffect } from 'react';
import { 
  Menu, User as UserIcon, Globe, Bell, ShoppingCart, LogOut, 
  Calendar, Heart, MessageSquare, Headphones, ShieldCheck, Sparkles,
  Award, Users, ChevronDown, Check, Search, Building2, UtensilsCrossed,
  Camera, Music, Palette, Grid
} from 'lucide-react';
import { ParvaLogo } from './ParvaLogo';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';

export interface AirbnbNavbarProps {
  categories: { id: string; name: string; icon?: any; image?: string }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currentUser: any;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: 'home' | 'bookings' | 'chat' | 'profile') => void;
  activeTab: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSupport: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  currentCity?: string;
  onSelectCity?: (city: string) => void;
  cities?: string[];
  eventDate?: string;
  onDateChange?: (date: string) => void;
  guestCount?: number;
  onGuestCountChange?: (guests: number) => void;
  onSearch?: () => void;
  showSearchCapsule?: boolean;
}

// 3D Category icons matching Airbnb style
const NAV_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌐', label: 'All Services' },
  { id: 'Banquet Hall', name: 'Venues', icon: '🏰', label: 'Venues' },
  { id: 'Catering', name: 'Catering', icon: '🍽️', label: 'Catering' },
  { id: 'Decorators', name: 'Decor', icon: '🎈', label: 'Decorators' },
  { id: 'Photographer', name: 'Photography', icon: '📷', label: 'Photographers' },
  { id: 'DJ', name: 'DJ & Sound', icon: '🎧', label: 'DJ & Sound' },
];

export function AirbnbNavbar({
  categories,
  selectedCategory,
  onSelectCategory,
  currentUser,
  onOpenLogin,
  onLogout,
  onNavigateTab,
  activeTab,
  cartCount,
  onOpenCart,
  onOpenSupport,
  onOpenNotifications,
  unreadCount,
  currentCity = 'Kolhapur',
  onSelectCity = () => {},
  cities = [],
  eventDate = '',
  onDateChange = () => {},
  guestCount = 100,
  onGuestCountChange = () => {},
  onSearch = () => {},
  showSearchCapsule = true
}: AirbnbNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = () => {
    if (!currentUser) return 'G';
    if (currentUser.name) {
      return currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 transition-all font-sans">
      {/* 1. Top Navbar Row: Logo | Center Categories | Right Partner + User Menu */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="shrink-0">
          <ParvaLogo 
            size="md"
            onClick={() => {
              onSelectCategory('all');
              onNavigateTab('home');
            }}
          />
        </div>

        {/* Center: Category Mode Tabs with 3D Icons & Bottom Underline Indicator */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-6 lg:gap-8 h-full">
          {NAV_CATEGORIES.map((cat) => {
            const isSelected = 
              (cat.id === 'all' && (selectedCategory === 'all' || !selectedCategory)) ||
              (cat.id !== 'all' && (
                selectedCategory.toLowerCase().includes(cat.id.toLowerCase()) ||
                selectedCategory.toLowerCase().includes(cat.name.toLowerCase()) ||
                selectedCategory.toLowerCase().includes(cat.label.toLowerCase())
              ));

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id === 'all' ? 'all' : cat.name);
                  if (activeTab !== 'home') onNavigateTab('home');
                }}
                className={`relative flex items-center gap-2 h-full px-2 text-sm font-semibold transition cursor-pointer select-none ${
                  isSelected
                    ? 'text-gray-950 font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="text-xl filter drop-shadow-xs">{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.name}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gray-950 rounded-full animate-in fade-in duration-150" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Partner link, Language/Globe, Concierge, Cart, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Become a Partner Link */}
          <a
            href="https://parva-vendor-app.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center text-xs sm:text-sm font-bold text-gray-800 hover:bg-gray-100 px-3.5 py-2 rounded-full transition cursor-pointer"
          >
            Become a partner
          </a>

          {/* Region / Globe Selector */}
          <button
            type="button"
            onClick={() => {}}
            className="p-2.5 hover:bg-gray-100 rounded-full text-gray-700 transition hidden sm:flex items-center justify-center cursor-pointer"
            title={`Current Region: ${currentCity}`}
          >
            <Globe size={18} />
          </button>

          {/* 24/7 Concierge Support */}
          <button
            type="button"
            onClick={onOpenSupport}
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-full transition"
            title="24/7 Celebration Assistance"
          >
            <Headphones size={15} className="text-rose-600" />
            <span>Concierge</span>
          </button>

          {/* Plan Bundle / Cart */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition active:scale-95 relative"
            title="View Event Plan"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Event Plan</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-3 border border-gray-300 rounded-full hover:shadow-md transition active:scale-95 bg-white cursor-pointer"
              aria-label="User navigation menu"
            >
              <Menu size={16} className="text-gray-600" />
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                {getInitials()}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsUserMenuOpen(false)}
              >
                {currentUser ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-900 truncate">
                        {currentUser.name || 'Valued Client'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {currentUser.email || currentUser.phone || 'Client Account'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('profile')}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <UserIcon size={15} className="text-gray-500" />
                      <span>Account Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('bookings')}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <Calendar size={15} className="text-gray-500" />
                      <span>My Reservations</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('chat')}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <MessageSquare size={15} className="text-gray-500" />
                      <span>Vendor Messages</span>
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-gray-900 hover:bg-gray-50 cursor-pointer"
                    >
                      Log In / Sign Up
                    </button>
                    <a
                      href="https://parva-vendor-app.onrender.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Become a Partner</span>
                    </a>
                    <button
                      type="button"
                      onClick={onOpenSupport}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Help Centre
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Floating Centered Search Capsule Row (Visible when showSearchCapsule is true) */}
      {showSearchCapsule && activeTab === 'home' && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 flex justify-center">
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
      )}
    </header>
  );
}

export default AirbnbNavbar;
