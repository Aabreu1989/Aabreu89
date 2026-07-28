
import React from 'react';

export const HandsHeartIcon = ({ size = 24, className = '', fill = 'none' }: { size?: number, className?: string, fill?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill === 'currentColor' ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
  >
    {/* Hands forming a heart shape 🫶 gesture */}
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path d="M7 10c-1-1-2-1-3 0" />
    <path d="M17 10c1-1 2-1 3 0" />
    <path d="M9 13c-0.5-0.5-1.5-0.5-2 0.5" />
    <path d="M15 13c0.5-0.5 1.5-0.5 2 0.5" />
  </svg>
);
