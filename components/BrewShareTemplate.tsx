'use client'

import { Brew } from '@/lib/types'
import { getVibeName, formatDate, mokaPotName, isEspresso } from '@/lib/utils'
import { describeMix } from '@/lib/beans'
import { translateRoastLevel, translateMilkType } from '@/lib/dbValues'
import { MokaPotIcon } from './icons/MokaPotIcon'
import { PressureChart } from './PressureProfile'
import VibeIcon from './VibeIcon'
import { Scale, Timer, Droplets, Settings } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

import { forwardRef } from 'react'

interface BrewShareTemplateProps {
  brew: Brew
  id?: string
  /** Short funny caption, generated when the image is made. Without it the longer recap is shown. */
  shareLine?: string
}

// Rendered off-screen and exported as a PNG, so it uses fixed brand colours
// (espresso canvas, terracotta accent) rather than the live theme tokens.
const C = { canvas: '#12100E', surface: '#1C1917', line: '#2E2925', ink: '#F2E8DA', muted: '#AB9E8F', accent: '#E58A62', accentFill: '#C85A32' }
const mono = { fontFamily: 'var(--font-mono-ui)' }
const display = { fontFamily: 'var(--font-display-ui)' }

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Scale; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-7">
      <div className="p-5 rounded-3xl border" style={{ background: C.canvas, borderColor: C.line }}>
        <Icon className="w-11 h-11" style={{ color: C.accent }} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl mb-1.5" style={{ color: C.muted }}>{label}</p>
        <p className="text-4xl font-semibold whitespace-nowrap" style={mono}>
          {value}
          {sub && <span className="text-2xl font-normal ml-3" style={{ color: C.muted }}>{sub}</span>}
        </p>
      </div>
    </div>
  )
}

const BrewShareTemplate = forwardRef<HTMLDivElement, BrewShareTemplateProps>(({ brew, id, shareLine }, ref) => {
  const { language, t } = useLanguage()
  const espresso = isEspresso(brew.moka_pot)
  const hasProfile = espresso && !!brew.pressure_profile?.length
  const ratio = brew.extraction_ratio_output || brew.final_yield_g / brew.coffee_weight_g || 0

  // The short caption when we have one; otherwise fall back to the longer recap
  const recap = (() => {
    if (shareLine) return { text: shareLine, short: true }
    if (!brew.ai_recap) return { text: '', short: false }
    try {
      const parsed = JSON.parse(brew.ai_recap)
      return { text: (parsed.summary || parsed.suggestion || brew.ai_recap) as string, short: false }
    } catch {
      return { text: brew.ai_recap, short: false }
    }
  })()

  const chips = [
    brew.milk_added_g ? `${translateMilkType(brew.milk_type, t)} ${brew.milk_added_g}g` : '',
    brew.taste_balance ? t(`brew_form.taste_${brew.taste_balance}`) : '',
    espresso && brew.first_drip_s != null ? `${t('brew_card.first_drip')} ${brew.first_drip_s}s` : '',
    espresso && brew.used_wdt ? 'WDT' : '',
  ].filter(Boolean)

  return (
    <div
      id={id}
      ref={ref}
      className="w-[1080px] h-[1920px] flex flex-col justify-between px-16 pb-24 relative overflow-hidden"
      style={{ background: C.canvas, color: C.ink, fontFamily: 'var(--font-sans-ui)', paddingTop: '120px' }}
    >
      {/* Tricolore hairline */}
      <div className="absolute top-0 left-0 w-full h-3 flex">
        <div className="flex-1 bg-[#009246]"></div>
        <div className="flex-1 bg-[#F4EFE6]"></div>
        <div className="flex-1 bg-[#CE2B37]"></div>
      </div>

      <div className="absolute -bottom-20 -right-20 opacity-[0.04]">
        <MokaPotIcon className="w-[600px] h-[600px]" />
      </div>

      {/* Header: brand on the left, the rating as the hero on the right */}
      <div className="w-full flex justify-between items-center z-10">
        <div>
          <h1 className="text-7xl font-semibold mb-4 tracking-tight" style={display}>Moka Tracker</h1>
          <p className="text-3xl" style={{ color: C.muted }}>
            {t('brew_share.ritual')} <span className="mx-2">/</span>
            <span style={mono}>{formatDate(brew.created_at)}</span>
          </p>
        </div>
        <div className="flex items-center gap-6" style={{ color: C.accent }}>
          <VibeIcon rating={brew.vibe_rating} size={150} />
          <div>
            <p className="leading-none font-semibold" style={{ ...display, fontSize: '130px', color: C.ink }}>
              {brew.vibe_rating}
              <span className="text-5xl ml-1" style={{ ...mono, color: C.muted }}>/10</span>
            </p>
            <p className="text-2xl uppercase tracking-[0.14em] mt-2" style={mono}>
              {getVibeName(brew.vibe_rating, language)}
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full rounded-[2.5rem] border p-14 z-10 shadow-2xl relative" style={{ background: C.surface, borderColor: C.line }}>
        {brew.moka_pot && (
          <div className="absolute top-10 right-10 px-7 py-3.5 rounded-full border" style={{ background: C.canvas, borderColor: C.line }}>
            <p className="text-3xl" style={{ ...mono, color: C.accent }}>{mokaPotName(brew.moka_pot)}</p>
          </div>
        )}

        <div className="mb-10 pb-8 border-b pr-64" style={{ borderColor: C.line }}>
          <h2 className="text-6xl font-semibold mb-3 leading-tight" style={display}>
            {brew.mix && brew.mix.length > 1 ? describeMix(brew.mix) : brew.bean?.name}
          </h2>
          <p className="text-4xl" style={{ color: C.accent }}>
            {brew.bean?.origin ? `${brew.bean.origin} • ` : ''}{translateRoastLevel(brew.bean?.roast_level, t)} {t('brew_share.roast')}
          </p>
          <p className="text-2xl mt-3" style={{ color: C.muted }}>{brew.bean?.roaster}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-9">
          <Stat
            icon={Scale}
            label={espresso ? t('brew_share.dose_yield') : t('brew_share.coffee_water')}
            value={espresso ? `${brew.coffee_weight_g}g → ${brew.final_yield_g}g` : `${brew.coffee_weight_g || 0}g / ${brew.water_added_g || 0}g`}
          />
          <Stat
            icon={Timer}
            label={t('brew_share.brew_time')}
            value={`${brew.extraction_time_s || 0}s`}
            sub={
              espresso && brew.first_drip_s != null
                ? t('brew_card.time_split_short', { total: Math.round((Number(brew.extraction_time_s) + Number(brew.first_drip_s)) * 10) / 10 })
                : undefined
            }
          />
          {brew.grinder_id && brew.grinder_setting != null && (
            <Stat
              icon={Settings}
              label={t('brew_share.grind_size')}
              value={brew.grinder?.adjustment_type === 'stepless' ? `${brew.grinder_setting}μm` : `${brew.grinder_setting} ${t('brew_card.clicks')}`}
              sub={
                brew.grinder?.adjustment_type !== 'stepless' && brew.grinder?.microns_per_click
                  ? `~${Math.round(brew.grinder_setting * brew.grinder.microns_per_click)}μm`
                  : undefined
              }
            />
          )}
          <Stat icon={Droplets} label={t('brew_share.extraction_ratio')} value={`1:${ratio.toFixed(1)}`} />
        </div>

        {hasProfile && (
          <div className="mt-10 rounded-[2rem] border p-7" style={{ background: C.canvas, borderColor: C.line }}>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-2xl" style={{ color: C.muted }}>{t('brew_card.pressure_profile')}</p>
              {brew.brew_temp_c != null && <p className="text-3xl" style={{ ...mono, color: C.accent }}>{brew.brew_temp_c}°C</p>}
            </div>
            <PressureChart
              profile={brew.pressure_profile!}
              maxBar={brew.moka_pot?.max_pressure_bar}
              colors={{ accent: C.accent, grid: C.line, text: C.muted }}
              size={{ w: 640, h: 150, font: 14 }}
            />
          </div>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-9">
            {chips.map((chip) => (
              <span key={chip} className="px-6 py-2.5 rounded-full border text-2xl" style={{ ...mono, background: C.canvas, borderColor: C.line, color: C.ink }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {brew.tasting_notes && (
          <div className="mt-9">
            <p className="text-2xl mb-2" style={{ color: C.muted }}>{t('brew_share.your_notes')}</p>
            <p className="text-3xl leading-snug line-clamp-3" style={{ color: C.ink }}>{brew.tasting_notes}</p>
          </div>
        )}

        {recap.text && (
          <div className="mt-9 p-9 rounded-[1.75rem] border border-l-[10px]" style={{ background: C.canvas, borderColor: C.line, borderLeftColor: C.accentFill }}>
            <p className={`${recap.short ? 'text-5xl leading-snug' : 'text-3xl leading-relaxed line-clamp-3'} italic`} style={display}>
              &ldquo;{recap.text}&rdquo;
            </p>
            <p className="text-right mt-4 text-2xl" style={{ color: C.muted }}>— {t('brew_share.brew_master')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center z-10" style={{ color: C.muted }}>
        <p className="text-3xl">{t('brew_share.shared_via')}</p>
        <p className="text-3xl tracking-tight italic" style={display}>{t('brew_share.good_coffee')}</p>
      </div>
    </div>
  )
})

BrewShareTemplate.displayName = 'BrewShareTemplate'

export default BrewShareTemplate
