import React, { useState } from 'react';
import { ArrowLeft, Star, ShieldCheck, Gem, Tag } from 'lucide-react';
import { Booking } from '../../types';

export interface AirbnbCheckoutViewProps {
  bundledItems: { vendor: any; service: any }[];
  planningDate: string;
  planningTimeSlot: string;
  guestCount: number;
  currentUser: any;
  onPay: () => void;
  onBack: () => void;
  couponDiscount: number;
  couponCode: string;
  setCouponCode: (c: string) => void;
  onApplyCoupon: () => void;
  couponMessage: string;
}

export function AirbnbCheckoutView({
  bundledItems,
  planningDate,
  planningTimeSlot,
  guestCount,
  currentUser,
  onPay,
  onBack,
  couponDiscount,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  couponMessage
}: AirbnbCheckoutViewProps) {
  const servicesTotal = bundledItems.reduce((sum, item) => sum + item.service.price, 0);
  const bookingFee = Math.round(servicesTotal * 0.05);
  const gst = Math.round(bookingFee * 0.18);
  const finalDue = Math.max(0, bookingFee + gst - couponDiscount);

  const primaryItem = bundledItems[0] || {
    vendor: { name: 'Verified Vendor', category: 'Services', rating: 5.0, reviewCount: 20 },
    service: { name: 'Package', price: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft size={16} />
        <span>Confirm and pay</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column (Confirm and pay actions) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl font-extrabold text-gray-900 font-display">
            Proceed to payment
          </h2>
          <p className="text-xs text-gray-500">
            You'll be directed to complete payment securely with Instant Escrow Protection.
          </p>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <h4 className="text-xs font-bold text-gray-900">User Contact Details</h4>
            <p className="text-xs text-gray-600">
              Name: {currentUser?.name || 'Valued Client'} • Phone: {currentUser?.phone || 'N/A'} • Email: {currentUser?.email || 'N/A'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-[11px] text-gray-500">
              By selecting the button below, I agree to the Parva Booking Terms and Vendor Cancellation Policy.
            </p>

            <button
              type="button"
              onClick={onPay}
              className="w-full sm:w-auto px-10 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition active:scale-95"
            >
              Confirm and pay ₹{finalDue.toLocaleString('en-IN')}
            </button>
          </div>
        </div>

        {/* Right Column (Order summary card) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-md space-y-5 sticky top-28">
            {/* Rare find tag */}
            <div className="bg-pink-50 text-brand-primary text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 border border-brand-border">
              <Gem size={14} />
              <span>Rare find! This vendor is usually booked</span>
            </div>

            {/* Vendor Snippet */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <img
                src={primaryItem.vendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'}
                alt={primaryItem.vendor.name}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-gray-900 truncate">{primaryItem.vendor.name}</h4>
                <p className="text-[11px] text-gray-500">{primaryItem.service.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-gray-700 font-bold mt-0.5">
                  <Star size={11} className="fill-gray-900 text-gray-900" />
                  <span>{primaryItem.vendor.rating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({primaryItem.vendor.reviewCount || 20})</span>
                </div>
              </div>
            </div>

            {/* Dates & Guests */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Dates</span>
                  <span className="font-extrabold text-gray-900">{planningDate || '2026-09-10'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Guests</span>
                  <span className="font-extrabold text-gray-900">{guestCount || 100} Guests</span>
                </div>
              </div>
            </div>

            {/* Coupon Code input */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-brand-primary uppercase"
                />
                <button
                  type="button"
                  onClick={onApplyCoupon}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition"
                >
                  Apply
                </button>
              </div>
              {couponMessage && <p className="text-[10px] font-bold text-brand-primary">{couponMessage}</p>}
            </div>

            {/* Price Details */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Services Total:</span>
                <span className="font-bold text-gray-900">₹{servicesTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>5% Escrow Advance Fee:</span>
                <span className="font-bold text-gray-900">₹{bookingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18%):</span>
                <span className="font-bold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Due:</span>
                <span className="text-brand-primary text-base">₹{finalDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
