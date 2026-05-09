'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import BrewCard from '@/components/BrewCard'
import { Brew } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [brews, setBrews] = useState<Brew[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Wait for auth to resolve before fetching
    if (!authLoading) {
      if (user) {
        fetchBrews()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const fetchBrews = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/brews', { headers })
      if (!response.ok) throw new Error('Failed to fetch brews')
      const data = await response.json()
      setBrews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading brews')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/brews?id=${id}`, {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) throw new Error('Failed to delete brew')
      setBrews(brews.filter((b) => b.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#d4a574] mb-2">
            Brewing Dashboard
          </h1>
          <p className="text-[#8b6f47] text-lg">
            Track your perfect moka pot brews. Every detail matters.
          </p>
        </div>

        {/* Not signed in */}
        {!authLoading && !user ? (
          <div className="text-center py-20 bg-[#2d2520] border border-[#3d3530] rounded-lg">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-serif font-bold text-[#d4a574] mb-2">Welcome to Moka Tracker</h2>
            <p className="text-[#8b6f47] mb-6">Sign in to start logging your brews.</p>
            <p className="text-[#8b6f47] text-sm">Click <strong className="text-[#d4a574]">Sign In</strong> in the top right corner.</p>
          </div>
        ) : (
          <>
            {/* Next Brew Guide Card */}
            {brews.length > 0 && brews[0].ai_recap && (() => {
              try {
                const parsed = JSON.parse(brews[0].ai_recap);
                if (parsed.suggestion) {
                  return (
                    <div className="mb-8 bg-gradient-to-r from-[#2d2520] to-[#1a1410] border border-[#d4a574]/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-8xl">☕</span>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">✨</span>
                          <h2 className="text-xl font-serif font-bold text-[#d4a574]">Next Brew Guide</h2>
                        </div>
                        <p className="text-[#8b6f47] text-sm mb-3">
                          Based on your last brew ({brews[0].bean?.name ? `${brews[0].bean.name}, ` : ''}{brews[0].vibe_rating}/10 vibe):
                        </p>
                        <p className="text-[#f5f1ed] text-lg font-medium leading-relaxed mb-6 max-w-3xl">
                          "{parsed.suggestion}"
                        </p>
                        <Link
                          href="/brew"
                          className="inline-block bg-transparent border-2 border-[#d4a574] hover:bg-[#d4a574] hover:text-[#1a1410] text-[#d4a574] font-bold py-2 px-6 rounded transition"
                        >
                          Log Next Brew →
                        </Link>
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                // If parsing fails, it's an old string-only recap, skip showing the card
              }
              return null;
            })()}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 text-center">
                <p className="text-[#8b6f47] text-sm mb-2">Total Brews</p>
                <p className="text-4xl font-bold text-[#d4a574]">{brews.length}</p>
              </div>
              <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 text-center">
                <p className="text-[#8b6f47] text-sm mb-2">Avg Vibe Rating</p>
                <p className="text-4xl font-bold text-[#d4a574]">
                  {brews.length > 0
                    ? (brews.reduce((sum, b) => sum + b.vibe_rating, 0) / brews.length).toFixed(1)
                    : '—'}
                </p>
              </div>
              <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 text-center">
                <p className="text-[#8b6f47] text-sm mb-2">Quick Action</p>
                <Link
                  href="/brew"
                  className="inline-block bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition"
                >
                  Log Brew →
                </Link>
              </div>
            </div>

            {/* Brews List */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-[#d4a574] mb-6">Recent Brews</h2>

              {loading ? (
                <div className="text-center py-12 text-[#8b6f47]">
                  <p>Loading your brewing history...</p>
                </div>
              ) : error ? (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-6 py-4 rounded">
                  {error}
                </div>
              ) : brews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#8b6f47] mb-4">No brews logged yet.</p>
                  <Link
                    href="/brew"
                    className="inline-block bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-6 rounded transition"
                  >
                    Log Your First Brew
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {brews.map((brew) => (
                    <BrewCard
                      key={brew.id}
                      brew={brew}
                      onDelete={handleDelete}
                      isDeleting={false}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
