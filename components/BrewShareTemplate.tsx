'use client'

import { Brew } from '@/lib/types'
import { getVibeEmoji, getVibeName, formatDate } from '@/lib/utils'
import { MokaPotIcon } from './icons/MokaPotIcon'
import { Scale, Thermometer, Timer, Sparkles, Droplets, Settings } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

import { forwardRef } from 'react'

interface BrewShareTemplateProps {
  brew: Brew
  id?: string
}

const BrewShareTemplate = forwardRef<HTMLDivElement, BrewShareTemplateProps>(({ brew, id }, ref) => {
  const { t } = useLanguage()
  const aiRecap = brew.ai_recap ? JSON.parse(brew.ai_recap) : null
  const recapText = aiRecap ? (aiRecap.summary || aiRecap.suggestion || brew.ai_recap) : null

  return (
    <div
      id={id}
      ref={ref}
      className="bg-[#1a1410] w-[1080px] h-[1920px] flex flex-col items-center justify-between p-16 pb-32 text-[#f5f1ed] relative overflow-hidden"
      style={{ fontFamily: 'var(--font-serif)', paddingTop: '140px' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-4 flex">
        <div className="flex-1 bg-[#009246]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#ce2b37]"></div>
      </div>

      <div className="absolute -bottom-20 -right-20 opacity-5">
        <MokaPotIcon className="w-[600px] h-[600px]" />
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div>
          <h1 className="text-7xl font-bold text-[#d4a574] mb-4 tracking-tight">Moka Tracker</h1>
          <p className="text-3xl text-[#8b6f47] italic">{t('brew_share.ritual')} • {formatDate(brew.created_at)}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[120px] mb-2 leading-none">{getVibeEmoji(brew.vibe_rating)}</span>
          <span className="text-4xl font-serif text-[#d4a574] uppercase tracking-[0.2em]">{getVibeName(brew.vibe_rating)}</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="w-full bg-[#2d2520]/90 backdrop-blur-xl border-2 border-[#d4a574]/40 rounded-[3rem] p-16 z-10 shadow-2xl relative min-h-[900px] flex flex-col justify-between">
        {brew.moka_pot && (
          <div className="absolute top-12 right-12 bg-[#1a1410] px-8 py-4 rounded-full border border-[#d4a574]/40 shadow-lg">
            <p className="text-3xl text-[#d4a574] font-serif italic">
              {brew.moka_pot.brand} {brew.moka_pot.model}
            </p>
          </div>
        )}

        <div className="mb-12 border-b border-[#3d3530] pb-10">
          <h2 className="text-6xl font-bold text-[#f5f1ed] mb-4">
            {brew.bean?.name}
          </h2>
          <p className="text-4xl text-[#d4a574]">
            {brew.bean?.origin ? `${brew.bean.origin} • ` : ''}{brew.bean?.roast_level} {t('brew_share.roast')}
          </p>
          <p className="text-2xl text-[#8b6f47] mt-4 italic">{brew.bean?.roaster}</p>
        </div>

        <div className="grid grid-cols-2 gap-16 mb-16">
          <div className="flex items-center gap-8">
            <div className="bg-[#1a1410] p-6 rounded-3xl border border-[#3d3530]">
              <Scale className="w-12 h-12 text-[#d4a574]" />
            </div>
            <div>
              <p className="text-2xl text-[#8b6f47] mb-2">{t('brew_share.coffee_water')}</p>
              <p className="text-4xl font-bold">{brew.coffee_weight_g || 0}g / {brew.water_added_g || 0}g</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="bg-[#1a1410] p-6 rounded-3xl border border-[#3d3530]">
              <Timer className="w-12 h-12 text-[#d4a574]" />
            </div>
            <div>
              <p className="text-2xl text-[#8b6f47] mb-2">{t('brew_share.brew_time')}</p>
              <p className="text-4xl font-bold">{brew.extraction_time_s || 0}s</p>
            </div>
          </div>
          {brew.grinder_id && brew.grinder_setting && (
            <div className="flex items-center gap-8">
              <div className="bg-[#1a1410] p-6 rounded-3xl border border-[#3d3530]">
                <Settings className="w-12 h-12 text-[#d4a574]" />
              </div>
              <div>
                <p className="text-2xl text-[#8b6f47] mb-2">{t('brew_share.grind_size')}</p>
                <p className="text-4xl font-bold">
                  {brew.grinder?.microns_per_click
                    ? `${brew.grinder_setting * brew.grinder.microns_per_click}μm`
                    : `${brew.grinder_setting} clicks`}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-8">
            <div className="bg-[#1a1410] p-6 rounded-3xl border border-[#3d3530]">
              <Droplets className="w-12 h-12 text-[#d4a574]" />
            </div>
            <div>
              <p className="text-2xl text-[#8b6f47] mb-2">{t('brew_share.extraction_ratio')}</p>
              <p className="text-4xl font-bold">1:{(brew.extraction_ratio_output || (brew.final_yield_g / brew.coffee_weight_g) || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>

        {brew.ai_recap && (
          <div className="bg-[#1a1410] p-12 rounded-[2.5rem] border-l-[12px] border-[#d4a574] italic shadow-inner mt-8">
            <p className="text-4xl text-[#f5f1ed] leading-relaxed font-medium">
              "{(() => {
                try {
                  const parsed = JSON.parse(brew.ai_recap);
                  return parsed.summary || parsed.suggestion || brew.ai_recap;
                } catch (e) {
                  return brew.ai_recap;
                }
              })()}"
            </p>
            <p className="text-right text-[#8b6f47] mt-8 text-3xl">— {t('brew_share.brew_master')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center z-10 text-[#8b6f47]">
        <p className="text-3xl">{t('brew_share.shared_via')}</p>
        <p className="text-3xl tracking-tighter italic font-serif">{t('brew_share.good_coffee')}</p>
      </div>
    </div>
  )
})

export default BrewShareTemplate
