'use client'

import { useState, useEffect, useCallback } from 'react'
import { BeanCatalogEntry } from '@/lib/types'
import { getAuthHeaders, getVibeColor } from '@/lib/utils'
import { translateRoastLevel, translateStoredExpertValue } from '@/lib/dbValues'
import { useLanguage } from '@/lib/LanguageContext'
import {
  ThumbsUp,
  ThumbsDown,
  Coffee,
  ArrowUpDown,
  ChevronDown,
  Thermometer,
  Flame,
  Droplets,
  Clock,
  Settings,
  Filter,
} from 'lucide-react'

const ROAST_LEVELS = ['Light', 'Medium', 'Dark', 'French']

export default function BeanJournal() {
  const { t, language } = useLanguage()
  const [catalog, setCatalog] = useState<BeanCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [roastFilter, setRoastFilter] = useState<string>('')
  const [summarizingId, setSummarizingId] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      let sort = 'rating_desc'
      if (sortBy === 'rating') sort = sortDir === 'desc' ? 'rating_desc' : 'rating_asc'
      if (sortBy === 'date') sort = sortDir === 'desc' ? 'date_desc' : 'date_asc'
      const res = await fetch(`/api/bean-journal?sort=${sort}`, { headers })
      if (res.ok) setCatalog(await res.json())
    } catch (err) {
      console.error('Error fetching bean journal:', err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortDir])

  useEffect(() => {
    setLoading(true)
    fetchCatalog()
  }, [fetchCatalog])

  const handleSummarize = async (name: string, roaster: string, key: string) => {
    setSummarizingId(key)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/bean-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name, roaster, language }),
      })
      if (res.ok) {
        await fetchCatalog()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate summary')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate summary')
    } finally {
      setSummarizingId(null)
    }
  }

  const displayRating = (entry: BeanCatalogEntry) => entry.avg_brew_rating

  const recommendLabel = (rating: number | undefined) => {
    if (rating == null) return null
    if (rating >= 7) return { text: t('bean_journal.rebuy'), className: 'text-green-400', Icon: ThumbsUp }
    if (rating <= 4) return { text: t('bean_journal.avoid'), className: 'text-red-400', Icon: ThumbsDown }
    return { text: t('bean_journal.neutral'), className: 'text-yellow-400', Icon: Coffee }
  }

  const displayed = roastFilter
    ? catalog.filter((e) => (e.roast_level || '').toLowerCase() === roastFilter.toLowerCase())
    : catalog

  if (loading) {
    return <p className="text-muted italic py-8 text-center">{t('bean_journal.loading')}</p>
  }

  return (
    <section className="space-y-6">
      {/* Simplified controls: rating sort + roast filter dropdown */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => {
            if (sortBy === 'rating') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
            else { setSortBy('rating'); setSortDir('desc') }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition ${sortBy === 'rating'
            ? 'bg-surface border-accent text-accent'
            : 'bg-canvas border-line text-muted hover:border-line-strong'
            }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          {t('bean_journal.sort_rating')} {sortBy === 'rating' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
        </button>

        <button
          onClick={() => {
            if (sortBy === 'date') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
            else { setSortBy('date'); setSortDir('desc') }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition ${sortBy === 'date'
            ? 'bg-surface border-accent text-accent'
            : 'bg-canvas border-line text-muted hover:border-line-strong'
            }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          {t('bean_journal.sort_date')} {sortBy === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
        </button>

        <div className="relative">
          <select
            value={roastFilter}
            onChange={(e) => setRoastFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-surface border border-line text-sm font-bold text-muted hover:border-line-strong focus:border-accent focus:outline-none transition cursor-pointer"
          >
            <option value="">All Roasts</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {translateRoastLevel(r, t)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>

        {roastFilter && (
          <button
            onClick={() => setRoastFilter('')}
            className="text-xs text-muted hover:text-ink transition"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-12 card">
          <Coffee className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted italic">{t('bean_journal.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((entry) => {
            const rating = displayRating(entry)
            const rec = recommendLabel(rating)
            const RecIcon = rec?.Icon
            const bb = entry.best_brew

            return (
              <article
                key={entry.key}
                className="card p-5 hover:border-line-strong transition"
              >
                <div className="flex flex-row justify-between items-start gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-ink">{entry.name}</h3>
                      {entry.is_pre_ground && (
                        <span
                          className="bg-line text-ink text-[10px] font-bold px-1.5 py-0.5 rounded cursor-help"
                          title={t('bean_form.is_pre_ground')}
                        >
                          PG
                        </span>
                      )}
                      {rec && RecIcon && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold uppercase ${rec.className}`}
                        >
                          <RecIcon className="w-3.5 h-3.5" />
                          {rec.text}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {entry.roaster}
                      {entry.roast_level && (
                        <> • {translateRoastLevel(entry.roast_level, t)}</>
                      )}
                      {entry.origins?.length ? <> • {entry.origins.join(', ')}</> : null}
                    </p>
                  </div>

                  {/* Rating column */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-right">
                      {rating != null ? (
                        <>
                          <div className={`text-3xl font-bold font-mono ${getVibeColor(rating)}`}>
                            {rating}
                            {/* <span className="text-base text-muted">/10</span> */}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted italic">{t('bean_journal.no_rating')}</p>
                      )}
                      {entry.brew_count > 0 && (
                        <p className="text-xs text-muted mt-1 flex items-center gap-1 justify-end">
                          <Coffee className="w-3 h-3" />
                          {t('bean_journal.brew_count', { count: entry.brew_count })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Best brew icon strip */}
                {bb && (
                  <div className="mb-3 flex flex-wrap gap-3">
                    <span className="text-[10px] text-muted uppercase tracking-widest self-center font-bold">Best brew</span>
                    <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                      <Coffee className="w-3 h-3 text-muted" />
                      {bb.coffee_weight_g}g
                    </span>
                    <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                      <Droplets className="w-3 h-3 text-muted" />
                      {bb.water_added_g}g
                    </span>
                    {!entry.is_pre_ground && bb.grinder_setting != null && (
                      <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                        <Settings className="w-3 h-3 text-muted" />
                        {bb.grinder_setting} clicks
                        {bb.grinder_microns_per_click ? ` (~${bb.grinder_setting * bb.grinder_microns_per_click}µm)` : ''}
                      </span>
                    )}
                    {bb.water_temp && (
                      <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                        <Thermometer className="w-3 h-3 text-muted" />
                        {translateStoredExpertValue(bb.water_temp, t, 'Boiling')}
                      </span>
                    )}
                    {bb.heat_level && (
                      <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                        <Flame className="w-3 h-3 text-muted" />
                        {translateStoredExpertValue(bb.heat_level, t, 'Medium-Low')}
                      </span>
                    )}
                    {bb.extraction_time_s != null && (
                      <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                        <Clock className="w-3 h-3 text-muted" />
                        {bb.extraction_time_s}s
                      </span>
                    )}
                    {bb.has_paper_filter && (
                      <span className="flex items-center gap-1 text-xs text-ink bg-canvas border border-line rounded px-2 py-1">
                        <Filter className="w-3 h-3 text-muted" />
                        {t('brew_card.paper_filter')}
                      </span>
                    )}
                  </div>
                )}

                {/* AI Summary */}
                {entry.flavor_notes ? (
                  <div className="mt-3 bg-canvas border border-accent/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">✨</span>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">Brew Recap</span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed italic">
                      {entry.flavor_notes}
                    </p>
                    <button
                      onClick={() => handleSummarize(entry.name, entry.roaster, entry.key)}
                      disabled={summarizingId === entry.key}
                      className="mt-3 text-xs text-muted hover:text-accent transition disabled:opacity-50"
                    >
                      {summarizingId === entry.key ? 'Generating...' : '🔄 Refresh'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      onClick={() => handleSummarize(entry.name, entry.roaster, entry.key)}
                      disabled={summarizingId === entry.key || entry.brew_count === 0}
                      className="text-sm flex items-center gap-2 bg-transparent border border-accent/50 hover:bg-accent/10 text-accent py-1.5 px-3 rounded transition disabled:opacity-50"
                    >
                      <span className="text-xs">✨</span>
                      {summarizingId === entry.key ? 'Generating...' : 'Summarize with AI'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
