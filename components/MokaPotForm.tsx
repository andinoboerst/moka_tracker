'use client'

import { useState } from 'react'
import { MokaPot } from '@/lib/types'
import { X } from 'lucide-react'

interface MokaPotFormProps {
  onSubmit: (mokaPot: Omit<MokaPot, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading: boolean
}

export default function MokaPotForm({ onSubmit, isLoading }: MokaPotFormProps) {
  const [formData, setFormData] = useState({
    size_cups: 3,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      await onSubmit(formData)
      setFormData({ size_cups: 3 })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add moka pot')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-[#d4a574]">Add New Moka Pot</h3>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded flex items-center justify-between">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          Moka pot added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Size (Cups)
        </label>
        <select
          value={formData.size_cups}
          onChange={(e) => setFormData({ ...formData, size_cups: parseInt(e.target.value) })}
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
        >
          <option value={1}>1 Cup</option>
          <option value={3}>3 Cups</option>
          <option value={6}>6 Cups</option>
          <option value={9}>9 Cups</option>
          <option value={12}>12 Cups</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-medium py-2 rounded transition"
      >
        {isLoading ? 'Adding...' : 'Add Moka Pot'}
      </button>
    </form>
  )
}
