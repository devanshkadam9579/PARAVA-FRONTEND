import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AnimatedListItem {
  id: string | number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  time?: string;
  badge?: string;
}

export interface AnimatedListProps {
  items: AnimatedListItem[];
  className?: string;
  onItemClick?: (item: AnimatedListItem) => void;
}

export function AnimatedList({
  items,
  className = '',
  onItemClick
}: AnimatedListProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            onClick={() => onItemClick?.(item)}
            className="flex items-center justify-between p-3.5 bg-white hover:bg-rose-50/40 rounded-2xl border border-gray-200/80 shadow-2xs hover:border-rose-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <div className="w-9 h-9 rounded-xl bg-gray-50 text-rose-600 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-rose-100/60 transition">
                  {item.icon}
                </div>
              )}
              <div>
                <h5 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition">
                  {item.title}
                </h5>
                {item.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {item.badge && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                  {item.badge}
                </span>
              )}
              {item.time && (
                <span className="text-[10px] text-gray-400 font-medium">
                  {item.time}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export default AnimatedList;
