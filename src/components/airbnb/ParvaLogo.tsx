import React from 'react';

export interface ParvaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'monochrome' | 'white' | 'icon-only';
  className?: string;
  onClick?: () => void;
}

export function ParvaLogo({
  size = 'md',
  variant = 'primary',
  className = '',
  onClick
}: ParvaLogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7 text-xs', text: 'text-lg', dot: 'w-1.5 h-1.5' },
    md: { icon: 'w-9 h-9 text-sm', text: 'text-xl', dot: 'w-2 h-2' },
    lg: { icon: 'w-11 h-11 text-base', text: 'text-2xl', dot: 'w-2.5 h-2.5' }
  }[size];

  const isIconOnly = variant === 'icon-only';
  const isWhite = variant === 'white';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      title="Parva Events Marketplace"
    >
      {/* Geometric Celebration Crest Icon */}
      <div
        className={`${sizeClasses.icon} rounded-2xl flex items-center justify-center font-black shadow-xs transition-transform duration-300 group-hover:scale-105 ${
          isWhite
            ? 'bg-white text-brand-primary'
            : 'bg-gradient-to-tr from-[#E11D48] via-[#F43F5E] to-[#FB7185] text-white shadow-rose-500/20'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          {/* Geometric Celebration Motif: Lotus Arch / Festive Canopy */}
          <path d="M12 3v18" />
          <path d="M5 9c0 5 7 10 7 10s7-5 7-10a7 7 0 0 0-14 0z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="12" cy="9" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* Wordmark */}
      {!isIconOnly && (
        <div className="flex items-baseline tracking-tight font-display">
          <span
            className={`font-black tracking-tighter ${sizeClasses.text} ${
              isWhite ? 'text-white' : 'text-gray-900'
            }`}
          >
            parva
          </span>
          <span
            className={`${sizeClasses.dot} rounded-full ml-0.5 bg-[#F43F5E] animate-pulse`}
          />
        </div>
      )}
    </div>
  );
}
