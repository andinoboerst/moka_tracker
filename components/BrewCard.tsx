'use client'

import { Brew } from '@/lib/types'
import { getVibeEmoji, getVibeName, formatDate } from '@/lib/utils'
import { Trash2, Sparkles, Share2, Download } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { toPng } from 'html-to-image'
import BrewShareTemplate from './BrewShareTemplate'
import { useRef, useState } from 'react'

interface BrewCardProps {
  brew: Brew
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
}

export default function BrewCard({ brew, onDelete, isDeleting }: BrewCardProps) {
  const { t } = useLanguage()
  const shareRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadImage = async (dataUrl: string) => {
    const link = document.createElement('a')
    link.download = `moka-brew-${brew.created_at.split('T')[0]}.png`
    link.href = dataUrl
    link.click()
  }

  const handleDownload = async () => {
    if (!shareRef.current) return
    setIsDownloading(true)
    try {
      const dataUrl = await toPng(shareRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1920,
      })
      await downloadImage(dataUrl)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!shareRef.current) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(shareRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1920,
      })

      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `moka-brew-${brew.created_at.split('T')[0]}.png`, { type: 'image/png' })

      // Get the current origin for the main app link
      const appUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}`

      // Try Web Share API on mobile
      if (navigator.share && navigator.canShare) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Moka Tracker - ${brew.bean?.name || 'Brew'}`,
              text: `Check out my brew! ${getVibeName(brew.vibe_rating)} vibe ☕\n\n${appUrl}`,
              files: [file],
            })
            return
          }
        } catch (err) {
          // User cancelled share, not an error
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Share cancelled')
            return
          }
          console.error('Web Share failed:', err)
        }
      }

      // Fallback: download the image on desktop or unsupported browsers
      await downloadImage(dataUrl)
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsSharing(false)
    }
  }
  return (
    <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 space-y-4 hover:border-[#5a4f4a] transition">
      {/* Header with date and delete */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-[#8b6f47]">{formatDate(brew.created_at)}</p>
          <h3 className="text-lg font-semibold text-[#f5f1ed] mt-1">
            {brew.bean?.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl" title={getVibeName(brew.vibe_rating)}>{getVibeEmoji(brew.vibe_rating)}</span>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="p-2 hover:bg-[#3d3530] rounded transition disabled:opacity-50 text-[#d4a574]"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 hover:bg-[#3d3530] rounded transition disabled:opacity-50 text-[#d4a574]"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(brew.id)}
            disabled={isDeleting}
            className="p-2 hover:bg-red-900/30 rounded transition disabled:opacity-50"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Brew Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.bean')}</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.bean?.origin ? `${brew.bean.origin} • ` : ''}{brew.bean?.roast_level} Roast
          </p>
          <p className="text-xs text-[#8b6f47]">{brew.bean?.roaster}</p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.grinder')}</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.grinder_id ? (
              <>
                {brew.grinder_setting} clicks
                {brew.grinder?.microns_per_click && (
                  <span className="text-xs text-[#8b6f47] ml-1">
                    ({brew.grinder_setting! * brew.grinder.microns_per_click}μm)
                  </span>
                )}
              </>
            ) : (
              t('brew_form.pre_ground')
            )}
          </p>
          <p className="text-xs text-[#8b6f47]">
            {brew.grinder_id ? `${brew.grinder?.brand} ${brew.grinder?.model}` : 'No grinder used'}
          </p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.moka_pot')}</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.moka_pot?.brand} {brew.moka_pot?.model} ({brew.moka_pot?.size_cups} Cup)
          </p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.vibe')}</p>
          <p className="text-sm font-medium text-[#d4a574]">
            {brew.vibe_rating}/10 — {getVibeName(brew.vibe_rating)}
          </p>
        </div>
      </div>

      {/* Measurements */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">{t('brew_card.coffee')}</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.coffee_weight_g}g</p>
        </div>
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">{t('brew_card.water_in')}</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.water_added_g}g</p>
        </div>
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">{t('brew_card.yield')}</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.final_yield_g}g</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.brew_ratio')}</p>
          <p className="text-sm font-semibold text-[#d4a574]">
            1:{brew.brew_ratio_input?.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.extraction')}</p>
          <p className="text-sm font-semibold text-[#d4a574]">
            1:{brew.extraction_ratio_output?.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.time')}</p>
          <p className="text-sm font-semibold text-[#f5f1ed]">{brew.extraction_time_s}s</p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.style')}</p>
          <p className="text-sm font-semibold text-[#f5f1ed]">
            {brew.milk_added_g ? `${brew.milk_type || 'Milk'} (${brew.milk_added_g}g)` : t('brew_card.black')}
          </p>
        </div>
      </div>

      {/* Expert Metrics Display */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3d3530]/50">
        <div className="text-[10px] bg-[#1a1410] text-[#8b6f47] px-2 py-1 rounded flex items-center gap-1 border border-[#3d3530]">
          <span>🌡️</span> {brew.water_temp || 'Boiling'} {t('brew_card.start_temp')}
        </div>
        <div className="text-[10px] bg-[#1a1410] text-[#8b6f47] px-2 py-1 rounded flex items-center gap-1 border border-[#3d3530]">
          <span>🔥</span> {brew.heat_level || 'Medium-Low'} {t('brew_card.heat')}
        </div>
        <div className="text-[10px] bg-[#1a1410] text-[#8b6f47] px-2 py-1 rounded flex items-center gap-1 border border-[#3d3530]">
          <span>🌊</span> {brew.flow_type || 'Steady'} {t('brew_card.flow')}
        </div>
        {brew.has_paper_filter && (
          <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded flex items-center gap-1 border border-blue-800/30">
            <span>📄</span> {t('brew_card.paper_filter')}
          </div>
        )}
      </div>

      {/* Tasting Notes */}
      {brew.tasting_notes && (
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">{t('brew_card.notes')}</p>
          <p className="text-sm text-[#f5f1ed]">{brew.tasting_notes}</p>
        </div>
      )}

      {/* AI Recap */}
      {brew.ai_recap && (
        <div className="bg-gradient-to-r from-[#3d3530] to-[#1a1410] rounded-lg p-4 border-l-4 border-[#d4a574]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#d4a574]" />
            <h4 className="text-sm font-bold text-[#d4a574]">Brew Master Recap</h4>
          </div>
          <p className="text-sm text-[#f5f1ed] italic">
            "{(() => {
              try {
                const parsed = JSON.parse(brew.ai_recap);
                return parsed.summary || parsed.suggestion || brew.ai_recap;
              } catch (e) {
                return brew.ai_recap;
              }
            })()}"
          </p>
        </div>
      )}

      {/* Hidden Share Template */}
      <div className="fixed -left-[4000px] -top-[4000px]">
        <BrewShareTemplate brew={brew} ref={shareRef} />
      </div>
    </div>
  )
}
