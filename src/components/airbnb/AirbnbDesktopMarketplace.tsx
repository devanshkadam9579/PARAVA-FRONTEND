import React, { useState } from 'react';
import { AirbnbNavbar } from './AirbnbNavbar';
import { HeroSection } from './HeroSection';
import { AirbnbVendorCard } from './AirbnbVendorCard';
import { AirbnbVendorDetailView } from './AirbnbVendorDetailView';
import { AirbnbCheckoutView } from './AirbnbCheckoutView';
import { MyBookingsView } from './MyBookingsView';
import { CustomerProfileView } from './CustomerProfileView';
import { HorizontalSection } from './HorizontalSection';
import { AirbnbCategoryRail } from './AirbnbCategoryRail';
import { HowItWorksSection } from './HowItWorksSection';
import ChatTab from '../ChatTab';
import { Vendor, VendorServiceItem, Booking } from '../../types';
import { 
  ChevronRight, ChevronLeft, Sparkles, ShieldCheck, Headphones, Star, 
  User as UserIcon, Heart, LogOut, ArrowRight, Shield, Award, Clock
} from 'lucide-react';
import { FooterSection } from '../ui/footer-section';
import { BendingMarquee } from '../ui/bending-marquee';
import { ScrollVelocity } from '../ui/scroll-velocity';
import { VendorGridSkeleton } from '../ui/skeleton-cards';

export interface AirbnbDesktopMarketplaceProps {
  vendors: Vendor[];
  categories: { id: string; name: string; image?: string; description?: string }[];
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

const ADDITIONAL_SERVICES = [
  { id: 'add_1', title: 'Mehendi Artists', image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&q=80&w=400', desc: 'Bridal & Arabic mehendi' },
  { id: 'add_2', title: 'Invitations & Stationery', image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=400', desc: 'Digital & luxury box invites' },
  { id: 'add_3', title: 'Return Gifts & Favors', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400', desc: 'Customized gift hampers' },
  { id: 'add_4', title: 'Bridal & Groom Entry', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400', desc: 'Floral chadar & smoke entry' },
  { id: 'add_5', title: 'Live Food Counters', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400', desc: 'Chaat, pasta & live barbeque' },
  { id: 'add_6', title: 'Bartenders & Mixology', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400', desc: 'Artisanal mocktails & bar setup' },
  { id: 'add_7', title: 'Event Anchors & MC', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=400', desc: 'Bilingual celebration hosts' },
  { id: 'add_8', title: 'Cold Fireworks & Pyro', image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&q=80&w=400', desc: 'Safe indoor sparkles & dry ice' },
  { id: 'add_9', title: 'Kids Entertainment', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=400', desc: 'Magicians, tattoo & games' },
  { id: 'add_10', title: 'Luxury Cars & Transport', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400', desc: 'Vintage & luxury bridal fleet' }
];

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
      if (sortBy === 'price_low') return (a.basePrice || 0) - (b.basePrice || 0);
      if (sortBy === 'price_high') return (b.basePrice || 0) - (a.basePrice || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  // Categorized vendor rails
  const popularVendors = filteredVendors.slice(0, 10);
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
        <FooterSection onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
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
        <FooterSection onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
      </div>
    );
  }

  // 3. Bookings Tab View
  if (activeTab === 'bookings') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MyBookingsView
            bookings={bookings}
            onOpenChatWithVendor={(vendorId, bookingId) => onNavigateTab('chat')}
            onDownloadVoucher={onDownloadVoucher}
            onCancelBooking={onCancelBooking}
            onSubmitReview={onSubmitReview}
            onExploreServices={() => onNavigateTab('home')}
          />
        </div>
        <FooterSection onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
      </div>
    );
  }

  // 4. Chat Tab View
  if (activeTab === 'chat') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ChatTab />
        </div>
        <FooterSection onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
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
        <FooterSection onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
      </div>
    );
  }

  // 6. Homepage & Marketplace Feed (Default)
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {renderNavbar()}

      {/* Hero Section with Embedded High-Visibility Search */}
      <HeroSection
        currentCity={currentCity}
        onSelectCity={onSelectCity}
        cities={cities}
        eventDate={planningStartDate}
        onDateChange={onDateChange}
        guestCount={planningGuestSize}
        onGuestCountChange={onGuestCountChange}
        onSearch={() => {}}
      />

      {/* Compact Airbnb Category Filter Rail */}
      <AirbnbCategoryRail
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {/* Main Centered Marketplace Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

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
              className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 font-black text-gray-900 outline-none focus:border-rose-500 shadow-2xs cursor-pointer"
            >
              <option value="recommended">Top Rated ⭐</option>
              <option value="price_low">Price: Low to High ₹</option>
              <option value="price_high">Price: High to Low ₹</option>
            </select>
          </div>
        </div>

        {/* Vendors Loading State */}
        {vendors.length === 0 ? (
          <VendorGridSkeleton count={8} />
        ) : (
          <>
            {/* Section 1: Horizontal Rail — Popular Specialists */}
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

            {/* Section 4: Explore More Services Section with Consistent Image Cards */}
            <section className="space-y-4 pt-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                    Explore More Celebration Services
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Complete your celebration checklist with verified add-on specialists
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
                {ADDITIONAL_SERVICES.map((svc) => (
                  <div
                    key={svc.id}
                    className="group flex flex-col shrink-0 w-[200px] sm:w-[220px] rounded-3xl border border-gray-200/90 hover:border-gray-400 p-3 bg-white shadow-2xs hover:shadow-sm transition-all duration-300 select-none snap-start cursor-pointer"
                  >
                    <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-100 mb-2.5">
                      <img
                        src={svc.image}
                        alt={svc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate group-hover:text-rose-600 transition-colors">
                      {svc.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                      {svc.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Horizontal Rail — Luxury Floral Decor */}
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

            {/* Velocity Text Strip */}
            <ScrollVelocity text="CELEBRATE • CONNECT • CREATE • PARVA • " />

            {/* Section 6: Horizontal Rail — Photography & Videography */}
            {photographers.length > 0 && (
              <HorizontalSection
                title="Celebration Photographers & Drone Cinematography"
                subtitle="Candid wedding photographers, pre-wedding shoots, and 4K aerial drone coverage"
              >
                {photographers.map((vendor) => (
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

            {/* Section 7: Horizontal Rail — Trending DJ & Sound */}
            {djs.length > 0 && (
              <HorizontalSection
                title="Trending DJ & Live Acoustic Bands"
                subtitle="Concert grade line-array sound systems, moving head beam lasers, and club DJs"
              >
                {djs.map((vendor) => (
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

            {/* Section 8: All Verified Specialists Grid */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          </>
        )}

        {/* How It Works & Escrow Guarantee */}
        <HowItWorksSection />
      </main>

      {/* Polished Light Marketplace Footer */}
      <FooterSection
        onNavigateTab={onNavigateTab}
        onOpenSupport={onOpenSupport}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
}
export default AirbnbDesktopMarketplace;
