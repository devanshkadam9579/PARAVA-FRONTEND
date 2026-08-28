import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: {
    sort: string;
    min: string;
    max: string;
    types: string[];
  }) => void;
}

export default function FilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
  const [selectedSort, setSelectedSort] = useState("Distance");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

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
  };

  const vendorTypes = [
    "AC Hall", "Lawn", "Veg Only", "Non-Veg Allowed", 
    "Photography", "Decoration", "Catering", "DJ & Sound", 
    "Bridal Makeup", "Rooms Available"
  ];
  
  const sortOptions = [
    "Distance", 
    "Rating - High to Low", 
    "Price - Low to High", 
    "Price - High to Low", 
    "Most Booked"
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] bg-white rounded-t-3xl sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-[#f7f7f7] rounded-full transition-colors"
          >
            <X size={18} className="text-[#222222]" strokeWidth={2} />
          </button>
          <h2 className="text-[16px] font-bold text-[#222222]">Filters</h2>
          <button
            onClick={handleClear}
            className="text-[14px] font-semibold text-[#717171] hover:text-[#222222] hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Sort By */}
          <div>
            <h3 className="text-[15px] font-bold text-[#222222] mb-3">Sort By</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {sortOptions.map((option) => (
                <label 
                  key={option} 
                  onClick={() => setSelectedSort(option)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSort === option 
                      ? 'border-[#222222] bg-[#f7f7f7] text-[#222222] font-semibold' 
                      : 'border-[#ebebeb] hover:border-[#dddddd] text-[#717171]'
                  }`}
                >
                  <span className="text-[14px]">{option}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedSort === option 
                      ? 'border-[#ff385c] bg-[#ff385c]' 
                      : 'border-[#dddddd]'
                  }`}>
                    {selectedSort === option && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-[#ebebeb]" />

          {/* Price Range */}
          <div>
            <h3 className="text-[15px] font-bold text-[#222222] mb-1">Price Range</h3>
            <p className="text-[12px] text-[#717171] mb-3">Filter by vendor starting budget</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[12px] text-[#717171] font-medium mb-1">Min Price (₹)</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717171] font-semibold text-[14px]">₹</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-white border border-[#dddddd] rounded-xl py-3 pl-8 pr-3 text-[14px] font-semibold text-[#222222] outline-none focus:border-[#222222] transition-colors"
                  />
                </div>
              </div>
              <div className="text-[#717171] font-bold mt-5">-</div>
              <div className="flex-1">
                <p className="text-[12px] text-[#717171] font-medium mb-1">Max Price (₹)</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717171] font-semibold text-[14px]">₹</span>
                  <input 
                    type="number" 
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-white border border-[#dddddd] rounded-xl py-3 pl-8 pr-3 text-[14px] font-semibold text-[#222222] outline-none focus:border-[#222222] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[#ebebeb]" />

          {/* Vendor Type / Features */}
          <div>
            <h3 className="text-[15px] font-bold text-[#222222] mb-1">Vendor Type & Amenities</h3>
            <p className="text-[12px] text-[#717171] mb-3">Select categories or special features</p>
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
                        ? 'bg-[#222222] text-white border border-[#222222]' 
                        : 'bg-white border border-[#dddddd] text-[#222222] hover:border-[#222222]'
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
        <div className="p-4 bg-white border-t border-[#ebebeb] flex items-center justify-between sticky bottom-0 rounded-b-3xl">
          <button 
            onClick={handleClear}
            className="text-[#222222] font-semibold text-[14px] px-4 py-2 hover:underline transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={() => {
              onApply({ sort: selectedSort, min: minPrice, max: maxPrice, types: selectedTypes });
              onClose();
            }}
            className="bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-[14px] shadow-sm transition-all"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
