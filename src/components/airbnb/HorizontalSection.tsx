import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function HorizontalSection({
  title,
  subtitle,
  actionText,
  onActionClick,
  children,
  className = ''
}: HorizontalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={`space-y-4 ${className}`}>
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-500 font-bold mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionText && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="text-xs font-bold text-gray-900 hover:text-brand-primary underline underline-offset-4 mr-2 transition"
            >
              {actionText}
            </button>
          )}

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition active:scale-95 ${
              canScrollLeft
                ? 'bg-white hover:border-gray-900 text-gray-900 shadow-xs cursor-pointer'
                : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition active:scale-95 ${
              canScrollRight
                ? 'bg-white hover:border-gray-900 text-gray-900 shadow-xs cursor-pointer'
                : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Rail */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}
