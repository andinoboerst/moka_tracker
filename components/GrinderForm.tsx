'use client'

import { useState } from 'react'
import { Grinder } from '@/lib/types'
import { X } from 'lucide-react'

interface GrinderFormProps {
  onSubmit: (grinder: Omit<Grinder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading: boolean
}

export default function GrinderForm({ onSubmit, isLoading }: GrinderFormProps) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      await onSubmit(formData)
      setFormData({ brand: '', model: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add grinder')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-[#d4a574]">Add New Grinder</h3>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded flex items-center justify-between">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          Grinder added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Brand
        </label>
        <input
          type="text"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          placeholder="e.g., Baratza"
          required
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Model
        </label>
        <input
          type="text"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="e.g., Encore"
          required
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-medium py-2 rounded transition"
      >
        {isLoading ? 'Adding...' : 'Add Grinder'}
      </button>
    </form>
  )
}
