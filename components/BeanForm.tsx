'use client'

import { useState } from 'react'
import { Bean } from '@/lib/types'
import { X, Save, Plus } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export interface BeanFormData {
  name: string
  roaster: string
  roast_level: string
  roast_date: string
  origin: string
  weight_g: string
  is_active: boolean
  is_pre_ground: boolean
  bean_type: string
  arabica_percent: string
  tasting_notes: string
}

export type BeanFormPayload = BeanFormData & { id?: string }

const emptyBeanForm: BeanFormData = {
  name: '',
  roaster: '',
  roast_level: 'Medium',
  roast_date: '',
  origin: '',
  weight_g: '',
  is_active: true,
  is_pre_ground: false,
  bean_type: '',
  arabica_percent: '',
  tasting_notes: '',
}

function beanToFormData(bean?: Bean | null): BeanFormData {
  if (!bean) return emptyBeanForm
  return {
    name: bean.name,
    roaster: bean.roaster,
    roast_level: bean.roast_level,
    roast_date: bean.roast_date || '',
    origin: bean.origin || '',
    weight_g: bean.weight_g?.toString() || '',
    is_active: bean.is_active !== false,
    is_pre_ground: bean.is_pre_ground === true,
    bean_type: bean.bean_type || '',
    arabica_percent: bean.arabica_percent?.toString() || '',
    tasting_notes: bean.tasting_notes || '',
  }
}

interface BeanFormProps {
  onSubmit: (bean: BeanFormPayload) => Promise<void>
  isLoading: boolean
  /** Changing the `key` of this component resets the form to the new initialData. */
  initialData?: Bean | null
  onCancel?: () => void
}

export default function BeanForm({ onSubmit, isLoading, initialData, onCancel }: BeanFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<BeanFormData>(() => beanToFormData(initialData))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      const payload = initialData ? { ...formData, id: initialData.id } : formData
      await onSubmit(payload)
      if (!initialData) {
        setFormData(emptyBeanForm)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bean')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-surface border ${initialData ? 'border-accent' : 'border-line'} rounded-lg p-6 space-y-4`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-accent-ink">
          {initialData ? t('bean_form.edit_title') : t('bean_form.add_title')}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded flex items-center justify-between">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          {t('bean_form.success')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.name')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Yirgacheffe"
            required
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.roaster')}</label>
          <input
            type="text"
            value={formData.roaster}
            onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
            placeholder="e.g., Blue Bottle"
            required
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.roast_level')}</label>
          <select
            value={formData.roast_level}
            onChange={(e) => setFormData({ ...formData, roast_level: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          >
            <option value="Light">{t('bean_form.light')}</option>
            <option value="Medium">{t('bean_form.medium')}</option>
            <option value="Dark">{t('bean_form.dark')}</option>
            <option value="French">{t('bean_form.french')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.bean_type')}</label>
          <select
            value={formData.bean_type}
            onChange={(e) => setFormData({ ...formData, bean_type: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          >
            <option value="">{t('bean_form.type_unknown')}</option>
            <option value="Arabica">{t('bean_form.type_arabica')}</option>
            <option value="Robusta">{t('bean_form.type_robusta')}</option>
            <option value="Blend">{t('bean_form.type_blend')}</option>
          </select>
        </div>

        {formData.bean_type === 'Blend' && (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.arabica_percent')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.arabica_percent}
              onChange={(e) => setFormData({ ...formData, arabica_percent: e.target.value })}
              placeholder="e.g., 70"
              className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.roast_date')}</label>
          <input
            type="date"
            value={formData.roast_date}
            onChange={(e) => setFormData({ ...formData, roast_date: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.origin')}</label>
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            placeholder={t('bean_form.origin_hint')}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.weight')}</label>
          <input
            type="number"
            value={formData.weight_g}
            onChange={(e) => setFormData({ ...formData, weight_g: e.target.value })}
            placeholder="e.g., 250"
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">{t('bean_form.tasting_notes')}</label>
          <textarea
            value={formData.tasting_notes}
            onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
            placeholder={t('bean_form.tasting_notes_hint')}
            rows={2}
            maxLength={300}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent resize-y"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-line-strong bg-canvas text-accent-ink focus:ring-accent"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-ink">
            {t('bean_form.is_active')}
          </label>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_pre_ground"
            checked={formData.is_pre_ground}
            onChange={(e) => setFormData({ ...formData, is_pre_ground: e.target.checked })}
            className="w-4 h-4 rounded border-line-strong bg-canvas text-accent-ink focus:ring-accent"
          />
          <label htmlFor="is_pre_ground" className="text-sm font-medium text-ink">
            {t('bean_form.is_pre_ground')}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full disabled:opacity-50 py-2 flex items-center justify-center gap-2"
      >
        {initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {isLoading ? t('common.saving') : t('common.save')}
      </button>
    </form>
  )
}
