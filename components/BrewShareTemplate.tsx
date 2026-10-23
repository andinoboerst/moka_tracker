'use client'

import { Brew } from '@/lib/types'
import { getVibeName, formatDate, mokaPotName } from '@/lib/utils'
import { describeMix } from '@/lib/beans'
import { translateRoastLevel } from '@/lib/dbValues'
import { MokaPotIcon } from './icons/MokaPotIcon'
import VibeIcon from './VibeIcon'
import { Scale, Timer, Droplets, Settings } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

import { forwardRef } from 'react'

interface BrewShareTemplateProps {
  brew: Brew
  id?: string
}

/**
 * Rendered off-screen and exported as a PNG, so it uses fixed brand colours
 * (espresso canvas, terracotta accent) rather than the live theme tokens.
 */
const BrewShareTemplate = forwardRef<HTMLDivElement, BrewShareTemplateProps>(({ brew, id }, ref) => {
  const { language, t } = useLanguage()

  return (
    <div
      id={id}
      ref={ref}
      className="bg-[#12100E] w-[1080px] h-[1920px] flex flex-col items-center justify-between p-16 pb-32 text-[#F2E8DA] relative overflow-hidden"
      style={{ fontFamily: 'var(--font-sans-ui)', paddingTop: '140px' }}
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

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div>
          <h1 className="text-7xl font-semibold text-[#F2E8DA] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display-ui)' }}>
            Moka Tracker
          </h1>
          <p className="text-3xl text-[#AB9E8F]">
            {t('brew_share.ritual')} <span className="mx-2">/</span>
            <span style={{ fontFamily: 'var(--font-mono-ui)' }}>{formatDate(brew.created_at)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end text-[#E58A62]">
          <VibeIcon rating={brew.vibe_rating} className="w-32 h-32 mb-4" strokeWidth={1.5} />
          <span className="text-3xl uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono-ui)' }}>
            {getVibeName(brew.vibe_rating, language)}
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="w-full bg-[#1C1917] border border-[#2E2925] rounded-[2.5rem] p-16 z-10 shadow-2xl relative min-h-[900px] flex flex-col justify-between">
        {brew.moka_pot && (
          <div className="absolute top-12 right-12 bg-[#12100E] px-8 py-4 rounded-full border border-[#2E2925]">
            <p className="text-3xl text-[#E58A62]" style={{ fontFamily: 'var(--font-mono-ui)' }}>
              {mokaPotName(brew.moka_pot)}
            </p>
          </div>
        )}

        <div className="mb-12 border-b border-[#2E2925] pb-10">
          <h2 className="text-6xl font-semibold text-[#F2E8DA] mb-4" style={{ fontFamily: 'var(--font-display-ui)' }}>
            {brew.mix && brew.mix.length > 1 ? describeMix(brew.mix) : brew.bean?.name}
          </h2>
          <p className="text-4xl text-[#E58A62]">
            {brew.bean?.origin ? `${brew.bean.origin} • ` : ''}{translateRoastLevel(brew.bean?.roast_level, t)} {t('brew_share.roast')}
          </p>
          <p className="text-2xl text-[#AB9E8F] mt-4">{brew.bean?.roaster}</p>
        </div>

        <div className="grid grid-cols-2 gap-16 mb-16">
          <div className="flex items-center gap-8">
            <div className="bg-[#12100E] p-6 rounded-3xl border border-[#2E2925]">
              <Scale className="w-12 h-12 text-[#E58A62]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl text-[#AB9E8F] mb-2">{t('brew_share.coffee_water')}</p>
              <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-mono-ui)' }}>{brew.coffee_weight_g || 0}g / {brew.water_added_g || 0}g</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="bg-[#12100E] p-6 rounded-3xl border border-[#2E2925]">
              <Timer className="w-12 h-12 text-[#E58A62]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl text-[#AB9E8F] mb-2">{t('brew_share.brew_time')}</p>
              <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-mono-ui)' }}>{brew.extraction_time_s || 0}s</p>
            </div>
          </div>
          {brew.grinder_id && brew.grinder_setting && (
            <div className="flex items-center gap-8">
              <div className="bg-[#12100E] p-6 rounded-3xl border border-[#2E2925]">
                <Settings className="w-12 h-12 text-[#E58A62]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl text-[#AB9E8F] mb-2">{t('brew_share.grind_size')}</p>
                <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-mono-ui)' }}>
                  {brew.grinder?.microns_per_click
                    ? `${brew.grinder_setting * brew.grinder.microns_per_click}μm`
                    : `${brew.grinder_setting} ${t('brew_card.clicks')}`}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-8">
            <div className="bg-[#12100E] p-6 rounded-3xl border border-[#2E2925]">
              <Droplets className="w-12 h-12 text-[#E58A62]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl text-[#AB9E8F] mb-2">{t('brew_share.extraction_ratio')}</p>
              <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-mono-ui)' }}>1:{(brew.extraction_ratio_output || (brew.final_yield_g / brew.coffee_weight_g) || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>

        {brew.ai_recap && (
          <div className="bg-[#12100E] p-12 rounded-[2rem] border border-[#2E2925] border-l-[10px] border-l-[#C85A32] mt-8">
            <p className="text-4xl text-[#F2E8DA] leading-relaxed italic" style={{ fontFamily: 'var(--font-display-ui)' }}>
              &ldquo;{(() => {
                try {
                  const parsed = JSON.parse(brew.ai_recap);
                  return parsed.summary || parsed.suggestion || brew.ai_recap;
                } catch {
                  return brew.ai_recap;
                }
              })()}&rdquo;
            </p>
            <p className="text-right text-[#AB9E8F] mt-8 text-3xl">— {t('brew_share.brew_master')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center z-10 text-[#AB9E8F]">
        <p className="text-3xl">{t('brew_share.shared_via')}</p>
        <p className="text-3xl tracking-tight italic" style={{ fontFamily: 'var(--font-display-ui)' }}>{t('brew_share.good_coffee')}</p>
      </div>
    </div>
  )
})

BrewShareTemplate.displayName = 'BrewShareTemplate'

export default BrewShareTemplate
