import React from 'react';
import { useBranding } from '../../hooks/useBranding';

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
  const { logoUrl, logoAltText, logoDarkUrl } = useBranding();

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  }[size];

  const effectiveLogoUrl = variant === 'white' && logoDarkUrl ? logoDarkUrl : logoUrl;
  const isWhiteFilter = variant === 'white' && !logoDarkUrl ? 'brightness-0 invert' : '';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer select-none group ${className}`}
      title={logoAltText || 'MyParva - Celebration Booking Platform'}
    >
      <img 
        src={effectiveLogoUrl || '/parva-logo.png'} 
        alt={logoAltText || 'MyParva'} 
        className={`${sizeClasses} ${isWhiteFilter} object-contain transition-transform duration-300 group-hover:scale-105`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/parva-logo.png';
        }}
      />
    </div>
  );
}
