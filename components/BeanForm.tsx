'use client'

import { useState } from 'react'
import { Bean } from '@/lib/types'
import { X } from 'lucide-react'

interface BeanFormProps {
  onSubmit: (bean: Omit<Bean, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading: boolean
}

export default function BeanForm({ onSubmit, isLoading }: BeanFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    roast_level: 'Medium',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      await onSubmit(formData)
      setFormData({ name: '', roaster: '', roast_level: 'Medium' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bean')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-[#d4a574]">Add New Bean</h3>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded flex items-center justify-between">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          Bean added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Bean Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Ethiopian Yirgacheffe"
          required
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Roaster
        </label>
        <input
          type="text"
          value={formData.roaster}
          onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
          placeholder="e.g., Blue Bottle Coffee"
          required
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] placeholder-[#8b6f47] focus:outline-none focus:border-[#d4a574]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-1">
          Roast Level
        </label>
        <select
          value={formData.roast_level}
          onChange={(e) => setFormData({ ...formData, roast_level: e.target.value })}
          className="w-full bg-[#1a1410] border border-[#5a4f4a] rounded px-3 py-2 text-[#f5f1ed] focus:outline-none focus:border-[#d4a574]"
        >
          <option>Light</option>
          <option>Medium</option>
          <option>Dark</option>
          <option>French</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#d4a574] hover:bg-[#c49464] disabled:opacity-50 text-[#1a1410] font-medium py-2 rounded transition"
      >
        {isLoading ? 'Adding...' : 'Add Bean'}
      </button>
    </form>
  )
}
