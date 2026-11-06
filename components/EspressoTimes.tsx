'use client'

import { Flag, Play, RotateCcw, Square } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export type TimeField = 'total' | 'drop' | 'extract'

interface Props {
  total: string
  drop: string
  extract: string
  /** The field that is currently worked out from the other two */
  auto?: TimeField
  onChange: (field: TimeField, value: string) => void
  timer: {
    running: boolean
    seconds: number
    splitTaken: boolean
    onToggle: () => void
    onSplit: () => void
    onReset: () => void
  }
}

const inputCls =
  'w-full bg-canvas border border-line-strong rounded-lg px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent'

/**
 * Espresso timing: total shot time, time until the first drop and time from the first drop.
 * Fill in any two and the third follows. The timer can be split at the first drop.
 */
export default function EspressoTimes({ total, drop, extract, auto, onChange, timer }: Props) {
  const { t } = useLanguage()

  const fields: { id: TimeField; label: string; value: string }[] = [
    { id: 'total', label: t('brew_form.time_total'), value: total },
    { id: 'drop', label: t('brew_form.time_drop'), value: drop },
    { id: 'extract', label: t('brew_form.time_extract'), value: extract },
  ]

  return (
    <div className="md:col-span-2 space-y-4 rounded-xl border border-line bg-canvas/50 p-4">
      {/* Timer with a split for the first drop */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="num text-2xl font-medium text-ink w-20">{timer.seconds}s</span>
        <button
          type="button"
          onClick={timer.onToggle}
          className={`shrink-0 px-3 py-2 rounded-lg border flex items-center gap-1.5 text-sm font-medium ${
            timer.running ? 'border-red-500 text-red-400' : 'border-line-strong text-accent-ink hover:border-accent'
          }`}
        >
          {timer.running ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {timer.running ? t('feat.timer_stop') : t('feat.timer_start')}
        </button>
        {timer.running && !timer.splitTaken && (
          <button
            type="button"
            onClick={timer.onSplit}
            className="shrink-0 px-3 py-2 rounded-lg border border-accent bg-accent/15 text-accent-ink flex items-center gap-1.5 text-sm font-medium"
          >
            <Flag className="w-4 h-4" /> {t('brew_form.timer_split')}
          </button>
        )}
        {!timer.running && timer.seconds > 0 && (
          <button
            type="button"
            onClick={timer.onReset}
            className="shrink-0 px-2 py-2 text-muted hover:text-accent-ink"
            title={t('feat.timer_reset')}
            aria-label={t('feat.timer_reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.id}>
            <label className="flex items-center justify-between text-sm font-medium text-ink mb-1">
              {f.label}
              {auto === f.id && (
                <span className="text-[10px] uppercase tracking-wider text-accent-ink">{t('brew_form.time_auto')}</span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={f.value}
              onChange={(e) => onChange(f.id, e.target.value)}
              placeholder="—"
              className={`${inputCls} ${auto === f.id ? 'border-dashed text-accent-ink' : ''}`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">{t('brew_form.time_hint')}</p>
    </div>
  )
}
