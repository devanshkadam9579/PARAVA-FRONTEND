/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Share2, 
  Bookmark, 
  TrendingUp, 
  Users, 
  Calendar, 
  ChevronDown, 
  Sliders, 
  ArrowRight, 
  Calculator, 
  MapPin, 
  AlertCircle, 
  Info, 
  Layers, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  FileText,
  Copy,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Globe,
  Settings,
  Heart,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { Vendor, VendorServiceItem, Booking } from '../types';

interface AiEventPlannerProps {
  vendors: Vendor[];
  planningEventType: string;
  planningDate: string;
  planningGuestSize: number;
  currentCity: string;
  // Callback when user selects a plan to customize in their Custom Planner slots
  onApplyPlanToCustom: (planVendors: { [category: string]: Vendor }) => void;
  onShowVendorDetail: (vendor: Vendor) => void;
  onBookDirectPlan: (planName: string, totalCost: number, vendors: Vendor[]) => void;
  // Current custom plan values for comparative layout
  customVendors: { [category: string]: Vendor | null };
  customTotal: number;
}

export interface EventPlan {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  badgeColor: string;
  accentColor: string;
  totalCost: number;
  savings: number;
  ratingScore: number;
  matchPercentage: number;
  avgDistance: string;
  availabilityStatus: string;
  breakdown: {
    venue: number;
    decoration: number;
    photography: number;
    videography: number;
    catering: number;
    cake: number;
    dj: number;
    lighting: number;
    transportation: number;
    accommodation: number;
  };
  timeline: { time: string; activity: string; desc: string }[];
  vendors: { [category: string]: Vendor };
}

export default function AiEventPlanner({
  vendors,
  planningEventType,
  planningDate,
  planningGuestSize,
  currentCity,
  onApplyPlanToCustom,
  onShowVendorDetail,
  onBookDirectPlan,
  customVendors,
  customTotal
}: AiEventPlannerProps) {
  const [plans, setPlans] = useState<EventPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('standard');
  const [showComparison, setShowComparison] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'timeline' | 'vendors'>('breakdown');
  const [replaceCategory, setReplaceCategory] = useState<string | null>(null);

  // Generate 5 intelligent plans based on city, guest count, occasion
  useEffect(() => {
    // Filter vendors belonging to the current selected city
    const cityVendors = vendors.filter(v => v.location.toLowerCase() === currentCity.toLowerCase());
    
    // Find representative vendors per category in current city or default
    const findVendor = (cat: string, tier: 'budget' | 'standard' | 'premium' | 'luxury') => {
      const catMatches = cityVendors.length > 0 
        ? cityVendors.filter(v => v.category === cat) 
        : vendors.filter(v => v.category === cat);
      
      if (catMatches.length === 0) return vendors.find(v => v.category === cat) || vendors[0];

      // Sort by price to segment into tiers
      const sorted = [...catMatches].sort((a, b) => a.basePrice - b.basePrice);
      
      if (tier === 'budget') return sorted[0];
      if (tier === 'luxury' || tier === 'premium') return sorted[sorted.length - 1];
      
      // Standard / Balanced tier
      const midIdx = Math.floor(sorted.length / 2);
      return sorted[midIdx];
    };

    // Helper to calculate total from vendors
    const getCateringCost = (v: Vendor, size: number) => {
      const platePrice = v.services[0]?.price || 650;
      return platePrice * size;
    };

    // Build the plans
    const budgetHall = findVendor('Banquet Hall', 'budget');
    const budgetDecor = findVendor('Decorator', 'budget');
    const budgetPhoto = findVendor('Photographer', 'budget');
    const budgetDJ = findVendor('DJ', 'budget');
    const budgetCatering = findVendor('Catering', 'budget');
    const budgetCake = findVendor('Cake & Desserts', 'budget');
    const budgetFun = findVendor('Fun & Entertainment', 'budget');
    const budgetMakeup = findVendor('Makeup Artist', 'budget');

    const stdHall = findVendor('Banquet Hall', 'standard');
    const stdDecor = findVendor('Decorator', 'standard');
    const stdPhoto = findVendor('Photographer', 'standard');
    const stdDJ = findVendor('DJ', 'standard');
    const stdCatering = findVendor('Catering', 'standard');
    const stdCake = findVendor('Cake & Desserts', 'standard');
    const stdFun = findVendor('Fun & Entertainment', 'standard');
    const stdMakeup = findVendor('Makeup Artist', 'standard');

    const premHall = findVendor('Banquet Hall', 'premium');
    const premDecor = findVendor('Decorator', 'premium');
    const premPhoto = findVendor('Photographer', 'premium');
    const premDJ = findVendor('DJ', 'premium');
    const premCatering = findVendor('Catering', 'premium');
    const premCake = findVendor('Cake & Desserts', 'premium');
    const premFun = findVendor('Fun & Entertainment', 'premium');
    const premMakeup = findVendor('Makeup Artist', 'premium');

    // BUDGET PLAN
    const budgetBreakdown = {
      venue: budgetHall.basePrice,
      decoration: budgetDecor.basePrice,
      photography: budgetPhoto.basePrice,
      videography: 0,
      catering: getCateringCost(budgetCatering, planningGuestSize),
      cake: budgetCake.basePrice,
      dj: budgetDJ.basePrice,
      lighting: 5000,
      transportation: 8000,
      accommodation: 0
    };
    const budgetSum = Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);
    const budgetSavings = Math.round(budgetSum * 0.12);

    // STANDARD PLAN
    const stdBreakdown = {
      venue: stdHall.basePrice,
      decoration: stdDecor.basePrice,
      photography: stdPhoto.basePrice,
      videography: 25000,
      catering: getCateringCost(stdCatering, planningGuestSize),
      cake: stdCake.basePrice * 1.5,
      dj: stdDJ.basePrice,
      lighting: 12000,
      transportation: 15000,
      accommodation: 20000
    };
    const stdSum = Object.values(stdBreakdown).reduce((a, b) => a + b, 0);
    const stdSavings = Math.round(stdSum * 0.18);

    // PREMIUM PLAN
    const premBreakdown = {
      venue: premHall.basePrice,
      decoration: premDecor.basePrice * 1.8,
      photography: premPhoto.basePrice * 2,
      videography: 50000,
      catering: getCateringCost(premCatering, planningGuestSize),
      cake: premCake.basePrice * 2.5,
      dj: premDJ.basePrice * 1.6,
      lighting: 35000,
      transportation: 40000,
      accommodation: 75000
    };
    const premSum = Object.values(premBreakdown).reduce((a, b) => a + b, 0);
    const premSavings = Math.round(premSum * 0.22);

    // LUXURY PLAN
    const luxBreakdown = {
      venue: premHall.basePrice * 1.5,
      decoration: premDecor.basePrice * 2.5,
      photography: premPhoto.basePrice * 3,
      videography: 95000,
      catering: getCateringCost(premCatering, planningGuestSize) * 1.4,
      cake: premCake.basePrice * 4,
      dj: premDJ.basePrice * 2.5,
      lighting: 80000,
      transportation: 90000,
      accommodation: 180000
    };
    const luxSum = Object.values(luxBreakdown).reduce((a, b) => a + b, 0);
    const luxSavings = Math.round(luxSum * 0.25);

    const timelineData = [
      { time: '09:00 AM', activity: 'Setup & Vendor Arrival', desc: 'Decorators, caterers, and production crew begin venue styling and stage layout.' },
      { time: '11:30 AM', activity: 'Bridal & Groom Styling', desc: 'Makeup artist starts session; cinematic team records closeups and apparel shots.' },
      { time: '04:00 PM', activity: 'Guest Reception & Live Music', desc: 'Guests arrive; welcome juices served; soft classical/live acoustic music active.' },
      { time: '06:30 PM', activity: 'Main Ceremony / Stage Entries', desc: 'Grand entry sequence under synchronized pyro-sparks and professional spotlighting.' },
      { time: '08:30 PM', activity: 'Royal Buffet Feast & Cake Cut', desc: 'Live counters active; 3-Tier cake slicing celebration; ambient dinner music playing.' },
      { time: '10:00 PM', activity: 'Concert DJ Dance Party', desc: 'Lasers active; heavy sound array pumping the best remixes; photobooths fully occupied.' }
    ];

    setPlans([
      {
        id: 'budget',
        name: 'Smart Budget Plan',
        tagline: 'High quality essential bookings optimized for affordability',
        badge: 'Best Value',
        color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        accentColor: 'emerald',
        totalCost: budgetSum - budgetSavings,
        savings: budgetSavings,
        ratingScore: 4.6,
        matchPercentage: 88,
        avgDistance: '3.4 km',
        availabilityStatus: '100% Confirmed Available',
        breakdown: budgetBreakdown,
        timeline: timelineData,
        vendors: {
          'Banquet Hall': budgetHall,
          'Decorator': budgetDecor,
          'Photographer': budgetPhoto,
          'DJ': budgetDJ,
          'Catering': budgetCatering,
          'Cake & Desserts': budgetCake,
          'Fun & Entertainment': budgetFun,
          'Makeup Artist': budgetMakeup
        }
      },
      {
        id: 'standard',
        name: 'Balanced Standard Plan',
        tagline: 'Most recommended verified vendors with stellar rating scores',
        badge: 'Popular Choice',
        color: 'border-brand-primary/20 bg-brand-primary-light/30 hover:bg-brand-primary-light/45',
        badgeColor: 'bg-brand-primary text-white',
        accentColor: 'brand-primary',
        totalCost: stdSum - stdSavings,
        savings: stdSavings,
        ratingScore: 4.8,
        matchPercentage: 96,
        avgDistance: '2.1 km',
        availabilityStatus: 'Fully Available',
        breakdown: stdBreakdown,
        timeline: timelineData,
        vendors: {
          'Banquet Hall': stdHall,
          'Decorator': stdDecor,
          'Photographer': stdPhoto,
          'DJ': stdDJ,
          'Catering': stdCatering,
          'Cake & Desserts': stdCake,
          'Fun & Entertainment': stdFun,
          'Makeup Artist': stdMakeup
        }
      },
      {
        id: 'premium',
        name: 'Premium Elite Plan',
        tagline: 'Lavish high-end arrangements with expert cinematography & styling',
        badge: 'Superb Luxury',
        color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50',
        badgeColor: 'bg-purple-600 text-white',
        accentColor: 'purple',
        totalCost: premSum - premSavings,
        savings: premSavings,
        ratingScore: 4.9,
        matchPercentage: 99,
        avgDistance: '1.5 km',
        availabilityStatus: 'Premium Priority Slot',
        breakdown: premBreakdown,
        timeline: timelineData,
        vendors: {
          'Banquet Hall': premHall,
          'Decorator': premDecor,
          'Photographer': premPhoto,
          'DJ': premDJ,
          'Catering': premCatering,
          'Cake & Desserts': premCake,
          'Fun & Entertainment': premFun,
          'Makeup Artist': premMakeup
        }
      },
      {
        id: 'luxury',
        name: 'Royal Heritage Luxury Plan',
        tagline: 'The ultimate bespoke experience with palatial venues and fine dining',
        badge: 'Elite Royal',
        color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
        badgeColor: 'bg-amber-500 text-white',
        accentColor: 'amber',
        totalCost: luxSum - luxSavings,
        savings: luxSavings,
        ratingScore: 5.0,
        matchPercentage: 100,
        avgDistance: '0.8 km',
        availabilityStatus: 'Palatial Priority Reserved',
        breakdown: luxBreakdown,
        timeline: timelineData,
        vendors: {
          'Banquet Hall': premHall,
          'Decorator': premDecor,
          'Photographer': premPhoto,
          'DJ': premDJ,
          'Catering': premCatering,
          'Cake & Desserts': premCake,
          'Fun & Entertainment': premFun,
          'Makeup Artist': premMakeup
        }
      }
    ]);
  }, [planningEventType, planningDate, planningGuestSize, currentCity]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  const handleShare = () => {
    setShareSuccess(true);
    navigator.clipboard.writeText(
      `PARVA Intelligent ${selectedPlan?.name} for my ${planningEventType} on ${planningDate}. Total Estimated Cost: ₹${selectedPlan?.totalCost.toLocaleString('en-IN')}. Get maximum bundle discount here!`
    );
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const handleSave = () => {
    setSaveSuccess(true);
    const savedList = JSON.parse(localStorage.getItem('parva_saved_plans') || '[]');
    savedList.push({
      id: `plan-${Date.now()}`,
      name: `${planningEventType} - ${selectedPlan?.name}`,
      date: planningDate,
      cost: selectedPlan?.totalCost,
      city: currentCity
    });
    localStorage.setItem('parva_saved_plans', JSON.stringify(savedList));
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReplaceVendor = (category: string, newVendor: Vendor) => {
    if (!selectedPlan) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const updatedVendors = { ...p.vendors, [category]: newVendor };
      
      // Re-calculate pricing breakdown specifically for the replaced vendor
      const updatedBreakdown = { ...p.breakdown };
      if (category === 'Banquet Hall') updatedBreakdown.venue = newVendor.basePrice;
      else if (category === 'Decorator') updatedBreakdown.decoration = newVendor.basePrice;
      else if (category === 'Photographer') updatedBreakdown.photography = newVendor.basePrice;
      else if (category === 'Catering') {
        const platePrice = newVendor.services[0]?.price || 650;
        updatedBreakdown.catering = platePrice * planningGuestSize;
      }
      else if (category === 'Cake & Desserts') updatedBreakdown.cake = newVendor.basePrice;
      else if (category === 'DJ') updatedBreakdown.dj = newVendor.basePrice;

      const newSum = (Object.values(updatedBreakdown) as number[]).reduce((a, b) => a + b, 0);
      const newSavings = Math.round(newSum * 0.18);

      return {
        ...p,
        vendors: updatedVendors,
        breakdown: updatedBreakdown,
        totalCost: newSum - newSavings,
        savings: newSavings
      };
    }));
    setReplaceCategory(null);
  };

  if (plans.length === 0) return null;

  return (
    <div className="space-y-4" id="ai-event-planner-module">
      
      {/* Dynamic Header Badge */}
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 bg-brand-primary-light rounded-lg text-brand-primary shrink-0 animate-pulse">
          <Sparkles size={14} />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-brand-primary-dark uppercase tracking-wider block leading-none">Intelligent Recs</span>
          <h4 className="text-xs font-bold text-brand-text">AI Smart-Plan Optimizer</h4>
        </div>
      </div>

      {/* 3-5 Intelligent Plan Tabs Selection */}
      <div className="grid grid-cols-4 gap-1.5">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPlanId(p.id);
              setShowComparison(false);
            }}
            className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border text-center transition-all ${
              selectedPlanId === p.id 
                ? 'bg-brand-text border-brand-text text-white shadow-md' 
                : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
            }`}
            id={`ai-plan-tab-${p.id}`}
          >
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1 ${
              selectedPlanId === p.id ? p.badgeColor : 'bg-gray-100 text-gray-600'
            }`}>
              {p.id === 'budget' ? 'Value' : p.id === 'standard' ? 'Pop' : p.id === 'premium' ? 'Prem' : 'Royal'}
            </span>
            <span className="text-[10px] font-extrabold line-clamp-1 leading-tight">{p.name.split(' ')[0]}</span>
            <span className="text-[9px] font-black mt-1 text-brand-primary">₹{(p.totalCost / 100000).toFixed(1)}L</span>
          </button>
        ))}
      </div>

      {/* Main Selected Plan Showcase Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-4 shadow-sm space-y-4">
        
        {/* Plan Identity Block */}
        <div className="flex justify-between items-start gap-4 border-b border-gray-100 pb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-brand-text text-sm truncate">{selectedPlan.name}</h4>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedPlan.badgeColor}`}>
                {selectedPlan.badge}
              </span>
            </div>
            <p className="text-[10px] text-brand-text-secondary mt-0.5 line-clamp-1 font-medium">{selectedPlan.tagline}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[8px] text-brand-text-secondary font-bold uppercase tracking-wider block">Estimated Cost</span>
            <span className="text-sm font-black text-brand-primary-dark">₹{selectedPlan.totalCost.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#FAF9F5]/40 border border-brand-border/40 p-2 rounded-2xl text-center">
          <div>
            <span className="text-[8px] text-brand-text-secondary uppercase font-semibold block">Match Score</span>
            <span className="text-[10px] font-black text-brand-primary flex items-center justify-center gap-0.5 mt-0.5">
              <ShieldCheck size={10} />
              <span>{selectedPlan.matchPercentage}%</span>
            </span>
          </div>
          <div>
            <span className="text-[8px] text-brand-text-secondary uppercase font-semibold block">Saves</span>
            <span className="text-[10px] font-black text-brand-success mt-0.5 block">₹{selectedPlan.savings.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[8px] text-brand-text-secondary uppercase font-semibold block">Trust Rating</span>
            <span className="text-[10px] font-black text-brand-text mt-0.5 block">⭐ {selectedPlan.ratingScore}/5</span>
          </div>
          <div>
            <span className="text-[8px] text-brand-text-secondary uppercase font-semibold block">Availability</span>
            <span className="text-[9px] font-bold text-brand-success-dark mt-0.5 block truncate">✓ Secured</span>
          </div>
        </div>

        {/* Inner Content Navigation Tabs */}
        <div className="flex border-b border-gray-100 pb-1 text-xs">
          {[
            { id: 'breakdown', label: 'Budget Breakdown', icon: BarChart3 },
            { id: 'vendors', label: 'Matched Crew', icon: Users },
            { id: 'timeline', label: 'Day Timeline', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 pb-1.5 font-bold transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-text-secondary hover:text-brand-text'
                }`}
              >
                <Icon size={11} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* INNER CONTENT PORT */}
        {activeTab === 'breakdown' && (
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              {[
                { label: 'Palatial Venue Hire', amount: selectedPlan.breakdown.venue, icon: '🏰', pct: (selectedPlan.breakdown.venue / selectedPlan.totalCost) * 100 },
                { label: 'Theme Stage & Floral Decor', amount: selectedPlan.breakdown.decoration, icon: '🌸', pct: (selectedPlan.breakdown.decoration / selectedPlan.totalCost) * 100 },
                { label: 'Five-Star Gourmet Catering', amount: selectedPlan.breakdown.catering, icon: '🍽️', pct: (selectedPlan.breakdown.catering / selectedPlan.totalCost) * 100 },
                { label: 'Photo & Cinematic Video', amount: selectedPlan.breakdown.photography + selectedPlan.breakdown.videography, icon: '📸', pct: ((selectedPlan.breakdown.photography + selectedPlan.breakdown.videography) / selectedPlan.totalCost) * 100 },
                { label: 'Sound, DJ & Concert Lighting', amount: selectedPlan.breakdown.dj + selectedPlan.breakdown.lighting, icon: '🎵', pct: ((selectedPlan.breakdown.dj + selectedPlan.breakdown.lighting) / selectedPlan.totalCost) * 100 },
                { label: 'Transport & Stays logistics', amount: selectedPlan.breakdown.transportation + selectedPlan.breakdown.accommodation, icon: '🚗', pct: ((selectedPlan.breakdown.transportation + selectedPlan.breakdown.accommodation) / selectedPlan.totalCost) * 100 }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-brand-text flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="font-extrabold text-brand-primary-dark">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Miniature beautiful progress bar */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-primary h-full rounded-full" 
                      style={{ width: `${Math.max(5, Math.min(100, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-brand-text-secondary leading-normal flex items-start gap-1 bg-[#FCFBF8] p-2.5 rounded-xl border border-brand-border/40">
              <Info size={12} className="text-brand-primary shrink-0 mt-0.5" />
              <span>Catering budget allocates standard gourmet plates for <b>{planningGuestSize} guests</b>. Transportation & Stay lists automated distance buffers based on locations.</span>
            </p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3.5 pt-1">
            <div className="relative border-l border-brand-primary/20 ml-2.5 space-y-4">
              {selectedPlan.timeline.map((item, idx) => (
                <div key={idx} className="relative pl-5">
                  {/* Left dot */}
                  <div className="absolute -left-1.5 top-1 w-3 h-3 bg-white border-2 border-brand-primary rounded-full" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-brand-primary-light text-brand-primary-dark px-2 py-0.5 rounded font-black font-mono">
                        {item.time}
                      </span>
                      <h5 className="font-bold text-brand-text text-xs leading-none">{item.activity}</h5>
                    </div>
                    <p className="text-[10px] text-brand-text-secondary font-medium mt-1 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-2.5 pt-1">
            <span className="text-[9px] font-extrabold text-brand-text-secondary uppercase tracking-wider block">Verified Matched Crew</span>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(selectedPlan.vendors) as [string, Vendor][]).slice(0, 4).map(([category, vendor]) => (
                <div 
                  key={category} 
                  className="flex items-center justify-between p-2.5 border border-gray-100 rounded-2xl hover:border-brand-primary/20 transition bg-gray-50/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img 
                      src={vendor.images[0]} 
                      alt={vendor.name} 
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-[8px] bg-brand-primary-light text-brand-primary-dark px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {category}
                      </span>
                      <h5 
                        onClick={() => onShowVendorDetail(vendor)}
                        className="font-bold text-brand-text text-xs hover:text-brand-primary cursor-pointer truncate mt-0.5"
                      >
                        {vendor.name}
                      </h5>
                    </div>
                  </div>
                  
                  {/* Quick Action Swap / View */}
                  <div className="flex items-center gap-1.5">
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-brand-text block">₹{vendor.basePrice.toLocaleString('en-IN')}</span>
                      <span className="text-[8px] text-brand-text-secondary block">Base Price</span>
                    </div>
                    <button
                      onClick={() => setReplaceCategory(category)}
                      className="text-[9px] font-bold text-brand-primary hover:underline border border-brand-border hover:border-brand-primary/30 px-2.5 py-1 rounded-lg bg-white"
                    >
                      Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(selectedPlan.vendors).length > 4 && (
              <p className="text-[10px] text-brand-text-secondary text-center font-bold">
                + {Object.keys(selectedPlan.vendors).length - 4} more matched team members are bundled in this plan
              </p>
            )}
          </div>
        )}

        {/* Save, Share, and Load/Customize Actions */}
        <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3.5 mt-2 gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={handleShare}
              className="p-2.5 border border-brand-border hover:border-brand-primary hover:bg-gray-50 text-brand-text rounded-xl transition relative flex items-center justify-center"
              title="Copy Plan link"
            >
              {shareSuccess ? <CheckCircle2 size={15} className="text-brand-success" /> : <Share2 size={15} />}
              {shareSuccess && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-text text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                  Copied!
                </span>
              )}
            </button>
            <button
              onClick={handleSave}
              className="p-2.5 border border-brand-border hover:border-brand-primary hover:bg-gray-50 text-brand-text rounded-xl transition relative flex items-center justify-center"
              title="Save Plan Draft"
            >
              {saveSuccess ? <CheckCircle2 size={15} className="text-brand-success" /> : <Bookmark size={15} />}
              {saveSuccess && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-text text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                  Saved!
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-2 flex-1 justify-end">
            <button
              onClick={() => onApplyPlanToCustom(selectedPlan.vendors)}
              className="bg-brand-primary-light hover:bg-brand-primary/20 text-brand-primary-dark font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1"
              id="ai-customize-plan-btn"
            >
              <Sliders size={12} />
              <span>Load & Customize</span>
            </button>
            <button
              onClick={() => onBookDirectPlan(selectedPlan.name, selectedPlan.totalCost, Object.values(selectedPlan.vendors))}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-brand-primary/10 flex items-center gap-1"
              id="ai-book-plan-btn"
            >
              <span>Instant Book</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* Side-by-Side Comparison Matrix Trigger */}
      <div className="bg-gradient-to-r from-purple-500/5 to-brand-primary/5 border border-brand-primary/10 rounded-2xl p-3 flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={14} className="text-purple-600" />
          <div className="min-w-0">
            <h5 className="font-bold text-brand-text text-[11px] leading-tight">Side-by-Side Matrix</h5>
            <p className="text-[9px] text-brand-text-secondary truncate">Compare pricing, distance & matching scores</p>
          </div>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="bg-white border border-brand-border hover:border-brand-primary text-brand-primary-dark font-extrabold text-[10px] py-1.5 px-3 rounded-lg shadow-sm transition"
        >
          {showComparison ? 'Hide' : 'Compare Plans'}
        </button>
      </div>

      {/* Comparison Drawer / Matrix Panel */}
      {showComparison && (
        <div className="bg-white border border-brand-border rounded-3xl p-4 shadow-md space-y-3.5 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h4 className="font-extrabold text-brand-text text-xs flex items-center gap-1">
              <Calculator size={13} className="text-brand-primary" />
              <span>Full Comparative Matrix</span>
            </h4>
            <span className="text-[9px] font-bold text-brand-text-secondary">Occasion: {planningEventType}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-gray-100 text-brand-text-secondary font-bold">
                  <th className="py-2 pr-2">Plan Name</th>
                  <th className="py-2 px-2 text-right">Cost</th>
                  <th className="py-2 px-2 text-right">Savings</th>
                  <th className="py-2 px-2 text-center">Match %</th>
                  <th className="py-2 pl-2 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {plans.map((p) => (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-gray-50/50 cursor-pointer ${selectedPlanId === p.id ? 'bg-brand-primary-light/10 font-bold' : ''}`}
                    onClick={() => setSelectedPlanId(p.id)}
                  >
                    <td className="py-2.5 pr-2">
                      <span className="block text-brand-text font-bold">{p.name}</span>
                      <span className="text-[8px] text-brand-text-secondary block font-medium leading-none mt-0.5">{p.badge}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-brand-primary-dark">₹{p.totalCost.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-2 text-right text-brand-success font-bold">₹{p.savings.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="bg-brand-primary-light text-brand-primary-dark font-extrabold px-1.5 py-0.5 rounded text-[8px]">
                        {p.matchPercentage}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-center font-bold text-brand-text">⭐{p.ratingScore}</td>
                  </tr>
                ))}
                {/* Custom Plan Comparison Row */}
                {customTotal > 0 && (
                  <tr className="bg-[#FAF9F5]/40 font-bold">
                    <td className="py-2.5 pr-2 text-brand-primary-dark font-extrabold">My Custom Draft</td>
                    <td className="py-2.5 px-2 text-right font-black">₹{customTotal.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-2 text-right text-brand-success">Dynamic</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px]">
                        Personal
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-center">Dynamic</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SWAP VENDOR SCREEN SELECTION */}
      {replaceCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm max-h-[80vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] font-black text-brand-primary-dark uppercase tracking-wider block">AI Choice Replacer</span>
                <h4 className="font-extrabold text-brand-text text-sm">Replace Matched {replaceCategory}</h4>
              </div>
              <button 
                onClick={() => setReplaceCategory(null)}
                className="text-gray-400 hover:text-brand-text text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {vendors.filter(v => v.category === replaceCategory).map((v) => (
                <div 
                  key={v.id}
                  onClick={() => handleReplaceVendor(replaceCategory, v)}
                  className="flex items-center gap-3 p-3 border border-gray-100 hover:border-brand-primary rounded-2xl cursor-pointer bg-gray-50/20 hover:bg-white transition"
                >
                  <img src={v.images[0]} alt={v.name} className="w-12 h-12 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-brand-text truncate">{v.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-brand-text-secondary">⭐ {v.rating} ({v.reviewCount})</span>
                      <span className="text-[9px] bg-brand-primary-light text-brand-primary-dark px-1 py-0.5 rounded font-bold">
                        {v.trustScore}% Match
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-brand-primary mt-1 block">₹{v.basePrice.toLocaleString('en-IN')} Base</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
