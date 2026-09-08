import React, { useRef, useState, useEffect } from 'react';
import { Search, Sparkles, ShieldCheck, HeartHandshake, Award, Headphones, Star, ChevronLeft, ChevronRight, Tag, ArrowRight } from 'lucide-react';

export function HowItWorksSection({ promos = [] }: { promos?: any[] }) {
  const promoScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkPromoScroll = () => {
    if (promoScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = promoScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkPromoScroll();
    window.addEventListener('resize', checkPromoScroll);
    return () => window.removeEventListener('resize', checkPromoScroll);
  }, [promos]);

  const scrollPromos = (direction: 'left' | 'right') => {
    if (promoScrollRef.current) {
      const amount = direction === 'left' ? -480 : 480;
      promoScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const steps = [
    {
      step: '01',
      title: 'Discover Specialists',
      desc: 'Browse physically audited venues, caterers, decorators, and photographers in your city with transparent pricing.',
      icon: Search
    },
    {
      step: '02',
      title: 'Customize Your Package',
      desc: 'Select exact guest counts, time slots, and bespoke add-on options tailored to your event requirements.',
      icon: Sparkles
    },
    {
      step: '03',
      title: 'Lock with 5% Advance',
      desc: 'Secure your date under the Parva Escrow Guarantee. Pay only a 5% connection fee now.',
      icon: ShieldCheck
    },
    {
      step: '04',
      title: 'Celebrate Stress-Free',
      desc: 'Direct vendor execution with 24/7 Parva Concierge support. Pay remaining balance on event day.',
      icon: HeartHandshake
    }
  ];

  const defaultPromos = [
    {
      id: 'promo_def_1',
      title: '50% Off Pre-Wedding Drone Shoots',
      subtitle: 'Book any premium photographer today and get a complimentary 4K cinematic drone shoot.',
      badge: 'Special Deal',
      discount: '50% OFF',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 'promo_def_2',
      title: 'Free Royal Mandap Upgrade',
      subtitle: 'Valid on all luxury banquet hall bookings this month. Elevate your wedding decor.',
      badge: 'Free Upgrade',
      discount: 'Complimentary',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 'promo_def_3',
      title: 'Complimentary Live Dessert Counters',
      subtitle: 'Get 2 premium live catering counters absolutely free on bookings above 200 guests.',
      badge: 'Catering Offer',
      discount: 'Free Add-on',
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 'promo_def_4',
      title: 'Complimentary Bridal Makeup Trial',
      subtitle: 'Secure your HD Bridal Makeup package and get a 100% free personalized trial session.',
      badge: 'Beauty Offer',
      discount: 'Free Trial',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'
    }
  ];

  const displayPromos = promos && promos.length > 0 ? promos : defaultPromos;

  return (
    <div className="space-y-16">
      {/* How Parva Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
            How Parva Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            From inspiration to execution, booking your celebration is completely effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow relative space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black transition-transform group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <span className="text-3xl font-black font-display text-gray-200 group-hover:text-rose-200 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-gray-900 font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Promotional Banners — Clean, Clear, Unfiltered & Spacious */}
      <section className="bg-gradient-to-b from-rose-50/70 via-white to-gray-50/60 border border-rose-100 rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-sm relative overflow-hidden space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} className="text-rose-600" />
              <span>Exclusive Offers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-gray-900 tracking-tight">
              Celebrate more, spend less
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl">
              Unlock verified celebration packages and limited-time savings with direct 5% escrow protection.
            </p>
          </div>

          {/* Navigation Scroll Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollPromos('left')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-gray-900 flex items-center justify-center text-gray-800 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
              aria-label="Previous offers"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollPromos('right')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-gray-900 flex items-center justify-center text-gray-800 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
              aria-label="Next offers"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Large Unfiltered Promotional Rails */}
        <div 
          ref={promoScrollRef}
          onScroll={checkPromoScroll}
          className="flex gap-6 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
        >
          {displayPromos.map((promo, idx) => (
            <div
              key={promo.id || idx}
              className="w-[340px] sm:w-[480px] md:w-[560px] shrink-0 bg-white rounded-3xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group snap-start cursor-pointer"
            >
              {/* Promo Banner Image Container — 100% natural, crisp, zero filters */}
              <div className="relative w-full h-48 sm:h-64 bg-gray-100 overflow-hidden">
                {promo.image ? (
                  <img
                    src={promo.image}
                    alt={promo.title || 'Promotional Offer'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 flex items-center justify-center text-white">
                    <Sparkles size={48} className="text-white/80" />
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Tag size={12} />
                    <span>{promo.badge || 'Featured Offer'}</span>
                  </span>
                  {promo.discount && (
                    <span className="bg-amber-400 text-gray-950 text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">
                      {promo.discount}
                    </span>
                  )}
                </div>
              </div>

              {/* Promo Information Footer — High contrast, large and clearly readable */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-3 bg-white">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-xl font-black text-gray-900 font-display leading-snug group-hover:text-rose-600 transition-colors">
                    {promo.title || 'Special Celebration Offer'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">
                    {promo.subtitle || 'Book now to lock in this exclusive deal with our verified partners.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <span className="text-xs font-extrabold text-rose-600 flex items-center gap-1">
                    <span>5% Escrow Advance Protection</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-gray-900 group-hover:text-rose-600 group-hover:translate-x-1 transition-all">
                    <span>Claim Offer</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default HowItWorksSection;
