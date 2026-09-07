import React from 'react';

export interface ScrollVelocityProps {
  text?: string;
  className?: string;
  speed?: number;
}

export function ScrollVelocity({
  text = 'CELEBRATE • CONNECT • CREATE • PARVA • ',
  className = '',
  speed = 30
}: ScrollVelocityProps) {
  const repeatedText = `${text} ${text} ${text} ${text} `;

  return (
    <div className={`w-full overflow-hidden py-3 border-y border-gray-100 bg-gray-50/60 select-none ${className}`}>
      <div 
        className="flex whitespace-nowrap animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-gray-400 uppercase mr-8">
          {repeatedText}
        </span>
        <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-gray-400 uppercase mr-8">
          {repeatedText}
        </span>
      </div>
    </div>
  );
}
export default ScrollVelocity;
