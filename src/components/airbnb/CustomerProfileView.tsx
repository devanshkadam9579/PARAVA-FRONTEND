import React, { useState } from 'react';
import { 
  User, Calendar, Heart, Award, Users, Settings, ShieldCheck, 
  ChevronRight, Copy, Check, Sparkles, LogOut, ArrowRight, ExternalLink, HelpCircle
} from 'lucide-react';
import { Booking, Vendor } from '../../types';

export interface CustomerProfileViewProps {
  currentUser: any;
  bookings: Booking[];
  wishlist: string[];
  vendors: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  onNavigateTab: (tab: 'home' | 'bookings' | 'chat' | 'profile') => void;
  onLogout: () => void;
  onOpenSupport: () => void;
}

export function CustomerProfileView({
  currentUser,
  bookings,
  wishlist,
  vendors,
  onSelectVendor,
  onNavigateTab,
  onLogout,
  onOpenSupport
}: CustomerProfileViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'saved' | 'rewards' | 'referrals' | 'settings'>('profile');
  const [copiedCode, setCopiedCode] = useState(false);

  const savedVendors = vendors.filter(v => wishlist.includes(v.id));
  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const referralCode = currentUser?.referralCode || `PARVA-${(currentUser?.id || 'VIP').substring(0, 6).toUpperCase()}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Profile Card & Navigation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main User Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {userInitials}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-extrabold text-gray-900 font-display">
                    {currentUser?.name || 'Valued Client'}
                  </h2>
                  <ShieldCheck size={18} className="text-rose-600 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {currentUser?.email || currentUser?.phone || 'Verified Guest Member'}
                </p>
                <div className="inline-flex items-center gap-1 mt-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-800">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>Gold Celebration Tier</span>
                </div>
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span>Profile Completion</span>
                <span className="text-rose-600 font-extrabold">85%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full w-[85%]" />
              </div>
              <p className="text-[11px] text-gray-500">Add an event location to unlock customized deals</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white rounded-3xl p-3 border border-gray-200/80 shadow-xs divide-y divide-gray-100 text-xs font-bold text-gray-700">
            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                activeSubTab === 'profile' ? 'bg-rose-50 text-rose-700 font-extrabold' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={16} />
                <span>Account Overview</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('bookings')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} />
                <span>My Reservations ({bookings.length})</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('saved')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                activeSubTab === 'saved' ? 'bg-rose-50 text-rose-700 font-extrabold' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart size={16} />
                <span>Saved Favorites ({savedVendors.length})</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('rewards')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                activeSubTab === 'rewards' ? 'bg-rose-50 text-rose-700 font-extrabold' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award size={16} />
                <span>Loyalty Rewards & Ledger</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('referrals')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                activeSubTab === 'referrals' ? 'bg-rose-50 text-rose-700 font-extrabold' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Invite & Earn ₹500</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={onOpenSupport}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={16} />
                <span>Help & Concierge Support</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition shadow-xs"
          >
            <LogOut size={15} />
            <span>Log Out Account</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8">
          {/* Subtab 1: Account Overview */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 font-display">
                    Welcome to Parva Celebrations
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage your upcoming events, verified vendors, and celebration perks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div 
                    onClick={() => onNavigateTab('bookings')}
                    className="p-5 rounded-2xl border border-gray-200 hover:border-gray-900 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Reservations</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{bookings.length} events booked</p>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-900 transition-transform group-hover:translate-x-1" />
                  </div>

                  <div 
                    onClick={() => setActiveSubTab('saved')}
                    className="p-5 rounded-2xl border border-gray-200 hover:border-gray-900 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Saved Wishlist</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{savedVendors.length} partners pinned</p>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-900 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Referral Promo Card */}
              <div className="bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 rounded-3xl p-8 text-white shadow-md space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-100">
                  <Sparkles size={14} />
                  <span>Refer Friends & Family</span>
                </div>
                <h3 className="text-2xl font-black font-display leading-tight">
                  Give ₹500 off their first booking, earn 200 Loyalty Points!
                </h3>
                <div className="flex items-center gap-3 pt-2">
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl font-mono font-bold text-sm border border-white/30">
                    {referralCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="bg-white text-rose-600 px-4 py-2.5 rounded-xl font-extrabold text-xs hover:bg-rose-50 transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Saved Favorites */}
          {activeSubTab === 'saved' && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 font-display">
                  Saved Favorites ({savedVendors.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">Specialists you've bookmarked for your celebrations</p>
              </div>

              {savedVendors.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <Heart size={24} />
                  </div>
                  <h4 className="font-extrabold text-base text-gray-900">No saved favorites yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Click the heart icon on any vendor card to pin them here for quick access.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('home')}
                    className="px-6 py-2.5 bg-gray-900 text-white font-extrabold text-xs rounded-xl hover:bg-black transition"
                  >
                    Explore Marketplace
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {savedVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      onClick={() => onSelectVendor(vendor)}
                      className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="aspect-4/3 w-full bg-gray-100 relative overflow-hidden">
                        <img
                          src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'}
                          alt={vendor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h4 className="font-extrabold text-sm text-gray-900 truncate">{vendor.name}</h4>
                        <p className="text-xs text-gray-500">{vendor.category} · {vendor.location}</p>
                        <p className="text-xs font-black text-gray-900 pt-1">
                          ₹{vendor.basePrice.toLocaleString('en-IN')}{' '}
                          <span className="text-gray-500 font-normal">onwards</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subtab 3: Loyalty Rewards & Ledger */}
          {activeSubTab === 'rewards' && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 font-display">
                    Parva Rewards & Points
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Redeem points for direct discounts on any celebration booking</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-rose-600 font-display">1,250</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Available Points (₹625 Value)</div>
                </div>
              </div>

              {/* Ledger History */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Transaction History</h4>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900">Completed Event Booking #b-101</p>
                      <p className="text-gray-400 text-[11px]">24 Aug 2026</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+600 pts</span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900">Repeat Booking Bonus</p>
                      <p className="text-gray-400 text-[11px]">15 Jul 2026</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+50 pts</span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900">Friend Referral Reward (Rahul K.)</p>
                      <p className="text-gray-400 text-[11px]">02 Jun 2026</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+200 pts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 4: Referrals */}
          {activeSubTab === 'referrals' && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 font-display">
                  Referral Program
                </h3>
                <p className="text-xs text-gray-500 mt-1">Share your unique code to invite friends to celebrate with Parva</p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Your Referral Code</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={referralCode}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 font-mono font-bold text-base text-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-6 py-2.5 bg-gray-900 text-white font-extrabold text-xs rounded-xl hover:bg-black transition shrink-0"
                  >
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
