import React, { useRef, useState, useEffect } from 'react';
import { 
  Grid, Building2, UtensilsCrossed, Sparkles, Camera, 
  Music, Palette, Cake, CalendarCheck, ChevronLeft, ChevronRight
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  image?: string;
  icon?: any;
  description?: string;
}

export interface AirbnbCategoryRailProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

const getCategoryIcon = (name: string) => {
  const lower = (name || '').toLowerCase();
  if (lower === 'all' || lower === 'all services') return Grid;
  if (lower.includes('hall') || lower.includes('venue') || lower.includes('banquet')) return Building2;
  if (lower.includes('cater') || lower.includes('food') || lower.includes('dining')) return UtensilsCrossed;
  if (lower.includes('decor')) return Sparkles;
  if (lower.includes('photo') || lower.includes('camera') || lower.includes('video')) return Camera;
  if (lower.includes('dj') || lower.includes('sound') || lower.includes('music') || lower.includes('band')) return Music;
  if (lower.includes('makeup') || lower.includes('beauty') || lower.includes('hair')) return Palette;
  if (lower.includes('cake') || lower.includes('dessert') || lower.includes('baker')) return Cake;
  if (lower.includes('plan') || lower.includes('event') || lower.includes('coordinator')) return CalendarCheck;
  return Sparkles;
};

export function AirbnbCategoryRail({
  categories,
  selectedCategory,
  onSelectCategory,
  className = ''
}: AirbnbCategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const allCategories: CategoryItem[] = [
    { id: 'all', name: 'All Services' },
    ...categories.filter(c => c.id !== 'all' && c.name.toLowerCase() !== 'all')
  ];

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
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100 ${className}`}>
      <div className="flex items-center gap-2 relative">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <div className="hidden md:flex absolute left-0 z-10 items-center h-full">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm hover:border-gray-900 flex items-center justify-center text-gray-700 hover:scale-105 active:scale-95 transition cursor-pointer"
              aria-label="Scroll categories left"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
          </div>
        )}

        {/* Scrollable Category Rail */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-7 sm:gap-9 overflow-x-auto scrollbar-none py-3.5 scroll-smooth select-none px-1 w-full"
        >
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id || 
              (selectedCategory === 'all' && (cat.id === 'all' || cat.name === 'All Services')) ||
              (selectedCategory.toLowerCase() === cat.name.toLowerCase());
            
            const IconComponent = getCategoryIcon(cat.name);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id === 'all' ? 'all' : cat.name)}
                className={`group flex flex-col items-center gap-1.5 shrink-0 pb-2 relative transition cursor-pointer ${
                  isSelected
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                {/* Category Icon / Admin Image */}
                <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-rose-600 ring-offset-2 scale-105 shadow-xs' 
                    : 'ring-1 ring-gray-200 group-hover:ring-gray-400 group-hover:scale-105'
                }`}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      isSelected ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900'
                    }`}>
                      <IconComponent size={18} className="stroke-[2]" />
                    </div>
                  )}
                </div>

                {/* Category Name Label */}
                <span className={`text-xs whitespace-nowrap tracking-tight ${isSelected ? 'text-gray-900 font-extrabold' : 'text-gray-600 font-medium group-hover:text-gray-900'}`}>
                  {cat.name}
                </span>

                {/* Active Indicator Underline */}
                {isSelected ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-600 rounded-full animate-in fade-in duration-200" />
                ) : (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-gray-300 rounded-full transition-all" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {canScrollRight && (
          <div className="hidden md:flex absolute right-0 z-10 items-center h-full">
            <div className="w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm hover:border-gray-900 flex items-center justify-center text-gray-700 hover:scale-105 active:scale-95 transition cursor-pointer"
              aria-label="Scroll categories right"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default AirbnbCategoryRail;
