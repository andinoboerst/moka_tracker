'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bean, Grinder, MokaPot, BrewCreateInput } from '@/lib/types'
import { calculateBrewRatio, calculateExtractionRatio } from '@/lib/utils'
import { X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

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
  const { language, t } = useLanguage()
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
        language,
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
      <h2 className="text-3xl font-serif font-bold text-[#d4a574]">{t('brew_form.title')}</h2>

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
            {t('brew_form.bean')}
          </label>
          <select
            value={formData.bean_id}
            onChange={(e) => setFormData({ ...formData, bean_id: e.target.value })}
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="">{t('brew_form.select_bean')}</option>
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
              {t('brew_form.grinder')}
            </label>
            <select
              value={formData.grinder_id}
              onChange={(e) => setFormData({ ...formData, grinder_id: e.target.value })}
              required
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="">{t('brew_form.pre_ground')}</option>
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
            {t('brew_form.moka_pot')}
          </label>
          <select
            value={formData.moka_pot_id}
            onChange={(e) => setFormData({ ...formData, moka_pot_id: e.target.value })}
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="">{t('brew_form.select_moka')}</option>
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
              {t('brew_form.grinder_setting')}
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
            {t('brew_form.coffee_weight')}
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
            {t('brew_form.water_added')}
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
            {t('brew_form.final_yield')}
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
            {t('brew_form.extraction_time')}
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
            {t('brew_form.milk_added')} - <span className="text-[#8b6f47] font-normal italic">{t('brew_form.milk_hint')}</span>
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
              {t('brew_form.milk_type')}
            </label>
            <select
              value={formData.milk_type}
              onChange={(e) => setFormData({ ...formData, milk_type: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Whole Milk">{t('brew_form.whole_milk') || 'Whole Milk'}</option>
              <option value="Semi-skimmed">{t('brew_form.semi_skimmed') || 'Semi-skimmed'}</option>
              <option value="Skimmed">{t('brew_form.skimmed') || 'Skimmed'}</option>
              <option value="Oat Milk">{t('brew_form.oat_milk') || 'Oat Milk'}</option>
              <option value="Almond Milk">{t('brew_form.almond_milk') || 'Almond Milk'}</option>
              <option value="Soy Milk">{t('brew_form.soy_milk') || 'Soy Milk'}</option>
              <option value="Coconut Milk">{t('brew_form.coconut_milk') || 'Coconut Milk'}</option>
              <option value="Cashew Milk">{t('brew_form.cashew_milk') || 'Cashew Milk'}</option>
              <option value="Pea Milk">{t('brew_form.pea_milk') || 'Pea Milk'}</option>
              <option value="Other">{t('common.none') || 'Other'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Expert Variables */}
      <div className="p-6 bg-[#1a1410]/50 border border-[#3d3530] rounded-lg space-y-6">
        <h3 className="text-lg font-serif font-bold text-[#d4a574] flex items-center gap-2">
          <span className="text-xl">🔬</span> {t('brew_form.expert_variables')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('brew_form.water_temp')}</label>
            <select
              value={formData.water_temp}
              onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Boiling">{t('brew_form.temp_boiling')}</option>
              <option value="Warm">{t('brew_form.temp_warm')}</option>
              <option value="Cold">{t('brew_form.temp_cold')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('brew_form.heat_intensity')}</label>
            <select
              value={formData.heat_level}
              onChange={(e) => setFormData({ ...formData, heat_level: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Low">{t('brew_form.heat_low')}</option>
              <option value="Medium-Low">{t('brew_form.heat_med_low')}</option>
              <option value="Medium">{t('brew_form.heat_med')}</option>
              <option value="High">{t('brew_form.heat_high')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('brew_form.flow_observation')}</label>
            <select
              value={formData.flow_type}
              onChange={(e) => setFormData({ ...formData, flow_type: e.target.value })}
              className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            >
              <option value="Honey-like">{t('brew_form.flow_honey')}</option>
              <option value="Steady">{t('brew_form.flow_steady')}</option>
              <option value="Sputtering">{t('brew_form.flow_sputtering')}</option>
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
              {t('brew_form.paper_filter')}
            </label>
          </div>
        </div>
      </div>

      {/* Auto-Calculated Ratios */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-[#3d3530] rounded border border-[#5a4f4a]">
        <div>
          <p className="text-sm text-[#8b6f47] mb-1">{t('brew_form.brew_ratio')}</p>
          <p className="text-lg font-semibold text-[#d4a574]">
            {brewRatio ? `1:${brewRatio.toFixed(2)}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#8b6f47] mb-1">{t('brew_form.extraction_ratio')}</p>
          <p className="text-lg font-semibold text-[#d4a574]">
            {extractionRatio ? `1:${extractionRatio.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>

      {/* Rating and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
            {t('brew_form.vibe_rating')}: {formData.vibe_rating}/10 — {getVibeName(parseInt(formData.vibe_rating))} {getVibeEmoji(parseInt(formData.vibe_rating))}
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
            {t('brew_form.tasting_notes')}
          </label>
          <textarea
            value={formData.tasting_notes}
            onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
            placeholder={t('brew_form.tasting_hint')}
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
        {isLoading ? t('common.saving') : t('brew_form.save_button')}
      </button>
    </form>
  )

  function getVibeEmoji(rating: number): string {
    if (rating <= 2) return '🫠'
    if (rating <= 4) return '🤷‍♂️'
    if (rating <= 6) return '☕'
    if (rating <= 8) return '🇮🇹'
    return '🤌'
  }

  function getVibeName(rating: number): string {
    if (rating <= 2) return t('dashboard.vibe_low')
    if (rating <= 4) return t('dashboard.vibe_med_low')
    if (rating <= 6) return t('dashboard.vibe_med')
    if (rating <= 8) return t('dashboard.vibe_high')
    return t('dashboard.vibe_max')
  }
}


