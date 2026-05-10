import React from 'react'

export function MokaPotIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Upper chamber */}
      <path d="M7 2 L17 2 L19 12 L5 12 Z" />
      {/* Lower chamber */}
      <path d="M5 12 L3 22 L21 22 L19 12 Z" />
      {/* Handle */}
      <path d="M18 6 C21 6 22 9 22 12 C22 15 21 18 18 18" />
      {/* Spout */}
      <path d="M5 5 L2 8" />
      {/* Central band/knob */}
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="12" cy="2" r="1" fill={color} />
    </svg>
  )
}
