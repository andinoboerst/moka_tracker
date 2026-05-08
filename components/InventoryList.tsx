'use client'

import { Bean, Grinder, MokaPot } from '@/lib/types'
import { Trash2 } from 'lucide-react'

interface InventoryListProps {
  items: Bean[] | Grinder[] | MokaPot[]
  type: 'beans' | 'grinders' | 'moka-pots'
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
}

export default function InventoryList({
  items,
  type,
  onDelete,
  isDeleting,
}: InventoryListProps) {
  const renderItem = (item: any) => {
    if (type === 'beans') {
      return (
        <div className="flex-1">
          <h4 className="font-medium text-[#f5f1ed]">{item.name}</h4>
          <p className="text-sm text-[#8b6f47]">
            {item.roaster} • {item.roast_level}
          </p>
        </div>
      )
    } else if (type === 'grinders') {
      return (
        <div className="flex-1">
          <h4 className="font-medium text-[#f5f1ed]">
            {item.brand} {item.model}
          </h4>
        </div>
      )
    } else {
      return (
        <div className="flex-1">
          <h4 className="font-medium text-[#f5f1ed]">{item.size_cups} Cup Moka Pot</h4>
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
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="p-2 hover:bg-red-900/30 rounded transition disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ))}
    </div>
  )
}
