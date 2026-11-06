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
}: {
  profile: PressureStage[]
  maxBar?: number | null
  /** Fixed colours for places that ignore the live theme (the exported share image) */
  colors?: { accent: string; grid: string; text: string }
  /** Drawing area and label size, for larger placements than the default 320x110 */
  size?: { w: number; h: number; font: number }
}) {
  const accent = colors?.accent ?? 'var(--accent)'
  const grid = colors?.grid ?? 'var(--line)'
  const text = colors?.text ?? 'var(--muted)'
  const total = profileDuration(profile)
  if (profile.length === 0 || total <= 0) return null

  const W = size?.w ?? 320
  const H = size?.h ?? 110
  const font = size?.font ?? 9
  const pad = { l: font * 3, r: 8, t: 8, b: font * 2.2 }
  const top = Math.max(maxBar ?? 0, Math.ceil(profilePeak(profile)), 1)
  const x = (s: number) => pad.l + (s / total) * (W - pad.l - pad.r)
  const y = (bar: number) => H - pad.b - (bar / top) * (H - pad.t - pad.b)
  const points = profilePoints(profile)
  const path = points.map(([s, bar], i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)},${y(bar).toFixed(1)}`).join(' ')
  const ticks = Array.from(new Set([0, Math.round(top / 2), top]))

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
}

/** Stage-by-stage editor for an espresso pressure profile, with a live chart. */
export function PressureProfileEditor({ value, onChange, maxBar, onUseTime }: EditorProps) {
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
        <div className="rounded-lg border border-line bg-surface p-2">
          <PressureChart profile={valid.map((s) => ({ ...s, pressure_bar: s.pressure_bar || 0 }))} maxBar={maxBar} />
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
                onClick={() => onUseTime(Math.round(profileDuration(valid)))}
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
