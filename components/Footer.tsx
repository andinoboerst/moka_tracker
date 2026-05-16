'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function Footer() {
  const { user } = useAuth()

  // Only show footer links when user is not logged in
  // (logged-in users can access them from the user dropdown menu)
  if (user) {
    return null
  }

  return (
    <footer className="py-4 px-4">
      <div className="flex gap-4 text-xs text-[#8b6f47]">
        <Link 
          href="/privacy" 
          className="hover:text-[#d4a574] transition"
        >
          Privacy
        </Link>
        <Link 
          href="/terms" 
          className="hover:text-[#d4a574] transition"
        >
          Terms
        </Link>
      </div>
    </footer>
  )
}
