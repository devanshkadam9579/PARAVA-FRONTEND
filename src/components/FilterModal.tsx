import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: {
    sort: string;
    min: string;
    max: string;
    types: string[];
    rating?: number;
  }) => void;
  initialSort?: string;
  initialMin?: string;
  initialMax?: string;
  initialTypes?: string[];
  initialRating?: number;
}

export default function FilterModal({ 
  isOpen, 
  onClose, 
  onApply,
  initialSort,
  initialMin,
  initialMax,
  initialTypes,
  initialRating = 0
}: FilterModalProps) {
  const [selectedSort, setSelectedSort] = useState(initialSort || "Distance");
  const [minPrice, setMinPrice] = useState(initialMin || "");
  const [maxPrice, setMaxPrice] = useState(initialMax || "");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes || []);
  const [minRating, setMinRating] = useState<number>(initialRating || 0);

  useEffect(() => {
    if (isOpen) {
      setSelectedSort(initialSort || "Distance");
      setMinPrice(initialMin || "");
      setMaxPrice(initialMax || "");
      setSelectedTypes(initialTypes || []);
      setMinRating(initialRating || 0);
    }
  }, [isOpen, initialSort, initialMin, initialMax, initialTypes, initialRating]);

  if (!isOpen) return null;

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleClear = () => {
    setSelectedSort("Distance");
    setMinPrice("");
    setMaxPrice("");
    setSelectedTypes([]);
    setMinRating(0);
  };

  const vendorTypes = [
    "AC Hall", "Lawn", "Veg Only", "Non-Veg Allowed", 
    "Photography", "Decoration", "Catering", "DJ & Sound", 
    "Bridal Makeup", "Rooms Available"
  ];
  
  const sortOptions = [
    { id: "Distance", label: "Nearest Distance" },
    { id: "Popularity", label: "Most Popular" },
    { id: "Rating - High to Low", label: "Top Rated" },
    { id: "Price - Low to High", label: "Price: Low to High" },
    { id: "Price - High to Low", label: "Price: High to Low" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-xl mx-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header (Sticky) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-3xl sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-800" strokeWidth={2} />
          </button>
          <h2 className="text-[16px] font-bold text-gray-900">Filters & Sort</h2>
          <button
            onClick={handleClear}
            className="text-[14px] font-semibold text-gray-500 hover:text-gray-900 hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Sort By */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">Sort By</h3>
            <div className="grid grid-cols-1 gap-2">
              {sortOptions.map((option) => (
                <label 
                  key={option.id} 
                  onClick={() => setSelectedSort(option.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSort === option.id 
                      ? 'border-[#EC003F] bg-rose-50/50 text-gray-900 font-bold' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-[14px]">{option.label}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedSort === option.id 
                      ? 'border-[#EC003F] bg-[#EC003F]' 
                      : 'border-gray-300'
                  }`}>
                    {selectedSort === option.id && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {/* Price Range */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Price Range</h3>
            <p className="text-[12px] text-gray-500 mb-3">Filter by vendor starting budget</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[12px] text-gray-500 font-medium mb-1">Min Price (₹)</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[14px]">₹</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-8 pr-3 text-[14px] font-semibold text-gray-900 outline-none focus:border-[#EC003F] transition-colors"
                  />
                </div>
              </div>
              <div className="text-gray-400 font-bold mt-5">-</div>
              <div className="flex-1">
                <p className="text-[12px] text-gray-500 font-medium mb-1">Max Price (₹)</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[14px]">₹</span>
                  <input 
                    type="number" 
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-8 pr-3 text-[14px] font-semibold text-gray-900 outline-none focus:border-[#EC003F] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {/* Rating Filter */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Minimum Rating</h3>
            <p className="text-[12px] text-gray-500 mb-3">Filter partners by verified customer reviews</p>
            <div className="flex items-center gap-2">
              {[0, 4.0, 4.5, 4.8].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setMinRating(rate)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    minRating === rate 
                      ? 'bg-[#EC003F] text-white shadow-xs' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {rate === 0 ? 'All' : `${rate}★+`}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {/* Vendor Type / Features */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Vendor Type & Amenities</h3>
            <p className="text-[12px] text-gray-500 mb-3">Select categories or special features</p>
            <div className="flex flex-wrap gap-2">
              {vendorTypes.map((type) => {
                const isActive = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      isActive 
                        ? 'bg-gray-900 text-white border border-gray-900' 
                        : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

        {/* Footer (Sticky) */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between sticky bottom-0 rounded-b-3xl">
          <button 
            onClick={handleClear}
            className="text-gray-700 font-semibold text-[14px] px-4 py-2 hover:underline transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={() => {
              onApply({ sort: selectedSort, min: minPrice, max: maxPrice, types: selectedTypes, rating: minRating });
              onClose();
            }}
            className="bg-[#EC003F] hover:bg-[#D40038] active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-[14px] shadow-sm transition-all"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
