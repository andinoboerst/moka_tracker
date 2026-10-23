import Link from 'next/link'
import { Coffee } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Coffee className="w-10 h-10 text-accent-ink mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-accent-ink mb-2">Sign-in didn&apos;t go through</h1>
        <p className="text-muted mb-6">
          The sign-in link is invalid or has expired. Please try again.
        </p>
        <Link
          href="/"
          className="btn-primary py-2 px-6"
        >
          Back to Moka Tracker
        </Link>
      </div>
    </main>
  )
}
