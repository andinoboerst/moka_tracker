'use client'

import { useMemo, useState } from 'react'
import { Trophy, Target, Lightbulb } from 'lucide-react'
import { Brew } from '@/lib/types'
import { describeMix, mixSignature } from '@/lib/beans'
import { formatDate, mokaPotName } from '@/lib/utils'
import { translateStoredExpertValue } from '@/lib/dbValues'
import { useLanguage } from '@/lib/LanguageContext'

interface Group {
  key: string
  label: string
  brews: Brew[]
}

const average = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0)

export default function DialIn({ brews }: { brews: Brew[] }) {
  const { t } = useLanguage()

  // One group per recipe of beans in a given moka pot
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const brew of brews) {
      const key = `${mixSignature({ bean_id: brew.bean_id, mix: brew.mix })}@${brew.moka_pot_id}`
      const hasMix = (brew.mix?.length ?? 0) > 1
      const beanLabel = hasMix ? describeMix(brew.mix!) : brew.bean?.name || '?'
      const label = `${beanLabel} · ${brew.moka_pot ? mokaPotName(brew.moka_pot) : '?'}`
      const group = map.get(key) || { key, label, brews: [] }
      group.brews.push(brew)
      map.set(key, group)
    }
    return [...map.values()].sort((a, b) => b.brews.length - a.brews.length)
  }, [brews])

  const [selectedKey, setSelectedKey] = useState('')
  const group = groups.find((g) => g.key === selectedKey) || groups[0]

  if (!group) {
    return <p className="text-muted text-center py-16">{t('feat.dialin_empty')}</p>
  }

  const best = [...group.brews].sort(
    (a, b) => b.vibe_rating - a.vibe_rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  // Average rating per grinder setting
  const bySetting = new Map<number, Brew[]>()
  for (const b of group.brews) {
    if (b.grinder_id && b.grinder_setting != null) {
      bySetting.set(b.grinder_setting, [...(bySetting.get(b.grinder_setting) || []), b])
    }
  }
  const rows = [...bySetting.entries()]
    .map(([setting, list]) => ({
      setting,
      count: list.length,
      avg: average(list.map((b) => b.vibe_rating)),
      avgTime: Math.round(average(list.map((b) => b.extraction_time_s))),
    }))
    .sort((a, b) => a.setting - b.setting)

  const sweetSpot = [...rows].sort((a, b) => b.avg - a.avg || b.count - a.count)[0]
  const tested = new Set(rows.map((r) => r.setting))
  // Suggest the closest untested neighbour of the sweet spot
  const untested = sweetSpot
    ? [sweetSpot.setting - 1, sweetSpot.setting + 1].find((s) => s >= 0 && !tested.has(s))
    : undefined

  const microns = best.grinder?.microns_per_click

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-xs text-muted mb-1">{t('feat.dialin_recipe')}</label>
        <select
          value={group.key}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[22rem] bg-canvas border border-line-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
        >
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label} ({g.brews.length})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best known recipe */}
        <div className="bg-surface border border-accent/30 rounded-2xl shadow-lg shadow-black/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-serif font-bold text-accent">{t('feat.dialin_best')}</h3>
          </div>
          <p className="text-sm text-muted mb-4">
            {best.vibe_rating}/10 · {formatDate(best.created_at)}
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted">{t('brew_card.grinder')}</dt>
              <dd className="text-ink font-medium">
                {best.grinder_id
                  ? `${best.grinder_setting} ${t('brew_card.clicks')}${microns && best.grinder_setting != null ? ` (~${best.grinder_setting * microns}µm)` : ''}`
                  : t('brew_form.pre_ground')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('brew_card.coffee')} / {t('brew_card.water_in')}</dt>
              <dd className="text-ink font-medium">
                {best.coffee_weight_g}g / {best.water_added_g}g
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('brew_card.yield')}</dt>
              <dd className="text-ink font-medium">{best.final_yield_g}g</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('brew_card.time')}</dt>
              <dd className="text-ink font-medium">{best.extraction_time_s}s</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('brew_card.start_temp')}</dt>
              <dd className="text-ink font-medium">{translateStoredExpertValue(best.water_temp, t, 'Boiling')}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('brew_card.heat')}</dt>
              <dd className="text-ink font-medium">{translateStoredExpertValue(best.heat_level, t, 'Medium-Low')}</dd>
            </div>
          </dl>
          <a
            href={`/brew?from=${best.id}`}
            className="mt-5 inline-block bg-accent hover:bg-accent-hover text-canvas font-semibold py-2 px-5 rounded-lg transition"
          >
            {t('feat.brew_again')}
          </a>
        </div>

        {/* Sweet spot by grind */}
        <div className="bg-surface border border-line rounded-2xl shadow-lg shadow-black/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-serif font-bold text-accent">{t('feat.dialin_sweet')}</h3>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted">{t('feat.dialin_no_grind')}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li key={row.setting} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-ink tabular-nums">
                      {row.setting} {t('brew_card.clicks')}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row === sweetSpot ? 'bg-accent' : 'bg-muted/60'}`}
                        style={{ width: `${(row.avg / 10) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-muted tabular-nums">
                      {row.avg.toFixed(1)} · {row.count}×
                    </span>
                  </li>
                ))}
              </ul>
              {sweetSpot && (
                <div className="mt-5 flex items-start gap-2 text-sm text-ink bg-canvas/60 border border-line rounded-xl p-3">
                  <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p>
                    {t('feat.dialin_tip', { setting: sweetSpot.setting, avg: sweetSpot.avg.toFixed(1) })}
                    {untested !== undefined && ` ${t('feat.dialin_try', { setting: untested })}`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
