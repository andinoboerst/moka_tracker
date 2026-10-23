'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import PageHeading from '@/components/PageHeading'
import { getAuthHeaders, formatDate } from '@/lib/utils'
import { translateStoredExpertValue } from '@/lib/dbValues'
import { useLanguage } from '@/lib/LanguageContext'
import {
  AnalyticsScatterPlot,
  AnalyticsLineGraph,
  RatingTrendChart,
  BeanBarChart,
} from '@/components/AnalyticsChart'
import BeanJournal from '@/components/BeanJournal'
import DialIn from '@/components/DialIn'
import InsightsPanel from '@/components/InsightsPanel'
import Simulator from '@/components/Simulator'
import { average, brewLabel } from '@/lib/analytics'
import type { Brew } from '@/lib/types'
import {
  ChevronDown,
  Star,
  Clock,
  Coffee,
  Thermometer,
  Flame,
  Droplets,
  Filter,
  Settings,
  Sparkles,
  FlaskConical,
  Target,
  LineChart as LineChartIcon,
  Trophy,
  BookOpen,
} from 'lucide-react'

type AnalyticsTab = 'insights' | 'lab' | 'dialin' | 'brews' | 'top_brews' | 'beans'

const TABS: { id: AnalyticsTab; labelKey: string; icon: typeof Sparkles }[] = [
  { id: 'insights', labelKey: 'analytics.tab_insights', icon: Sparkles },
  { id: 'lab', labelKey: 'analytics.tab_lab', icon: FlaskConical },
  { id: 'dialin', labelKey: 'feat.tab_dialin', icon: Target },
  { id: 'brews', labelKey: 'analytics.tab_brews', icon: LineChartIcon },
  { id: 'top_brews', labelKey: 'analytics.tab_top_brews', icon: Trophy },
  { id: 'beans', labelKey: 'analytics.tab_beans', icon: BookOpen },
]

function Detail({ icon: Icon, label, children, className = '' }: { icon?: typeof Coffee; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="eyebrow flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <div className="num text-sm text-ink">{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('insights')
  const [brews, setBrews] = useState<Brew[]>([])
  const [loading, setLoading] = useState(false)
  const [scatterMode, setScatterMode] = useState<'grind' | 'roast'>('grind')
  const [expandedBrew, setExpandedBrew] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'beans') return
    const load = async () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data-fetch loading flag
      setLoading(true)
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/brews?all=1', { headers })
        if (response.ok) setBrews(await response.json())
      } catch (err) {
        console.error('Error fetching analytics data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTab])

  const scatterData = useMemo(
    () =>
      brews
        .filter((b) => b.vibe_rating !== undefined)
        .filter((b) => {
          if (scatterMode === 'grind') return b.grinder_id != null && b.grinder_setting != null
          if (scatterMode === 'roast') return b.bean?.roast_date != null
          return true
        })
        .map((b) => {
          let grindValue = b.grinder_setting
          if (b.grinder?.microns_per_click) {
            grindValue = (b.grinder_setting ?? 0) * b.grinder.microns_per_click
          }
          let daysPastRoast = 0
          if (b.bean?.roast_date) {
            const diff = new Date(b.created_at).getTime() - new Date(b.bean.roast_date).getTime()
            daysPastRoast = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
          }
          return { rating: b.vibe_rating, grind: grindValue, roast: daysPastRoast, id: b.id }
        }),
    [brews, scatterMode]
  )

  const chronological = useMemo(
    () => [...brews].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [brews]
  )

  const lineData = chronological.slice(-10).map((b, i) => ({ index: i + 1, time: b.extraction_time_s }))

  const ratingData = chronological.map((b, i, all) => ({
    index: i + 1,
    rating: b.vibe_rating,
    avg: Number(average(all.slice(Math.max(0, i - 4), i + 1).map((x) => x.vibe_rating)).toFixed(2)),
  }))

  const beanBars = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const b of brews) map.set(brewLabel(b), [...(map.get(brewLabel(b)) || []), b.vibe_rating])
    return [...map.entries()]
      .map(([name, list]) => ({ name: name.length > 18 ? `${name.slice(0, 17)}…` : name, avg: average(list), count: list.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8)
  }, [brews])

  const topBrews = useMemo(
    () =>
      [...brews]
        .sort((a, b) => {
          if (b.vibe_rating !== a.vibe_rating) return b.vibe_rating - a.vibe_rating
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, 5),
    [brews]
  )

  const empty = !loading && brews.length === 0

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeading
          eyebrow={t('analytics.eyebrow')}
          title={t('analytics.title')}
          subtitle={t('analytics.subtitle')}
          className="mb-8"
        />

        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto mb-8 pb-1">
          <div className="segmented w-max" role="tablist" aria-label={t('analytics.title')}>
            {TABS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                data-active={activeTab === id}
                onClick={() => setActiveTab(id)}
                className="segmented-item whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'beans' ? (
          <BeanJournal />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-muted">{t('dashboard.loading')}</p>
          </div>
        ) : activeTab === 'insights' ? (
          <InsightsPanel brews={brews} />
        ) : activeTab === 'lab' ? (
          <Simulator brews={brews} />
        ) : activeTab === 'dialin' ? (
          <DialIn brews={brews} />
        ) : empty ? (
          <div className="card p-10 text-center">
            <Coffee className="w-8 h-8 text-accent-ink mx-auto mb-4" />
            <p className="font-display text-xl text-ink mb-1">{t('analytics.empty_title')}</p>
            <p className="text-muted max-w-md mx-auto">{t('analytics.empty_body')}</p>
          </div>
        ) : activeTab === 'brews' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5 sm:p-6 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl text-ink">{t('analytics.rating_trend_title')}</h2>
                <p className="text-xs text-muted">{t('analytics.rating_trend_subtitle')}</p>
              </div>
              <RatingTrendChart data={ratingData} />
            </div>

            <div className="card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl text-ink">{t('analytics.scatter_plot_title')}</h2>
                <div className="segmented">
                  {(['grind', 'roast'] as const).map((mode) => (
                    <button
                      key={mode}
                      data-active={scatterMode === mode}
                      onClick={() => setScatterMode(mode)}
                      className="segmented-item text-xs"
                    >
                      {t(mode === 'grind' ? 'analytics.toggle_grind' : 'analytics.toggle_roast')}
                    </button>
                  ))}
                </div>
              </div>
              <AnalyticsScatterPlot
                data={scatterData}
                yKey={scatterMode}
                yLabel={scatterMode === 'grind' ? t('analytics.grind_axis') : t('analytics.roast_axis')}
              />
            </div>

            <div className="card p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl text-ink">{t('analytics.line_graph_title')}</h2>
                <p className="text-xs text-muted">{t('analytics.line_graph_subtitle')}</p>
              </div>
              <AnalyticsLineGraph data={lineData} />
            </div>

            <div className="card p-5 sm:p-6 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl text-ink">{t('analytics.bean_bars_title')}</h2>
                <p className="text-xs text-muted">{t('analytics.bean_bars_subtitle')}</p>
              </div>
              <BeanBarChart data={beanBars} />
            </div>
          </div>
        ) : (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl text-ink mb-1">{t('analytics.top_brews_title')}</h2>
              <p className="text-muted">{t('analytics.top_brews_subtitle')}</p>
            </div>

            <div className="space-y-3">
              {topBrews.map((brew, rank) => {
                const open = expandedBrew === brew.id
                return (
                  <div key={brew.id} className="card card-interactive overflow-hidden">
                    <button
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left"
                      aria-expanded={open}
                      onClick={() => setExpandedBrew(open ? null : brew.id)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="num text-2xl text-muted w-8 shrink-0">{rank + 1}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ink truncate">{brewLabel(brew)}</h3>
                          <p className="text-xs text-muted">
                            {formatDate(brew.created_at)} · {t('analytics.vibe_score', { rating: brew.vibe_rating })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex items-center gap-1 text-accent-ink">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="num font-medium">{brew.vibe_rating}</span>
                        </div>
                        <div className="text-right">
                          <p className="eyebrow">{t('brew_card.time')}</p>
                          <p className="num text-ink">{brew.extraction_time_s}s</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 sm:px-5 pb-6 pt-5 border-t border-line bg-canvas/50 rise-in">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <Detail icon={Coffee} label={t('brew_card.coffee')}>{brew.coffee_weight_g}g</Detail>
                          <Detail icon={Droplets} label={t('brew_card.water_in')}>{brew.water_added_g}g</Detail>
                          <Detail icon={Thermometer} label={t('brew_card.start_temp')}>
                            {translateStoredExpertValue(brew.water_temp, t, 'Boiling')}
                          </Detail>
                          {!brew.bean?.is_pre_ground && brew.grinder_setting != null && (
                            <Detail icon={Settings} label={t('brew_card.grinder')}>
                              {brew.grinder_setting} {t('brew_card.clicks')}
                              {brew.grinder?.microns_per_click ? ` (~${brew.grinder_setting * brew.grinder.microns_per_click}µm)` : ''}
                            </Detail>
                          )}
                          <Detail icon={Flame} label={t('brew_card.heat')}>
                            {translateStoredExpertValue(brew.heat_level, t, 'Medium-Low')}
                          </Detail>
                          <Detail icon={Clock} label={t('brew_card.flow')}>
                            {translateStoredExpertValue(brew.flow_type, t, 'Steady')}
                          </Detail>
                          <Detail icon={Filter} label={t('brew_card.paper_filter')}>
                            {brew.has_paper_filter ? t('common.yes') : t('common.no')}
                          </Detail>
                          <Detail label={t('brew_card.notes')} className="col-span-2">
                            <span className="font-sans italic leading-relaxed">
                              &ldquo;{brew.tasting_notes || t('common.no_notes')}&rdquo;
                            </span>
                          </Detail>
                        </div>
                        <Link href={`/brew?from=${brew.id}`} className="btn-primary mt-6 px-5 py-2 text-sm inline-flex">
                          {t('feat.brew_again')}
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
