'use client'

import { Bean, Grinder, MokaPot } from '@/lib/types'
import { Trash2, Edit2, Package, Scale, Calendar, Zap, ZapOff } from 'lucide-react'

interface InventoryListProps {
  items: Bean[] | Grinder[] | MokaPot[]
  type: 'beans' | 'grinders' | 'moka-pots'
  onDelete: (id: string) => Promise<void>
  onEdit: (item: any) => void
  isDeleting: boolean
}

export default function InventoryList({
  items,
  type,
  onDelete,
  onEdit,
  isDeleting,
}: InventoryListProps) {
  const renderItem = (item: any) => {
    if (type === 'beans') {
      const bean = item as Bean
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${bean.is_active !== false ? 'text-[#f5f1ed]' : 'text-[#8b6f47] line-through'}`}>
              {bean.name}
            </h4>
            {bean.is_active !== false ? (
              <span title="Active">
                <Zap className="w-3 h-3 text-yellow-500" />
              </span>
            ) : (
              <span title="Inactive">
                <ZapOff className="w-3 h-3 text-[#5a4f4a]" />
              </span>
            )}
          </div>
          <p className="text-sm text-[#8b6f47]">
            {bean.roaster} • {bean.roast_level}
          </p>
          <div className="flex gap-4 mt-1">
            {bean.roast_date && (
              <span className="text-[10px] text-[#8b6f47] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(bean.roast_date).toLocaleDateString()}
              </span>
            )}
            {bean.weight_g && (
              <span className="text-[10px] text-[#8b6f47] flex items-center gap-1">
                <Scale className="w-3 h-3" /> {bean.weight_g}g
              </span>
            )}
          </div>
        </div>
      )
    } else if (type === 'grinders') {
      const grinder = item as Grinder
      return (
        <div className="flex-1">
          <h4 className="font-medium text-[#f5f1ed]">
            {grinder.brand} {grinder.model}
          </h4>
          {grinder.microns_per_click && (
            <p className="text-[10px] text-[#8b6f47] flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3" /> {grinder.microns_per_click} microns/click
            </p>
          )}
        </div>
      )
    } else {
      const pot = item as MokaPot
      return (
        <div className="flex-1">
          <h4 className="font-medium text-[#f5f1ed]">
            {pot.brand} {pot.model}
          </h4>
          <p className="text-sm text-[#8b6f47]">
            {pot.type} • {pot.size_cups} Cup
          </p>
        </div>
      )
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-[#8b6f47]">
        No {type} added yet. Add one to get started!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-4 flex items-center justify-between hover:border-[#5a4f4a] transition"
        >
          {renderItem(item)}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-2 hover:bg-[#3d3530] rounded transition text-[#8b6f47] hover:text-[#d4a574]"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="p-2 hover:bg-red-900/30 rounded transition disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
