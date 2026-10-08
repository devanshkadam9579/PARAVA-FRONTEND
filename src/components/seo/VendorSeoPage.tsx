import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, ShieldCheck, MapPin, CheckCircle2, Calendar, Clock, ArrowRight, Share2, Heart, Sparkles, Check, Phone, MessageSquare } from 'lucide-react';
import { Vendor, VendorServiceItem } from '../../types';
import { buildCanonicalUrl, generateVendorSlug, SEO_KOLHAPUR_ROUTES, SITE_URL } from '../../utils/seo';

interface VendorSeoPageProps {
  vendor: Vendor;
  allVendors: Vendor[];
  onBookService: (service: VendorServiceItem) => void;
  onOpenChat?: (vendorId: string) => void;
  onSelectVendor?: (vendor: Vendor) => void;
  currentUser?: any;
}

export function VendorSeoPage({
  vendor,
  allVendors,
  onBookService,
  onOpenChat,
  onSelectVendor,
  currentUser
}: VendorSeoPageProps) {
  const navigate = useNavigate();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedService, setSelectedService] = useState<VendorServiceItem | null>(vendor.services?.[0] || null);

  const vendorSlug = generateVendorSlug(vendor);
  const canonicalUrl = buildCanonicalUrl(`/vendor/${vendorSlug}`);
  const city = vendor.location?.toLowerCase().includes('kolhapur') ? 'Kolhapur' : (vendor.location || 'Maharashtra');

  // Find corresponding category route
  const matchingCategoryRoute = Object.entries(SEO_KOLHAPUR_ROUTES).find(([_, cfg]) => 
    cfg.category.toLowerCase() === (vendor.category || '').toLowerCase()
  );
  const categoryPath = matchingCategoryRoute ? matchingCategoryRoute[0] : '/event-vendors-kolhapur';
  const categoryLabel = matchingCategoryRoute ? matchingCategoryRoute[1].h1 : `${vendor.category} in Kolhapur`;

  const coverImage = vendor.images?.[selectedImageIdx] || vendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200';
  const startingPrice = vendor.services?.[0]?.price || vendor.basePrice || vendor.minBudget || 0;

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': categoryLabel,
        'item': `${SITE_URL}${categoryPath}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': vendor.name,
        'item': canonicalUrl
      }
    ]
  };

  // LocalBusiness schema (Phase 13: truthful only, no invented ratings)
  const localBusinessSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': vendor.name,
    'description': vendor.description || vendor.tagline,
    'url': canonicalUrl,
    'image': vendor.images || [coverImage],
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': vendor.location || 'Kolhapur',
      'addressLocality': city,
      'addressRegion': 'Maharashtra',
      'addressCountry': 'IN'
    }
  };

  if (vendor.rating && vendor.rating > 0 && vendor.reviewCount && vendor.reviewCount > 0) {
    localBusinessSchema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': vendor.rating,
      'reviewCount': vendor.reviewCount,
      'bestRating': 5,
      'worstRating': 1
    };
  }

  if (startingPrice > 0) {
    localBusinessSchema.priceRange = `₹${startingPrice.toLocaleString('en-IN')}+`;
  }

  // Related vendors in the same category
  const relatedVendors = (allVendors || [])
    .filter(v => v.id !== vendor.id && (v.category || '').toLowerCase() === (vendor.category || '').toLowerCase())
    .slice(0, 3);

  const pageTitle = `${vendor.name} | ${vendor.category} in ${city} | Parva`;
  const metaDesc = `${vendor.name} is a verified ${vendor.category} in ${city}. Explore packages, photos, customer reviews, and direct reservation on Parva.`;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="business.business" />
        <meta property="og:image" content={coverImage} />
        <meta property="og:site_name" content="Parva Events" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={coverImage} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500">
          <Link to="/" className="hover:text-[#EC003F] transition-colors">Home</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <Link to={categoryPath} className="hover:text-[#EC003F] transition-colors">{categoryLabel}</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-900 font-bold truncate">{vendor.name}</span>
        </nav>

        {/* Top Header */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-rose-50 text-[#EC003F] border border-rose-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {vendor.category}
            </span>
            {vendor.verified && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Verified Parva Partner</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            {vendor.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-[#EC003F]" />
              <span>{vendor.location || 'Kolhapur, Maharashtra'}</span>
            </div>

            {vendor.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-gray-900">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{vendor.rating.toFixed(1)}</span>
                {vendor.reviewCount > 0 && (
                  <span className="text-gray-400 font-normal">({vendor.reviewCount} reviews)</span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Image Gallery */}
        <section aria-label="Vendor Photo Gallery" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 aspect-16/10 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs">
            <img
              src={coverImage}
              alt={`${vendor.name} showcase photo in ${city}`}
              className="w-full h-full object-cover"
            />
          </div>

          {vendor.images && vendor.images.length > 1 && (
            <div className="lg:col-span-4 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
              {vendor.images.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative flex-1 aspect-16/10 rounded-2xl overflow-hidden border-2 transition cursor-pointer ${
                    selectedImageIdx === idx ? 'border-[#EC003F]' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${vendor.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Main Content & Sticky Booking Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4">
          
          {/* Left Column: Details, Services, Reviews */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* About */}
            <section className="space-y-3">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">About {vendor.name}</h2>
              <p className="text-base text-gray-700 leading-relaxed font-normal">
                {vendor.description || vendor.tagline}
              </p>
            </section>

            {/* Inclusions & Amenities */}
            {vendor.inclusions && vendor.inclusions.length > 0 && (
              <section className="space-y-3 pt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Service Inclusions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vendor.inclusions.map((inc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Features */}
            {vendor.features && vendor.features.length > 0 && (
              <section className="space-y-3 pt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Features & Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.features.map((feat, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                      {feat}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Available Services & Packages Menu */}
            {vendor.services && vendor.services.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Available Services & Packages
                </h2>
                <div className="space-y-3">
                  {vendor.services.map((srv, idx) => {
                    const isSelected = selectedService?.name === srv.name;
                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected ? 'border-[#EC003F] bg-rose-50/30 shadow-xs' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-base text-gray-900">{srv.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{srv.description}</p>
                          <span className="text-xs font-semibold text-gray-400 block">{srv.unit || 'Standard Package'}</span>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                          <span className="text-lg font-black text-[#EC003F]">
                            ₹{srv.price.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedService(srv);
                              onBookService(srv);
                            }}
                            className="bg-[#EC003F] hover:bg-[#D40038] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            Select & Book
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Real Reviews */}
            {vendor.reviews && vendor.reviews.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Customer Reviews ({vendor.reviews.length})
                </h2>
                <div className="space-y-3">
                  {vendor.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{rev.userName}</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Column: Sticky Booking / Action Card */}
          <div className="lg:col-span-5">
            <aside className="sticky top-24 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-xl space-y-6">
              
              <div className="border-b border-gray-100 pb-4 space-y-1">
                <span className="text-xs uppercase font-bold text-gray-400">Advance Connection Fee</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">
                    {startingPrice > 0 ? `₹${Math.round(startingPrice * 0.05).toLocaleString('en-IN')}` : '₹500'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">5% escrow advance</span>
                </div>
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 pt-1">
                  <ShieldCheck size={14} /> 100% Escrow Protected Booking
                </p>
              </div>

              {selectedService ? (
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-1 text-xs">
                  <span className="text-gray-400 font-bold uppercase block text-[10px]">Selected Package</span>
                  <p className="font-extrabold text-sm text-gray-900">{selectedService.name}</p>
                  <p className="font-black text-[#EC003F] text-base">₹{selectedService.price.toLocaleString('en-IN')}</p>
                </div>
              ) : null}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const srv = selectedService || vendor.services?.[0] || { name: 'Full Service Package', price: startingPrice, description: vendor.tagline, unit: 'Event' };
                    onBookService(srv);
                  }}
                  className="w-full bg-[#EC003F] hover:bg-[#D40038] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer text-base flex items-center justify-center gap-2"
                >
                  <span>Book {vendor.name}</span>
                  <ArrowRight size={18} />
                </button>

                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() => onOpenChat(vendor.id)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-5 rounded-2xl transition cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    <span>Chat with Specialist</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Only 5% charged now to lock your date</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Remaining balance payable directly on event day</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Free cancellation window per vendor policy</span>
                </div>
              </div>

            </aside>
          </div>

        </div>

        {/* Related Vendors in Kolhapur */}
        {relatedVendors.length > 0 && (
          <section className="space-y-4 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Other {vendor.category} Specialists in Kolhapur
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedVendors.map(rv => (
                <article key={rv.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <img
                      src={rv.images?.[0] || coverImage}
                      alt={`${rv.name} - ${rv.category} in Kolhapur`}
                      className="w-full aspect-16/10 rounded-xl object-cover"
                    />
                    <h3 className="font-extrabold text-sm text-gray-900">{rv.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{rv.location || 'Kolhapur'}</p>
                  </div>
                  <Link
                    to={`/vendor/${generateVendorSlug(rv)}`}
                    className="text-xs font-extrabold text-[#EC003F] hover:text-[#D40038] flex items-center gap-1 transition"
                  >
                    <span>View Profile</span>
                    <ChevronRight size={13} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default VendorSeoPage;
