import React from 'react'
import Image from 'next/image'
import mokaImage from './E152_color.png'

export function MokaPotIcon({ className = "w-6 h-6" }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <Image 
        src={mokaImage} 
        alt="Moka Pot" 
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
