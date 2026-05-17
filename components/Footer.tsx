'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'

export default function Footer() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@mokatracker.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <button
          onClick={handleCopyEmail}
          className="hover:text-[#d4a574] transition cursor-pointer bg-transparent border-0 p-0 text-xs relative"
          title="Click to copy"
        >
          {copied ? 'Copied!' : 'support@mokatracker.com'}
        </button>
      </div>
    </footer>
  )
}
