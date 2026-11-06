'use client'

import { Plus, X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import {
  MAX_PRESSURE_STAGES,
  PRESSURE_STAGE_TYPES,
  profileDuration,
  profilePeak,
  profilePoints,
  type PressureStage,
  type PressureStageType,
} from '@/lib/pressure'

const STAGE_LABEL_KEY: Record<PressureStageType, string> = {
  preinfusion: 'brew_form.stage_preinfusion',
  ramp: 'brew_form.stage_ramp',
  hold: 'brew_form.stage_hold',
  decline: 'brew_form.stage_decline',
}

/** Line chart of a pressure profile (bar over seconds). */
export function PressureChart({
  profile,
  maxBar,
  colors,
  size,
  compact,
  marker,
}: {
  profile: PressureStage[]
  maxBar?: number | null
  /** Fixed colours for places that ignore the live theme (the exported share image) */
  colors?: { accent: string; grid: string; text: string; marker?: string }
  /** Drawing area and label size, for larger placements than the default 320x110 */
  size?: { w: number; h: number; font: number }
  /** Small sparkline without axes: just the shape of the shot, to be able to repeat it */
  compact?: boolean
  /** A vertical line at a point in time, e.g. the first drop in the cup. Ignored when it falls outside the profile. */
  marker?: { s: number; label: string }
}) {
  const accent = colors?.accent ?? 'var(--accent)'
  const grid = colors?.grid ?? 'var(--line)'
  const text = colors?.text ?? 'var(--muted)'
  const markerColor = colors?.marker ?? 'var(--ink)'
  const total = profileDuration(profile)
  if (profile.length === 0 || total <= 0) return null

  const W = size?.w ?? (compact ? 120 : 320)
  const H = size?.h ?? (compact ? 36 : 110)
  const font = size?.font ?? 9
  const pad = compact ? { l: 2, r: 2, t: 3, b: 3 } : { l: font * 3, r: 8, t: 8, b: font * 2.2 }
  const top = Math.max(maxBar ?? 0, Math.ceil(profilePeak(profile)), 1)
  const x = (s: number) => pad.l + (s / total) * (W - pad.l - pad.r)
  const y = (bar: number) => H - pad.b - (bar / top) * (H - pad.t - pad.b)
  const points = profilePoints(profile)
  const path = points.map(([s, bar], i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)},${y(bar).toFixed(1)}`).join(' ')
  const ticks = Array.from(new Set([0, Math.round(top / 2), top]))

  if (compact) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pressure profile">
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke={grid} strokeWidth="1" />
        <path d={`${path} L${x(total)},${y(0)} L${x(0)},${y(0)} Z`} fill={accent} opacity="0.18" />
        <path d={path} fill="none" stroke={accent} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pressure profile">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={W - pad.r} y1={y(tick)} y2={y(tick)} stroke={grid} strokeWidth="1" />
          <text x={pad.l - 4} y={y(tick) + 3} textAnchor="end" fontSize={font} fill={text}>
            {tick}
          </text>
        </g>
      ))}
      <path d={`${path} L${x(total)},${y(0)} L${x(0)},${y(0)} Z`} fill={accent} opacity="0.15" />
      <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
      {marker && marker.s > 0 && marker.s < total && (() => {
        const mx = x(marker.s)
        // Pressure where the line meets the curve, marked with a small dot
        const pts = profilePoints(profile)
        const seg = pts.findIndex(([s], i) => i > 0 && s >= marker.s)
        const [s0, b0] = pts[Math.max(0, seg - 1)]
        const [s1, b1] = pts[Math.max(1, seg)]
        const bar = s1 === s0 ? b1 : b0 + ((marker.s - s0) / (s1 - s0)) * (b1 - b0)
        // Keep the label clear of the 0s / total labels at the ends
        const label = `${marker.label} ${marker.s}s`
        const w = label.length * font * 0.58
        const anchor = mx - w / 2 < pad.l + font * 2.5 ? 'start' : mx + w / 2 > W - pad.r - font * 3 ? 'end' : 'middle'
        const tx = anchor === 'start' ? mx + 3 : anchor === 'end' ? mx - 3 : mx
        return (
          <g>
            <line x1={mx} x2={mx} y1={y(top)} y2={y(0)} stroke={markerColor} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
            <circle cx={mx} cy={y(bar)} r={Math.max(2.5, font * 0.28)} fill={markerColor} />
            <text x={tx} y={H - 5} textAnchor={anchor} fontSize={font} fill={markerColor}>{label}</text>
          </g>
        )
      })()}
      <text x={pad.l} y={H - 5} fontSize={font} fill={text}>0s</text>
      <text x={W - pad.r} y={H - 5} textAnchor="end" fontSize={font} fill={text}>{total}s</text>
    </svg>
  )
}

const cellCls =
  'w-full bg-canvas border border-line-strong rounded-lg px-2 py-2 text-ink focus:outline-none focus:border-accent'

interface EditorProps {
  value: PressureStage[]
  onChange: (next: PressureStage[]) => void
  maxBar?: number | null
  /** Called with the profile's total seconds when the user wants it as the extraction time */
  onUseTime?: (seconds: number) => void
  /** First drop in the cup, shown as a marker on the chart */
  firstDropS?: number
}

/** Stage-by-stage editor for an espresso pressure profile, with a live chart. */
export function PressureProfileEditor({ value, onChange, maxBar, onUseTime, firstDropS }: EditorProps) {
  const { t } = useLanguage()
  const update = (i: number, patch: Partial<PressureStage>) =>
    onChange(value.map((stage, idx) => (idx === i ? { ...stage, ...patch } : stage)))

  const addStage = () => {
    // Suggest the usual next step: pre-infusion -> short ramp -> hold -> decline
    const last = value[value.length - 1]
    const next: PressureStage = !last
      ? { type: 'preinfusion', duration_s: 10, pressure_bar: 3 }
      : last.type === 'preinfusion'
        ? { type: 'ramp', duration_s: 4, pressure_bar: 9 }
        : last.type === 'ramp'
          ? { type: 'hold', duration_s: 20, pressure_bar: last.pressure_bar }
          : last.type === 'hold'
            ? { type: 'decline', duration_s: 8, pressure_bar: Math.max(2, last.pressure_bar - 4) }
            : { type: 'hold', duration_s: 5, pressure_bar: last.pressure_bar }
    onChange([...value, next])
  }

  const valid = value.filter((s) => s.duration_s > 0)
  const total = profileDuration(valid)

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t('brew_form.pressure_hint')}</p>

      {value.map((stage, i) => (
        <div key={i} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-2 items-end">
          <div>
            {i === 0 && <label className="block text-xs text-muted mb-1">{t('brew_form.stage_type')}</label>}
            <select
              value={stage.type}
              onChange={(e) => update(i, { type: e.target.value as PressureStageType })}
              className={cellCls}
            >
              {PRESSURE_STAGE_TYPES.map((type) => (
                <option key={type} value={type}>{t(STAGE_LABEL_KEY[type])}</option>
              ))}
            </select>
          </div>
          <div>
            {i === 0 && <label className="block text-xs text-muted mb-1">{t('brew_form.stage_duration')}</label>}
            <input
              type="number" min="1" max="600" step="0.5"
              value={stage.duration_s || ''}
              onChange={(e) => update(i, { duration_s: parseFloat(e.target.value) || 0 })}
              className={cellCls}
              aria-label={t('brew_form.stage_duration')}
            />
          </div>
          <div>
            {i === 0 && <label className="block text-xs text-muted mb-1">{t('brew_form.stage_pressure')}</label>}
            <input
              type="number" min="0" max="20" step="0.5"
              value={Number.isFinite(stage.pressure_bar) ? stage.pressure_bar : ''}
              onChange={(e) => update(i, { pressure_bar: parseFloat(e.target.value) })}
              className={cellCls}
              aria-label={t('brew_form.stage_pressure')}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="p-2 text-muted hover:text-red-400"
            aria-label={t('brew_form.remove_stage')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {valid.length > 0 && (
        <div className="rounded-lg border border-line bg-surface p-2 max-w-sm">
          <PressureChart
            profile={valid.map((s) => ({ ...s, pressure_bar: s.pressure_bar || 0 }))}
            maxBar={maxBar}
            marker={firstDropS ? { s: firstDropS, label: t('brew_card.first_drop') } : undefined}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {value.length < MAX_PRESSURE_STAGES && (
          <button
            type="button"
            onClick={addStage}
            className="px-2.5 py-1 rounded-full text-xs border border-line-strong text-muted hover:text-accent-ink hover:border-accent flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {t('brew_form.add_stage')}
          </button>
        )}
        {valid.length > 0 && (
          <>
            <span className="text-xs text-muted">
              {t('brew_form.profile_total', { seconds: profileDuration(valid), bar: profilePeak(valid) })}
            </span>
            {onUseTime && (
              <button
                type="button"
                onClick={() => onUseTime(Math.round(total * 10) / 10)}
                className="ml-auto text-xs text-accent-ink hover:text-accent-hover"
              >
                {t('brew_form.use_profile_time')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
