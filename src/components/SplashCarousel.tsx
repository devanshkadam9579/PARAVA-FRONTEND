/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, MapPin, Package, Building2 } from 'lucide-react';
import mandalaPattern from '../assets/images/mandala_pattern_1782933605563.jpg';

interface SplashCarouselProps {
  onComplete: () => void;
  appLogo?: string;
}

export default function SplashCarousel({ onComplete, appLogo }: SplashCarouselProps) {
  const [step, setStep] = useState<'splash' | 'carousel'>('splash');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto transition from Splash to Carousel after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('carousel');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const slides = [
    {
      title: "Welcome to Parva",
      subtitle: "Your Complete Event Platform",
      description: "Plan your celebrations effortlessly. We bring the best professionals together in one place so you can focus on creating memories.",
      stats: [
        { icon: Building2, text: "500+ Verified Vendors" },
        { icon: MapPin, text: "Active in 15+ Cities" }
      ],
      icon: Sparkles,
      color: "text-brand-primary"
    },
    {
      title: "Step 1: Discover & Filter",
      subtitle: "Find the Perfect Match",
      description: "Select your city and choose from various categories like Banquet Halls, Decorators, and Photographers. Use our smart filters to match your exact budget and guest size.",
      stats: [
        { icon: CheckCircle2, text: "Transparent Pricing" },
        { icon: CheckCircle2, text: "Verified Reviews" }
      ],
      icon: MapPin,
      color: "text-amber-500"
    },
    {
      title: "Step 2: Bundle & Save",
      subtitle: "Maximize Your Budget",
      description: "Add multiple services to your event plan and unlock automated bundle discounts. Manage all your bookings through a single, unified dashboard.",
      stats: [
        { icon: Package, text: "Automated Discounts" },
        { icon: CheckCircle2, text: "1-Click Booking" }
      ],
      icon: Package,
      color: "text-pink-500"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem('parva_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FEF8F2] flex flex-col justify-between overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {step === 'splash' ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative"
          >
            {/* Ambient decorative patterns */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-brand-primary-light/50 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-brand-accent/30 blur-3xl pointer-events-none" />

            <div className="space-y-6 text-center">
              {/* Rotating Mandala Logo */}
              <div className="relative w-32 h-32 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                  className="w-full h-full rounded-full overflow-hidden border-2 border-brand-primary/20 shadow-lg p-1 bg-white flex items-center justify-center"
                >
                  <img
                    src={appLogo || "https://i.postimg.cc/mgk6dNNd/parva-logo.png"}
                    alt="PARVA Logo"
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = mandalaPattern; }}
                  />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#FEF8F2]/90 rounded-full flex items-center justify-center border border-brand-primary/10 shadow-md">
                    <Sparkles className="text-brand-primary animate-pulse" size={28} />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black tracking-tight text-brand-text font-display"
                >
                  PARVA <span className="text-brand-primary">CELEBRATIONS</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-brand-text-secondary font-semibold uppercase tracking-widest"
                >
                  Plan • Bundle • Save
                </motion.p>
              </div>

              {/* Loader */}
              <div className="w-20 h-1 bg-brand-primary-light rounded-full mx-auto overflow-hidden relative">
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-1/2 bg-brand-primary rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="carousel-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full relative"
          >
            {/* Skip header */}
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-1.5 text-brand-primary">
                <Sparkles size={16} />
                <span className="text-xs font-black tracking-wider uppercase font-display">Parva Guide</span>
              </div>
              <button
                onClick={handleFinish}
                className="text-xs font-extrabold text-brand-text-secondary hover:text-brand-primary px-3 py-1.5 rounded-full hover:bg-brand-primary-light transition"
              >
                Skip Tour
              </button>
            </div>

            {/* Slide Body */}
            <div className="flex-1 flex flex-col justify-center py-4 space-y-8">
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className={`w-24 h-24 rounded-full bg-white shadow-xl border border-brand-border flex items-center justify-center ${slides[currentSlide].color}`}>
                  {React.createElement(slides[currentSlide].icon, { size: 48 })}
                </div>
                
                {/* Title & Description */}
                <div className="space-y-4 px-4">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-brand-accent">
                      {slides[currentSlide].subtitle}
                    </span>
                    <h2 className="text-3xl font-black text-brand-text leading-tight tracking-tight font-display">
                      {slides[currentSlide].title}
                    </h2>
                  </div>
                  <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                    {slides[currentSlide].description}
                  </p>
                </div>
              </div>

              {/* Stats / Features Grid */}
              <div className="grid grid-cols-1 gap-3 px-4">
                {slides[currentSlide].stats.map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
                      {React.createElement(stat.icon, { size: 20 })}
                    </div>
                    <span className="font-bold text-brand-text">{stat.text}</span>
                  </div>
                ))}
              </div>

              {/* Interactive preview indicators */}
              <div className="flex gap-2 items-center justify-center pt-4">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-primary/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slide Navigation Actions footer */}
            <div className="space-y-4 py-2">
              <button
                onClick={handleNext}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-lg py-4 rounded-[18px] transition shadow-lg shadow-brand-primary/15 flex items-center justify-center gap-2"
              >
                <span>{currentSlide === slides.length - 1 ? "Start Planning" : "Continue"}</span>
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
              
              <div className="text-center">
                <span className="text-[11px] text-brand-text-secondary font-semibold">
                  By continuing, you agree to our verified event execution warranty
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
