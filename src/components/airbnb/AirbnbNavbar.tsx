import React, { useState, useEffect } from 'react';
import { 
  Menu, User as UserIcon, Globe, Bell, ShoppingCart, LogOut, 
  Calendar, Heart, MessageSquare, Headphones, ShieldCheck, Sparkles,
  Award, Users, ChevronDown, Check, Search, MapPin, Activity
} from 'lucide-react';
import { ParvaLogo } from './ParvaLogo';
import { isUserAuthenticated, isMasterAdminEmail } from '../../services/authService';

export interface AirbnbNavbarProps {
  categories: { id: string; name: string; icon?: any; image?: string }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currentUser: any;
  onOpenLogin: (tab?: 'signin' | 'signup') => void;
  onLogout: () => void;
  onNavigateTab: (tab: 'home' | 'explore' | 'bookings' | 'chat' | 'messages' | 'profile') => void;
  activeTab: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSupport: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  currentCity?: string;
  onSelectCity?: (city: string) => void;
  cities?: string[];
  onOpenLocationSelector?: () => void;
  onOpenAdminKyc?: () => void;
  onOpenAdminHealth?: () => void;
  onOpenAdminChats?: () => void;
  onOpenVendorAuth?: () => void;
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
  unreadCount,
  currentCity = 'Kolhapur',
  onSelectCity,
  cities = [],
  onOpenLocationSelector,
  onOpenAdminKyc,
  onOpenAdminHealth,
  onOpenAdminChats,
  onOpenVendorAuth
}: AirbnbNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isUserLoggedIn = isUserAuthenticated(currentUser);

  const isAdminUser = Boolean(
    currentUser && (
      currentUser.role === 'admin' || 
      currentUser.role === 'master_admin' || 
      isMasterAdminEmail(currentUser.email)
    )
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = () => {
    if (!currentUser) return '';
    if (currentUser.name) {
      return currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
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
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 transition-all font-sans">
      {/* Top Bar: Logo, City Pill, Nav Capsule, Actions */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 2xl:px-12 h-[72px] flex items-center justify-between gap-4">
        
        {/* Brand Logo & City Selector Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <ParvaLogo 
            size="md"
            onClick={() => onNavigateTab('home')}
          />

          {/* Direct City Selector Button */}
          <button
            type="button"
            onClick={() => onOpenLocationSelector ? onOpenLocationSelector() : null}
            className="hidden lg:flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Switch City"
          >
            <MapPin size={13} className="text-rose-600 shrink-0" />
            <span className="font-extrabold">{currentCity}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
        </div>

        {/* Center Navigation Capsule */}
        <div className="hidden md:flex flex-1 h-[48px] items-center justify-center relative max-w-xl">
          <div className="relative">
            <nav className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-full px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'home' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Explore Services
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('explore')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'explore' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Vendors
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('bookings')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Reservations
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('chat')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'chat' || activeTab === 'messages' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages
              </button>

              {isUserLoggedIn && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('profile')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    activeTab === 'profile' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile
                </button>
              )}

              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => onOpenAdminKyc ? onOpenAdminKyc() : onNavigateTab('profile')}
                  className="px-3 py-1.5 rounded-full text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={13} />
                  <span>Admin Hub</span>
                </button>
              )}
            </nav>
          </div>

          <div 
            className={`absolute transition-all duration-300 ease-in-out cursor-pointer ${isScrolled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-110 pointer-events-none -translate-y-2'} flex items-center justify-center`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition pl-5 pr-2 py-2 gap-4">
              <span className="text-sm font-bold text-gray-900">Anywhere</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm font-bold text-gray-900">{currentCity}</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">Add event date</span>
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white ml-2">
                <Search size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions Menu */}
        <div className="flex items-center gap-3">
          {/* 24/7 Concierge Support */}
          <button
            type="button"
            onClick={onOpenSupport}
            className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-700 hover:bg-gray-100 px-3.5 py-2 rounded-full transition cursor-pointer"
            title="24/7 Celebration Assistance"
          >
            <Headphones size={15} className="text-rose-600" />
            <span>24/7 Concierge</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2.5 hover:bg-gray-100 rounded-full text-gray-700 transition relative cursor-pointer"
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
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-full text-xs font-extrabold transition active:scale-95 relative cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Event Plan</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Guaranteed Visible Log In / Sign Up Button When Logged Out */}
          {!isUserLoggedIn && (
            <button
              type="button"
              onClick={() => onOpenLogin('signin')}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-full shadow-sm hover:shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              id="desktop-signin-button"
            >
              <UserIcon size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* User Profile Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-3 border border-gray-200 rounded-full hover:shadow-md transition active:scale-95 bg-white cursor-pointer"
              id="desktop-user-menu-pill"
            >
              <Menu size={16} className="text-gray-600" />
              <div className={`w-8 h-8 rounded-full ${isUserLoggedIn ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'} text-xs font-extrabold flex items-center justify-center shadow-xs`}>
                {isUserLoggedIn ? getInitials() : <UserIcon size={14} />}
              </div>
            </button>

            {/* Profile Menu Dropdown Modal */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans"
                onClick={() => setIsUserMenuOpen(false)}
              >
                {isUserLoggedIn ? (
                  <>
                    <div className="px-5 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-extrabold text-gray-900 truncate">
                          {currentUser.name || 'Valued Client'}
                        </p>
                        {isAdminUser && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {currentUser.email || currentUser.phone || 'Client Account'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('profile')}
                        className="w-full px-5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <UserIcon size={15} className="text-gray-500" />
                        <span>Account Profile & Wishlist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('bookings')}
                        className="w-full px-5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Calendar size={15} className="text-gray-500" />
                        <span>My Reservations</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('chat')}
                        className="w-full px-5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <MessageSquare size={15} className="text-gray-500" />
                        <span>Vendor Messages</span>
                      </button>
                    </div>

                    {/* Admin Actions */}
                    {isAdminUser && (
                      <div className="border-t border-gray-100 py-1 bg-rose-50/40">
                        <div className="px-5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                          Administrative Controls
                        </div>
                        {onOpenAdminKyc && (
                          <button
                            type="button"
                            onClick={onOpenAdminKyc}
                            className="w-full px-5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-rose-100/60 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <ShieldCheck size={15} className="text-rose-600" />
                            <span>🛡️ KYC Verification Hub</span>
                          </button>
                        )}
                        {onOpenAdminHealth && (
                          <button
                            type="button"
                            onClick={onOpenAdminHealth}
                            className="w-full px-5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-rose-100/60 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <Activity size={15} className="text-rose-600" />
                            <span>📊 Cloudflare & DB Health</span>
                          </button>
                        )}
                        {onOpenAdminChats && (
                          <button
                            type="button"
                            onClick={onOpenAdminChats}
                            className="w-full px-5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-rose-100/60 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <MessageSquare size={15} className="text-rose-600" />
                            <span>💬 Admin Live Chat Logs</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full px-5 py-2.5 text-left text-xs font-extrabold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => onOpenLogin('signin')}
                      className="w-full px-5 py-2.5 text-left text-xs font-extrabold text-gray-900 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                    >
                      Log In / Sign Up
                    </button>
                    {onOpenVendorAuth && (
                      <button
                        type="button"
                        onClick={onOpenVendorAuth}
                        className="w-full px-5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center justify-between cursor-pointer"
                      >
                        <span>Partner / Vendor Portal</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">Register</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenSupport}
                      className="w-full px-5 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      24/7 Concierge & Help
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
