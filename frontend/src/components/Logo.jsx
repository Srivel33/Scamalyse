import React from 'react';

export default function Logo({ className = '', width = 24, height = 24 }) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Outer Shield Outline */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {/* Inner Lens / Magnifying Glass */}
      <circle cx="11" cy="11" r="3" />
      <line x1="15" y1="15" x2="13.1" y2="13.1" />
    </svg>
  );
}
