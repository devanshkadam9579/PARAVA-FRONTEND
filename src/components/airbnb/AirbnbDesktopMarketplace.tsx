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
  User as UserIcon, Heart, LogOut, ArrowRight, Shield, Award, Clock,
  Search, Filter, X, SlidersHorizontal, MapPin
} from 'lucide-react';
import { FooterSection } from '../ui/footer-section';
import { BendingMarquee } from '../ui/bending-marquee';
import { ScrollVelocity } from '../ui/scroll-velocity';
import { VendorGridSkeleton } from '../ui/skeleton-cards';

export interface AirbnbDesktopMarketplaceProps {
  promos?: any[];
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
  onOpenLogin: (tab?: 'signin' | 'signup') => void;
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
  onPay: (bookingDetails?: any) => void;
  couponDiscount: number;
  couponCode: string;
  setCouponCode: (c: string) => void;
  onApplyCoupon: () => void;
  couponMessage: string;
  bookings: Booking[];
  onDownloadVoucher: (b: Booking) => void;
  onCancelBooking: (bookingId: string, reason: string) => Promise<void>;
  onSubmitReview: (bookingId: string, vendorId: string, rating: number, comment: string) => Promise<void>;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
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
  promos = [],
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
  onSubmitReview,
  searchQuery: externalSearchQuery,
  onSearchQueryChange
}: AirbnbDesktopMarketplaceProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>('recommended');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (onSearchQueryChange) onSearchQueryChange(val);
    setInternalSearchQuery(val);
  };

  // Flexible category matching helper
  const isCategoryMatch = (vendor: Vendor, targetCategory: string) => {
    if (!targetCategory || targetCategory === 'all' || targetCategory.toLowerCase() === 'all services') return true;
    const target = targetCategory.toLowerCase().trim();
    const vCat = (vendor.category || '').toLowerCase().trim();
    
    if (vCat === target || vCat.includes(target) || target.includes(vCat)) return true;

    // Keyword synonyms
    if (target.includes('cater') && vCat.includes('cater')) return true;
    if ((target.includes('decor') || target.includes('mandap')) && (vCat.includes('decor') || vCat.includes('mandap'))) return true;
    if ((target.includes('photo') || target.includes('camera') || target.includes('video')) && (vCat.includes('photo') || vCat.includes('cinematography'))) return true;
    if ((target.includes('dj') || target.includes('music') || target.includes('sound') || target.includes('band')) && (vCat.includes('dj') || vCat.includes('music') || vCat.includes('sound'))) return true;
    if ((target.includes('hall') || target.includes('venue') || target.includes('banquet') || target.includes('lawn')) && (vCat.includes('hall') || vCat.includes('venue') || vCat.includes('banquet'))) return true;
    if ((target.includes('makeup') || target.includes('make-up') || target.includes('beauty') || target.includes('salon')) && (vCat.includes('makeup') || vCat.includes('beauty'))) return true;
    if ((target.includes('pandit') || target.includes('priest') || target.includes('puja')) && (vCat.includes('pandit') || vCat.includes('priest'))) return true;
    if ((target.includes('cake') || target.includes('dessert') || target.includes('baker')) && (vCat.includes('cake') || vCat.includes('dessert') || vCat.includes('baker'))) return true;

    if (vendor.categories && Array.isArray(vendor.categories)) {
      return vendor.categories.some(c => {
        const cLower = c.toLowerCase().trim();
        return cLower === target || cLower.includes(target) || target.includes(cLower);
      });
    }
    return false;
  };

  // Filter & Sort vendors
  const filteredVendors = vendors
    .filter((v) => {
      const matchesCategory = isCategoryMatch(v, selectedCategory);
      const matchesCity = !currentCity || currentCity.toLowerCase() === 'all' || (v.location || '').toLowerCase().includes(currentCity.toLowerCase());
      
      const sq = activeSearchQuery.toLowerCase().trim();
      const matchesSearch = !sq || 
        (v.name || '').toLowerCase().includes(sq) ||
        (v.category || '').toLowerCase().includes(sq) ||
        (v.tagline || '').toLowerCase().includes(sq) ||
        (v.description || '').toLowerCase().includes(sq) ||
        (v.location || '').toLowerCase().includes(sq) ||
        (v.features || []).some(f => f.toLowerCase().includes(sq)) ||
        (v.services || []).some(s => (s.name || '').toLowerCase().includes(sq) || (s.description || '').toLowerCase().includes(sq));

      const price = v.basePrice || 0;
      const matchesMin = minPrice === '' || price >= Number(minPrice);
      const matchesMax = maxPrice === '' || price <= Number(maxPrice);
      const matchesRating = minRating === 0 || (v.rating || 0) >= minRating;

      return matchesCategory && matchesCity && matchesSearch && matchesMin && matchesMax && matchesRating;
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
          onOpenLogin={onOpenLogin}
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

  const [selectedChatVendorId, setSelectedChatVendorId] = useState<string | null>(null);

  // 3. Bookings Tab View
  if (activeTab === 'bookings') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {renderNavbar()}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MyBookingsView
            bookings={bookings}
            onOpenChatWithVendor={(vendorId, bookingId) => {
              setSelectedChatVendorId(vendorId);
              onNavigateTab('chat');
            }}
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
          <ChatTab
            vendors={vendors}
            bookings={bookings}
            currentUser={currentUser}
            initialVendorId={selectedChatVendorId}
            onOpenLogin={() => onOpenLogin?.('signin')}
            onShowNotification={(msg) => console.log(msg)}
          />
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
        searchQuery={activeSearchQuery}
        onSearchQueryChange={handleSearchChange}
      />

      {/* Compact Airbnb Category Filter Rail */}
      <div id="category-filter-rail" className="scroll-mt-20">
        <AirbnbCategoryRail
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Main Centered Marketplace Content */}
      <main id="marketplace-cards-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 scroll-mt-6">

        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-gray-50/80 border border-gray-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={activeSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search vendors, banquet halls, photographers, decorators in ${currentCity}...`}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition"
              />
              {activeSearchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition shadow-xs cursor-pointer"
              >
                <option value="recommended">⭐ Top Rated</option>
                <option value="price_low">₹ Price: Low to High</option>
                <option value="price_high">₹ Price: High to Low</option>
                <option value="rating">★ Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Pills: Price Min/Max, Rating, Reset */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200/60 flex-wrap text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Price Range */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-500">Price (₹):</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-rose-500"
                />
              </div>

              {/* Rating Filter Pills */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-500">Rating:</span>
                {[0, 4.0, 4.5, 4.8].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setMinRating(rate)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition ${
                      minRating === rate 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {rate === 0 ? 'All' : `${rate}★+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters / Result Count */}
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-gray-700">
                {filteredVendors.length} {filteredVendors.length === 1 ? 'Specialist' : 'Specialists'}
              </span>
              {(activeSearchQuery || minPrice !== '' || maxPrice !== '' || minRating !== 0) && (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinRating(0);
                    setSortBy('recommended');
                  }}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vendors Loading State */}
        {vendors.length === 0 ? (
          <VendorGridSkeleton count={8} />
        ) : selectedCategory !== 'all' ? (
          /* Focused Category Grid View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">
                  {selectedCategory} Specialists in {currentCity}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Showing {filteredVendors.length} verified {selectedCategory.toLowerCase()} partners with 5% escrow protection
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="text-xs font-black text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                View all categories
              </button>
            </div>

            {filteredVendors.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl border border-gray-200/80 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  No {selectedCategory} specialists in {currentCity} yet
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto font-medium">
                  We are actively onboarding top-tier celebration partners in {currentCity}. Explore other categories or browse all verified services.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectCategory('all')}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition active:scale-95"
                >
                  Browse All Services
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
                {filteredVendors.map((vendor) => (
                  <AirbnbVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    className="w-full"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default "All Services" View with Curated Rails and Master Grid */
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
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
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
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
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
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </HorizontalSection>
            )}

            {/* Section 4: Horizontal Rail — Luxury Floral Decor */}
            {decorators.length > 0 && (
              <HorizontalSection
                title="Luxury Wedding Decor & Mandap Designs"
                subtitle="Bespoke marigold strings, kinetic lighting, and contemporary floral installations"
              >
                {decorators.map((vendor) => (
                  <AirbnbVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </HorizontalSection>
            )}

            {/* Velocity Text Strip */}
            <ScrollVelocity text="CELEBRATE • CONNECT • CREATE • PARVA • " />

            {/* Section 5: Horizontal Rail — Photography & Videography */}
            {photographers.length > 0 && (
              <HorizontalSection
                title="Celebration Photographers & Drone Cinematography"
                subtitle="Candid wedding photographers, pre-wedding shoots, and 4K aerial drone coverage"
              >
                {photographers.map((vendor) => (
                  <AirbnbVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </HorizontalSection>
            )}

            {/* Section 6: Horizontal Rail — Trending DJ & Sound */}
            {djs.length > 0 && (
              <HorizontalSection
                title="Trending DJ & Live Acoustic Bands"
                subtitle="Concert grade line-array sound systems, moving head beam lasers, and club DJs"
              >
                {djs.map((vendor) => (
                  <AirbnbVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    className="w-[280px] sm:w-[300px] md:w-[315px] shrink-0"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </HorizontalSection>
            )}

            {/* Section 7: All Verified Specialists Grid */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
                {filteredVendors.map((vendor) => (
                  <AirbnbVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    className="w-full"
                    onSelect={onSelectVendor}
                    isWishlisted={wishlist.includes(vendor.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

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
        <HowItWorksSection promos={promos} />
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
