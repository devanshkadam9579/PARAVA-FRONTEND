import React from 'react';

export interface BendingMarqueeProps {
  items: Array<{ title: string; subtitle?: string; icon?: React.ReactNode; image?: string }>;
  className?: string;
  speed?: number;
}

export function BendingMarquee({
  items,
  className = '',
  speed = 25
}: BendingMarqueeProps) {
  // Duplicate items for continuous looping
  const displayItems = [...items, ...items, ...items];

  return (
    <div className={`relative w-full overflow-hidden py-4 select-none ${className}`}>
      {/* Subtle left & right gradient fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      <div 
        className="flex items-center gap-4 w-max animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-5 py-2.5 bg-gray-50/80 hover:bg-rose-50/40 rounded-full border border-gray-200/70 transition shrink-0 group cursor-default"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-7 h-7 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            )}
            {item.icon && !item.image && (
              <div className="text-rose-600">
                {item.icon}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-black text-gray-900 tracking-tight">
                {item.title}
              </span>
              {item.subtitle && (
                <span className="text-[11px] text-gray-400 font-medium">
                  {item.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default BendingMarquee;
