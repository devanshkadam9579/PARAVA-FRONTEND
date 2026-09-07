import React, { useState, useRef } from 'react';

export interface GlareHoverProps {
  children: React.ReactNode;
  className?: string;
  glareOpacity?: number;
  borderRadius?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function GlareHover({
  children,
  className = '',
  glareOpacity = 0.25,
  borderRadius = '1.5rem',
  onClick
}: GlareHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePosition({ x, y, opacity: glareOpacity });
  };

  const handleMouseLeave = () => {
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={{ borderRadius }}
    >
      {children}
      {/* Light Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle 240px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.7), transparent 80%)`
        }}
      />
    </div>
  );
}
export default GlareHover;
