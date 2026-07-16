import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Ticket, ShieldCheck, Star, Users, MapPin, Sparkles, X, ChevronRight, Share2 } from 'lucide-react';
import { Booking } from '../types';

interface SharedPlanViewProps {
  sharedBooking: any;
  onClose: () => void;
}

export default function SharedPlanView({ sharedBooking, onClose }: SharedPlanViewProps) {
  if (!sharedBooking) return null;

  const vendor = sharedBooking.vendor;
  const selectedServices = sharedBooking.selectedServices || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-bg flex items-center justify-center p-4">
      {/* Abstract elegant background grids and spheres */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 via-white to-amber-500/5 -z-10" />
      <div className="absolute top-10 left-10 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Main card box */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-full max-w-md bg-white rounded-[36px] shadow-2xl border border-brand-border overflow-hidden relative flex flex-col p-6 md:p-8"
        id="shared-plan-view-container"
      >
        {/* Confetti celebration crown icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-primary-light flex items-center justify-center mb-3 text-brand-primary shadow-inner">
            <Sparkles className="animate-pulse" size={20} />
          </div>
          <h2 className="font-black text-brand-text text-xl tracking-tight">
            Shared Celebration Plan
          </h2>
          <p className="text-xs text-brand-text-secondary mt-1 max-w-[280px]">
            You have been invited to view this premium event blueprint crafted on PARVA.
          </p>
        </div>

        {/* The Ticket Pass */}
        <div 
          className="relative bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 rounded-[24px] border border-brand-primary/20 p-5 shadow-lg shadow-brand-primary/5 overflow-hidden mb-6"
          id="shared-booking-pass"
        >
          {/* Semicircle Ticket Cuts */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border-r border-brand-primary/20 rounded-r-full z-10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border-l border-brand-primary/20 rounded-l-full z-10" />

          {/* Card Header branding */}
          <div className="flex justify-between items-center border-b border-brand-primary/20 pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 text-xs">👑</span>
              <span className="text-[10px] font-extrabold tracking-widest text-brand-primary uppercase">
                PARVA CELEBRATIONS
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-700">EXCLUSIVE</span>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="mb-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary px-2.5 py-0.5 rounded bg-brand-primary/10">
              {sharedBooking.eventType || 'Event'}
            </span>
            <h4 className="font-extrabold text-brand-text text-base mt-2.5">
              {vendor?.name || 'Grand Celebration'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-text-secondary">
                {vendor?.category || 'Vendor Partner'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-brand-text-secondary flex items-center gap-0.5">
                📍 {vendor?.location || 'Kolhapur'}
              </span>
            </div>
            
            {vendor?.rating && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex items-center text-amber-500">
                  <Star size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-brand-text">
                  {vendor.rating}
                </span>
                <span className="text-[10px] text-brand-text-secondary">
                  (Score: {vendor.trustScore || 98}%)
                </span>
              </div>
            )}
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-brand-primary/30 my-4" />

          {/* Booking metadata */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                CELEBRATION DATE
              </span>
              <span className="text-xs font-bold text-brand-text flex items-center gap-1 mt-1">
                <Calendar size={12} className="text-brand-primary" />
                {sharedBooking.eventDate || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                PLAN ID
              </span>
              <span className="text-xs font-mono font-bold text-brand-text flex items-center gap-1 mt-1">
                <Ticket size={12} className="text-amber-600" />
                {sharedBooking.bookingIdString || 'PARVA-PLAN'}
              </span>
            </div>
          </div>

          {/* Service list highlights */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-brand-primary/10 space-y-1.5 mb-4">
            <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">
              SERVICES INCLUDED
            </span>
            {selectedServices.length === 0 ? (
              <p className="text-xs text-brand-text-secondary">Base Package Services Included</p>
            ) : (
              selectedServices.map((svc: any) => (
                <div key={svc.name} className="flex justify-between items-center text-[11px]">
                  <span className="text-brand-text font-medium truncate max-w-[170px]">
                    {svc.name}
                  </span>
                  <span className="font-bold text-brand-text">
                    ₹{svc.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Total investment box */}
          <div className="bg-brand-primary text-white rounded-xl p-3 flex justify-between items-center">
            <div>
              <span className="text-[8px] font-extrabold tracking-widest uppercase opacity-80 block">
                TOTAL EVENT VALUATION
              </span>
              <span className="text-lg font-black tracking-tight">
                ₹{(sharedBooking.finalPrice || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
              CONFIRMED
            </div>
          </div>
        </div>

        {/* Viral loop action CTA */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3.5 px-4 rounded-xl text-xs font-extrabold transition shadow-lg shadow-brand-primary/15 flex items-center justify-center gap-2 active:scale-[0.98]"
            id="start-planning-btn"
          >
            <span>Start Planning Your Own Event</span>
            <ChevronRight size={14} />
          </button>
          
          <button
            onClick={() => {
              // Share the current page URL again
              if (navigator.share) {
                navigator.share({
                  title: 'PARVA Event Plan',
                  text: `Check out this event plan: ${vendor?.name}`,
                  url: window.location.href,
                }).catch(err => console.log(err));
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('📋 Link copied to clipboard!');
              }
            }}
            className="w-full bg-white hover:bg-gray-100 text-brand-text border border-brand-border py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-[0.98]"
            id="reshare-plan-btn"
          >
            <Share2 size={14} className="text-brand-text-secondary" />
            <span>Re-share This Plan</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
