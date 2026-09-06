import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, ArrowRight, Download, MessageSquare, 
  XCircle, Star, ShieldCheck, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Booking } from '../../types';
import { CancelBookingModal } from './CancelBookingModal';
import { ReviewsModal } from './ReviewsModal';

export interface MyBookingsViewProps {
  bookings: Booking[];
  onOpenChatWithVendor: (vendorId: string, bookingId: string) => void;
  onDownloadVoucher: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason: string) => Promise<void>;
  onSubmitReview: (bookingId: string, vendorId: string, rating: number, comment: string) => Promise<void>;
  onExploreServices: () => void;
}

export function MyBookingsView({
  bookings,
  onOpenChatWithVendor,
  onDownloadVoucher,
  onCancelBooking,
  onSubmitReview,
  onExploreServices
}: MyBookingsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'upcoming') return b.status === 'CONFIRMED' || b.status === 'Pending' || b.status === 'VENDOR_PENDING';
    if (activeFilter === 'completed') return b.status === 'Completed' || b.status === 'COMPLETED';
    if (activeFilter === 'cancelled') return b.status === 'Cancelled' || b.status === 'CANCELLED' || b.status === 'REFUNDED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 font-display">My Bookings & Events</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your upcoming event reservations, invoices and vendor chats</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                activeFilter === filter
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-200 space-y-3">
          <Calendar size={40} className="mx-auto text-gray-400" />
          <h3 className="font-extrabold text-base text-gray-900">No {activeFilter !== 'all' ? activeFilter : ''} bookings found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Explore verified celebration specialists and book your dream decor, catering, and DJ in minutes.
          </p>
          <button
            type="button"
            onClick={onExploreServices}
            className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition"
          >
            Explore Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'Confirmed';
            const isPending = b.status === 'Pending' || b.status === 'VENDOR_PENDING';
            const isCancelled = b.status === 'Cancelled' || b.status === 'CANCELLED' || b.status === 'REFUNDED';
            const isCompleted = b.status === 'Completed' || b.status === 'COMPLETED';

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Status Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      ID: {b.bookingIdString || b.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : isCancelled
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {isConfirmed && <CheckCircle2 size={11} />}
                      {isPending && <Clock size={11} />}
                      {isCancelled && <XCircle size={11} />}
                      <span>{b.status}</span>
                    </span>
                  </div>

                  {/* Vendor Details */}
                  <div className="flex items-center gap-3.5">
                    <img
                      src={b.vendor?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'}
                      alt={b.vendor?.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-gray-900 truncate">{b.vendor?.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{b.serviceName || b.vendor?.category}</p>
                      <p className="text-xs font-black text-gray-900 mt-0.5">
                        ₹{(b.totalPrice || 0).toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-gray-400">(Total Event Value)</span>
                      </p>
                    </div>
                  </div>

                  {/* Schedule Snapshot */}
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={13} className="text-brand-primary shrink-0" />
                      <span className="font-bold text-gray-800 truncate">{b.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock size={13} className="text-brand-primary shrink-0" />
                      <span className="font-bold text-gray-800 truncate capitalize">{b.eventTimeSlot || 'Evening Slot'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Chat Trigger */}
                    <button
                      type="button"
                      onClick={() => onOpenChatWithVendor(b.vendor?.id, b.id)}
                      className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 border border-gray-200 transition"
                      title="Chat with Vendor"
                    >
                      <MessageSquare size={14} className="text-brand-primary" />
                    </button>

                    {/* PDF Voucher */}
                    <button
                      type="button"
                      onClick={() => onDownloadVoucher(b)}
                      className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 border border-gray-200 transition"
                      title="Download Invoice PDF"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Cancellation Button */}
                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForCancel(b)}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Review Button */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForReview(b)}
                        className="text-xs font-bold text-brand-primary hover:bg-brand-primary-light px-3 py-1.5 rounded-xl border border-brand-border transition flex items-center gap-1"
                      >
                        <Star size={12} className="fill-brand-primary" />
                        <span>Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      <CancelBookingModal
        isOpen={Boolean(selectedBookingForCancel)}
        onClose={() => setSelectedBookingForCancel(null)}
        booking={selectedBookingForCancel}
        onConfirmCancel={onCancelBooking}
      />

      {/* Review Modal */}
      <ReviewsModal
        isOpen={Boolean(selectedBookingForReview)}
        onClose={() => setSelectedBookingForReview(null)}
        booking={selectedBookingForReview}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
}
