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
    <footer className="py-8 px-4 mt-8">
      <span className="tricolore-divider mb-5" aria-hidden="true" />
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
        <Link
          href="/privacy"
          className="hover:text-accent transition"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="hover:text-accent transition"
        >
          Terms
        </Link>
        <button
          onClick={handleCopyEmail}
          className="hover:text-accent transition cursor-pointer bg-transparent border-0 p-0 text-xs relative"
          title="Click to copy"
        >
          {copied ? 'Copied!' : 'support@mokatracker.com'}
        </button>
      </div>
      <p className="text-center text-[11px] text-muted/70 mt-4 italic font-serif">Fatto con ☕ e passione</p>
    </footer>
  )
}
