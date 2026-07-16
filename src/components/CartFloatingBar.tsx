/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartFloatingBarProps {
  itemCount: number;
  totalPrice: number;
  onClick: () => void;
  isVisible: boolean;
}

export default function CartFloatingBar({
  itemCount,
  totalPrice,
  onClick,
  isVisible
}: CartFloatingBarProps) {
  return (
    <AnimatePresence>
      {isVisible && itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[88px] left-4 right-4 z-40"
        >
          <button
            onClick={onClick}
            className="w-full bg-[#22C55E] text-white p-4 rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-between group active:scale-95 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative">
                <ShoppingCart size={18} strokeWidth={2.5} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#22C55E] text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Vendor Selection Bundle</p>
                <p className="text-sm font-black">₹{totalPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Continue to Book</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight size={18} />
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
