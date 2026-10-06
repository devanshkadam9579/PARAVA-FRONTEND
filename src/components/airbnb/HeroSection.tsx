import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AirbnbSearchCapsule } from './AirbnbSearchCapsule';
import { getDb } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface HeroSlide {
  id: string;
  category: string;
  image: string;
  badgeLabel?: string;
  highlightText?: string;
}

export interface HeroSectionProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
  eventDate: string;
  onDateChange: (date: string) => void;
  guestCount: number;
  onGuestCountChange: (guests: number) => void;
  onSearch: () => void;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'caterer',
    category: 'Catering',
    image: '/hero/hero-caterer-clean.png',
    badgeLabel: 'Catering & Food',
    highlightText: 'delicious feasts.'
  },
  {
    id: 'planner',
    category: 'Event Planners',
    image: '/hero/hero-planner-clean.png',
    badgeLabel: 'Event Planning',
    highlightText: 'seamless planning.'
  },
  {
    id: 'dj',
    category: 'DJ & Sound',
    image: '/hero/hero-dj-clean.png',
    badgeLabel: 'DJ & Sound',
    highlightText: 'high-energy beats.'
  },
  {
    id: 'decorator',
    category: 'Decorators',
    image: '/hero/hero-decorator-clean.png',
    badgeLabel: 'Decorators',
    highlightText: 'stunning decor.'
  }
];

const DEFAULT_HERO_CONFIG = {
  badgeText: "India's Trusted Event Services Marketplace",
  titleLine1: "Plan less,",
  titleHighlight: "celebrate more.",
  subtitle: "Discover trusted vendors, services and experiences for your event.",
  trustPoint1: "Verified Vendors",
  trustPoint2: "Secure Booking",
  trustPoint3: "Best Prices",
  slides: DEFAULT_SLIDES
};

/**
 * Text reveal typing animation with blur-to-sharp transition
 */
function BlurRevealTypingText({
  text,
  className = ''
}: {
  text: string;
  className?: string;
}) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    if (!text || text.length === 0) return;

    let idx = 0;
    const speed = 40; // ms per character
    const timer = setInterval(() => {
      idx++;
      setRevealedCount(idx);
      if (idx >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className={`inline-block ${className}`}>
      {text.split('').map((char, index) => {
        const isRevealed = index < revealedCount;
        return (
          <span
            key={index}
            className="inline-block transition-all duration-300"
            style={{
              opacity: isRevealed ? 1 : 0,
              filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
              transform: isRevealed ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
}

export function HeroSection({
  currentCity,
  onSelectCity,
  cities,
  eventDate,
  onDateChange,
  guestCount,
  onGuestCountChange,
  onSearch,
  searchQuery,
  onSearchQueryChange
}: HeroSectionProps) {
  const [heroConfig, setHeroConfig] = useState(DEFAULT_HERO_CONFIG);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Subscribe to live hero configuration from Firestore settings/hero
  useEffect(() => {
    try {
      const db = getDb();
      if (!db) return;
      const unsub = onSnapshot(doc(db, 'settings', 'hero'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHeroConfig(prev => ({
            badgeText: data.badgeText || prev.badgeText,
            titleLine1: data.titleLine1 || prev.titleLine1,
            titleHighlight: data.titleHighlight || prev.titleHighlight,
            subtitle: data.subtitle || prev.subtitle,
            trustPoint1: data.trustPoint1 || prev.trustPoint1,
            trustPoint2: data.trustPoint2 || prev.trustPoint2,
            trustPoint3: data.trustPoint3 || prev.trustPoint3,
            slides: Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : prev.slides
          }));
        }
      }, (err) => {
        console.debug('[HeroSection] Firestore sync notice:', err?.message);
      });
      return unsub;
    } catch (e) {
      console.debug('[HeroSection] Firestore init notice:', e);
    }
  }, []);

  const slides = heroConfig.slides && heroConfig.slides.length > 0 ? heroConfig.slides : DEFAULT_SLIDES;

  // Auto-rotate slides seamlessly every 5.5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Determine current blur-reveal typing highlight phrase
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const currentHighlight = activeSlide?.highlightText || heroConfig.titleHighlight || "celebrate more.";

  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 2xl:px-12 pt-6 pb-4 font-sans bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Copy, Blur Reveal Typing Headline, Trust Points, Search Capsule */}
        <div className="lg:col-span-7 xl:col-span-6 space-y-6 text-left">
          {/* Top Tagline Badge - Parva Brand Theme from Navbar: #EC003F & #FFF0F3 */}
          <div className="inline-flex items-center gap-2 bg-[#FFF0F3] text-[#EC003F] px-4 py-1.5 rounded-full text-xs font-bold border border-[#FFCCD5] shadow-xs">
            <Sparkles size={14} className="text-[#EC003F]" />
            <span>{heroConfig.badgeText}</span>
          </div>

          {/* Main Headline with Blur-Reveal Typing Animation in Parva #EC003F */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-[#111827] leading-[1.12]">
            {heroConfig.titleLine1} <br />
            <BlurRevealTypingText 
              text={currentHighlight} 
              className="text-[#EC003F] min-h-[1.2em]" 
            />
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-600 font-medium max-w-xl leading-relaxed">
            {heroConfig.subtitle}
          </p>

          {/* Trust Checkmarks - Brand #EC003F */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs sm:text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#EC003F] fill-[#FFF0F3]" />
              <span>{heroConfig.trustPoint1}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#EC003F] fill-[#FFF0F3]" />
              <span>{heroConfig.trustPoint2}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#EC003F] fill-[#FFF0F3]" />
              <span>{heroConfig.trustPoint3}</span>
            </div>
          </div>

          {/* Integrated High-Visibility Search Experience */}
          <div className="pt-2 w-full">
            <AirbnbSearchCapsule
              currentCity={currentCity}
              onSelectCity={onSelectCity}
              cities={cities}
              eventDate={eventDate}
              onDateChange={onDateChange}
              guestCount={guestCount}
              onGuestCountChange={onGuestCountChange}
              onSearch={onSearch}
              searchQuery={searchQuery}
              onSearchQueryChange={onSearchQueryChange}
            />
          </div>
        </div>

        {/* Right Column: Seamless Showcase on Pure Plain White Background */}
        <div className="lg:col-span-5 xl:col-span-6 relative flex items-center justify-center">
          <div className="relative w-full max-w-[620px] h-[400px] sm:h-[480px] lg:h-[500px] xl:h-[540px] flex items-center justify-center">
            {/* Seamless Cross-fade Images - 100% Plane White / Transparent Background, No black box, No extra tags */}
            <div className="relative w-full h-full flex items-center justify-center">
              {slides.map((s, idx) => (
                <img
                  key={s.id || idx}
                  src={s.image}
                  alt={s.category || 'Celebration Services'}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                    idx === activeSlideIndex
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  loading="eager"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
