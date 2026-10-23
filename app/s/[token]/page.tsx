'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MokaPotIcon } from '@/components/icons/MokaPotIcon'
import ThemeToggle from '@/components/ThemeToggle'
import { useLanguage } from '@/lib/LanguageContext'
import { formatDate, getVibeEmoji, getVibeName, mokaPotName } from '@/lib/utils'
import { translateRoastLevel, translateStoredExpertValue } from '@/lib/dbValues'
import { mixArabicaShare, type MixComponent } from '@/lib/beans'

interface SharedBrew {
  created_at: string
  vibe_rating: number
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  brew_ratio_input: number
  extraction_ratio_output: number
  grinder_setting?: number | null
  grinder_id?: string | null
  water_temp?: string
  heat_level?: string
  flow_type?: string
  tasting_notes?: string
  milk_added_g?: number | null
  bean: { name: string; roaster: string; origin?: string; roast_level: string; bean_type?: string | null }
  mix: (MixComponent & { bean: { name: string; roaster: string; bean_type?: string | null } })[]
  grinder?: { brand: string; model: string; microns_per_click?: number } | null
  moka_pot: { brand: string; model: string; nickname?: string | null; size_cups: number }
}

export default function SharedBrewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { language, t } = useLanguage()
  const [brew, setBrew] = useState<SharedBrew | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc('get_shared_brew', { p_token: token })
      if (!error && data) setBrew(data as SharedBrew)
      setLoading(false)
    }
    load()
  }, [token])

  const share = brew && brew.mix?.length > 1 ? mixArabicaShare(brew.mix) : null

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MokaPotIcon className="w-10 h-10" />
            <span className="text-xl font-serif font-bold text-accent">Moka Tracker</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-muted py-20">{t('dashboard.loading')}</p>
        ) : !brew ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">☕</div>
            <h1 className="text-2xl font-serif font-bold text-ink mb-2">{t('feat.shared_not_found')}</h1>
            <Link href="/" className="text-accent hover:underline">
              {t('feat.shared_cta')}
            </Link>
          </div>
        ) : (
          <article className="card overflow-hidden">
            <div className="h-1.5 flex">
              <div className="flex-1 bg-italy-green" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-italy-red" />
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted">{t('feat.shared_by')} · {formatDate(brew.created_at)}</p>
                  <h1 className="text-3xl font-serif font-bold text-accent mt-1">
                    {brew.mix?.length > 1
                      ? [...brew.mix].sort((a, b) => b.percentage - a.percentage).map((c) => `${c.percentage}% ${c.bean.name}`).join(' + ')
                      : brew.bean.name}
                  </h1>
                  <p className="text-muted mt-1">
                    {brew.bean.roaster}
                    {brew.bean.bean_type ? ` · ${brew.bean.bean_type}` : ''} · {translateRoastLevel(brew.bean.roast_level, t)}
                  </p>
                  {share !== null && (
                    <p className="text-xs text-muted mt-1">
                      {t('feat.mix_overall', { arabica: share, robusta: 100 - share })}
                    </p>
                  )}
                </div>
                <div className="text-center shrink-0">
                  <div className="text-5xl">{getVibeEmoji(brew.vibe_rating)}</div>
                  <p className="text-xs text-accent font-semibold mt-1">
                    {brew.vibe_rating}/10 · {getVibeName(brew.vibe_rating, language)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  [t('brew_card.coffee'), `${brew.coffee_weight_g}g`],
                  [t('brew_card.water_in'), `${brew.water_added_g}g`],
                  [t('brew_card.yield'), `${brew.final_yield_g}g`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-line rounded-xl p-3">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="text-lg font-semibold text-accent">{value}</p>
                  </div>
                ))}
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.moka_pot')}</dt>
                  <dd className="text-ink">{mokaPotName(brew.moka_pot)} ({t('moka_form.cup_count', { count: brew.moka_pot.size_cups })})</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.grinder')}</dt>
                  <dd className="text-ink">
                    {brew.grinder_id && brew.grinder
                      ? `${brew.grinder_setting} ${t('brew_card.clicks')} · ${brew.grinder.brand} ${brew.grinder.model}`
                      : t('brew_form.pre_ground')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.time')}</dt>
                  <dd className="text-ink">{brew.extraction_time_s}s</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.brew_ratio')}</dt>
                  <dd className="text-ink">1:{Number(brew.brew_ratio_input).toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.start_temp')}</dt>
                  <dd className="text-ink">{translateStoredExpertValue(brew.water_temp, t, 'Boiling')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t('brew_card.heat')}</dt>
                  <dd className="text-ink">{translateStoredExpertValue(brew.heat_level, t, 'Medium-Low')}</dd>
                </div>
              </dl>

              {brew.tasting_notes && (
                <p className="text-ink italic border-l-4 border-accent pl-4">&ldquo;{brew.tasting_notes}&rdquo;</p>
              )}

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="btn-primary py-2.5 px-6"
                >
                  {t('feat.shared_cta')}
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  )
}
