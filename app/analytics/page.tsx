'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Brew, Bean, Grinder } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import { AnalyticsScatterPlot, AnalyticsLineGraph } from '@/components/AnalyticsChart'
import { ChevronDown, ChevronUp, Star, Clock, Coffee, Thermometer, Flame, Droplets, Filter } from 'lucide-react'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [brews, setBrews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scatterMode, setScatterMode] = useState<'grind' | 'roast'>('grind')
  const [expandedBrew, setExpandedBrew] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/brews', { headers })
      if (response.ok) {
        const data = await response.json()
        setBrews(data)
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Prepare Scatter Plot Data
  const scatterData = brews
    .filter(b => b.vibe_rating !== undefined)
    .filter(b => {
      if (scatterMode === 'grind') return b.grinder_id !== null && b.grinder_setting !== null
      if (scatterMode === 'roast') return b.bean?.roast_date !== undefined
      return true
    })
    .map(b => {
      let grindValue = b.grinder_setting
      if (b.grinder?.microns_per_click) {
        grindValue = b.grinder_setting * b.grinder.microns_per_click
      }

      let daysPastRoast = 0
      if (b.bean?.roast_date) {
        const brewDate = new Date(b.created_at)
        const roastDate = new Date(b.bean.roast_date)
        daysPastRoast = Math.max(0, Math.floor((brewDate.getTime() - roastDate.getTime()) / (1000 * 60 * 60 * 24)))
      }

      return {
        rating: b.vibe_rating,
        grind: grindValue,
        roast: daysPastRoast,
        id: b.id
      }
    })

  // Prepare Line Graph Data (last 10 sessions)
  const lineData = [...brews]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-10)
    .map((b, i) => ({
      index: i + 1,
      time: b.extraction_time_s
    }))

  // Prepare Top 5 Brews
  const topBrews = [...brews]
    .sort((a, b) => {
      if (b.vibe_rating !== a.vibe_rating) {
        return b.vibe_rating - a.vibe_rating
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 5)

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#8b6f47]">{t('dashboard.loading')}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#d4a574] mb-2">
            {t('analytics.title')}
          </h1>
          <p className="text-[#8b6f47] text-lg italic">
            {t('analytics.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Scatter Plot Card */}
          <div className="bg-[#2d2520] border border-[#3d3530] rounded-xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-[#d4a574]">
                {t('analytics.scatter_plot_title')}
              </h2>
              <div className="flex bg-[#1a1410] rounded-lg p-1 border border-[#3d3530]">
                <button
                  onClick={() => setScatterMode('grind')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    scatterMode === 'grind' ? 'bg-[#d4a574] text-[#1a1410]' : 'text-[#8b6f47] hover:text-[#f5f1ed]'
                  }`}
                >
                  {t('analytics.toggle_grind')}
                </button>
                <button
                  onClick={() => setScatterMode('roast')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    scatterMode === 'roast' ? 'bg-[#d4a574] text-[#1a1410]' : 'text-[#8b6f47] hover:text-[#f5f1ed]'
                  }`}
                >
                  {t('analytics.toggle_roast')}
                </button>
              </div>
            </div>
            <AnalyticsScatterPlot 
              data={scatterData} 
              yKey={scatterMode} 
              yLabel={scatterMode === 'grind' ? t('analytics.grind_axis') : t('analytics.roast_axis')}
            />
          </div>

          {/* Line Graph Card */}
          <div className="bg-[#2d2520] border border-[#3d3530] rounded-xl p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-[#d4a574]">
                {t('analytics.line_graph_title')}
              </h2>
              <p className="text-xs text-[#8b6f47]">{t('analytics.line_graph_subtitle')}</p>
            </div>
            <AnalyticsLineGraph data={lineData} />
          </div>
        </div>

        {/* Top 5 Brews Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-serif font-bold text-[#d4a574] mb-1">
              {t('analytics.top_brews_title')}
            </h2>
            <p className="text-[#8b6f47] italic">{t('analytics.top_brews_subtitle')}</p>
          </div>

          <div className="space-y-4">
            {topBrews.map((brew) => (
              <div 
                key={brew.id} 
                className="bg-[#2d2520] border border-[#3d3530] rounded-xl overflow-hidden shadow-lg transition hover:border-[#d4a574]/30"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedBrew(expandedBrew === brew.id ? null : brew.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#1a1410] p-3 rounded-lg border border-[#d4a574]/20">
                      <Star className="w-5 h-5 text-[#d4a574] fill-[#d4a574]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#f5f1ed]">{brew.bean?.name}</h3>
                      <p className="text-xs text-[#8b6f47]">
                        {new Date(brew.created_at).toLocaleDateString()} • {brew.vibe_rating}/10 Vibe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[#8b6f47] uppercase tracking-wider">{t('brew_card.time')}</span>
                      <span className="font-mono text-[#d4a574]">{brew.extraction_time_s}s</span>
                    </div>
                    <button className="text-[#8b6f47] hover:text-[#d4a574] transition">
                      {expandedBrew === brew.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {expandedBrew === brew.id && (
                  <div className="px-4 pb-6 pt-2 border-t border-[#3d3530] bg-[#1a1410]/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Coffee className="w-3 h-3" />
                          <span>{t('brew_card.coffee')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.coffee_weight_g}g</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Droplets className="w-3 h-3" />
                          <span>{t('brew_card.water_in')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.water_added_g}g</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Thermometer className="w-3 h-3" />
                          <span>{t('brew_card.start_temp')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.water_temp}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Flame className="w-3 h-3" />
                          <span>{t('brew_card.heat')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.heat_level}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Clock className="w-3 h-3" />
                          <span>{t('brew_card.flow')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.flow_type}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <Filter className="w-3 h-3" />
                          <span>{t('brew_card.paper_filter')}</span>
                        </div>
                        <p className="font-medium text-[#f5f1ed]">{brew.has_paper_filter ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <div className="flex items-center gap-2 text-[#8b6f47] text-xs uppercase">
                          <span>{t('brew_card.notes')}</span>
                        </div>
                        <p className="text-sm italic text-[#f5f1ed] leading-relaxed">
                          "{brew.tasting_notes || 'No notes'}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
