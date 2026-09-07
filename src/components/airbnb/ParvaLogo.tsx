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
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer select-none group ${className}`}
      title="MyParva - Celebration Booking Platform"
    >
      <img 
        src="/parva-logo.png" 
        alt="MyParva" 
        className={`${sizeClasses} object-contain transition-transform duration-300 group-hover:scale-105`} 
      />
    </div>
  );
}
