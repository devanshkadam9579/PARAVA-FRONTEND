import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, ShieldCheck, MapPin, CheckCircle2, HelpCircle, ArrowRight, Sparkles, Building2, Utensils, Camera, Music, Palette, ClipboardList, Cake } from 'lucide-react';
import { Vendor } from '../../types';
import { SeoPageConfig, SEO_KOLHAPUR_ROUTES, buildCanonicalUrl, generateVendorSlug, SITE_URL } from '../../utils/seo';

interface SeoLandingPageProps {
  config: SeoPageConfig;
  vendors: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  onOpenLogin?: () => void;
  currentUser?: any;
}

export function SeoLandingPage({
  config,
  vendors,
  onSelectVendor,
  onOpenLogin,
  currentUser
}: SeoLandingPageProps) {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Filter real vendors for this city and category
  const filteredVendors = vendors.filter(v => {
    if (!v) return false;
    const locLower = (v.location || '').toLowerCase();
    const cityMatch = locLower.includes(config.city.toLowerCase()) || locLower.includes('maharashtra') || true; // Fallback to inventory
    
    if (config.category === 'all') return cityMatch;
    
    const catLower = (v.category || '').toLowerCase();
    const targetCatLower = config.category.toLowerCase();
    
    return catLower.includes(targetCatLower) || targetCatLower.includes(catLower);
  });

  const canonicalUrl = buildCanonicalUrl(config.path);

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
        'name': 'Event Vendors Kolhapur',
        'item': `${SITE_URL}/event-vendors-kolhapur`
      },
      ...(config.category !== 'all' ? [{
        '@type': 'ListItem',
        'position': 3,
        'name': config.h1,
        'item': canonicalUrl
      }] : [])
    ]
  };

  // ItemList schema of real vendors
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': config.h1,
    'description': config.metaDescription,
    'numberOfItems': filteredVendors.length,
    'itemListElement': filteredVendors.slice(0, 10).map((v, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': v.name,
      'url': `${SITE_URL}/vendor/${generateVendorSlug(v)}`
    }))
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.metaDescription} />
        <meta name="keywords" content={config.keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/parva-logo.png`} />
        <meta property="og:site_name" content="Parva Events" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.metaDescription} />
        <meta name="twitter:image" content={`${SITE_URL}/parva-logo.png`} />

        {/* Structured Data JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        {filteredVendors.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(itemListSchema)}
          </script>
        )}
      </Helmet>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 sm:space-y-14">
        
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500">
          <Link to="/" className="hover:text-[#EC003F] transition-colors">Home</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <Link to="/event-vendors-kolhapur" className="hover:text-[#EC003F] transition-colors">Kolhapur</Link>
          {config.category !== 'all' && (
            <>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-gray-900 font-bold truncate">{config.category}</span>
            </>
          )}
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-[#EC003F] border border-rose-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>{config.heroTagline}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            {config.h1}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            {config.introDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {config.bulletPoints.map((point, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#EC003F] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">{point}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Real Vendor Showcase Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Available {config.category === 'all' ? 'Event Vendors' : config.category} in {config.city}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Showing {filteredVendors.length} verified partner{filteredVendors.length === 1 ? '' : 's'} available for online booking.
              </p>
            </div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-10 text-center space-y-3">
              <h3 className="text-lg font-bold text-gray-800">Vendors in this category are being verified</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                We are actively onboarding top specialists in Kolhapur. Explore our all-vendors directory or request personalized concierge support.
              </p>
              <Link
                to="/event-vendors-kolhapur"
                className="inline-flex items-center gap-2 bg-[#EC003F] hover:bg-[#D40038] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition"
              >
                <span>Browse All Kolhapur Vendors</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredVendors.map((vendor) => {
                const vendorSlug = generateVendorSlug(vendor);
                const startingPrice = vendor.services?.[0]?.price || vendor.basePrice || vendor.minBudget || 0;
                const coverImage = vendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800';

                return (
                  <article
                    key={vendor.id}
                    className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image with alt text */}
                    <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                      <img
                        src={coverImage}
                        alt={`${vendor.name} - ${vendor.category} in ${vendor.location || 'Kolhapur'}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                        {vendor.category}
                      </div>
                      {vendor.verified && (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <ShieldCheck size={12} />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 truncate">
                            {vendor.name}
                          </h3>
                          {vendor.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-800 shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{vendor.rating.toFixed(1)}</span>
                              {vendor.reviewCount > 0 && (
                                <span className="text-gray-400 font-normal">({vendor.reviewCount})</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <MapPin size={13} className="text-[#EC003F] shrink-0" />
                          <span className="truncate">{vendor.location || 'Kolhapur'}</span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {vendor.tagline || vendor.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Starting from</span>
                          <span className="text-base font-black text-gray-900">
                            {startingPrice > 0 ? `₹${startingPrice.toLocaleString('en-IN')}` : 'Custom Quote'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectVendor(vendor);
                            navigate(`/vendor/${vendorSlug}`);
                          }}
                          className="bg-[#EC003F] hover:bg-[#D40038] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>View & Book</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Local FAQ Section */}
        {config.faqs && config.faqs.length > 0 && (
          <section className="bg-gray-50/70 border border-gray-200/80 rounded-3xl p-6 sm:p-10 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <HelpCircle size={22} className="text-[#EC003F]" />
                <span>Frequently Asked Questions</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Everything you need to know about booking {config.category === 'all' ? 'event services' : config.category.toLowerCase()} in Kolhapur.
              </p>
            </div>

            <div className="space-y-3">
              {config.faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-gray-900 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Internal Linking Architecture (Phase 15): Related Kolhapur Categories */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Explore All Event Categories in Kolhapur
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(SEO_KOLHAPUR_ROUTES).map(([routePath, routeConfig]) => {
              if (routePath === config.path) return null;
              return (
                <Link
                  key={routePath}
                  to={routePath}
                  className="p-3.5 rounded-2xl bg-gray-50 hover:bg-rose-50 border border-gray-200/70 hover:border-rose-200 text-xs sm:text-sm font-bold text-gray-800 hover:text-[#EC003F] transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{routeConfig.h1}</span>
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-[#EC003F] shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

export default SeoLandingPage;
