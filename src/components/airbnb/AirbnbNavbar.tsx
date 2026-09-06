import React, { useState } from 'react';
import { 
  Menu, User as UserIcon, Globe, Bell, ShoppingCart, LogOut, 
  Calendar, Heart, MessageSquare, Headphones, ShieldCheck, Sparkles 
} from 'lucide-react';

export interface AirbnbNavbarProps {
  categories: { id: string; name: string; icon?: any }[];
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getInitials = () => {
    if (!currentUser) return 'G';
    if (currentUser.name) {
      return currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const allCategories = [
    { id: 'all', name: 'All Services', icon: '✨' },
    ...categories.map(c => ({
      id: c.name,
      name: c.name,
      icon: c.name === 'Catering' ? '🍽️' :
            c.name === 'Decorator' || c.name === 'Decorators' ? '🌸' :
            c.name === 'Banquet Hall' || c.name === 'Venues' ? '🏛️' :
            c.name === 'DJ' || c.name === 'DJ & Sound' ? '🎵' :
            c.name === 'Photographer' || c.name === 'Photography' ? '📸' :
            c.name === 'Makeup Artist' || c.name === 'Makeup Artists' ? '💄' :
            c.name === 'Cake & Desserts' ? '🎂' :
            c.name === 'Event Planner' || c.name === 'Event Planners' ? '📋' : '✨'
    }))
  ];

  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40">
      {/* Top Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigateTab('home')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-extrabold text-xl text-brand-primary tracking-tight font-display">
            parva
          </span>
        </div>

        {/* Right Action Menu Capsule */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSupport}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 px-3.5 py-2 rounded-full transition"
          >
            <Headphones size={15} className="text-brand-primary" />
            <span>24/7 Concierge</span>
          </button>

          {/* Cart Capsule */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-brand-primary-light hover:bg-pink-100 text-brand-primary border border-brand-border px-3.5 py-2 rounded-full text-xs font-extrabold transition active:scale-95 relative"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Plan Bundle</span>
            {cartCount > 0 && (
              <span className="bg-brand-primary text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Menu Capsule */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2.5 bg-white hover:shadow-md border border-gray-300 px-3 py-1.5 rounded-full transition duration-200"
            >
              <Menu size={16} className="text-gray-600" />
              <div className="w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                {getInitials()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                {currentUser ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{currentUser.email || currentUser.phone}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { onNavigateTab('bookings'); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                      >
                        <Calendar size={14} className="text-brand-primary" />
                        <span>My Bookings & Invoices</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { onNavigateTab('chat'); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                      >
                        <MessageSquare size={14} className="text-brand-primary" />
                        <span>Messages with Vendors</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { onNavigateTab('profile'); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                      >
                        <UserIcon size={14} className="text-brand-primary" />
                        <span>Account Profile</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={() => { setIsMenuOpen(false); onLogout(); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); onOpenLogin(); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-gray-900 hover:bg-gray-50"
                    >
                      Log in or sign up
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); onOpenSupport(); }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Headphones size={14} />
                      <span>Help Center</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Category Navigation Bar */}
      <div className="border-t border-gray-100 bg-white overflow-x-auto no-scrollbar py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 min-w-max">
          {allCategories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase() || (selectedCategory === 'all' && cat.id === 'all');
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id === 'all' ? 'all' : cat.name)}
                className={`flex flex-col items-center gap-1.5 pb-2 transition-all relative select-none cursor-pointer group ${
                  isSelected ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-bold whitespace-nowrap">{cat.name}</span>
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
