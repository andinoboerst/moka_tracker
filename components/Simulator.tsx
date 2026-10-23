'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { FlaskConical, RotateCcw, Sparkles, Timer, Star, Gauge, Info } from 'lucide-react'
import type { Brew } from '@/lib/types'
import {
  brewLabel,
  buildSimModel,
  groupRecipes,
  notesBalance,
  predictBrew,
  simCurve,
  type Confidence,
  type SimModel,
} from '@/lib/analytics'
import { formatDate, getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  color: 'var(--ink)',
  fontSize: 12,
}

export default function Simulator({ brews }: { brews: Brew[] }) {
  const { t } = useLanguage()

  // Only recipes brewed with a grinder can be simulated: no clicks, no slider
  const groups = useMemo(
    () => groupRecipes(brews).filter((g) => g.brews.some((b) => b.grinder_id && b.grinder_setting != null)),
    [brews]
  )
  const [groupKey, setGroupKey] = useState('')
  const [brewId, setBrewId] = useState('')

  const group = groups.find((g) => g.key === groupKey) || groups[0]

  const candidates = useMemo(
    () =>
      (group?.brews ?? [])
        .filter((b) => b.grinder_id && b.grinder_setting != null)
        .sort((a, b) => b.vibe_rating - a.vibe_rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [group]
  )
  const anchor = candidates.find((b) => b.id === brewId) || candidates[0]

  if (!group || !anchor) {
    return (
      <div className="card p-10 text-center">
        <FlaskConical className="w-8 h-8 text-accent-ink mx-auto mb-4" />
        <p className="font-display text-xl text-ink mb-1">{t('analytics.lab_empty_title')}</p>
        <p className="text-muted max-w-md mx-auto">{t('analytics.lab_empty_body')}</p>
      </div>
    )
  }

  const selectClass =
    'w-full bg-canvas border border-line-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent'

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="eyebrow block mb-2">{t('analytics.lab_pick_recipe')}</label>
          <select
            value={group.key}
            onChange={(e) => {
              setGroupKey(e.target.value)
              setBrewId('')
            }}
            className={selectClass}
          >
            {groups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label} ({g.brews.length})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-2">{t('analytics.lab_pick_brew')}</label>
          <select value={anchor.id} onChange={(e) => setBrewId(e.target.value)} className={selectClass}>
            {candidates.map((b) => (
              <option key={b.id} value={b.id}>
                {formatDate(b.created_at)} · {b.vibe_rating}/10 · {b.grinder_setting} {t('brew_card.clicks')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* key resets slider state whenever another brew is picked */}
      <SimulatorBody key={`${group.key}:${anchor.id}`} groupBrews={group.brews} anchor={anchor} />
    </div>
  )
}

function SimulatorBody({ groupBrews, anchor }: { groupBrews: Brew[]; anchor: Brew }) {
  const { t, language } = useLanguage()
  const model = useMemo(() => buildSimModel(groupBrews), [groupBrews])
  const anchorSetting = anchor.grinder_setting as number

  const [setting, setSetting] = useState(anchorSetting)
  const [heat, setHeat] = useState<-1 | 0 | 1>(0)
  const [verdict, setVerdict] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!model) return null

  const lo = Math.max(0, Math.floor(Math.min(model.minX, anchorSetting)) - 4)
  const hi = Math.ceil(Math.max(model.maxX, anchorSetting)) + 4
  const x = clamp(setting, lo, hi)
  const microns = model.micronsPerClick

  const base = predictBrew(model, anchorSetting, 0)
  const sim = predictBrew(model, x, heat)

  // Anchor the estimate on the real brew: apply only the model's predicted *change*
  const rating = clamp(anchor.vibe_rating + (sim.rating - base.rating), 1, 10)
  const time = Math.round(anchor.extraction_time_s * (sim.time / base.time))
  const anchorBalance = notesBalance(anchor.tasting_notes) ?? base.balance
  const balance = clamp(anchorBalance + (sim.balance - base.balance), -1, 1)

  const dRating = rating - anchor.vibe_rating
  const dTime = time - anchor.extraction_time_s
  const changed = x !== anchorSetting || heat !== 0

  const curve = simCurve(model, heat).map((r) => ({
    ...r,
    rating: Number(clamp(anchor.vibe_rating + (r.rating - base.rating), 1, 10).toFixed(2)),
    time: Math.round(anchor.extraction_time_s * (r.time / base.time)),
  }))
  const observed = model.points.map((p) => ({ x: p.setting, rating: p.rating, time: p.time }))

  const reading =
    balance > 0.45
      ? 'bitter_strong'
      : balance > 0.15
        ? 'bitter_light'
        : balance < -0.45
          ? 'sour_strong'
          : balance < -0.15
            ? 'sour_light'
            : 'balanced'

  const confLabel: Record<Confidence, string> = {
    low: t('analytics.lab_conf_low'),
    medium: t('analytics.lab_conf_medium'),
    high: t('analytics.lab_conf_high'),
  }
  const confTone: Record<Confidence, string> = {
    low: 'text-italy-red',
    medium: 'text-accent-ink',
    high: 'text-sage',
  }

  const askVerdict = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/analytics-insights', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'simulation',
          language,
          payload: {
            recipe: brewLabel(anchor),
            starting_brew: {
              grinder_clicks: anchorSetting,
              rating: anchor.vibe_rating,
              time_s: anchor.extraction_time_s,
              notes: (anchor.tasting_notes || '').slice(0, 160),
              heat: anchor.heat_level ?? null,
            },
            simulated_change: {
              grinder_clicks: x,
              clicks_delta: x - anchorSetting,
              direction: x < anchorSetting ? 'finer' : x > anchorSetting ? 'coarser' : 'same',
              heat_change: heat === 0 ? 'same' : heat > 0 ? 'higher' : 'lower',
            },
            estimate: {
              rating: Number(rating.toFixed(1)),
              time_s: time,
              cup_balance_minus1_sour_to_plus1_bitter: Number(balance.toFixed(2)),
            },
            confidence: sim.confidence,
            distinct_settings_in_history: model.distinct,
            brews_in_history: model.points.length,
          },
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { verdict?: string }
      setVerdict(data.verdict ?? null)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setSetting(anchorSetting)
    setHeat(0)
    setVerdict(null)
  }

  const fill = `${((x - lo) / Math.max(1, hi - lo)) * 100}%`
  const delta = (n: number, digits = 1) => `${n > 0 ? '+' : ''}${n.toFixed(digits)}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Controls */}
      <section className="card p-5 sm:p-6 lg:col-span-2 space-y-8">
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="eyebrow">{t('analytics.lab_grind')}</p>
              <p className="num text-4xl text-ink mt-1">
                {x} <span className="text-base text-muted">{t('brew_card.clicks')}</span>
              </p>
              {microns ? <p className="num text-xs text-muted mt-1">~{Math.round(x * microns)} µm</p> : null}
            </div>
            <button onClick={reset} disabled={!changed} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40">
              <RotateCcw className="w-3.5 h-3.5" /> {t('analytics.lab_reset')}
            </button>
          </div>
          <input
            type="range"
            className="slider"
            min={lo}
            max={hi}
            step={1}
            value={x}
            style={{ ['--fill' as string]: fill }}
            aria-label={t('analytics.lab_grind')}
            onChange={(e) => {
              setSetting(Number(e.target.value))
              setVerdict(null)
            }}
          />
          <div className="flex justify-between text-[0.68rem] text-muted mt-2 eyebrow">
            <span>{t('analytics.lab_finer')}</span>
            <span>
              {t('analytics.lab_started_at', { setting: anchorSetting })}
            </span>
            <span>{t('analytics.lab_coarser')}</span>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">{t('analytics.lab_heat')}</p>
          <div className="segmented w-full">
            {([-1, 0, 1] as const).map((h) => (
              <button
                key={h}
                data-active={heat === h}
                onClick={() => {
                  setHeat(h)
                  setVerdict(null)
                }}
                className="segmented-item flex-1 justify-center"
              >
                {t(h === -1 ? 'analytics.lab_heat_lower' : h === 0 ? 'analytics.lab_heat_same' : 'analytics.lab_heat_higher')}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">{t('analytics.lab_heat_note')}</p>
        </div>

        <div className="stat-tile p-4 text-sm">
          <p className="eyebrow mb-2">{t('analytics.lab_started_from')}</p>
          <p className="text-ink">
            <span className="num">{anchor.vibe_rating}/10</span> · <span className="num">{anchor.extraction_time_s}s</span> ·{' '}
            <span className="num">
              {anchor.coffee_weight_g}g / {anchor.final_yield_g}g
            </span>
          </p>
          {anchor.tasting_notes && <p className="text-muted italic mt-1 line-clamp-2">&ldquo;{anchor.tasting_notes}&rdquo;</p>}
        </div>
      </section>

      {/* Results */}
      <section className="lg:col-span-3 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="card p-4 sm:p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <Star className="w-3 h-3" /> {t('analytics.lab_est_rating')}
            </p>
            <p className="num text-4xl text-ink mt-2">
              {rating.toFixed(1)}
              <span className="text-base text-muted">/10</span>
            </p>
            <p className={`num text-xs mt-1 ${!changed ? 'text-muted' : dRating > 0.05 ? 'text-sage' : dRating < -0.05 ? 'text-italy-red' : 'text-muted'}`}>
              {changed ? `${delta(dRating)} ${t('analytics.lab_vs_brew')}` : t('analytics.lab_no_change')}
            </p>
          </div>
          <div className="card p-4 sm:p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <Timer className="w-3 h-3" /> {t('analytics.lab_est_time')}
            </p>
            <p className="num text-4xl text-ink mt-2">
              {time}
              <span className="text-base text-muted">s</span>
            </p>
            <p className="num text-xs mt-1 text-muted">
              {changed ? `${delta(dTime, 0)}s ${t('analytics.lab_vs_brew')}` : t('analytics.lab_no_change')}
            </p>
          </div>
        </div>

        {/* Balance gauge */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow flex items-center gap-1.5">
              <Gauge className="w-3 h-3" /> {t('analytics.lab_balance')}
            </p>
            <span className={`badge ${confTone[sim.confidence]}`}>
              {t('analytics.lab_confidence', { level: confLabel[sim.confidence] })}
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-line">
            <div
              className="absolute inset-y-0 left-0 right-0 rounded-full opacity-60"
              style={{
                background:
                  'linear-gradient(90deg, var(--italy-green), var(--sage) 30%, var(--line-strong) 50%, var(--accent) 70%, var(--italy-red))',
              }}
            />
            <div
              className="absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-[3px] border-accent bg-ink shadow transition-[left] duration-200"
              style={{ left: `${((balance + 1) / 2) * 100}%` }}
            />
          </div>
          <div className="flex justify-between eyebrow mt-3 text-[0.65rem]">
            <span>{t('analytics.lab_sour')}</span>
            <span>{t('analytics.lab_balanced')}</span>
            <span>{t('analytics.lab_bitter')}</span>
          </div>
          <p className="text-ink mt-4">{t(`analytics.lab_read_${reading}`)}</p>
        </div>

        {/* Charts */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg text-ink">{t('analytics.lab_curve_title')}</h3>
            <span className="eyebrow">{t('analytics.lab_curve_legend')}</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curve} margin={{ top: 16, right: 16, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="x" type="number" domain={[lo, hi]} stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis domain={[0, 10]} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--line-strong)' }} />
                <ReferenceLine x={anchorSetting} stroke="var(--muted)" strokeDasharray="4 4" />
                <ReferenceLine x={x} stroke="var(--accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="rating" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} name={t('analytics.lab_est_rating')} />
                <Scatter data={observed} dataKey="rating" fill="var(--ink)" name={t('analytics.lab_your_brews')} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="text-lg text-ink mb-2">{t('analytics.lab_time_title')}</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curve} margin={{ top: 16, right: 16, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="x" type="number" domain={[lo, hi]} stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis unit="s" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--line-strong)' }} />
                <ReferenceLine x={anchorSetting} stroke="var(--muted)" strokeDasharray="4 4" />
                <ReferenceLine x={x} stroke="var(--accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="time" stroke="var(--sage)" strokeWidth={2.5} dot={false} isAnimationActive={false} name={t('analytics.lab_est_time')} />
                <Scatter data={observed} dataKey="time" fill="var(--ink)" name={t('analytics.lab_your_brews')} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI verdict */}
        <div className="card tricolore-top p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-ink" />
              <h3 className="text-lg text-ink">{t('analytics.lab_verdict_title')}</h3>
            </div>
            <button onClick={askVerdict} disabled={busy || !changed} className="btn-primary px-4 py-2 text-sm">
              {busy ? t('analytics.ai_busy') : t('analytics.lab_verdict_cta')}
            </button>
          </div>
          {verdict ? (
            <p className="text-ink mt-4 leading-relaxed rise-in">{verdict}</p>
          ) : (
            <p className="text-muted text-sm mt-3">{failed ? t('analytics.ai_failed') : t('analytics.lab_verdict_hint')}</p>
          )}
        </div>

        <ModelNote model={model} />
      </section>
    </div>
  )
}

function ModelNote({ model }: { model: SimModel }) {
  const { t } = useLanguage()
  return (
    <p className="text-xs text-muted flex gap-2 leading-relaxed">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>
        {t('analytics.lab_model_note', {
          brews: model.points.length,
          settings: model.distinct,
          pct: Math.round(model.dataWeight * 100),
        })}
      </span>
    </p>
  )
}
