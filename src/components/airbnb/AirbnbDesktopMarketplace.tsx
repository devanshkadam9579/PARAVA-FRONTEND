import React, { useState } from 'react';
import { AirbnbNavbar } from './AirbnbNavbar';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';
import { AirbnbVendorCard } from './AirbnbVendorCard';
import { AirbnbVendorDetailView } from './AirbnbVendorDetailView';
import { AirbnbCheckoutView } from './AirbnbCheckoutView';
import { MyBookingsView } from './MyBookingsView';
import ChatTab from '../ChatTab';
import { Vendor, VendorServiceItem, Booking } from '../../types';
import { 
  ChevronRight, Sparkles, ShieldCheck, Headphones, Star, 
  User as UserIcon, Heart, LogOut, ArrowRight 
} from 'lucide-react';

export interface AirbnbDesktopMarketplaceProps {
  vendors: Vendor[];
  categories: { id: string; name: string }[];
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  planningStartDate: string;
  onDateChange: (date: string) => void;
  planningGuestSize: number;
  onGuestCountChange: (guests: number) => void;
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
  wishlist: string[];
  onToggleWishlist: (id: string, e: any) => void;
  onSelectVendor: (vendor: Vendor) => void;
  selectedVendor: Vendor | null;
  onCloseVendorDetail: () => void;
  onAddServiceToBundle: (service: VendorServiceItem) => void;
  bundledItems: { vendor: any; service: any }[];
  onPay: () => void;
  couponDiscount: number;
  couponCode: string;
  setCouponCode: (c: string) => void;
  onApplyCoupon: () => void;
  couponMessage: string;
  bookings: Booking[];
  onDownloadVoucher: (b: Booking) => void;
  onCancelBooking: (bookingId: string, reason: string) => Promise<void>;
  onSubmitReview: (bookingId: string, vendorId: string, rating: number, comment: string) => Promise<void>;
}

export function AirbnbDesktopMarketplace({
  vendors,
  categories,
  currentCity,
  onSelectCity,
  cities,
  selectedCategory,
  onSelectCategory,
  planningStartDate,
  onDateChange,
  planningGuestSize,
  onGuestCountChange,
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
  wishlist,
  onToggleWishlist,
  onSelectVendor,
  selectedVendor,
  onCloseVendorDetail,
  onAddServiceToBundle,
  bundledItems,
  onPay,
  couponDiscount,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  couponMessage,
  bookings,
  onDownloadVoucher,
  onCancelBooking,
  onSubmitReview
}: AirbnbDesktopMarketplaceProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>('recommended');

  // Filter & Sort vendors
  const filteredVendors = vendors
    .filter((v) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (v.category || '').toLowerCase() === selectedCategory.toLowerCase() ||
        (v.categories && v.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase()));
      
      const matchesCity = !currentCity || (v.location || '').toLowerCase().includes(currentCity.toLowerCase());
      return matchesCategory && matchesCity;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.basePrice - b.basePrice;
      if (sortBy === 'price_high') return b.basePrice - a.basePrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.rating || 0) - (a.rating || 0);
    });

  const popularVendors = filteredVendors.slice(0, 6);
  const nextMonthVendors = filteredVendors.slice(6, 12);
  const remainingVendors = filteredVendors.slice(12);

  // Common Header
  const renderNavbar = () => (
    <AirbnbNavbar
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={(c) => {
        onSelectCategory(c);
        if (activeTab !== 'home') onNavigateTab('home');
      }}
      currentUser={currentUser}
      onOpenLogin={onOpenLogin}
      onLogout={onLogout}
      onNavigateTab={onNavigateTab}
      activeTab={activeTab}
      cartCount={cartCount}
      onOpenCart={() => setIsCheckoutOpen(true)}
      onOpenSupport={onOpenSupport}
      onOpenNotifications={onOpenNotifications}
      unreadCount={unreadCount}
    />
  );

  // 1. Checkout View
  if (isCheckoutOpen && bundledItems.length > 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <AirbnbCheckoutView
          bundledItems={bundledItems}
          planningDate={planningStartDate}
          planningTimeSlot="evening"
          guestCount={planningGuestSize}
          currentUser={currentUser}
          onPay={onPay}
          onBack={() => setIsCheckoutOpen(false)}
          couponDiscount={couponDiscount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          onApplyCoupon={onApplyCoupon}
          couponMessage={couponMessage}
        />
      </div>
    );
  }

  // 2. Vendor Listing / Detail View
  if (selectedVendor) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <AirbnbVendorDetailView
          vendor={selectedVendor}
          onBack={onCloseVendorDetail}
          eventDate={planningStartDate}
          onDateChange={onDateChange}
          guestCount={planningGuestSize}
          onGuestCountChange={onGuestCountChange}
          onAddServiceToBundle={onAddServiceToBundle}
          isWishlisted={wishlist.includes(selectedVendor.id)}
          onToggleWishlist={onToggleWishlist}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>
    );
  }

  // 3. Bookings Tab View
  if (activeTab === 'bookings') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <MyBookingsView
          bookings={bookings}
          onOpenChatWithVendor={(vendorId, bookingId) => onNavigateTab('chat')}
          onDownloadVoucher={onDownloadVoucher}
          onCancelBooking={onCancelBooking}
          onSubmitReview={onSubmitReview}
          onExploreServices={() => onNavigateTab('home')}
        />
      </div>
    );
  }

  // 4. Chat Tab View
  if (activeTab === 'chat') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ChatTab />
        </div>
      </div>
    );
  }

  // 5. Profile Tab View
  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 rounded-full bg-brand-primary text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{currentUser?.name || 'Valued Client'}</h2>
              <p className="text-xs text-gray-500">{currentUser?.email || currentUser?.phone || 'Guest Account'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => onNavigateTab('bookings')}
              className="p-5 rounded-3xl border border-gray-200 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">My Bookings</h4>
                <p className="text-xs text-gray-500 mt-0.5">{bookings.length} reservations</p>
              </div>
              <ArrowRight size={18} className="text-gray-400" />
            </div>

            <div 
              onClick={() => onNavigateTab('chat')}
              className="p-5 rounded-3xl border border-gray-200 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Vendor Messages</h4>
                <p className="text-xs text-gray-500 mt-0.5">Direct chat & coordination</p>
              </div>
              <ArrowRight size={18} className="text-gray-400" />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onLogout}
              className="px-6 py-2.5 bg-red-50 text-red-600 font-extrabold text-xs rounded-xl border border-red-200 hover:bg-red-100 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Homepage & Feed (Default)
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {renderNavbar()}

      {/* Signature Floating Search Capsule */}
      <AirbnbSearchCapsule
        currentCity={currentCity}
        onSelectCity={onSelectCity}
        cities={cities}
        eventDate={planningStartDate}
        onDateChange={onDateChange}
        guestCount={planningGuestSize}
        onGuestCountChange={onGuestCountChange}
        onSearch={() => {}}
      />

      {/* Main Listing Feeds */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Sort Controls */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs text-gray-500 font-semibold">
            Showing {filteredVendors.length} verified celebration specialists
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-900 outline-none focus:border-brand-primary"
            >
              <option value="recommended">Top Rated ⭐</option>
              <option value="price_low">Price: Low to High ₹</option>
              <option value="price_high">Price: High to Low ₹</option>
            </select>
          </div>
        </div>

        {/* Section 1: Popular vendors */}
        {popularVendors.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 font-display flex items-center gap-2">
                <span>Popular celebration specialists in {currentCity}</span>
                <ChevronRight size={18} className="text-gray-400" />
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {popularVendors.map((vendor) => (
                <AirbnbVendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSelect={onSelectVendor}
                  isWishlisted={wishlist.includes(vendor.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Available Next Month */}
        {nextMonthVendors.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 font-display flex items-center gap-2">
                <span>Available for upcoming dates in {currentCity}</span>
                <ChevronRight size={18} className="text-gray-400" />
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {nextMonthVendors.map((vendor) => (
                <AirbnbVendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSelect={onSelectVendor}
                  isWishlisted={wishlist.includes(vendor.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: All verified specialists */}
        {remainingVendors.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 font-display">
              All Verified Partners in {currentCity}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {remainingVendors.map((vendor) => (
                <AirbnbVendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSelect={onSelectVendor}
                  isWishlisted={wishlist.includes(vendor.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trust & Guarantee Section */}
        <section className="bg-gray-50 rounded-3xl p-8 border border-gray-200 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} className="text-brand-primary shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">100% Verified Partners</h4>
                <p className="text-xs text-gray-500 mt-0.5">Physically inspected & Aadhaar/GST verified</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles size={24} className="text-brand-primary shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">Direct Escrow Advance</h4>
                <p className="text-xs text-gray-500 mt-0.5">Pay only 5% advance to lock your date</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Headphones size={24} className="text-brand-primary shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">24/7 Celebration Concierge</h4>
                <p className="text-xs text-gray-500 mt-0.5">Dedicated event assistance whenever you need</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star size={24} className="text-brand-primary shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">Best Price Guarantee</h4>
                <p className="text-xs text-gray-500 mt-0.5">Direct vendor rates with zero brokerage</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
