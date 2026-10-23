'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  HardDrive,
  Package,
  Plus,
  Scale,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import Header from '@/components/Header'
import PageHeading from '@/components/PageHeading'
import AuthModal from '@/components/AuthModal'
import BrewCard from '@/components/BrewCard'
import { MokaPotIcon } from '@/components/icons/MokaPotIcon'
import { Bean, Brew, MokaPot } from '@/lib/types'
import { getAuthHeaders, mokaPotName } from '@/lib/utils'
import { brewsToCsv, downloadCsv } from '@/lib/exportCsv'
import { describeMix } from '@/lib/beans'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/LanguageContext'

const PAGE_SIZE = 12
const LOW_STOCK_G = 50

interface Stats {
  total: number
  avg_rating: number | null
  latest: {
    ai_recap?: string
    vibe_rating: number
    bean?: { name: string }
    mix?: { percentage: number; bean?: { name: string } }[]
  } | null
}

const selectCls =
  'bg-canvas border border-line-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent'

export default function Home() {
  const { t } = useLanguage()
  const { user, loading: authLoading, signInAnonymously } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const [brews, setBrews] = useState<Brew[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [beans, setBeans] = useState<Bean[]>([])
  const [pots, setPots] = useState<MokaPot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  // Filters
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [beanId, setBeanId] = useState('')
  const [potId, setPotId] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const filtersActive = !!(debouncedSearch || beanId || potId || minRating)

  const fetchBrews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort })
      if (debouncedSearch) qs.set('q', debouncedSearch)
      if (beanId) qs.set('bean_id', beanId)
      if (potId) qs.set('moka_pot_id', potId)
      if (minRating) qs.set('min_rating', minRating)
      const response = await fetch(`/api/brews?${qs}`, { headers })
      if (!response.ok) throw new Error('Failed to fetch brews')
      const result = await response.json()
      setBrews(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading brews')
    } finally {
      setLoading(false)
    }
  }, [page, sort, debouncedSearch, beanId, potId, minRating])

  const fetchOverview = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const [s, b, p] = await Promise.all([
        fetch('/api/brews?stats=1', { headers }),
        fetch('/api/beans', { headers }),
        fetch('/api/moka-pots', { headers }),
      ])
      if (s.ok) setStats(await s.json())
      if (b.ok) setBeans(await b.json())
      if (p.ok) setPots(await p.json())
    } catch (err) {
      console.error('Error loading overview:', err)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    fetchOverview()
  }, [user, authLoading, fetchOverview])

  useEffect(() => {
    if (authLoading || !user) return
    // fetchBrews toggles loading/error state as part of the data fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBrews()
  }, [user, authLoading, fetchBrews])

  // Any filter change returns to the first page
  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setBeanId('')
    setPotId('')
    setMinRating('')
    setSort('newest')
    setPage(1)
  }

  const handleGuestSignIn = async () => {
    const { error } = await signInAnonymously()
    if (error) alert(error.message)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('feat.confirm_delete_brew'))) return
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/brews?id=${id}`, { method: 'DELETE', headers })
      if (!response.ok) throw new Error('Failed to delete brew')
      fetchBrews()
      fetchOverview()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/brews?all=1', { headers })
      if (!response.ok) throw new Error('Export failed')
      const all: Brew[] = await response.json()
      downloadCsv(`moka-tracker-brews-${new Date().toISOString().split('T')[0]}.csv`, brewsToCsv(all))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const lowStock = useMemo(
    () =>
      beans.filter(
        (b) => b.is_active !== false && !b.is_pre_ground && typeof b.weight_g === 'number' && b.weight_g <= LOW_STOCK_G
      ),
    [beans]
  )

  const suggestion = useMemo(() => {
    if (!stats?.latest?.ai_recap) return null
    try {
      return JSON.parse(stats.latest.ai_recap).suggestion as string | undefined
    } catch {
      return null
    }
  }, [stats])

  const latestName = stats?.latest
    ? (stats.latest.mix?.length ?? 0) > 1
      ? describeMix(stats.latest.mix!.map((m) => ({ percentage: m.percentage, bean: m.bean as Bean })))
      : stats.latest.bean?.name
    : ''

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(total, page * PAGE_SIZE)

  return (
    <>
      <Header onSignInClick={() => setIsAuthModalOpen(true)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <PageHeading title={t('dashboard.headline')} subtitle={t('dashboard.subtitle')} />

        {/* Guest mode: one quiet note, no alarm bells */}
        {user?.is_anonymous && (
          <p className="mb-8 flex items-start gap-2.5 text-xs leading-relaxed text-muted max-w-2xl">
            <HardDrive className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            {t('common.guest_mode_description')}
          </p>
        )}

        {/* Not signed in */}
        {!authLoading && !user ? (
          <section
            className="card tricolore-top rounded-2xl relative px-6 py-14 sm:py-20 text-center rise-in"
            aria-labelledby="welcome-heading"
          >
            <div className="absolute -right-10 -bottom-10 opacity-[0.05] pointer-events-none hidden md:block" aria-hidden="true">
              <MokaPotIcon className="w-72 h-72" />
            </div>

            <div className="relative max-w-2xl mx-auto">
              <span className="badge mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                {t('welcome.badge')}
              </span>

              <h2
                id="welcome-heading"
                className="text-4xl md:text-5xl font-display font-semibold text-ink leading-[1.1] mb-5"
              >
                {t('welcome.headline')}{' '}
                <span className="text-muted italic font-normal">{t('welcome.headline_aside')}</span>
              </h2>

              <p className="text-muted text-lg leading-relaxed mb-8">{t('welcome.body')}</p>

              <ul className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
                <li className="feature-pill">
                  <Scale className="w-4 h-4" />
                  {t('welcome.feature_dialin')}
                </li>
                <li className="feature-pill">
                  <Package className="w-4 h-4" />
                  {t('welcome.feature_stash')}
                </li>
                <li className="feature-pill">
                  <Sparkles className="w-4 h-4" />
                  {t('welcome.feature_ai')}
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-primary w-full sm:w-auto h-12 px-8 text-base"
                >
                  {t('welcome.cta_signin')}
                </button>
                <button
                  onClick={handleGuestSignIn}
                  className="btn-ghost w-full sm:w-auto h-12 px-8 text-base"
                >
                  {t('welcome.cta_guest')}
                </button>
              </div>

              <p className="mt-8 mx-auto max-w-md flex items-start justify-center gap-2 text-xs leading-relaxed text-muted text-left sm:text-center">
                <HardDrive className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{t('common.guest_mode_description')}</span>
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* Next Brew Guide Card */}
            {suggestion && stats?.latest && (
              <div className="card rounded-2xl relative overflow-hidden mb-8 p-6 sm:p-8">
                <div className="absolute top-0 right-0 p-4 opacity-[0.06] text-ink pointer-events-none">
                  <MokaPotIcon className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-accent-ink" />
                    <h2 className="text-xl font-display font-semibold text-ink">{t('dashboard.next_brew_guide')}</h2>
                  </div>
                  <p className="text-muted text-sm mb-3">
                    {t('dashboard.based_on_last', { bean: latestName || '?', rating: stats.latest.vibe_rating })}
                  </p>
                  <p className="text-ink text-lg font-medium leading-relaxed mb-6 max-w-3xl">
                    &ldquo;{suggestion}&rdquo;
                  </p>
                  <Link
                    href="/brew"
                    className="btn-primary py-2.5 px-6"
                  >
                    {t('dashboard.log_next')}
                  </Link>
                </div>
              </div>
            )}

            {/* Low stock */}
            {lowStock.length > 0 && (
              <div className="card mb-8 flex items-start gap-3 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-ink font-semibold">{t('feat.stock_low_title')}</p>
                  <p className="text-muted">
                    {lowStock.map((b) => `${b.name} (${b.weight_g}g)`).join(' · ')}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="card p-6 text-center">
                <p className="eyebrow mb-3">{t('dashboard.total_brews')}</p>
                <p className="num text-5xl font-medium text-ink">{stats?.total ?? '—'}</p>
              </div>
              <div className="card p-6 text-center">
                <p className="eyebrow mb-3">{t('dashboard.avg_vibe')}</p>
                <p className="num text-5xl font-medium text-ink">
                  {stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : '—'}
                </p>
              </div>
              <div className="card p-6 text-center flex flex-col items-center justify-center">
                <p className="eyebrow mb-4">{t('dashboard.quick_action')}</p>
                <Link
                  href="/brew"
                  className="btn-primary py-2.5 px-5"
                >
                  <Plus className="w-4 h-4" />
                  {t('nav.log_brew')}
                </Link>
              </div>
            </div>

            {/* Brews List */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-display font-semibold text-ink">{t('dashboard.recent_brews')}</h2>
                {(stats?.total ?? 0) > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 text-sm text-muted hover:text-accent-ink border border-line-strong rounded-lg px-3 py-1.5 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> {t('feat.export_csv')}
                  </button>
                )}
              </div>

              {/* Search & filters */}
              {(stats?.total ?? 0) > 0 && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="relative col-span-2 md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => changeFilter(setSearch)(e.target.value)}
                      placeholder={t('feat.search_ph')}
                      className={`${selectCls} w-full pl-9`}
                    />
                  </div>
                  <select value={beanId} onChange={(e) => changeFilter(setBeanId)(e.target.value)} className={selectCls}>
                    <option value="">{t('feat.filter_all_beans')}</option>
                    {beans.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select value={potId} onChange={(e) => changeFilter(setPotId)(e.target.value)} className={selectCls}>
                    <option value="">{t('feat.filter_all_pots')}</option>
                    {pots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {mokaPotName(p)}
                      </option>
                    ))}
                  </select>
                  <select value={minRating} onChange={(e) => changeFilter(setMinRating)(e.target.value)} className={selectCls}>
                    <option value="">{t('feat.filter_min_rating')}</option>
                    {[5, 6, 7, 8, 9].map((r) => (
                      <option key={r} value={r}>
                        ≥ {r}
                      </option>
                    ))}
                  </select>
                  <select value={sort} onChange={(e) => changeFilter(setSort)(e.target.value)} className={selectCls}>
                    <option value="newest">{t('feat.sort_newest')}</option>
                    <option value="oldest">{t('feat.sort_oldest')}</option>
                    <option value="rating">{t('feat.sort_rating')}</option>
                  </select>
                </div>
              )}

              {loading && brews.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <p>{t('dashboard.loading')}</p>
                </div>
              ) : error ? (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-6 py-4 rounded-lg">{error}</div>
              ) : brews.length === 0 ? (
                filtersActive ? (
                  <div className="text-center py-12">
                    <p className="text-muted mb-4">{t('feat.no_results')}</p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 text-accent-ink hover:underline"
                    >
                      <X className="w-4 h-4" /> {t('feat.clear_filters')}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted mb-4">{t('dashboard.no_brews')}</p>
                    <Link
                      href="/brew"
                      className="btn-primary py-2.5 px-6"
                    >
                      + {t('nav.log_brew')}
                    </Link>
                  </div>
                )
              ) : (
                <>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
                    {brews.map((brew) => (
                      <BrewCard
                        key={brew.id}
                        brew={brew}
                        onDelete={handleDelete}
                        isDeleting={false}
                        onUpdate={(updated) => setBrews((list) => list.map((b) => (b.id === updated.id ? updated : b)))}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
                    <p className="text-sm text-muted">{t('feat.showing', { from, to, total })}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-line-strong text-ink disabled:opacity-40 hover:border-accent"
                        aria-label={t('feat.prev')}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-muted tabular-nums">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-line-strong text-ink disabled:opacity-40 hover:border-accent"
                        aria-label={t('feat.next')}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </nav>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
