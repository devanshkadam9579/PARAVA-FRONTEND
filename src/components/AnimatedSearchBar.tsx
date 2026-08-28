import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, X, TrendingUp, Sparkles, SlidersHorizontal, MapPin, Star, ArrowRight, ShieldCheck, Utensils, Building2, Camera, Music, Palette, Cake, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vendor, QuickCategory } from '../types';

interface AnimatedSearchBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categories: QuickCategory[];
  vendors: Vendor[];
  currentCity: string;
  onSelectVendor: (vendor: Vendor) => void;
  onSelectCategory: (categoryName: string) => void;
  onOpenVoiceSearch: () => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
  placeholderPrefix?: string;
}

const DEFAULT_CATEGORY_ROTATIONS = [
  "Catering & Buffets",
  "Decorators & Mandap",
  "Banquet Halls & Lawns",
  "Wedding Photographers",
  "DJ, Lights & Sound",
  "Bridal Makeup Artists",
  "Cakes & Gourmet Desserts",
  "Complete Event Planners"
];

export default function AnimatedSearchBar({
  searchQuery,
  setSearchQuery,
  categories,
  vendors,
  currentCity,
  onSelectVendor,
  onSelectCategory,
  onOpenVoiceSearch,
  onOpenFilters,
  activeFilterCount = 0,
  placeholderPrefix = "Search"
}: AnimatedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedText, setAnimatedText] = useState(DEFAULT_CATEGORY_ROTATIONS[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  const categoryNames = categories && categories.length > 0
    ? categories.map(c => c.name)
    : DEFAULT_CATEGORY_ROTATIONS;

  useEffect(() => {
    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: any;

    const tick = () => {
      const currentWord = categoryNames[wordIdx % categoryNames.length];
      
      if (isDeleting) {
        setAnimatedText(currentWord.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setAnimatedText(currentWord.substring(0, charIdx + 1));
        charIdx++;
      }

      if (!isDeleting && charIdx === currentWord.length) {
        isDeleting = true;
        timeout = setTimeout(tick, 2200);
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx++;
        timeout = setTimeout(tick, 400);
      } else {
        timeout = setTimeout(tick, isDeleting ? 30 : 65);
      }
    };

    timeout = setTimeout(tick, 100);
    return () => clearTimeout(timeout);
  }, [categories]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingCategories = categoryNames.filter(name => 
    name.toLowerCase().includes(trimmedQuery)
  );

  const cityVendors = vendors.filter(v => 
    (v.location || '').toLowerCase().includes(currentCity.toLowerCase()) && v.approved !== false
  );

  const matchingVendors = cityVendors.filter(v => 
    (v.name || '').toLowerCase().includes(trimmedQuery) ||
    (v.category || '').toLowerCase().includes(trimmedQuery) ||
    (v.tagline || '').toLowerCase().includes(trimmedQuery) ||
    (v.location || '').toLowerCase().includes(trimmedQuery)
  ).slice(0, 6);

  const trendingTags = [
    `Top Halls in ${currentCity}`,
    `Pre-Wedding Photography`,
    `Veg Catering Menus`,
    `Stage & Mandap Decor`,
    `DJ with Dhol Setup`
  ];

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cater')) return <Utensils size={14} className="text-amber-600" />;
    if (n.includes('hall') || n.includes('lawn')) return <Building2 size={14} className="text-indigo-600" />;
    if (n.includes('photo')) return <Camera size={14} className="text-blue-600" />;
    if (n.includes('dj') || n.includes('music')) return <Music size={14} className="text-purple-600" />;
    if (n.includes('makeup')) return <Palette size={14} className="text-pink-600" />;
    if (n.includes('cake') || n.includes('dessert')) return <Cake size={14} className="text-rose-600" />;
    if (n.includes('planner')) return <ClipboardList size={14} className="text-emerald-600" />;
    return <Sparkles size={14} className="text-brand-primary" />;
  };

  return (
    <div className="relative w-full z-40" ref={containerRef}>
      <div 
        className={`relative flex items-center bg-white rounded-2xl border transition-all duration-300 shadow-sm ${
          isFocused 
            ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="pl-4 text-brand-primary flex items-center justify-center">
          <Search size={18} className="animate-pulse" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={`${placeholderPrefix} '${animatedText}'...`}
          className="flex-1 bg-transparent py-3.5 pl-3 pr-2 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none w-full truncate"
          id="animated-search-input"
        />

        <div className="flex items-center gap-1 pr-2.5">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

          <button
            onClick={onOpenVoiceSearch}
            className="p-2 text-brand-primary hover:bg-brand-primary-light rounded-full transition-colors"
            title="Voice Search"
          >
            <Mic size={18} />
          </button>

          {onOpenFilters && (
            <button
              onClick={onOpenFilters}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                activeFilterCount > 0
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Filters & Sorting"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-black bg-white text-brand-primary px-1.5 py-0.2 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[70vh] overflow-y-auto z-50 divide-y divide-gray-100"
          >
            <div className="p-3 bg-gray-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Browse by Category
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Click to filter</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(matchingCategories.length > 0 ? matchingCategories : categoryNames).slice(0, 8).map(catName => (
                  <button
                    key={catName}
                    onClick={() => {
                      onSelectCategory(catName);
                      setIsFocused(false);
                    }}
                    className="flex items-center gap-1.5 bg-white hover:bg-brand-primary hover:text-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs transition-all active:scale-95 group"
                  >
                    {getCategoryIcon(catName)}
                    <span>{catName}</span>
                  </button>
                ))}
              </div>
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="py-2">
                <div className="px-3.5 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Vendors in {currentCity} ({matchingVendors.length})
                  </span>
                </div>

                {matchingVendors.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-xs text-gray-500 font-medium">No vendors matching "{searchQuery}" in {currentCity}</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-bold text-brand-primary hover:underline"
                    >
                      Clear search & view all
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {matchingVendors.map(vendor => (
                      <div
                        key={vendor.id}
                        onClick={() => {
                          onSelectVendor(vendor);
                          setIsFocused(false);
                        }}
                        className="px-3.5 py-2.5 hover:bg-rose-50/40 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=120'}
                            alt={vendor.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-brand-primary truncate">
                                {vendor.name}
                              </h4>
                              {vendor.verified && (
                                <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                              <span className="font-semibold text-gray-700">{vendor.category}</span>
                              <span>•</span>
                              <div className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star size={10} className="fill-amber-500" />
                                <span>{vendor.rating ? vendor.rating.toFixed(1) : '4.8'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-gray-900">
                            ₹{vendor.basePrice ? vendor.basePrice.toLocaleString('en-IN') : '0'}
                          </p>
                          <span className="text-[10px] text-brand-primary font-bold flex items-center gap-0.5 justify-end">
                            View <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="p-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  🔥 Trending Searches in {currentCity}
                </span>
                <div className="space-y-1">
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        setIsFocused(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-gray-400" />
                        <span>{tag}</span>
                      </div>
                      <ArrowRight size={12} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
