import React, { useState } from 'react';
import { AirbnbNavbar } from './AirbnbNavbar';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';
import { AirbnbVendorCard } from './AirbnbVendorCard';
import { AirbnbVendorDetailView } from './AirbnbVendorDetailView';
import { AirbnbCheckoutView } from './AirbnbCheckoutView';
import { MyBookingsView } from './MyBookingsView';
import { CustomerProfileView } from './CustomerProfileView';
import { HorizontalSection } from './HorizontalSection';
import ChatTab from '../ChatTab';
import { Vendor, VendorServiceItem, Booking } from '../../types';
import { 
  ChevronRight, Sparkles, ShieldCheck, Headphones, Star, 
  User as UserIcon, Heart, LogOut, ArrowRight, Shield, Award, Clock
} from 'lucide-react';

export interface AirbnbDesktopMarketplaceProps {
  vendors: Vendor[];
  categories: { id: string; name: string; image?: string }[];
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
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  // Categorized vendor rails
  const popularVendors = filteredVendors.slice(0, 8);
  const banquetHalls = vendors.filter(v => (v.category || '').toLowerCase().includes('hall') || (v.category || '').toLowerCase().includes('venue'));
  const caterers = vendors.filter(v => (v.category || '').toLowerCase().includes('cater'));
  const decorators = vendors.filter(v => (v.category || '').toLowerCase().includes('decor'));
  const photographers = vendors.filter(v => (v.category || '').toLowerCase().includes('photo'));
  const djs = vendors.filter(v => (v.category || '').toLowerCase().includes('dj'));

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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-8">
          <MyBookingsView
            bookings={bookings}
            onOpenChatWithVendor={(vendorId, bookingId) => onNavigateTab('chat')}
            onDownloadVoucher={onDownloadVoucher}
            onCancelBooking={onCancelBooking}
            onSubmitReview={onSubmitReview}
            onExploreServices={() => onNavigateTab('home')}
          />
        </div>
      </div>
    );
  }

  // 4. Chat Tab View
  if (activeTab === 'chat') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
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
        <CustomerProfileView
          currentUser={currentUser}
          bookings={bookings}
          wishlist={wishlist}
          vendors={vendors}
          onSelectVendor={onSelectVendor}
          onNavigateTab={onNavigateTab}
          onLogout={onLogout}
          onOpenSupport={onOpenSupport}
        />
      </div>
    );
  }

  // 6. Homepage & Marketplace Feed (Default)
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

      {/* Main Full-Width Marketplace Content */}
      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-8 space-y-16">
        {/* Sort & Results Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <span className="text-xs sm:text-sm text-gray-500 font-bold">
            Showing {filteredVendors.length} verified celebration specialists in {currentCity}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 font-black text-gray-900 outline-none focus:border-rose-500 shadow-2xs"
            >
              <option value="recommended">Top Rated ⭐</option>
              <option value="price_low">Price: Low to High ₹</option>
              <option value="price_high">Price: High to Low ₹</option>
            </select>
          </div>
        </div>

        {/* Section 1: Horizontal Content Rail — Popular Specialists */}
        {popularVendors.length > 0 && (
          <HorizontalSection
            title={`Popular celebration specialists in ${currentCity}`}
            subtitle="Top-rated verified partners for weddings, birthdays, and grand celebrations"
            actionText="View all"
            onActionClick={() => {}}
          >
            {popularVendors.map((vendor) => (
              <AirbnbVendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                isWishlisted={wishlist.includes(vendor.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </HorizontalSection>
        )}

        {/* Section 2: Horizontal Rail — Banquet Halls & Royal Venues */}
        {banquetHalls.length > 0 && (
          <HorizontalSection
            title="Palatial Banquet Halls & Wedding Venues"
            subtitle="Grand ballrooms, air-conditioned banquet spaces, and landscaped lawn terraces"
          >
            {banquetHalls.map((vendor) => (
              <AirbnbVendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                isWishlisted={wishlist.includes(vendor.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </HorizontalSection>
        )}

        {/* Section 3: Horizontal Rail — Catering & Gourmet Dining */}
        {caterers.length > 0 && (
          <HorizontalSection
            title="Authentic Multi-Cuisine Catering"
            subtitle="Master chefs, royal Rajasthani & Maharashtrian thalis, and live counter buffets"
          >
            {caterers.map((vendor) => (
              <AirbnbVendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                isWishlisted={wishlist.includes(vendor.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </HorizontalSection>
        )}

        {/* Section 4: Horizontal Rail — Floral Decor & Stage Styling */}
        {decorators.length > 0 && (
          <HorizontalSection
            title="Luxury Wedding Decor & Mandap Designs"
            subtitle="Bespoke marigold strings, kinetic lighting, and contemporary floral installations"
          >
            {decorators.map((vendor) => (
              <AirbnbVendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                isWishlisted={wishlist.includes(vendor.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </HorizontalSection>
        )}

        {/* Section 5: All Verified Specialists (Ultra-Responsive Grid) */}
        <section className="space-y-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 font-display">
                All Verified Celebration Specialists in {currentCity}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Explore trusted professionals with direct 5% escrow advance protection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredVendors.map((vendor) => (
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

        {/* Trust & Guarantee Section */}
        <section className="bg-gray-50 rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-xs">
          <div className="max-w-4xl mx-auto text-center mb-10 space-y-2">
            <h3 className="text-2xl font-black text-gray-900 font-display">
              The Parva Celebration Guarantee
            </h3>
            <p className="text-xs text-gray-500 max-w-xl mx-auto font-medium">
              Every specialist is physically audited and verified to ensure your celebration runs flawlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">100% Verified Partners</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Physically inspected, GST & Aadhaar verified background checks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">5% Escrow Advance</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Lock your date with only 5% advance fee. Pay remaining at the event.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Headphones size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">24/7 Concierge Support</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Dedicated celebration specialist to assist you every step of the way.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Star size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Direct Price Assurance</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Zero middleman markups. Direct wholesale vendor pricing guaranteed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Comprehensive Marketplace Footer */}
      <footer className="border-t border-gray-200 bg-gray-50/50 mt-20">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-gray-200">
            <div className="space-y-3">
              <h5 className="font-black text-xs uppercase tracking-wider text-gray-900 font-display">Support</h5>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Help Centre</a></li>
                <li><a href="#" className="hover:text-gray-900">Cancellation Options</a></li>
                <li><a href="#" className="hover:text-gray-900">Safety & Verification</a></li>
                <li><a href="#" className="hover:text-gray-900">Escrow Guarantee</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-black text-xs uppercase tracking-wider text-gray-900 font-display">Specialists</h5>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-gray-900">List Your Service</a></li>
                <li><a href="#" className="hover:text-gray-900">Partner Portal Login</a></li>
                <li><a href="#" className="hover:text-gray-900">Vendor Pro Plans</a></li>
                <li><a href="#" className="hover:text-gray-900">Community Hub</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-black text-xs uppercase tracking-wider text-gray-900 font-display">Parva Events</h5>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About Us</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Press & News</a></li>
                <li><a href="#" className="hover:text-gray-900">Celebration Guides</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-black text-xs uppercase tracking-wider text-gray-900 font-display">Legal</h5>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gray-900">Refund Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Sitemap</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <span>© 2026 Parva Events Technologies Inc. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <span>English (IN)</span>
              <span>·</span>
              <span>₹ INR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
