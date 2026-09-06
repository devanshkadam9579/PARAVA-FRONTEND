import React, { useState } from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';

export interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSubmitReview: (bookingId: string, vendorId: string, rating: number, comment: string) => Promise<void>;
}

export function ReviewsModal({
  isOpen,
  onClose,
  booking,
  onSubmitReview
}: ReviewsModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitReview(booking.id, booking.vendor?.id, rating, comment);
      onClose();
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-extrabold text-base text-gray-900">Rate & Review Experience</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div>
          <h4 className="font-bold text-xs text-gray-900">{booking.vendor?.name}</h4>
          <p className="text-[11px] text-gray-500">{booking.serviceName} • {booking.eventDate}</p>
        </div>

        {/* Star Selector */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 transition hover:scale-110 active:scale-95"
            >
              <Star
                size={28}
                className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>

        {/* Comment Box */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 block">Your Feedback</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details of decoration, catering taste, punctuality, or vendor professionalism..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-900 outline-none focus:border-brand-primary"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !comment.trim()}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Verified Review'}
        </button>
      </div>
    </div>
  );
}
