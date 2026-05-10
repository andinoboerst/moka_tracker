'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bean, Grinder, MokaPot, BrewCreateInput } from '@/lib/types'
import { calculateBrewRatio, calculateExtractionRatio } from '@/lib/utils'
import { X } from 'lucide-react'

interface BrewFormProps {
  beans: Bean[]
  grinders: Grinder[]
  mokaPots: MokaPot[]
  onSubmit: (brew: BrewCreateInput) => Promise<void>
  isLoading: boolean
}

export default function BrewForm({
  beans,
  grinders,
  mokaPots,
  onSubmit,
  isLoading,
}: BrewFormProps) {
  const [formData, setFormData] = useState({
    bean_id: '',
    grinder_id: '',
    moka_pot_id: '',
    grinder_setting: '',
    coffee_weight_g: '',
    water_added_g: '',
    final_yield_g: '',
    extraction_time_s: '',
    milk_added_g: '',
    milk_type: 'Whole Milk',
    vibe_rating: '7',
    tasting_notes: '',
    water_temp: 'Boiling',
    heat_level: 'Medium-Low',
    has_paper_filter: false,
    flow_type: 'Steady',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Filter for active beans only
  const activeBeans = useMemo(() => beans.filter(b => b.is_active !== false), [beans])

  const isBeanPreGround = useMemo(() => {
    const selectedBean = beans.find(b => b.id === formData.bean_id)
    return selectedBean?.is_pre_ground === true
  }, [beans, formData.bean_id])

  // Consolidated auto-selection and pre-ground logic
  useEffect(() => {
    setFormData(prev => {
      const selectedBeanId = prev.bean_id || (activeBeans[0]?.id ?? '')
      const selectedBean = beans.find(b => b.id === selectedBeanId)
      const isPreGround = selectedBean?.is_pre_ground === true

      // We want to re-select a grinder if:
      // 1. No grinder is currently selected AND it's not pre-ground
      // 2. We just switched from a pre-ground bean to a whole bean
      const needsGrinder = !isPreGround && (!prev.grinder_id || prev.grinder_id === '')

      return {
        ...prev,
        bean_id: selectedBeanId,
        grinder_id: isPreGround ? '' : (needsGrinder ? (grinders[0]?.id ?? '') : prev.grinder_id),
        moka_pot_id: prev.moka_pot_id || (mokaPots[0]?.id ?? ''),
      }
    })
  }, [activeBeans, grinders, mokaPots, beans, formData.bean_id])

  // Auto-calculated values
  const brewRatio = useMemo(() => {
    if (formData.coffee_weight_g && formData.water_added_g) {
      return calculateBrewRatio(
        parseFloat(formData.coffee_weight_g),
        parseFloat(formData.water_added_g)
      )
    }
    return 0
  }, [formData.coffee_weight_g, formData.water_added_g])

  const extractionRatio = useMemo(() => {
    if (formData.coffee_weight_g && formData.final_yield_g) {
      return calculateExtractionRatio(
        parseFloat(formData.coffee_weight_g),
        parseFloat(formData.final_yield_g)
      )
    }
    return 0
  }, [formData.coffee_weight_g, formData.final_yield_g])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      await onSubmit({
        bean_id: formData.bean_id,
        grinder_id: formData.grinder_id || undefined,
        moka_pot_id: formData.moka_pot_id,
        grinder_setting: formData.grinder_id ? parseInt(formData.grinder_setting) : undefined,
        coffee_weight_g: parseFloat(formData.coffee_weight_g),
        water_added_g: parseFloat(formData.water_added_g),
        final_yield_g: parseFloat(formData.final_yield_g),
        extraction_time_s: parseInt(formData.extraction_time_s),
        milk_added_g: formData.milk_added_g ? parseFloat(formData.milk_added_g) : undefined,
        milk_type: formData.milk_added_g ? formData.milk_type : undefined,
        vibe_rating: parseInt(formData.vibe_rating),
        tasting_notes: formData.tasting_notes,
        water_temp: formData.water_temp,
        heat_level: formData.heat_level,
        has_paper_filter: formData.has_paper_filter,
        flow_type: formData.flow_type,
      })
      setFormData({
        bean_id: '',
        grinder_id: '',
        moka_pot_id: '',
        grinder_setting: '',
        coffee_weight_g: '',
        water_added_g: '',
        final_yield_g: '',
        extraction_time_s: '',
        milk_added_g: '',
        milk_type: 'Whole Milk',
        vibe_rating: '7',
        tasting_notes: '',
        water_temp: 'Boiling',
        heat_level: 'Medium-Low',
        has_paper_filter: false,
        flow_type: 'Steady',
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brew')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 space-y-6"
    >
      <h2 className="text-3xl font-serif font-bold text-[#d4a574]">The Daily Ritual (Log Brew)</h2>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded flex items-center justify-between">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          Brew logged and recap generated! 🎉
        </div>
      )}

      {/* Inventory Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Bean
          </label>
          <select
            value={formData.bean_id}
            onChange={(e) => setFormData({ ...formData, bean_id: e.target.value })}
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="">Select your beans...</option>
            {activeBeans.map((bean) => (
              <option key={bean.id} value={bean.id}>
                {bean.name} ({bean.roast_level})
              </option>
            ))}
          </select>
        </div>

        {!isBeanPreGround && (
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
              Grinder
            </label>
            <select
              value={formData.grinder_id}
              onChange={(e) => setFormData({ ...formData, grinder_id: e.target.value })}
              required
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="">None (Pre-ground)</option>
              {grinders.map((grinder) => (
                <option key={grinder.id} value={grinder.id}>
                  {grinder.brand} {grinder.model}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            The Moka
          </label>
          <select
            value={formData.moka_pot_id}
            onChange={(e) => setFormData({ ...formData, moka_pot_id: e.target.value })}
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="">Select your moka...</option>
            {mokaPots.map((pot) => (
              <option key={pot.id} value={pot.id}>
                {pot.brand} {pot.model} ({pot.size_cups} Cup)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Brew Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.grinder_id && !isBeanPreGround && (
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
              Grinder Setting (clicks)
            </label>
            <input
              type="number"
              value={formData.grinder_setting}
              onChange={(e) => setFormData({ ...formData, grinder_setting: e.target.value })}
              placeholder="e.g., 15"
              required
              min="0"
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Coffee Weight (g)
          </label>
          <input
            type="number"
            value={formData.coffee_weight_g}
            onChange={(e) => setFormData({ ...formData, coffee_weight_g: e.target.value })}
            placeholder="e.g., 18"
            required
            min="0"
            step="0.1"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Water in Boiler (g)
          </label>
          <input
            type="number"
            value={formData.water_added_g}
            onChange={(e) => setFormData({ ...formData, water_added_g: e.target.value })}
            placeholder="e.g., 36"
            required
            min="0"
            step="0.1"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Final Yield (g)
          </label>
          <input
            type="number"
            value={formData.final_yield_g}
            onChange={(e) => setFormData({ ...formData, final_yield_g: e.target.value })}
            placeholder="e.g., 32"
            required
            min="0"
            step="0.1"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Extraction Time (s)
          </label>
          <input
            type="number"
            value={formData.extraction_time_s}
            onChange={(e) => setFormData({ ...formData, extraction_time_s: e.target.value })}
            placeholder="e.g., 45"
            required
            min="0"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Milk Added (Latte Aggiunto) (g) - <span className="text-[#8b6f47] font-normal italic">Leave empty for black coffee</span>
          </label>
          <input
            type="number"
            value={formData.milk_added_g}
            onChange={(e) => setFormData({ ...formData, milk_added_g: e.target.value })}
            placeholder="e.g., 50"
            min="0"
            step="0.1"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        {parseFloat(formData.milk_added_g) > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
              Milk Type
            </label>
            <select
              value={formData.milk_type}
              onChange={(e) => setFormData({ ...formData, milk_type: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Whole Milk">Whole Milk</option>
              <option value="Semi-skimmed">Semi-skimmed</option>
              <option value="Skimmed">Skimmed</option>
              <option value="Oat Milk">Oat Milk</option>
              <option value="Almond Milk">Almond Milk</option>
              <option value="Soy Milk">Soy Milk</option>
              <option value="Coconut Milk">Coconut Milk</option>
              <option value="Cashew Milk">Cashew Milk</option>
              <option value="Pea Milk">Pea Milk</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}
      </div>

      {/* Expert Variables */}
      <div className="p-6 bg-[#1a1410]/50 border border-[#3d3530] rounded-lg space-y-6">
        <h3 className="text-lg font-serif font-bold text-[#d4a574] flex items-center gap-2">
          <span className="text-xl">🔬</span> Expert Variables
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">Starting Water Temp</label>
            <select
              value={formData.water_temp}
              onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Boiling">Boiling (90-100°C)</option>
              <option value="Warm">Warm (50-80°C)</option>
              <option value="Cold">Cold (Tap)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">Heat Intensity</label>
            <select
              value={formData.heat_level}
              onChange={(e) => setFormData({ ...formData, heat_level: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Low">Low (Gentle)</option>
              <option value="Medium-Low">Medium-Low (Standard)</option>
              <option value="Medium">Medium (Fast)</option>
              <option value="High">High (Aggressive)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">Flow Observation</label>
            <select
              value={formData.flow_type}
              onChange={(e) => setFormData({ ...formData, flow_type: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Honey-like">Honey-like (Perfect)</option>
              <option value="Steady">Steady (Good)</option>
              <option value="Sputtering">Sputtering (Too fast/Hot)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="has_paper_filter"
              checked={formData.has_paper_filter}
              onChange={(e) => setFormData({ ...formData, has_paper_filter: e.target.checked })}
              className="w-4 h-4 rounded border-[#5a4f4a] bg-[#1a1410] text-[#d4a574] focus:ring-[#d4a574]"
            />
            <label htmlFor="has_paper_filter" className="text-sm font-medium text-[#f5f1ed]">
              Used Paper Filter (AeroPress hack)
            </label>
          </div>
        </div>
      </div>

      {/* Auto-Calculated Ratios */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-[#3d3530] rounded border border-[#5a4f4a]">
        <div>
          <p className="text-sm text-[#8b6f47] mb-1">Brew Ratio (Coffee : Water)</p>
          <p className="text-lg font-semibold text-[#d4a574]">
            {brewRatio ? `1:${brewRatio.toFixed(2)}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#8b6f47] mb-1">Extraction Ratio (Coffee : Yield)</p>
          <p className="text-lg font-semibold text-[#d4a574]">
            {extractionRatio ? `1:${extractionRatio.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>

      {/* Rating and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
            Vibe Rating: {formData.vibe_rating}/10 — {getVibeName(parseInt(formData.vibe_rating))} {getVibeEmoji(parseInt(formData.vibe_rating))}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.vibe_rating}
            onChange={(e) => setFormData({ ...formData, vibe_rating: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Tasting Notes
          </label>
          <textarea
            value={formData.tasting_notes}
            onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
            placeholder="e.g., Smooth, chocolatey, hint of caramel. Could be slightly sweeter..."
            rows={3}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-bold py-3 rounded transition text-lg"
      >
        {isLoading ? 'Saving...' : 'Save the Coffee! ☕'}
      </button>
    </form>
  )
}

function getVibeEmoji(rating: number): string {
  if (rating <= 2) return '🫠'
  if (rating <= 4) return '🤷‍♂️'
  if (rating <= 6) return '☕'
  if (rating <= 8) return '🇮🇹'
  return '🤌'
}

function getVibeName(rating: number): string {
  if (rating <= 2) return 'Mamma Mia...'
  if (rating <= 4) return 'Così così'
  if (rating <= 6) return 'Bene'
  if (rating <= 8) return 'Bellissimo'
  return 'Ottimo!'
}
