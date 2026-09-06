import React, { useState } from 'react';
import { 
  Menu, User as UserIcon, Globe, Bell, ShoppingCart, LogOut, 
  Calendar, Heart, MessageSquare, Headphones, ShieldCheck, Sparkles,
  Award, Users, ChevronDown, Check
} from 'lucide-react';
import { ParvaLogo } from './ParvaLogo';

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
}

// Curated high-definition category imagery mapping (Zero emojis)
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'all': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=120',
  'Catering': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=120',
  'Decorator': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=120',
  'Decorators': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=120',
  'Decoration': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=120',
  'Banquet Hall': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=120',
  'Venues': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=120',
  'Venue': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=120',
  'DJ': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=120',
  'DJ & Sound': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=120',
  'Photographer': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=120',
  'Photography': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=120',
  'Makeup Artist': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=120',
  'Makeup Artists': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=120',
  'Cake & Desserts': 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&q=80&w=120',
  'Event Planner': 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=120',
  'Event Planners': 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=120'
};

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
  unreadCount
}: AirbnbNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getInitials = () => {
    if (!currentUser) return 'G';
    if (currentUser.name) {
      return currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const navCategories = [
    { id: 'all', name: 'All Services', image: CATEGORY_IMAGE_MAP['all'] },
    ...categories.map(c => ({
      id: c.name,
      name: c.name,
      image: c.image || CATEGORY_IMAGE_MAP[c.name] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=120'
    }))
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 transition-all">
      {/* Top Bar: Logo, Concierge, Cart, Profile */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <ParvaLogo 
          size="md"
          onClick={() => onNavigateTab('home')}
        />

        {/* Center Quick Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-full px-2 py-1 shadow-xs">
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'home' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Explore Services
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('bookings')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Reservations
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('chat')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'chat' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Messages
          </button>
        </nav>

        {/* Right Actions Menu */}
        <div className="flex items-center gap-3">
          {/* 24/7 Concierge Support */}
          <button
            type="button"
            onClick={onOpenSupport}
            className="hidden lg:flex items-center gap-2 text-xs font-bold text-gray-700 hover:bg-gray-100 px-3.5 py-2 rounded-full transition"
            title="24/7 Celebration Assistance"
          >
            <Headphones size={15} className="text-rose-600" />
            <span>24/7 Concierge</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2.5 hover:bg-gray-100 rounded-full text-gray-700 transition relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Plan Bundle / Cart */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-full text-xs font-extrabold transition active:scale-95 relative"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Event Plan</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-3 border border-gray-200 rounded-full hover:shadow-md transition active:scale-95 bg-white"
            >
              <Menu size={16} className="text-gray-600" />
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                {getInitials()}
              </div>
            </button>

            {/* Profile Menu Dropdown Modal */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
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
                      className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-gray-900 hover:bg-gray-50"
                    >
                      Log In / Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={onOpenSupport}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
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

      {/* Bottom Category Rail (Zero Emojis - Real Visual Thumbnails) */}
      <div className="w-full border-t border-gray-100 bg-white/60">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center gap-8 overflow-x-auto py-3 scrollbar-none">
          {navCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id || (selectedCategory === 'all' && cat.id === 'all');
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 pb-1 border-b-2 transition select-none shrink-0 group ${
                  isSelected
                    ? 'border-gray-900 opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                }`}
              >
                {/* Category Thumbnail */}
                <div className={`w-8 h-8 rounded-full overflow-hidden border shadow-2xs transition-transform group-hover:scale-105 ${
                  isSelected ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-200'
                }`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-800 tracking-tight whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
