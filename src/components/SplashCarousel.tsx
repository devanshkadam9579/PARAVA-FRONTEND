/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Gift, Calendar, Heart, PartyPopper } from 'lucide-react';
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
      title: "Plan Your Celebrations Like Pro",
      subtitle: "Zomato-Style Easy Matching",
      description: "Simply select your event type, date, guest size, and target budget. Our smart matchmaker filters and highlights perfect verified vendors instantly.",
      badge: "Smart Filters",
      icon: Calendar,
      color: "from-orange-500 to-red-600",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Handpicked Premium Categories",
      subtitle: "Urban Clap Style Simplicity",
      description: "Browse handpicked banquet halls, DJs, decorators, photographers, makeups, and gorgeous cakes. Clean, standard service pricing with zero hidden margins.",
      badge: "Verified Quality",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-600",
      image: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Unlock Super Saver Discounts",
      subtitle: "The More You Bundle, The More You Save",
      description: "Add multiple service slots to your active plan and enjoy automated multiplier discounts. Save up to 22% on combined packages with 1-click booking.",
      badge: "Super Saver Packs",
      icon: Gift,
      color: "from-pink-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600"
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
            <div className="flex-1 flex flex-col justify-center py-4 space-y-6">
              {/* Illustration Block */}
              <div className="relative rounded-[32px] overflow-hidden shadow-xl aspect-video border border-brand-border bg-white group">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Floating category badges */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/95 text-brand-text text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    {React.createElement(slides[currentSlide].icon, { size: 12, className: "text-brand-primary" })}
                    <span>{slides[currentSlide].badge}</span>
                  </span>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent mb-1 block">
                    {slides[currentSlide].subtitle}
                  </span>
                  <p className="text-sm font-bold leading-tight">
                    Premium Verified Vendors Only
                  </p>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-brand-text leading-tight tracking-tight font-display">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-xs text-brand-text-secondary leading-relaxed font-medium">
                  {slides[currentSlide].description}
                </p>
              </div>

              {/* Interactive preview indicators */}
              <div className="flex gap-1.5 items-center justify-start py-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-6 bg-brand-primary' : 'w-2 bg-brand-primary/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slide Navigation Actions footer */}
            <div className="space-y-4 py-2">
              <button
                onClick={handleNext}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-sm py-4 rounded-[18px] transition shadow-lg shadow-brand-primary/15 flex items-center justify-center gap-1.5"
              >
                <span>{currentSlide === slides.length - 1 ? "Let's Get Started" : "Continue Tour"}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              
              <div className="text-center">
                <span className="text-[10px] text-brand-text-secondary font-semibold">
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
