'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import AuthModal from '@/components/AuthModal'
import BrewCard from '@/components/BrewCard'
import { Brew } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { MokaPotIcon } from '@/components/icons/MokaPotIcon'
import { useLanguage } from '@/lib/LanguageContext'

export default function Home() {
  const { language, t } = useLanguage()
  const { user, loading: authLoading, signInAnonymously } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
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

  const handleGuestSignIn = async () => {
    const { error } = await signInAnonymously()
    if (error) {
      alert(error.message)
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
      <Header onSignInClick={() => setIsAuthModalOpen(true)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#d4a574] mb-2">
            {t('dashboard.headline')}
          </h1>
          <p className="text-[#8b6f47] text-lg italic">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Guest Mode Warning */}
        {user?.is_anonymous && (
          <div className="mb-8 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="text-[#f5f1ed] font-bold text-sm">{t('common.guest_mode_warning')}</p>
              <p className="text-[#8b6f47] text-xs mt-1">{t('common.guest_mode_description')}</p>
            </div>
          </div>
        )}

        {/* Not signed in */}
        {!authLoading && !user ? (
          <div className="text-center py-20 bg-[#2d2520] border border-[#3d3530] rounded-xl px-6 relative overflow-hidden">
            {/* Background design element */}
            <div className="absolute top-0 left-0 w-full h-1 flex">
              <div className="flex-1 bg-italy-green"></div>
              <div className="flex-1 bg-white"></div>
              <div className="flex-1 bg-italy-red"></div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="text-7xl mb-6">☕</div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#d4a574] mb-4">
                {language === 'it' ? 'Il tuo rituale, elevato.' : 'Your ritual, elevated.'}
              </h2>
              <p className="text-[#8b6f47] text-lg mb-10 leading-relaxed">
                {language === 'it' 
                  ? 'Traccia ogni dettaglio della tua Moka. Dalla macinatura alla temperatura, perfeziona il tuo caffè con l\'aiuto dell\'AI.' 
                  : 'Track every detail of your Moka ritual. From grind size to water temperature, perfect your coffee with AI-driven insights.'}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-3 px-10 rounded-lg transition shadow-lg text-lg"
                >
                  {t('common.sign_in')}
                </button>
                <button 
                  onClick={handleGuestSignIn}
                  className="w-full sm:w-auto bg-transparent border-2 border-[#3d3530] hover:border-[#5a4f4a] text-[#f5f1ed] font-bold py-3 px-10 rounded-lg transition text-lg"
                >
                  {t('common.continue_as_guest')}
                </button>
              </div>
              
              <div className="mt-12 p-4 bg-[#1a1410]/50 rounded-lg border border-yellow-900/30">
                <p className="text-yellow-600 font-bold text-sm mb-1">⚠️ {t('common.guest_mode_warning')}</p>
                <p className="text-[#8b6f47] text-xs">
                  {t('common.guest_mode_description')}
                </p>
              </div>
            </div>
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
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-[#d4a574]">
                        <MokaPotIcon className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">✨</span>
                          <h2 className="text-xl font-serif font-bold text-[#d4a574]">{t('dashboard.next_brew_guide')}</h2>
                        </div>
                        <p className="text-[#8b6f47] text-sm mb-3">
                          {t('dashboard.based_on_last', { bean: brews[0].bean?.name || '?', rating: brews[0].vibe_rating })}
                        </p>
                        <p className="text-[#f5f1ed] text-lg font-medium leading-relaxed mb-6 max-w-3xl">
                          "{parsed.suggestion}"
                        </p>
                        <Link
                          href="/brew"
                          className="inline-block bg-transparent border-2 border-[#d4a574] hover:bg-[#d4a574] hover:text-[#1a1410] text-[#d4a574] font-bold py-2 px-6 rounded transition"
                        >
                          {t('dashboard.log_next')}
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
                <p className="text-[#8b6f47] text-sm mb-2">{t('dashboard.total_brews')}</p>
                <p className="text-4xl font-bold text-[#d4a574]">{brews.length}</p>
              </div>
              <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 text-center">
                <p className="text-[#8b6f47] text-sm mb-2">{t('dashboard.avg_vibe')}</p>
                <p className="text-4xl font-bold text-[#d4a574]">
                  {brews.length > 0
                    ? (brews.reduce((sum, b) => sum + b.vibe_rating, 0) / brews.length).toFixed(1)
                    : '—'}
                </p>
              </div>
              <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 text-center">
                <p className="text-[#8b6f47] text-sm mb-2">{t('dashboard.quick_action')}</p>
                <Link
                  href="/brew"
                  className="inline-block bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition"
                >
                  {t('nav.log_brew')} →
                </Link>
              </div>
            </div>

            {/* Brews List */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-[#d4a574] mb-6">{t('dashboard.recent_brews')}</h2>

              {loading ? (
                <div className="text-center py-12 text-[#8b6f47]">
                  <p>{t('dashboard.loading')}</p>
                </div>
              ) : error ? (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-6 py-4 rounded">
                  {error}
                </div>
              ) : brews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#8b6f47] mb-4">{t('dashboard.no_brews')}</p>
                  <Link
                    href="/brew"
                    className="inline-block bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-6 rounded transition"
                  >
                    + {t('nav.log_brew')}
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
