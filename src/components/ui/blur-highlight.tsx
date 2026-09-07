import React from 'react';

export interface BlurHighlightProps {
  children: React.ReactNode;
  highlightText?: string;
  className?: string;
}

export function BlurHighlight({
  children,
  highlightText,
  className = ''
}: BlurHighlightProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Background soft ambient blur */}
      <div 
        aria-hidden="true" 
        className="absolute -inset-1 bg-gradient-to-r from-rose-200/50 via-pink-100/40 to-amber-100/40 rounded-3xl blur-md opacity-70 pointer-events-none -z-10"
      />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
export default BlurHighlight;
