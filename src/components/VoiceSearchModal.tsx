/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mic, X, Sparkles, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult: (result: string) => void;
}

const TRANSCRIPT_STEPS = [
  'Listening...',
  'Listening... "wedding"',
  'Listening... "wedding decorators in Mumbai"',
  'Recognized! "Aura Premium Florals & Decor"'
];

export default function VoiceSearchModal({
  isOpen,
  onClose,
  onVoiceResult
}: VoiceSearchModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    // Progress through simulated transcript states
    const timer1 = setTimeout(() => setStepIndex(1), 800);
    const timer2 = setTimeout(() => setStepIndex(2), 1600);
    const timer3 = setTimeout(() => setStepIndex(3), 2400);
    const timer4 = setTimeout(() => {
      onVoiceResult('Aura Premium Florals');
      onClose();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onClose, onVoiceResult]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            id="voice-backdrop"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="fixed inset-x-4 top-[20%] max-w-md mx-auto bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden p-6 border border-brand-border text-center"
            id="voice-dialog"
          >
            {/* Header */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full text-brand-text-secondary transition"
                id="close-voice-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Micro Icon & Waves */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative flex items-center justify-center mb-8">
                {/* Pulsing Backing Rings */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-24 h-24 rounded-full bg-brand-primary-light/40"
                />
                <motion.div
                  animate={{ scale: [1, 1.8, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="absolute w-24 h-24 rounded-full bg-brand-primary-light/20"
                />

                {/* Primary Mic Button */}
                <div className="relative w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/30">
                  <Mic size={32} className="animate-pulse" />
                </div>
              </div>

              {/* Glowing Waveform Bars */}
              <div className="flex items-center justify-center gap-1.5 h-10 mb-6">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: stepIndex < 3 ? [10, Math.random() * 35 + 10, 10] : [10, 12, 10]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: 'easeInOut'
                    }}
                    className={`w-1 rounded-full ${
                      stepIndex === 3 ? 'bg-brand-success' : 'bg-brand-primary'
                    }`}
                  />
                ))}
              </div>

              {/* Dynamic Transcript text */}
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-14 flex items-center justify-center px-4"
              >
                {stepIndex === 3 ? (
                  <div className="flex items-center gap-1.5 text-brand-success font-medium">
                    <Sparkles size={16} />
                    <span>{TRANSCRIPT_STEPS[stepIndex]}</span>
                  </div>
                ) : (
                  <p className="text-base font-medium text-brand-text tracking-wide">
                    {TRANSCRIPT_STEPS[stepIndex]}
                  </p>
                )}
              </motion.div>

              <div className="flex items-center justify-center gap-2 text-xs text-brand-text-secondary mt-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Volume2 size={12} />
                <span>Try speaking "flower decorators" or "Grand Pavilion"</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
