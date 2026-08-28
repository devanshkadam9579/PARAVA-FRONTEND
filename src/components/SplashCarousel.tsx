/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

interface SplashCarouselProps {
  onComplete: () => void;
  appLogo?: string;
}

export default function SplashCarousel({ onComplete }: SplashCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Discover MyParva",
      subtitle: "Everything for your celebration, in one place.",
      badge: "Step 1: Explore",
      imageUrl: "https://res.cloudinary.com/k03rmhkg/image/upload/f_auto,q_auto/v1787952909/parva_onboarding/g88ytcg5bbcoz6q695b2.webp",
      highlights: ["Wedding & Engagement", "Birthdays & Anniversaries", "Corporate Events"]
    },
    {
      id: 2,
      title: "Find the Right Professionals",
      subtitle: "Discover trusted, verified professionals near you.",
      badge: "Step 2: Connect",
      imageUrl: "https://res.cloudinary.com/k03rmhkg/image/upload/f_auto,q_auto/v1787952913/parva_onboarding/tnbcq9uvrkhhnhz53okz.webp",
      highlights: ["Banquet Halls & Venues", "Catering & Multi-Tier Menus", "Photographers & Decorators"]
    },
    {
      id: 3,
      title: "Connect & Celebrate",
      subtitle: "Plan less. Celebrate more.",
      badge: "Step 3: Celebrate",
      imageUrl: "https://res.cloudinary.com/k03rmhkg/image/upload/f_auto,q_auto/v1787952918/parva_onboarding/eahpidovhddsdwok7clk.webp",
      highlights: ["Instant Enquiries & Chat", "Automated Bundle Savings", "Official PDF Receipts"]
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem('parva_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden font-sans">
      {/* Top Header Bar with Skip Tour */}
      <header className="px-6 pt-6 pb-2 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-gray-900">
            PARVA <span className="text-brand-primary">GUIDE</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-bold text-gray-500 hover:text-brand-primary bg-gray-100/80 hover:bg-brand-primary/10 px-3.5 py-1.5 rounded-full transition active:scale-95"
        >
          Skip Tour
        </button>
      </header>

      {/* Main Slide Carousel */}
      <main className="flex-1 flex flex-col justify-center px-6 py-2 max-w-lg mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center text-center space-y-4"
          >
            {/* Illustration Container */}
            <div className="w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden bg-rose-50/40 p-2 border border-rose-100/50 shadow-sm">
              <img
                src={slides[currentSlide].imageUrl}
                alt={slides[currentSlide].title}
                className="w-full h-full object-contain rounded-2xl"
                loading="eager"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 px-2">
              <span className="inline-block bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                {slides[currentSlide].badge}
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            {/* Highlights Chips */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {slides[currentSlide].highlights.map((h, i) => (
                <span
                  key={i}
                  className="bg-gray-50 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-gray-200/60"
                >
                  ✓ {h}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step Dot Indicators */}
        <div className="flex gap-2 justify-center pt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-brand-primary' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </main>

      {/* Bottom Action Footer */}
      <footer className="p-6 max-w-lg mx-auto w-full space-y-3">
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>{currentSlide === slides.length - 1 ? "Start Planning Celebrations" : "Next"}</span>
          {currentSlide === slides.length - 1 ? <Sparkles size={16} /> : <ArrowRight size={16} />}
        </button>
      </footer>
    </div>
  );
}
