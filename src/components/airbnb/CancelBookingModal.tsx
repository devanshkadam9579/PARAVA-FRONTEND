import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirmCancel: (bookingId: string, reason: string) => Promise<void>;
}

export function CancelBookingModal({
  isOpen,
  onClose,
  booking,
  onConfirmCancel
}: CancelBookingModalProps) {
  const [reason, setReason] = useState('Change of event plans');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    refundAmountINR: number;
    refundPercentage: number;
    policyApplied: string;
    daysUntilEvent: number;
  } | null>(null);

  useEffect(() => {
    if (!booking) return;

    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const advancePaid = booking.totalPrice ? Math.round(booking.totalPrice * 0.05 * 1.18) : 500;
    let refundPercentage = 0;
    let policyApplied = '';

    if (diffDays >= 7) {
      refundPercentage = 100;
      policyApplied = 'Early Notice Full Refund (>= 7 Days Notice)';
    } else if (diffDays >= 3) {
      refundPercentage = 50;
      policyApplied = 'Partial Refund (3 - 6 Days Notice)';
    } else {
      refundPercentage = 0;
      policyApplied = 'Late Notice (Under 3 Days - Non-Refundable)';
    }

    const refundAmountINR = Math.round((advancePaid * refundPercentage) / 100);

    setRefundInfo({
      refundAmountINR,
      refundPercentage,
      policyApplied,
      daysUntilEvent: diffDays
    });
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleCancelSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmCancel(booking.id, reason);
      onClose();
    } catch (error) {
      console.error('Cancellation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600 font-extrabold text-base">
            <AlertTriangle size={20} />
            <span>Cancel Booking</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-gray-900">{booking.vendor?.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Event Date: {booking.eventDate} • {booking.serviceName || 'Selected Service'}
          </p>
        </div>

        {/* Refund Policy Calculation Box */}
        {refundInfo && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Days until event:</span>
              <span className="font-extrabold text-gray-900">{refundInfo.daysUntilEvent} Days</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Cancellation Policy:</span>
              <span className="font-bold text-brand-primary">{refundInfo.policyApplied}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
              <span className="font-extrabold text-gray-900">Estimated Refund Amount:</span>
              <span className="text-base font-black text-emerald-600">
                ₹{refundInfo.refundAmountINR.toLocaleString('en-IN')} ({refundInfo.refundPercentage}%)
              </span>
            </div>
          </div>
        )}

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">Reason for cancellation</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-brand-primary"
          >
            <option value="Change of event plans">Change of event plans</option>
            <option value="Date rescheduled">Date rescheduled</option>
            <option value="Budget constraints">Budget constraints</option>
            <option value="Booked another vendor">Booked another vendor</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleCancelSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}
