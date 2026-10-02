import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, ShieldCheck, Sparkles, ArrowRight, Download, 
  Share2, Calendar, MapPin, User, Check, Clock, PartyPopper
} from 'lucide-react';

export interface PaymentSuccessCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReservations: () => void;
  onContinueExploring?: () => void;
  amount: number;
  orderId?: string;
  vendorName?: string;
  serviceName?: string;
  eventDate?: string;
  timeSlot?: string;
  customerName?: string;
}

// Play pleasant high quality PhonePe-style payment confirmation chime
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Harmonic arpeggio chords: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      // Smooth attack & gentle bell decay
      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.7);
    });
  } catch (e) {
    console.warn('Audio chime playback notice:', e);
  }
}

export function PaymentSuccessCelebrationModal({
  isOpen,
  onClose,
  onViewReservations,
  onContinueExploring,
  amount,
  orderId,
  vendorName = 'Parva Partner',
  serviceName = 'Event Reservation',
  eventDate = 'Upcoming Date',
  timeSlot = 'Full Day',
  customerName = 'Valued Customer'
}: PaymentSuccessCelebrationModalProps) {
  const [countdown, setCountdown] = useState(6);
  const txnId = orderId || `PRV-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(6);
      return;
    }

    // Play synthesized chime upon open
    playSuccessChime();

    // Auto-redirect timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onViewReservations();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-gray-100 flex flex-col items-center text-center overflow-hidden relative"
      >
        {/* Confetti & Gradient Header */}
        <div className="w-full bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-600 text-white p-7 sm:p-9 relative flex flex-col items-center">
          {/* Subtle Confetti Stars */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Animated Big Green Badge */}
          <div className="relative mb-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xl shadow-black/20"
            >
              <Check className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3.5] text-emerald-600" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1"
          >
            <span className="text-xs font-black uppercase tracking-widest text-emerald-100 flex items-center justify-center gap-1">
              <Sparkles size={14} className="text-amber-300" />
              <span>Payment Successful</span>
              <Sparkles size={14} className="text-amber-300" />
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
              ₹{Number(amount).toLocaleString('en-IN')}.00
            </div>
            <p className="text-xs text-emerald-100 font-medium">
              5% Advance Paid • Escrow Protected by Parva Guarantee
            </p>
          </motion.div>
        </div>

        {/* Receipt Details Card */}
        <div className="w-full p-6 sm:p-8 space-y-5 bg-white text-left">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-2.5">
              <span className="text-gray-500 font-medium">Transaction ID</span>
              <span className="font-mono font-bold text-gray-900">{txnId}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-2.5">
              <span className="text-gray-500 font-medium">Vendor / Venue</span>
              <span className="font-extrabold text-gray-900 truncate max-w-[220px] text-right">{vendorName}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-2.5">
              <span className="text-gray-500 font-medium">Service Package</span>
              <span className="font-bold text-gray-800 truncate max-w-[220px] text-right">{serviceName}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-2.5">
              <span className="text-gray-500 font-medium">Event Date & Slot</span>
              <span className="font-bold text-emerald-700">{eventDate} ({timeSlot})</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Payment Mode</span>
              <span className="font-bold text-gray-800 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>UPI / Cashfree Instant Escrow</span>
              </span>
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/70 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="text-xs font-black text-emerald-950">100% Escrow Protection Active</h5>
              <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                Remaining 95% is paid directly to vendor on event day after satisfactory setup.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={onViewReservations}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-2xl text-sm transition shadow-lg shadow-emerald-600/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View in My Reservations</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={onContinueExploring || onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-3 px-6 rounded-2xl text-xs transition active:scale-98 cursor-pointer"
            >
              Continue Exploring
            </button>

            <p className="text-[11px] text-gray-400 text-center font-medium">
              Auto-redirecting to reservations in <span className="font-bold text-emerald-600">{countdown}s</span>...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
