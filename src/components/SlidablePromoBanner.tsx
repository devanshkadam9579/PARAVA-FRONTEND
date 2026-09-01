import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Tag } from 'lucide-react';

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  buttonText?: string;
  image?: string;
  category?: string;
  discount?: string;
}

const DEFAULT_PROMOS: Promo[] = [
  {
    id: 'p1',
    title: 'Celebrate with Royal Catering & Decor',
    subtitle: 'Flat 15% OFF on Wedding & Reception Packages',
    badge: '🔥 Best Seller',
    buttonText: 'Book Now',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    category: 'Catering',
    discount: '15% OFF'
  },
  {
    id: 'p2',
    title: 'Top Rated Banquet Halls & Venues',
    subtitle: 'Instant Date Booking with Zero Brokerage',
    badge: '⭐ Verified Venues',
    buttonText: 'Explore Venues',
    image: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800',
    category: 'Venues',
    discount: 'Top Rated'
  },
  {
    id: 'p3',
    title: 'Live DJ & Royal Stage Lighting',
    subtitle: 'Make your Sangeet & Birthday Unforgettable',
    badge: '🎵 Trending',
    buttonText: 'View Artists',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    category: 'DJ & Sound',
    discount: 'Special Offer'
  }
];

export interface SlidablePromoBannerProps {
  promos?: Promo[];
  onSelectCategory?: (category: string) => void;
}

export default function SlidablePromoBanner({
  promos = DEFAULT_PROMOS,
  onSelectCategory
}: SlidablePromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activePromos = promos.length > 0 ? promos : DEFAULT_PROMOS;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePromos.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [activePromos.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl my-3 select-none">
      <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden rounded-3xl shadow-sm border border-brand-border">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Gradient Overlay */}
            <img
              src={activePromos[currentIndex].image}
              alt={activePromos[currentIndex].title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent flex flex-col justify-center px-5 sm:px-8 text-white space-y-1 sm:space-y-2">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <span className="bg-brand-primary text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Tag size={10} />
                  <span>{activePromos[currentIndex].badge || 'Special Offer'}</span>
                </span>
                {activePromos[currentIndex].discount && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md">
                    {activePromos[currentIndex].discount}
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-extrabold text-sm sm:text-lg lg:text-xl text-white font-display max-w-sm sm:max-w-md leading-tight line-clamp-1">
                {activePromos[currentIndex].title}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80 max-w-xs sm:max-w-sm line-clamp-1 font-medium">
                {activePromos[currentIndex].subtitle}
              </p>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCategory && activePromos[currentIndex].category) {
                      onSelectCategory(activePromos[currentIndex].category!);
                    }
                  }}
                  className="bg-white hover:bg-gray-100 text-brand-primary text-[11px] sm:text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 w-fit"
                >
                  <span>{activePromos[currentIndex].buttonText || 'Book Now'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-2.5">
        {activePromos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-5 bg-brand-primary' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
