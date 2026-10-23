'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useState, useRef, useEffect } from 'react'
import AuthModal from './AuthModal'
import PasswordChangeModal from './PasswordChangeModal'
import { User, Menu, X, Trash2, LogOut, UserPlus, Key } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { MokaPotIcon } from './icons/MokaPotIcon'
import { getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

interface HeaderProps {
  onSignInClick?: () => void
}

export default function Header({ onSignInClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage()
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

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

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@mokatracker.com')
    setEmailCopied(true)
    setTimeout(() => {
      setEmailCopied(false)
      setIsUserMenuOpen(false)
      setIsMobileMenuOpen(false)
    }, 2000)
  }

  return (
    <>
      <header className="bg-surface/85 backdrop-blur-md border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="text-accent transition-transform group-hover:scale-110 group-hover:rotate-6">
                <MokaPotIcon className="w-12 h-12" />
              </div>
              <div className="relative">
                <span className="block text-2xl font-serif font-bold text-accent">Moka Tracker</span>
                <div className="absolute -bottom-1 left-0 w-full h-[2px] flex">
                  <div className="flex-1 bg-[#009246]"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-[#ce2b37]"></div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex gap-1">
                {[
                  { href: '/', label: t('nav.dashboard') },
                  { href: '/inventory', label: t('nav.inventory') },
                  { href: '/analytics', label: t('nav.analytics') },
                  { href: '/brew', label: t('nav.log_brew') },
                ].map((item) => {
                  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        active
                          ? 'bg-accent/15 text-accent'
                          : 'text-ink/80 hover:text-accent hover:bg-line/60'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <ThemeToggle className="hidden md:flex" />

              {/* Language Toggle (Desktop) */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}
                className="hidden md:flex items-center justify-center w-10 h-10 text-xl hover:scale-110 transition-transform rounded-full hover:bg-line"
                title={language === 'en' ? t('common.switch_to_italian') : t('common.switch_to_english')}
              >
                <span>{language === 'en' ? '🇬🇧' : '🇮🇹'}</span>
              </button>

              <div className="flex items-center gap-4">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="p-2 rounded-full bg-canvas border border-line-strong text-accent hover:bg-line transition"
                      aria-label="Account menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-surface border border-line-strong rounded-lg shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-line mb-2">
                          <p className="text-xs text-muted">
                            {user.is_anonymous ? t('common.guest_mode_warning').split(':')[0] : t('common.signed_in_as')}
                          </p>
                          <p className="text-sm text-ink truncate font-medium">
                            {user.is_anonymous ? t('common.guest_explorer') : user.email}
                          </p>
                        </div>

                        {user.is_anonymous && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              onSignInClick ? onSignInClick() : setIsAuthModalOpen(true)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-accent hover:bg-line transition flex items-center gap-2 border-b border-line mb-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            {t('common.sign_up')}
                          </button>
                        )}

                        {!user.is_anonymous && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              setIsPasswordChangeOpen(true)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-line hover:text-accent transition flex items-center gap-2 border-b border-line mb-1"
                          >
                            <Key className="w-4 h-4" />
                            {t('common.change_password')}
                          </button>
                        )}

                        <Link
                          href="/privacy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line hover:text-accent transition flex items-center gap-2 border-t border-line mt-2"
                        >
                          Privacy Policy
                        </Link>

                        <Link
                          href="/terms"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line hover:text-accent transition flex items-center gap-2"
                        >
                          Terms of Service
                        </Link>

                        <button
                          onClick={handleCopyEmail}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line hover:text-accent transition flex items-center gap-2 border-t border-line mt-2"
                        >
                          {emailCopied ? '✓ Copied!' : 'support@mokatracker.com'}
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            signOut()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-line hover:text-accent transition flex items-center gap-2 border-t border-line mt-2"
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
                    className="bg-accent hover:bg-accent-hover text-canvas font-semibold py-2 px-4 rounded-lg transition text-sm hidden md:block"
                  >
                    {t('common.sign_in')}
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-ink hover:text-accent"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-canvas border-b border-line px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {user ? (
              <>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-ink hover:text-accent hover:bg-surface transition"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-ink hover:text-accent hover:bg-surface transition"
                >
                  {t('nav.inventory')}
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-ink hover:text-accent hover:bg-surface transition"
                >
                  {t('nav.analytics')}
                </Link>
                <Link
                  href="/brew"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-ink hover:text-accent hover:bg-surface transition"
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
                className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-accent hover:bg-surface transition"
              >
                {t('common.sign_in')}
              </button>
            )}

            <ThemeToggle className="w-full !justify-start gap-3 px-3 !rounded-md" />

            {/* Language Toggle (Mobile) */}
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'it' : 'en')
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-medium text-ink hover:text-accent hover:bg-surface transition border-t border-line mt-2"
            >
              <span>{language === 'en' ? t('common.switch_to_italian') : t('common.switch_to_english')}</span>
              <span className="text-2xl">{language === 'en' ? '🇬🇧' : '🇮🇹'}</span>
            </button>

            {/* Only show privacy/terms in mobile menu when logged in */}
            {user && (
              <>
                <Link
                  href="/privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-muted hover:text-accent hover:bg-surface transition border-t border-line"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-muted hover:text-accent hover:bg-surface transition"
                >
                  Terms of Service
                </Link>

                <button
                  onClick={handleCopyEmail}
                  className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-muted hover:text-accent hover:bg-surface transition"
                >
                  {emailCopied ? '✓ Copied!' : 'support@mokatracker.com'}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <PasswordChangeModal
        isOpen={isPasswordChangeOpen}
        onClose={() => setIsPasswordChangeOpen(false)}
      />
    </>
  )
}
