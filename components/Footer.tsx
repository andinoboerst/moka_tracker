'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'
import { Check } from 'lucide-react'

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

  const linkCls = 'text-muted hover:text-ink transition-colors'

  return (
    <footer className="mt-12 border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-4">
        <span className="tricolore-divider" aria-hidden="true" />
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
        >
          <Link href="/privacy" className={linkCls}>
            Privacy
          </Link>
          <span className="text-line-strong" aria-hidden="true">/</span>
          <Link href="/terms" className={linkCls}>
            Terms
          </Link>
          <span className="text-line-strong" aria-hidden="true">/</span>
          <button
            onClick={handleCopyEmail}
            className={`${linkCls} cursor-pointer bg-transparent border-0 p-0 text-xs inline-flex items-center gap-1.5`}
            title="Click to copy"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sage" /> Copied
              </>
            ) : (
              'support@mokatracker.com'
            )}
          </button>
        </nav>
        <p className="text-xs text-muted/80">Fatto con passione. Servito senza fretta.</p>
      </div>
    </footer>
  )
}
