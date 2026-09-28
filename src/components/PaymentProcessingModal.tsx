import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export interface PaymentProcessingModalProps {
  isOpen: boolean;
  amount?: number;
  vendorName?: string;
  serviceName?: string;
}

export function PaymentProcessingModal({
  isOpen,
  amount = 0,
  vendorName = 'Parva Partner',
  serviceName = 'Event Reservation'
}: PaymentProcessingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Connecting Secure Gateway',
      desc: '128-bit SSL encrypted bank channel initialized',
      duration: 700
    },
    {
      id: 2,
      title: 'Authorizing 5% Booking Advance',
      desc: `Verifying token for ₹${amount.toLocaleString('en-IN')} escrow reservation`,
      duration: 1100
    },
    {
      id: 3,
      title: 'Locking Vendor Calendar & Slots',
      desc: `Guaranteeing availability with ${vendorName}`,
      duration: 1000
    },
    {
      id: 4,
      title: 'Finalizing Booking Token & Receipt',
      desc: 'Generating official 100% Escrow protected voucher',
      duration: 800
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    const t1 = setTimeout(() => setCurrentStep(2), 700);
    const t2 = setTimeout(() => setCurrentStep(3), 1800);
    const t3 = setTimeout(() => setCurrentStep(4), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col items-center relative overflow-hidden"
      >
        {/* Animated Background Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none" />

        {/* Top Pulsing Security Badge */}
        <div className="relative mb-5">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-md"
          />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-900 text-center tracking-tight">
          Processing Secure Payment
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1 font-medium">
          Please keep this window open while we secure your booking
        </p>

        {/* Order Summary Pill */}
        {amount > 0 && (
          <div className="mt-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl px-4 py-2 flex items-center justify-between w-full text-xs">
            <span className="font-bold text-gray-700 truncate max-w-[200px]">{vendorName}</span>
            <span className="font-black text-emerald-700 text-sm">₹{amount.toLocaleString('en-IN')}.00</span>
          </div>
        )}

        {/* Step-by-Step Checklist with Animated Green Check Signs */}
        <div className="w-full mt-6 space-y-3">
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step.id * 0.1 }}
                className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                    : isCurrent
                    ? 'bg-emerald-50/30 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-gray-50/60 border-gray-100 opacity-50'
                }`}
              >
                {/* Green Sign Indicator */}
                <div className="shrink-0">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30"
                    >
                      <CheckCircle2 size={18} className="stroke-[3]" />
                    </motion.div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold font-mono">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-xs font-extrabold ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </h5>
                    {isDone && (
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <Lock size={12} className="text-emerald-600" />
          <span>100% Escrow Protected by Parva Guarantee</span>
        </div>
      </motion.div>
    </div>
  );
}
