'use client'

import { useState, useEffect } from 'react'
import { Grinder } from '@/lib/types'
import { X, Save, Plus } from 'lucide-react'

interface GrinderFormProps {
  onSubmit: (grinder: any) => Promise<void>
  isLoading: boolean
  initialData?: Grinder | null
  onCancel?: () => void
}

export default function GrinderForm({ onSubmit, isLoading, initialData, onCancel }: GrinderFormProps) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    microns_per_click: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand,
        model: initialData.model,
        microns_per_click: initialData.microns_per_click?.toString() || '',
      })
    } else {
      setFormData({ brand: '', model: '', microns_per_click: '' })
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
        setFormData({ brand: '', model: '', microns_per_click: '' })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grinder')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-[#2d2520] border ${initialData ? 'border-[#d4a574]' : 'border-[#3d3530]'} rounded-lg p-6 space-y-4`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#d4a574]">
          {initialData ? 'Edit Grinder' : 'Add New Grinder'}
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
          Grinder saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">Brand</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="e.g., Comandante"
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">Model</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="e.g., C40 MK4"
            required
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
            Microns per Click <span className="text-[#8b6f47] font-normal italic">(optional)</span>
          </label>
          <input
            type="number"
            value={formData.microns_per_click}
            onChange={(e) => setFormData({ ...formData, microns_per_click: e.target.value })}
            placeholder="e.g., 30"
            className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
          />
          <p className="text-xs text-[#8b6f47] mt-1">Used to calculate total grind size for easy comparisons.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-bold py-2 rounded transition flex items-center justify-center gap-2"
      >
        {initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {isLoading ? 'Saving...' : initialData ? 'Update Grinder' : 'Add Grinder'}
      </button>
    </form>
  )
}
