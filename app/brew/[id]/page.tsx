'use client'

import { useEffect, useState } from 'react'
import { Brew } from '@/lib/types'
import BrewShareTemplate from '@/components/BrewShareTemplate'
import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import { getVibeName, getAuthHeaders } from '@/lib/utils'

export default function BrewSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { language, t } = useLanguage()
  const [brew, setBrew] = useState<Brew | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const [paramsId, setParamsId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setParamsId(id)
    })
  }, [params])

  useEffect(() => {
    if (!paramsId) return

    const fetchBrew = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/brews/${paramsId}`, { headers })
        if (!response.ok) throw new Error('Brew not found')
        const data = await response.json()
        setBrew(data)
      } catch (err) {
        console.error('Failed to fetch brew:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBrew()
  }, [paramsId])

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
      const link = document.createElement('a')
      link.download = `moka-brew-${brew?.created_at.split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!shareRef.current || !brew) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(shareRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1920,
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `moka-brew-${brew.created_at.split('T')[0]}.png`, { type: 'image/png' })

      const brewUrl = `https://mokatracker.com`

      if (navigator.share && navigator.canShare) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Moka Tracker - ${brew.bean?.name || 'Brew'}`,
              text: t('brew_card.share_message', {
                vibe: getVibeName(brew.vibe_rating, language),
                url: brewUrl,
              }),
              files: [file],
            })
            return
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Share cancelled')
            return
          }
          console.error('Web Share failed:', err)
        }
      }
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">{t('brew_share_page.loading')}</p>
      </div>
    )
  }

  if (!brew) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">{t('brew_share_page.not_found')}</h1>
        <Link href="/brew" className="text-accent hover:underline">
          {t('brew_share_page.back_to_brews')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/brew"
            className="flex items-center gap-2 text-accent hover:text-ink transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('brew_share_page.back')}
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-canvas rounded-lg hover:bg-accent-hover transition disabled:opacity-50 font-medium"
            >
              <Share2 className="w-4 h-4" />
              {t('common.share')}
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-line text-accent rounded-lg hover:bg-line transition disabled:opacity-50 font-medium"
            >
              <Download className="w-4 h-4" />
              {t('brew_share_page.download')}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="scale-50 origin-top-left -ml-[540px]">
            <BrewShareTemplate brew={brew} ref={shareRef} />
          </div>
        </div>

        <div className="mt-8 p-6 card">
          <h2 className="text-2xl font-bold text-accent mb-4">{t('brew_share_page.title')}</h2>
          <div className="space-y-4 text-ink">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('brew_share_page.on_mobile')}</h3>
              <ol className="space-y-2 ml-4 list-decimal">
                <li>{t('brew_share_page.mobile_step_1')}</li>
                <li>{t('brew_share_page.mobile_step_2')}</li>
                <li>{t('brew_share_page.mobile_step_3')}</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('brew_share_page.on_desktop')}</h3>
              <ol className="space-y-2 ml-4 list-decimal">
                <li>{t('brew_share_page.desktop_step_1')}</li>
                <li>{t('brew_share_page.desktop_step_2')}</li>
              </ol>
            </div>
            <div className="pt-4 border-t border-line">
              <p className="text-sm text-muted italic">
                {t('brew_share_page.share_tip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
