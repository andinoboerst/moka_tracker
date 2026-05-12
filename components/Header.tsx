'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useState, useRef, useEffect } from 'react'
import AuthModal from './AuthModal'
import { User, Menu, X, Trash2, LogOut, UserPlus } from 'lucide-react'
import { MokaPotIcon } from './icons/MokaPotIcon'
import { getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

interface HeaderProps {
  onSignInClick?: () => void
}

export default function Header({ onSignInClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage()
  const { user, signOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('common.confirm_delete_account'))) {
      return
    }

    setIsDeletingAccount(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Successfully deleted on server, now sign out locally
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting account')
      setIsDeletingAccount(false)
    }
  }

  return (
    <>
      <header className="bg-[#2d2520] border-b border-[#3d3530] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="text-[#d4a574] transition-transform group-hover:scale-110 group-hover:rotate-6">
                <MokaPotIcon className="w-12 h-12" />
              </div>
              <div className="relative">
                <h1 className="text-2xl font-serif font-bold text-[#d4a574]">Moka Tracker</h1>
                <div className="absolute -bottom-1 left-0 w-full h-[2px] flex">
                  <div className="flex-1 bg-[#009246]"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-[#ce2b37]"></div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex gap-8">
                <Link href="/" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  {t('nav.dashboard')}
                </Link>
                <Link href="/inventory" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  {t('nav.inventory')}
                </Link>
                <Link href="/analytics" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  {t('nav.analytics')}
                </Link>
                <Link href="/brew" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
                  {t('nav.log_brew')}
                </Link>
              </nav>

              {/* Language Toggle (Desktop) */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}
                className="hidden md:flex items-center justify-center w-10 h-10 text-2xl hover:scale-110 transition-transform rounded-full hover:bg-[#3d3530]"
                title={language === 'en' ? 'Switch to Italian' : 'Cambia in Inglese'}
              >
                <span>{language === 'en' ? '🇬🇧' : '🇮🇹'}</span>
              </button>

              <div className="flex items-center gap-4">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="p-2 rounded-full bg-[#1a1410] border border-[#5a4f4a] text-[#d4a574] hover:bg-[#3d3530] transition"
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#2d2520] border border-[#5a4f4a] rounded-lg shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-[#3d3530] mb-2">
                          <p className="text-xs text-[#8b6f47]">
                            {user.is_anonymous ? t('common.guest_mode_warning').split(':')[0] : 'Signed in as'}
                          </p>
                          <p className="text-sm text-[#f5f1ed] truncate font-medium">
                            {user.is_anonymous ? 'Guest Explorer' : user.email}
                          </p>
                        </div>

                        {user.is_anonymous && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              onSignInClick ? onSignInClick() : setIsAuthModalOpen(true)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#d4a574] hover:bg-[#3d3530] transition flex items-center gap-2 border-b border-[#3d3530] mb-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            {t('common.sign_up')}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            signOut()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#f5f1ed] hover:bg-[#3d3530] hover:text-[#d4a574] transition flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('common.sign_out')}
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            handleDeleteAccount()
                          }}
                          disabled={isDeletingAccount}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/30 transition flex items-center gap-2 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeletingAccount ? t('common.saving') : t('common.delete_account')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onSignInClick ? onSignInClick() : setIsAuthModalOpen(true)}
                    className="bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition text-sm hidden md:block"
                  >
                    {t('common.sign_in')}
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-[#f5f1ed] hover:text-[#d4a574]"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1a1410] border-b border-[#3d3530] px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {user ? (
              <>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-[#f5f1ed] hover:text-[#d4a574] hover:bg-[#2d2520] transition"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-[#f5f1ed] hover:text-[#d4a574] hover:bg-[#2d2520] transition"
                >
                  {t('nav.inventory')}
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-[#f5f1ed] hover:text-[#d4a574] hover:bg-[#2d2520] transition"
                >
                  {t('nav.analytics')}
                </Link>
                <Link
                  href="/brew"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-[#f5f1ed] hover:text-[#d4a574] hover:bg-[#2d2520] transition"
                >
                  {t('nav.log_brew')}
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsAuthModalOpen(true)
                }}
                className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-[#d4a574] hover:bg-[#2d2520] transition"
              >
                {t('common.sign_in')}
              </button>
            )}

            {/* Language Toggle (Mobile) */}
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'it' : 'en')
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-medium text-[#f5f1ed] hover:text-[#d4a574] hover:bg-[#2d2520] transition border-t border-[#3d3530] mt-2"
            >
              <span>{language === 'en' ? 'Switch to Italian' : 'Cambia in Inglese'}</span>
              <span className="text-2xl">{language === 'en' ? '🇬🇧' : '🇮🇹'}</span>
            </button>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}
