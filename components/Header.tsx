'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'
import AuthModal from './AuthModal'

export default function Header() {
  const { user, signOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <header className="bg-[#2d2520] border-b border-[#3d3530] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">☕</div>
              <h1 className="text-xl font-bold text-[#d4a574]">Moka Tracker</h1>
            </Link>
            
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex gap-8">
                <Link href="/" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  Dashboard
                </Link>
                <Link href="/inventory" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  Inventory
                </Link>
                <Link href="/brew" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  New Brew
                </Link>
              </nav>
              
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-[#8b6f47] text-sm">
                      {user.email}
                    </span>
                    <button
                      onClick={signOut}
                      className="text-[#f5f1ed] hover:text-[#d4a574] text-sm transition"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition text-sm"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}
