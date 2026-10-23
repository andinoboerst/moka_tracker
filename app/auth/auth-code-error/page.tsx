import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">☕</div>
        <h1 className="text-2xl font-serif font-bold text-accent mb-2">Sign-in didn&apos;t go through</h1>
        <p className="text-muted mb-6">
          The sign-in link is invalid or has expired. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block bg-accent hover:bg-accent-hover text-canvas font-bold py-2 px-6 rounded-lg transition"
        >
          Back to Moka Tracker
        </Link>
      </div>
    </main>
  )
}
