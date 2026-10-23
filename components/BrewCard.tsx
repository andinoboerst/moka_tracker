'use client'

import { Brew } from '@/lib/types'
import { getVibeName, formatDate, mokaPotName, getAuthHeaders } from '@/lib/utils'
import { translateStoredExpertValue, translateMilkType, translateRoastLevel } from '@/lib/dbValues'
import { Trash2, Sparkles, Share2, Download, Pencil, Copy, Link2, Link2Off, Check, Thermometer, Flame, Waves, FileText } from 'lucide-react'
import VibeIcon from './VibeIcon'
import Link from 'next/link'
import { describeMix, mixArabicaShare } from '@/lib/beans'
import { useLanguage } from '@/lib/LanguageContext'
import { toPng } from 'html-to-image'
import BrewShareTemplate from './BrewShareTemplate'
import { useRef, useState } from 'react'

interface BrewCardProps {
  brew: Brew
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
  /** Called when the brew changes (e.g. public link toggled) */
  onUpdate?: (brew: Brew) => void
}

export default function BrewCard({ brew, onDelete, isDeleting, onUpdate }: BrewCardProps) {
  const { language, t } = useLanguage()
  const shareRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const hasMix = (brew.mix?.length ?? 0) > 1
  const mixShare = hasMix ? mixArabicaShare(brew.mix!) : null

  const copyPublicLink = async () => {
    try {
      let token = brew.share_token
      if (!token) {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/brews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ id: brew.id, share: true }),
        })
        if (!response.ok) throw new Error('Failed to create link')
        token = (await response.json()).share_token
        onUpdate?.({ ...brew, share_token: token })
      }
      await navigator.clipboard.writeText(`${window.location.origin}/s/${token}`)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Share link failed:', err)
    }
  }

  const stopSharing = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/brews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ id: brew.id, share: false }),
      })
      if (response.ok) onUpdate?.({ ...brew, share_token: null })
    } catch (err) {
      console.error('Stop sharing failed:', err)
    }
  }

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
      const appUrl = 'https://mokatracker.com'

      // Try Web Share API on mobile
      if (navigator.share && navigator.canShare) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Moka Tracker - ${brew.bean?.name || 'Brew'}`,
              text: t('brew_card.share_message', {
                vibe: getVibeName(brew.vibe_rating, language),
                url: appUrl,
              }),
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
    <div className="card card-interactive p-6 space-y-4">
      {/* Header with date and delete */}
      <div className="flex justify-between items-start">
        <div>
          <p className="eyebrow">{formatDate(brew.created_at)}</p>
          <h3 className="text-xl font-display font-bold text-ink mt-1.5">
            {hasMix ? describeMix(brew.mix!) : brew.bean?.name}
          </h3>
          {hasMix && mixShare !== null && (
            <p className="text-xs text-muted">{t('feat.mix_overall', { arabica: mixShare, robusta: 100 - mixShare })}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span title={getVibeName(brew.vibe_rating, language)} className="text-accent-ink px-1">
            <VibeIcon rating={brew.vibe_rating} className="w-6 h-6" />
          </span>
          <Link
            href={`/brew/${brew.id}/edit`}
            className="p-2 hover:bg-line rounded transition text-accent-ink"
            title={t('feat.edit_brew')}
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <Link
            href={`/brew?from=${brew.id}`}
            className="p-2 hover:bg-line rounded transition text-accent-ink"
            title={t('feat.brew_again')}
          >
            <Copy className="w-4 h-4" />
          </Link>
          <button
            onClick={copyPublicLink}
            className="p-2 hover:bg-line rounded transition text-accent-ink"
            title={linkCopied ? t('feat.link_copied') : t('feat.share_link')}
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          </button>
          {brew.share_token && (
            <button
              onClick={stopSharing}
              className="p-2 hover:bg-line rounded transition text-muted"
              title={t('feat.stop_sharing')}
            >
              <Link2Off className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="p-2 hover:bg-line rounded transition disabled:opacity-50 text-accent-ink"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 hover:bg-line rounded transition disabled:opacity-50 text-accent-ink"
            title={t('brew_card.download_image')}
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
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.bean')}</p>
          {hasMix ? (
            <ul className="text-sm font-medium text-ink space-y-0.5">
              {[...brew.mix!].sort((a, b) => b.percentage - a.percentage).map((c) => (
                <li key={c.bean_id}>
                  {c.percentage}% {c.bean?.name}
                  {c.bean?.bean_type && <span className="text-xs text-muted"> · {c.bean.bean_type}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">
                {brew.bean?.origin ? `${brew.bean.origin} • ` : ''}{translateRoastLevel(brew.bean?.roast_level, t)} {t('brew_card.roast_suffix')}
              </p>
              <p className="text-xs text-muted">
                {brew.bean?.roaster}
                {brew.bean?.bean_type ? ` · ${brew.bean.bean_type}` : ''}
              </p>
            </>
          )}
        </div>

        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.grinder')}</p>
          <p className="text-sm font-medium text-ink">
            {brew.grinder_id ? (
              <>
                <span className="num">{brew.grinder_setting}</span> {t('brew_card.clicks')}
                {brew.grinder?.microns_per_click && (
                  <span className="text-xs text-muted ml-1">
                    (<span className="num">{brew.grinder_setting! * brew.grinder.microns_per_click}μm</span>)
                  </span>
                )}
              </>
            ) : (
              t('brew_form.pre_ground')
            )}
          </p>
          <p className="text-xs text-muted">
            {brew.grinder_id ? `${brew.grinder?.brand} ${brew.grinder?.model}` : t('brew_card.no_grinder_used')}
          </p>
        </div>

        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.moka_pot')}</p>
          <p className="text-sm font-medium text-ink">
            {brew.moka_pot ? mokaPotName(brew.moka_pot) : ''} ({t('moka_form.cup_count', { count: brew.moka_pot?.size_cups ?? 0 })})
          </p>
        </div>

        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.vibe')}</p>
          <p className="text-sm font-medium text-accent-ink">
            <span className="num">{brew.vibe_rating}/10</span> — {getVibeName(brew.vibe_rating, language)}
          </p>
        </div>
      </div>

      {/* Measurements */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-tile-strong p-3 text-center">
          <p className="eyebrow">{t('brew_card.coffee')}</p>
          <p className="num text-lg font-medium text-ink">{brew.coffee_weight_g}g</p>
        </div>
        <div className="stat-tile-strong p-3 text-center">
          <p className="eyebrow">{t('brew_card.water_in')}</p>
          <p className="num text-lg font-medium text-ink">{brew.water_added_g}g</p>
        </div>
        <div className="stat-tile-strong p-3 text-center">
          <p className="eyebrow">{t('brew_card.yield')}</p>
          <p className="num text-lg font-medium text-ink">{brew.final_yield_g}g</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.brew_ratio')}</p>
          <p className="num text-sm font-medium text-ink">
            1:{brew.brew_ratio_input?.toFixed(2)}
          </p>
        </div>
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.extraction')}</p>
          <p className="num text-sm font-medium text-ink">
            1:{brew.extraction_ratio_output?.toFixed(2)}
          </p>
        </div>
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.time')}</p>
          <p className="num text-sm font-medium text-ink">{brew.extraction_time_s}s</p>
        </div>
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.style')}</p>
          <p className="text-sm font-semibold text-ink">
            {brew.milk_added_g ? `${translateMilkType(brew.milk_type, t)} (${brew.milk_added_g}g)` : t('brew_card.black')}
          </p>
        </div>
      </div>

      {/* Expert Metrics Display */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-line/50">
        <div className="chip">
          <Thermometer className="w-3.5 h-3.5" /> {translateStoredExpertValue(brew.water_temp, t, 'Boiling')}
        </div>
        <div className="chip">
          <Flame className="w-3.5 h-3.5" /> {translateStoredExpertValue(brew.heat_level, t, 'Medium-Low')}
        </div>
        <div className="chip">
          <Waves className="w-3.5 h-3.5" /> {translateStoredExpertValue(brew.flow_type, t, 'Steady')}
        </div>
        {brew.has_paper_filter && (
          <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded flex items-center gap-1 border border-blue-800/30">
            <FileText className="w-3.5 h-3.5" /> {t('brew_card.paper_filter')}
          </div>
        )}
      </div>

      {/* Tasting Notes */}
      {brew.tasting_notes && (
        <div className="stat-tile p-3">
          <p className="eyebrow mb-1.5">{t('brew_card.notes')}</p>
          <p className="text-sm text-ink">{brew.tasting_notes}</p>
        </div>
      )}

      {/* AI Recap */}
      {brew.ai_recap && (
        <div className="rounded-lg p-4 border border-line border-l-[3px] border-l-accent bg-canvas">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent-ink" />
            <h4 className="eyebrow !text-accent-ink">{t('brew_card.brew_master_recap')}</h4>
          </div>
          {(() => {
            let summary = brew.ai_recap
            let suggestion = ''
            try {
              const parsed = JSON.parse(brew.ai_recap)
              summary = parsed.summary || parsed.suggestion || brew.ai_recap
              suggestion = parsed.summary ? parsed.suggestion || '' : ''
            } catch {
              // Old-style plain string recap
            }
            return (
              <div className="space-y-2">
                <p className="text-sm text-ink italic">&ldquo;{summary}&rdquo;</p>
                {suggestion && (
                  <p className="text-sm text-accent-ink">
                    <span className="font-semibold">{t('dashboard.next_brew_guide')}: </span>
                    {suggestion}
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Hidden Share Template */}
      <div className="fixed -left-[4000px] -top-[4000px]">
        <BrewShareTemplate brew={brew} ref={shareRef} />
      </div>
    </div>
  )
}
