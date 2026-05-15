'use client'

import { useState, useEffect } from 'react'
import { MokaPot } from '@/lib/types'
import { X, Save, Plus } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface MokaPotFormProps {
  onSubmit: (mokaPot: any) => Promise<void>
  isLoading: boolean
  initialData?: MokaPot | null
  onCancel?: () => void
}

export default function MokaPotForm({ onSubmit, isLoading, initialData, onCancel }: MokaPotFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    type: 'Stovetop',
    size_cups: 2,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand,
        model: initialData.model,
        type: initialData.type,
        size_cups: initialData.size_cups,
      })
    } else {
      setFormData({ brand: '', model: '', type: 'Stovetop', size_cups: 2 })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      const payload = initialData ? { ...formData, id: initialData.id } : formData
      await onSubmit(payload)
      if (!initialData) {
        setFormData({ brand: '', model: '', type: 'Stovetop', size_cups: 2 })
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
      className={`bg-[#2d2520] border ${initialData ? 'border-[#d4a574]' : 'border-[#3d3530]'} rounded-lg p-6 space-y-4`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#d4a574]">
          {initialData ? t('moka_form.edit_title') : t('moka_form.add_title')}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[#8b6f47] hover:text-[#f5f1ed]">
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
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('moka_form.brand')}</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            placeholder="e.g., Bialetti"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('moka_form.model')}</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
            placeholder="e.g., Venus"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('moka_form.type')}</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="Stovetop">Stovetop</option>
            <option value="Electric">Electric</option>
            <option value="Induction">Induction</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('moka_form.size')}</label>
          <select
            value={formData.size_cups}
            onChange={(e) => setFormData({ ...formData, size_cups: parseInt(e.target.value) })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
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
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-bold py-2 rounded transition flex items-center justify-center gap-2"
      >
        {initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {isLoading ? t('common.saving') : t('common.save')}
      </button>
    </form>
  )
}
