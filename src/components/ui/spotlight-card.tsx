'use client';

import React, { useRef, useState, useEffect } from 'react';

interface GlowCardProps {
  children?: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'white';
}

const colorMap = {
  blue: { base: 220, spread: 20 },
  purple: { base: 280, spread: 30 },
  green: { base: 120, spread: 20 },
  red: { base: 0, spread: 20 },
  orange: { base: 30, spread: 20 },
  white: { base: 0, spread: 0 }
};

export const GlowCard = ({ 
  children, 
  className = '', 
  glowColor = 'purple' 
}: GlowCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, xp: 0.5, yp: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({
      x,
      y,
      xp: x / rect.width,
      yp: y / rect.height,
    });
  };

  const { base, spread } = colorMap[glowColor];
  const currentHue = base + (mousePosition.xp * spread);
  
  // High-end lighting colors
  const glowHsl = `hsl(${currentHue}, 80%, 70%)`;
  const borderGlowHsl = `hsl(${currentHue}, 100%, 80%)`;

  if (!mounted) {
    return (
      <div className={`rounded-2xl border border-white/5 bg-surface/50 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 group ${className}`}
      style={{
        background: isHovered 
          ? `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, ${borderGlowHsl}, transparent 80%)`
          : 'transparent',
        boxShadow: isHovered ? 'none' : '0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      {/* Background Layer with Ambient Glow */}
      <div className="absolute inset-[1px] rounded-[inherit] bg-neutral-50 dark:bg-[#0d0d0d] z-0 overflow-hidden">
         {/* Internal Surface Glow */}
         <div
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500"
            style={{
              opacity: isHovered ? 0.15 : 0,
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowHsl}, transparent 60%)`,
            }}
          />
          
          {/* Static Corner Shimmer (Matches the premium aesthetic) */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 p-8 h-full bg-transparent flex flex-col">
        {children}
      </div>
    </div>
  );
};
