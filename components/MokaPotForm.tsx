'use client'

import { useState } from 'react'
import { MokaPot } from '@/lib/types'
import { X, Save, Plus } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export interface MokaPotFormData {
  brand: string
  model: string
  nickname: string
  type: string
  size_cups: number
}

export type MokaPotFormPayload = MokaPotFormData & { id?: string }

const emptyMokaPotForm: MokaPotFormData = { brand: '', model: '', nickname: '', type: 'Stovetop', size_cups: 2 }

function mokaPotToFormData(pot?: MokaPot | null): MokaPotFormData {
  if (!pot) return emptyMokaPotForm
  return {
    brand: pot.brand,
    model: pot.model,
    nickname: pot.nickname ?? '',
    type: pot.type,
    size_cups: pot.size_cups,
  }
}

interface MokaPotFormProps {
  onSubmit: (mokaPot: MokaPotFormPayload) => Promise<void>
  isLoading: boolean
  /** Changing the `key` of this component resets the form to the new initialData. */
  initialData?: MokaPot | null
  onCancel?: () => void
}

export default function MokaPotForm({ onSubmit, isLoading, initialData, onCancel }: MokaPotFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<MokaPotFormData>(() => mokaPotToFormData(initialData))
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
        setFormData(emptyMokaPotForm)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save moka pot')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-surface border ${initialData ? 'border-accent' : 'border-line'} rounded-lg p-6 space-y-4`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-accent-ink">
          {initialData ? t('moka_form.edit_title') : t('moka_form.add_title')}
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
          {t('moka_form.success')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('moka_form.brand')}</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
            placeholder="e.g., Bialetti"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('moka_form.model')}</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
            placeholder="e.g., Venus"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">
            {t('moka_form.nickname')} <span className="text-muted font-normal">({t('moka_form.optional')})</span>
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
            placeholder={t('moka_form.nickname_placeholder')}
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('moka_form.type')}</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          >
            <option value="Stovetop">Stovetop</option>
            <option value="Electric">Electric</option>
            <option value="Induction">Induction</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('moka_form.size')}</label>
          <select
            value={formData.size_cups}
            onChange={(e) => setFormData({ ...formData, size_cups: parseInt(e.target.value) })}
            className="w-full bg-canvas border border-line-strong rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          >
            {[1, 2, 3, 4, 6, 9, 12, 18].map((cups) => (
              <option key={cups} value={cups}>
                {t('moka_form.cup_count', { count: cups })}
              </option>
            ))}
          </select>
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
