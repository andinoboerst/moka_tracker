import React from 'react'

export function MokaPotIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Upper part - The iconic faceted top */}
      <path 
        d="M9 3H15L18 12H6L9 3Z" 
        fill={color} 
      />
      
      {/* Lower part - The boiler base */}
      <path 
        d="M6 13H18L19 22H5L6 13Z" 
        fill={color} 
        fillOpacity="0.8"
      />
      
      {/* The safety valve */}
      <circle cx="15.5" cy="17.5" r="0.7" fill="#fff" fillOpacity="0.5" />
      
      {/* The spout */}
      <path 
        d="M6 5L3 8L3 9L6 11" 
        fill={color} 
      />
      
      {/* The black handle */}
      <path 
        d="M18 7C20.5 7 21.5 9 21.5 12C21.5 15 20.5 17 18 17" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* The top knob */}
      <circle cx="12" cy="2.5" r="1" fill={color} />
      
      {/* Subtle vertical facet lines for that 'Moka Express' look */}
      <line x1="9" y1="3" x2="8.5" y2="12" stroke="#fff" strokeOpacity="0.2" strokeWidth="0.5" />
      <line x1="15" y1="3" x2="15.5" y2="12" stroke="#fff" strokeOpacity="0.2" strokeWidth="0.5" />
      <line x1="12" y1="3" x2="12" y2="12" stroke="#fff" strokeOpacity="0.2" strokeWidth="0.5" />
    </svg>
  )
}
