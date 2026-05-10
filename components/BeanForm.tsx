'use client'

import { useState, useEffect } from 'react'
import { Bean } from '@/lib/types'
import { X, Save, Plus } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface BeanFormProps {
  onSubmit: (bean: any) => Promise<void>
  isLoading: boolean
  initialData?: Bean | null
  onCancel?: () => void
}

export default function BeanForm({ onSubmit, isLoading, initialData, onCancel }: BeanFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    roast_level: 'Medium',
    roast_date: '',
    weight_g: '',
    is_active: true,
    is_pre_ground: false,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        roaster: initialData.roaster,
        roast_level: initialData.roast_level,
        roast_date: initialData.roast_date || '',
        weight_g: initialData.weight_g?.toString() || '',
        is_active: initialData.is_active !== false,
        is_pre_ground: initialData.is_pre_ground === true,
      })
    } else {
      setFormData({
        name: '',
        roaster: '',
        roast_level: 'Medium',
        roast_date: '',
        weight_g: '',
        is_active: true,
        is_pre_ground: false,
      })
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
        setFormData({
          name: '',
          roaster: '',
          roast_level: 'Medium',
          roast_date: '',
          weight_g: '',
          is_active: true,
          is_pre_ground: false,
        })
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
      className={`bg-[#2d2520] border ${initialData ? 'border-[#d4a574]' : 'border-[#3d3530]'} rounded-lg p-6 space-y-4`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#d4a574]">
          {initialData ? t('bean_form.edit_title') : t('bean_form.add_title')}
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
          {t('bean_form.success')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('bean_form.name')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Yirgacheffe"
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('bean_form.roaster')}</label>
          <input
            type="text"
            value={formData.roaster}
            onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
            placeholder="e.g., Blue Bottle"
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('bean_form.roast_level')}</label>
          <select
            value={formData.roast_level}
            onChange={(e) => setFormData({ ...formData, roast_level: e.target.value })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          >
            <option value="Light">{t('bean_form.light')}</option>
            <option value="Medium">{t('bean_form.medium')}</option>
            <option value="Dark">{t('bean_form.dark')}</option>
            <option value="French">French</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('bean_form.roast_date')}</label>
          <input
            type="date"
            value={formData.roast_date}
            onChange={(e) => setFormData({ ...formData, roast_date: e.target.value })}
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">{t('bean_form.weight')}</label>
          <input
            type="number"
            value={formData.weight_g}
            onChange={(e) => setFormData({ ...formData, weight_g: e.target.value })}
            placeholder="e.g., 250"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-[#5a4f4a] bg-[#1a1410] text-[#d4a574] focus:ring-[#d4a574]"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-[#f5f1ed]">
            {t('bean_form.is_active')}
          </label>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_pre_ground"
            checked={formData.is_pre_ground}
            onChange={(e) => setFormData({ ...formData, is_pre_ground: e.target.checked })}
            className="w-4 h-4 rounded border-[#5a4f4a] bg-[#1a1410] text-[#d4a574] focus:ring-[#d4a574]"
          />
          <label htmlFor="is_pre_ground" className="text-sm font-medium text-[#f5f1ed]">
            {t('bean_form.is_pre_ground')}
          </label>
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
