/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartFloatingBarProps {
  itemCount: number;
  totalPrice: number;
  onClick: () => void;
  isVisible: boolean;
}

/**
 * Compact Floating Cart Indicator
 * Conforms to strict design specifications:
 * - Height: 50px (spec: 48-56px)
 * - Width: 210px (spec: 180-240px)
 * - Placement: Floating bottom-right pill that never covers page content
 * - Uses authoritative price & item counts from central booking state
 */
export default function CartFloatingBar({
  itemCount,
  totalPrice,
  onClick,
  isVisible
}: CartFloatingBarProps) {
  return (
    <AnimatePresence>
      {isVisible && itemCount > 0 && (
        <motion.aside
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          aria-label="Shopping Cart Selection"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40"
        >
          <button
            type="button"
            onClick={onClick}
            title="View Selected Services and Booking Summary"
            className="h-[52px] w-[210px] sm:w-[220px] bg-gray-950 hover:bg-black text-white px-3.5 rounded-full shadow-2xl shadow-black/30 border border-white/15 flex items-center justify-between group active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {/* Left: Cart Icon & Count Badge */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-rose-600/90 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShoppingBag size={15} strokeWidth={2.3} />
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-white text-gray-950 text-[10px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                  {itemCount}
                </span>
              </div>
              <div className="text-left flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-300 leading-tight">
                  Cart ({itemCount})
                </span>
                <span className="text-xs font-black text-white leading-tight">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Right: Micro Action */}
            <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-rose-600 flex items-center justify-center text-white transition-colors shrink-0">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
