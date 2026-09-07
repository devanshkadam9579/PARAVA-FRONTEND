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
import AccordionGallery from '../reactbits/AccordionGallery';
import LogoLoop from '../reactbits/LogoLoop';
import FlowingMenu from '../reactbits/FlowingMenu';
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
          <span className="text-sm sm:text-base text-gray-500 font-bold">
            Showing {filteredVendors.length} verified celebration specialists in {currentCity}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-semibold hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border-2 border-rose-500 rounded-full px-5 py-2 font-bold text-gray-900 outline-none focus:ring-4 focus:ring-rose-100 hover:border-rose-600 transition shadow-sm cursor-pointer appearance-none relative pr-10 hover:bg-gray-50 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1.2em_1.2em]"
            >
              <option value="recommended" className="bg-white text-gray-900 font-semibold hover:bg-blue-600 hover:text-white">Top Rated ⭐</option>
              <option value="price_low" className="bg-white text-gray-900 font-semibold hover:bg-blue-600 hover:text-white">Price: Low to High ₹</option>
              <option value="price_high" className="bg-white text-gray-900 font-semibold hover:bg-blue-600 hover:text-white">Price: High to Low ₹</option>
            </select>
          </div>
        </div>

        {/* Vendors Loading State */}
        {vendors.length === 0 ? (
          <VendorGridSkeleton count={8} />
        ) : (
          <div className="space-y-12">
            {/* Section 1: Horizontal Rail — Popular Specialists */}
            {popularVendors.length > 0 && (
              <HorizontalSection
                title={`Popular celebration specialists in ${currentCity}`}
                subtitle="Top-rated verified partners for weddings, birthdays, and grand celebrations"
                actionText="View all"
                onActionClick={() => onSelectCategory('all')}
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
          </div>
        )}

        {/* Events take place with MyParva - Accordion Gallery */}
        <section className="space-y-6 pt-10 pb-6 border-t border-gray-100">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
              Events That Came to Life with MyParva
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Explore some of the stunning celebrations made possible by our verified vendor partners.
            </p>
          </div>
          <div className="w-full max-w-5xl mx-auto h-[400px]">
            <AccordionGallery
              items={[
                { image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900', label: 'Grand Weddings', link: '#' },
                { image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=900', label: 'Luxury Decor', link: '#' },
                { image: 'https://images.unsplash.com/photo-1533147670608-2a2f9776d3ac?auto=format&fit=crop&q=80&w=900', label: 'Birthday Bashes', link: '#' },
                { image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=900', label: 'Catering Extravaganza', link: '#' },
                { image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=900', label: 'Live DJ Nights', link: '#' }
              ]}
              defaultIndex={2}
              expandRatio={0.5}
              trigger="hover"
              grayscale={false}
            />
          </div>
        </section>

        {/* Logo Loop - Tech / Partners */}
        <section className="py-8 border-y border-gray-100 bg-gray-50 overflow-hidden">
          <div className="text-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Trusted by the best event partners
            </h3>
          </div>
          <LogoLoop
            logos={[
              { src: '/parva-logo.png', alt: 'MyParva', title: 'MyParva' },
              { src: '/parva-logo.png', alt: 'MyParva', title: 'MyParva' },
              { src: '/parva-logo.png', alt: 'MyParva', title: 'MyParva' },
              { src: '/parva-logo.png', alt: 'MyParva', title: 'MyParva' },
              { src: '/parva-logo.png', alt: 'MyParva', title: 'MyParva' }
            ]}
            speed={40}
            direction="left"
            logoHeight={24}
            gap={60}
            fadeOut={true}
            fadeOutColor="#f9fafb"
          />
        </section>

        {/* Flowing Menu - Popular Destinations */}
        <section className="space-y-6 pt-10 pb-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
              Trending Destinations
            </h2>
          </div>
          <div style={{ height: '400px', position: 'relative' }}>
            <FlowingMenu 
              items={[
                { link: '#', text: 'Kolhapur', image: 'https://images.unsplash.com/photo-1596706443729-28c067e7d692?q=80&w=600&h=400&fit=crop' },
                { link: '#', text: 'Pune', image: 'https://images.unsplash.com/photo-1593026775323-a55e2e8e97a3?q=80&w=600&h=400&fit=crop' },
                { link: '#', text: 'Mumbai', image: 'https://images.unsplash.com/photo-1522211984282-588267026df9?q=80&w=600&h=400&fit=crop' },
                { link: '#', text: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&h=400&fit=crop' }
              ]} 
              speed={20}
              bgColor="#ffffff"
              textColor="#111827"
              marqueeBgColor="#f3f4f6"
              marqueeTextColor="#f43f5e"
              borderColor="#e5e7eb"
            />
          </div>
        </section>

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
