'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ThumbsUp, TriangleAlert, Wrench, FlaskConical, RefreshCw, Coffee, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Brew } from '@/lib/types'
import { computeStats, deriveFindings, summariseForAI, type Finding, type FindingKind } from '@/lib/analytics'
import { getAuthHeaders } from '@/lib/utils'
import { translateStoredExpertValue } from '@/lib/dbValues'
import { useLanguage } from '@/lib/LanguageContext'

interface AiReport {
  headline: string
  good: string[]
  bad: string[]
  improve: string[]
  experiment: string
}

const SECTIONS: { kind: FindingKind; icon: typeof ThumbsUp; tone: string }[] = [
  { kind: 'good', icon: ThumbsUp, tone: 'text-sage' },
  { kind: 'bad', icon: TriangleAlert, tone: 'text-italy-red' },
  { kind: 'improve', icon: Wrench, tone: 'text-accent-ink' },
]

export default function InsightsPanel({ brews }: { brews: Brew[] }) {
  const { t, language } = useLanguage()
  const [report, setReport] = useState<AiReport | null>(null)
  const [reportLang, setReportLang] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const stats = useMemo(() => computeStats(brews), [brews])
  const findings = useMemo(() => deriveFindings(stats), [stats])

  const renderFinding = (f: Finding) => {
    const vars = { ...(f.vars || {}) }
    if (f.key === 'heat' && typeof vars.heat === 'string') {
      vars.heat = translateStoredExpertValue(vars.heat, t, vars.heat).toLowerCase()
    }
    return t(`analytics.finding_${f.key}`, vars)
  }

  const askBarista = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/analytics-insights', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'insights', language, payload: summariseForAI(brews, stats) }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setReport((await res.json()) as AiReport)
      setReportLang(language)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  if (stats.total === 0) {
    return (
      <div className="card p-10 text-center">
        <Coffee className="w-8 h-8 text-accent-ink mx-auto mb-4" />
        <p className="font-display text-xl text-ink mb-1">{t('analytics.empty_title')}</p>
        <p className="text-muted max-w-md mx-auto">{t('analytics.empty_body')}</p>
        <Link href="/brew" className="btn-primary mt-6 px-5 py-2.5 inline-flex">
          {t('analytics.empty_cta')}
        </Link>
      </div>
    )
  }

  const TrendIcon = stats.trend === null || Math.abs(stats.trend) < 0.3 ? Minus : stats.trend > 0 ? TrendingUp : TrendingDown
  const trendTone =
    stats.trend === null || Math.abs(stats.trend) < 0.3 ? 'text-muted' : stats.trend > 0 ? 'text-sage' : 'text-italy-red'

  const kpis = [
    { label: t('analytics.kpi_brews'), value: String(stats.total), hint: t('analytics.kpi_brews_hint') },
    {
      label: t('analytics.kpi_avg'),
      value: stats.avgRating.toFixed(1),
      suffix: '/10',
      hint: t('analytics.kpi_avg_hint', { pct: Math.round(stats.highShare * 100) }),
    },
    {
      label: t('analytics.kpi_trend'),
      value: stats.trend === null ? '—' : `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}`,
      hint: t('analytics.kpi_trend_hint'),
      icon: <TrendIcon className={`w-4 h-4 ${trendTone}`} />,
    },
    {
      label: t('analytics.kpi_best'),
      value: stats.bestBean ? stats.bestBean.avg.toFixed(1) : '—',
      suffix: stats.bestBean ? '/10' : undefined,
      hint: stats.bestBean ? stats.bestBean.name : t('analytics.kpi_best_hint'),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{k.label}</p>
              {k.icon}
            </div>
            <p className="num text-3xl sm:text-4xl font-medium text-ink mt-2">
              {k.value}
              {k.suffix && <span className="text-base text-muted">{k.suffix}</span>}
            </p>
            <p className="text-xs text-muted mt-1 truncate">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* AI barista */}
      <section className="card tricolore-top p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-canvas border border-line">
              <Sparkles className="w-5 h-5 text-accent-ink" />
            </div>
            <div>
              <p className="eyebrow">{t('analytics.ai_eyebrow')}</p>
              <h2 className="text-2xl text-ink">{t('analytics.ai_title')}</h2>
            </div>
          </div>
          <button onClick={askBarista} disabled={busy} className="btn-primary px-5 py-2.5 text-sm shrink-0">
            {busy ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> {t('analytics.ai_busy')}
              </>
            ) : report ? (
              <>
                <RefreshCw className="w-4 h-4" /> {t('analytics.ai_refresh')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {t('analytics.ai_cta')}
              </>
            )}
          </button>
        </div>

        {failed && <p className="text-sm text-muted mb-4">{t('analytics.ai_failed')}</p>}

        {report ? (
          <div className="space-y-5 rise-in">
            {report.headline && (
              <p className="font-display text-xl sm:text-2xl text-ink leading-snug">{report.headline}</p>
            )}
            {reportLang !== language && <p className="text-xs text-muted">{t('analytics.ai_stale_lang')}</p>}
            {report.experiment && (
              <div className="stat-tile-strong p-4 flex gap-3">
                <FlaskConical className="w-5 h-5 text-accent-ink shrink-0 mt-0.5" />
                <div>
                  <p className="eyebrow mb-1">{t('analytics.ai_experiment')}</p>
                  <p className="text-ink">{report.experiment}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted max-w-2xl">{t('analytics.ai_intro')}</p>
        )}
      </section>

      {/* Findings: AI wording if available, deterministic otherwise */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {SECTIONS.map(({ kind, icon: Icon, tone }) => {
          const aiItems = report ? report[kind] : null
          const items = aiItems ?? findings.filter((f) => f.kind === kind).map(renderFinding)
          return (
            <section key={kind} className="card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${tone}`} />
                <h3 className="text-lg text-ink">{t(`analytics.section_${kind}`)}</h3>
                <span className="badge ml-auto">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted">{t(`analytics.section_${kind}_empty`)}</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm text-ink leading-relaxed">
                      <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${kind === 'good' ? 'bg-sage' : kind === 'bad' ? 'bg-italy-red' : 'bg-accent'}`} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <p className="text-xs text-muted flex items-center gap-2">
        <Star className="w-3 h-3" /> {report ? t('analytics.footnote_ai') : t('analytics.footnote_rules')}
      </p>
    </div>
  )
}
