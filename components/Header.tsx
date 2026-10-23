'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useState, useRef, useEffect } from 'react'
import AuthModal from './AuthModal'
import PasswordChangeModal from './PasswordChangeModal'
import { User, Menu, X, Trash2, LogOut, UserPlus, Key, Coffee, Package, BarChart3, Plus, Globe, Check } from 'lucide-react'
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
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Moka Tracker home">
              <div className="transition-transform duration-150 group-hover:-rotate-6">
                <MokaPotIcon className="w-9 h-9" />
              </div>
              <div className="relative pb-1">
                <span className="block text-xl font-display font-semibold tracking-tight text-ink">Moka Tracker</span>
                <div className="tricolore absolute bottom-0 left-0 w-full" aria-hidden="true" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="segmented hidden md:inline-flex" aria-label="Primary">
                {[
                  { href: '/', label: t('nav.dashboard'), Icon: Coffee },
                  { href: '/inventory', label: t('nav.inventory'), Icon: Package },
                  { href: '/analytics', label: t('nav.analytics'), Icon: BarChart3 },
                ].map(({ href, label, Icon }) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className="segmented-item"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  )
                })}
              </nav>

              <Link href="/brew" className="btn-primary hidden md:inline-flex h-9 px-3.5 text-sm">
                <Plus className="w-4 h-4" />
                {t('nav.log_brew')}
              </Link>

              <ThemeToggle className="hidden md:flex" />

              {/* Language switcher (desktop) */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-line text-muted hover:text-ink hover:border-line-strong"
                title={language === 'en' ? t('common.switch_to_italian') : t('common.switch_to_english')}
                aria-label={language === 'en' ? t('common.switch_to_italian') : t('common.switch_to_english')}
              >
                <Globe className="w-4 h-4" />
                <span className="num text-xs font-medium tracking-wide">{language.toUpperCase()}</span>
              </button>

              <div className="flex items-center gap-3">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-line-strong text-accent-ink hover:border-muted"
                      aria-label="Account menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <User className="w-4 h-4" />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 card py-2 z-50">
                        <div className="px-4 py-2 border-b border-line mb-2">
                          <p className="eyebrow">
                            {user.is_anonymous ? t('common.guest_mode_warning').split(':')[0] : t('common.signed_in_as')}
                          </p>
                          <p className="text-sm text-ink truncate font-medium mt-1">
                            {user.is_anonymous ? t('common.guest_explorer') : user.email}
                          </p>
                        </div>

                        {user.is_anonymous && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              onSignInClick ? onSignInClick() : setIsAuthModalOpen(true)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-accent-ink hover:bg-line/60 flex items-center gap-2 border-b border-line mb-1"
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
                            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-line/60 flex items-center gap-2 border-b border-line mb-1"
                          >
                            <Key className="w-4 h-4" />
                            {t('common.change_password')}
                          </button>
                        )}

                        <Link
                          href="/privacy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line/60 hover:text-ink flex items-center gap-2 border-t border-line mt-2"
                        >
                          Privacy Policy
                        </Link>

                        <Link
                          href="/terms"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line/60 hover:text-ink flex items-center gap-2"
                        >
                          Terms of Service
                        </Link>

                        <button
                          onClick={handleCopyEmail}
                          className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-line/60 hover:text-ink flex items-center gap-2 border-t border-line mt-2"
                        >
                          {emailCopied ? (
                            <>
                              <Check className="w-4 h-4 text-sage" /> Copied
                            </>
                          ) : (
                            'support@mokatracker.com'
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            signOut()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-line/60 flex items-center gap-2 border-t border-line mt-2"
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
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/30 flex items-center gap-2 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeletingAccount ? t('common.saving') : t('common.delete_account')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => (onSignInClick ? onSignInClick() : setIsAuthModalOpen(true))}
                    className="btn-ghost h-9 px-3.5 text-sm hidden md:inline-flex"
                  >
                    {t('common.sign_in')}
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-ink hover:text-accent-ink"
                  aria-label="Toggle menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-canvas border-b border-line px-4 pt-3 pb-4 space-y-1">
            {user ? (
              <>
                {[
                  { href: '/', label: t('nav.dashboard'), Icon: Coffee },
                  { href: '/inventory', label: t('nav.inventory'), Icon: Package },
                  { href: '/analytics', label: t('nav.analytics'), Icon: BarChart3 },
                ].map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-ink hover:bg-surface"
                  >
                    <Icon className="w-5 h-5 text-muted" />
                    {label}
                  </Link>
                ))}
                <Link
                  href="/brew"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary w-full py-3 mt-2"
                >
                  <Plus className="w-5 h-5" />
                  {t('nav.log_brew')}
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsAuthModalOpen(true)
                }}
                className="btn-primary w-full py-3"
              >
                {t('common.sign_in')}
              </button>
            )}

            <ThemeToggle showLabel className="w-full !justify-start gap-3 px-3" />

            {/* Language switcher (mobile) */}
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'it' : 'en')
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium text-ink hover:bg-surface border-t border-line mt-2"
            >
              <span>{language === 'en' ? t('common.switch_to_italian') : t('common.switch_to_english')}</span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Globe className="w-4 h-4" />
                <span className="num text-xs font-medium">{language.toUpperCase()}</span>
              </span>
            </button>

            {/* Only show privacy/terms in mobile menu when logged in */}
            {user && (
              <>
                <Link
                  href="/privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:text-ink hover:bg-surface border-t border-line"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:text-ink hover:bg-surface"
                >
                  Terms of Service
                </Link>

                <button
                  onClick={handleCopyEmail}
                  className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-muted hover:text-ink hover:bg-surface flex items-center gap-2"
                >
                  {emailCopied ? (
                    <>
                      <Check className="w-4 h-4 text-sage" /> Copied
                    </>
                  ) : (
                    'support@mokatracker.com'
                  )}
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
