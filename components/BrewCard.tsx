'use client'

import { Brew } from '@/lib/types'
import { getVibeEmoji, formatDate } from '@/lib/utils'
import { Trash2, Sparkles } from 'lucide-react'

interface BrewCardProps {
  brew: Brew
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
}

export default function BrewCard({ brew, onDelete, isDeleting }: BrewCardProps) {
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
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getVibeEmoji(brew.vibe_rating)}</span>
          <button
            onClick={() => onDelete(brew.id)}
            disabled={isDeleting}
            className="p-2 hover:bg-red-900/30 rounded transition disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Brew Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Bean</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.bean?.roast_level} Roast
          </p>
          <p className="text-xs text-[#8b6f47]">{brew.bean?.roaster}</p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Grinder</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.grinder_setting} clicks
          </p>
          <p className="text-xs text-[#8b6f47]">
            {brew.grinder?.brand} {brew.grinder?.model}
          </p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Moka Pot</p>
          <p className="text-sm font-medium text-[#f5f1ed]">
            {brew.moka_pot?.brand} {brew.moka_pot?.model} ({brew.moka_pot?.size_cups} Cup)
          </p>
        </div>

        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Vibe Rating</p>
          <p className="text-sm font-medium text-[#d4a574]">
            {brew.vibe_rating}/10
          </p>
        </div>
      </div>

      {/* Measurements */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">Coffee</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.coffee_weight_g}g</p>
        </div>
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">Water In</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.water_added_g}g</p>
        </div>
        <div className="bg-[#3d3530] rounded p-3 text-center">
          <p className="text-xs text-[#8b6f47]">Yield</p>
          <p className="text-lg font-semibold text-[#d4a574]">{brew.final_yield_g}g</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Brew Ratio</p>
          <p className="text-sm font-semibold text-[#d4a574]">
            1:{brew.brew_ratio_input?.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Extraction</p>
          <p className="text-sm font-semibold text-[#d4a574]">
            1:{brew.extraction_ratio_output?.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Time</p>
          <p className="text-sm font-semibold text-[#f5f1ed]">{brew.extraction_time_s}s</p>
        </div>
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Style</p>
          <p className="text-sm font-semibold text-[#f5f1ed]">
            {brew.milk_added_g ? `Milk (${brew.milk_added_g}g)` : 'Black'}
          </p>
        </div>
      </div>

      {/* Tasting Notes */}
      {brew.tasting_notes && (
        <div className="bg-[#1a1410] rounded p-3">
          <p className="text-xs text-[#8b6f47] mb-1">Notes</p>
          <p className="text-sm text-[#f5f1ed]">{brew.tasting_notes}</p>
        </div>
      )}

      {/* AI Recap */}
      {brew.ai_recap && (
        <div className="bg-gradient-to-r from-[#5a4f4a] to-[#3d3530] rounded p-4 border border-[#d4a574]/20">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-[#d4a574] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#d4a574] font-semibold mb-1">Brew Master Recap</p>
              <p className="text-sm text-[#f5f1ed]">
                {(() => {
                  try {
                    const parsed = JSON.parse(brew.ai_recap);
                    return parsed.summary || brew.ai_recap;
                  } catch (e) {
                    return brew.ai_recap;
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
