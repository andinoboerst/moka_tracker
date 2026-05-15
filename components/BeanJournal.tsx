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
  Filter,
} from 'lucide-react'

const ROAST_LEVELS = ['Light', 'Medium', 'Dark', 'French']

export default function BeanJournal() {
  const { t, language } = useLanguage()
  const [catalog, setCatalog] = useState<BeanCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [roastFilter, setRoastFilter] = useState<string>('')
  const [summarizingId, setSummarizingId] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const sort = sortDir === 'desc' ? 'rating_desc' : 'rating_asc'
      const res = await fetch(`/api/bean-journal?sort=${sort}`, { headers })
      if (res.ok) setCatalog(await res.json())
    } catch (err) {
      console.error('Error fetching bean journal:', err)
    } finally {
      setLoading(false)
    }
  }, [sortDir])

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
    return <p className="text-[#8b6f47] italic py-8 text-center">{t('bean_journal.loading')}</p>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#d4a574] mb-1">
            {t('bean_journal.title')}
          </h2>
          <p className="text-[#8b6f47] italic text-sm max-w-2xl">{t('bean_journal.subtitle')}</p>
        </div>
      </div>

      {/* Simplified controls: rating sort + roast filter dropdown */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d2520] border border-[#3d3530] text-sm font-bold text-[#d4a574] hover:border-[#d4a574] transition"
        >
          <ArrowUpDown className="w-4 h-4" />
          Rating {sortDir === 'desc' ? '↓' : '↑'}
        </button>

        <div className="relative">
          <select
            value={roastFilter}
            onChange={(e) => setRoastFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-[#2d2520] border border-[#3d3530] text-sm font-bold text-[#8b6f47] hover:border-[#5a4f4a] focus:border-[#d4a574] focus:outline-none transition cursor-pointer"
          >
            <option value="">All Roasts</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {translateRoastLevel(r, t)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6f47] pointer-events-none" />
        </div>

        {roastFilter && (
          <button
            onClick={() => setRoastFilter('')}
            className="text-xs text-[#8b6f47] hover:text-[#f5f1ed] transition"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-12 bg-[#2d2520] border border-[#3d3530] rounded-xl">
          <Coffee className="w-12 h-12 text-[#8b6f47] mx-auto mb-4" />
          <p className="text-[#8b6f47] italic">{t('bean_journal.empty')}</p>
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
                className="bg-[#2d2520] border border-[#3d3530] rounded-xl p-5 hover:border-[#5a4f4a] transition"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-[#f5f1ed]">{entry.name}</h3>
                      {rec && RecIcon && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold uppercase ${rec.className}`}
                        >
                          <RecIcon className="w-3.5 h-3.5" />
                          {rec.text}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8b6f47]">
                      {entry.roaster}
                      {entry.roast_level && (
                        <> • {translateRoastLevel(entry.roast_level, t)}</>
                      )}
                      {entry.origins?.length ? <> • {entry.origins.join(', ')}</> : null}
                    </p>

                    {/* Best brew icon strip */}
                    {bb && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <span className="text-[10px] text-[#8b6f47] uppercase tracking-widest self-center font-bold">Best brew</span>
                        <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                          <Coffee className="w-3 h-3 text-[#8b6f47]" />
                          {bb.coffee_weight_g}g
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                          <Droplets className="w-3 h-3 text-[#8b6f47]" />
                          {bb.water_added_g}g
                        </span>
                        {bb.grinder_setting != null && (
                          <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                            <Filter className="w-3 h-3 text-[#8b6f47]" />
                            {bb.grinder_brand ? `${bb.grinder_brand} ` : ''}{bb.grinder_setting} clicks
                          </span>
                        )}
                        {bb.water_temp && (
                          <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                            <Thermometer className="w-3 h-3 text-[#8b6f47]" />
                            {translateStoredExpertValue(bb.water_temp, t, 'Boiling')}
                          </span>
                        )}
                        {bb.heat_level && (
                          <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                            <Flame className="w-3 h-3 text-[#8b6f47]" />
                            {translateStoredExpertValue(bb.heat_level, t, 'Medium-Low')}
                          </span>
                        )}
                        {bb.extraction_time_s != null && (
                          <span className="flex items-center gap-1 text-xs text-[#f5f1ed] bg-[#1a1410] border border-[#3d3530] rounded px-2 py-1">
                            <Clock className="w-3 h-3 text-[#8b6f47]" />
                            {bb.extraction_time_s}s
                          </span>
                        )}
                      </div>
                    )}

                    {/* AI Summary */}
                    {entry.flavor_notes ? (
                      <div className="mt-3 bg-[#1a1410] border border-[#d4a574]/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">✨</span>
                          <span className="text-xs font-bold text-[#d4a574] uppercase tracking-wider">Brew Recap</span>
                        </div>
                        <p className="text-sm text-[#f5f1ed] leading-relaxed italic">
                          {entry.flavor_notes}
                        </p>
                        <button
                          onClick={() => handleSummarize(entry.name, entry.roaster, entry.key)}
                          disabled={summarizingId === entry.key}
                          className="mt-3 text-xs text-[#8b6f47] hover:text-[#d4a574] transition disabled:opacity-50"
                        >
                          {summarizingId === entry.key ? 'Generating...' : '🔄 Refresh'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <button
                          onClick={() => handleSummarize(entry.name, entry.roaster, entry.key)}
                          disabled={summarizingId === entry.key || entry.brew_count === 0}
                          className="text-sm flex items-center gap-2 bg-transparent border border-[#d4a574]/50 hover:bg-[#d4a574]/10 text-[#d4a574] py-1.5 px-3 rounded transition disabled:opacity-50"
                        >
                          <span className="text-xs">✨</span>
                          {summarizingId === entry.key ? 'Generating...' : 'Summarize with AI'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                    <div className="text-center sm:text-right">
                      {rating != null ? (
                        <>
                          <div className={`text-3xl font-bold font-mono ${getVibeColor(rating)}`}>
                            {rating}
                            <span className="text-lg text-[#8b6f47]">/10</span>
                          </div>
                          <p className="text-[10px] text-[#8b6f47] uppercase tracking-wider">
                            {t('bean_journal.avg_brew_rating')}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-[#8b6f47] italic">{t('bean_journal.no_rating')}</p>
                      )}
                      {entry.brew_count > 0 && (
                        <p className="text-xs text-[#8b6f47] mt-1 flex items-center gap-1 justify-end">
                          <Coffee className="w-3 h-3" />
                          {t('bean_journal.brew_count', { count: entry.brew_count })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
