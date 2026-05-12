'use client'

import { Bean, Grinder, MokaPot } from '@/lib/types'
import { Trash2, Edit2, Package, Scale, Calendar, Zap, ZapOff, Globe } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

interface InventoryListProps {
  items: Bean[] | Grinder[] | MokaPot[]
  type: 'beans' | 'grinders' | 'moka-pots'
  onDelete: (id: string) => Promise<void>
  onEdit: (item: any) => void
  onToggleActive?: (item: any) => Promise<void>
  isDeleting: boolean
}

export default function InventoryList({
  items,
  type,
  onDelete,
  onEdit,
  onToggleActive,
  isDeleting,
}: InventoryListProps) {
  const { t } = useLanguage()
  const renderItem = (item: any) => {
    if (type === 'beans') {
      const bean = item as Bean
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium transition-all ${bean.is_active !== false ? 'text-[#f5f1ed]' : 'text-[#8b6f47] line-through opacity-50'}`}>
              {bean.name}
            </h4>
            {bean.is_pre_ground && (
              <span className="text-[10px] text-[#d4a574] bg-[#3d3530] px-1.5 py-0.5 rounded border border-[#5a4f4a] font-bold uppercase">
                {t('brew_form.pre_ground')}
              </span>
            )}
          </div>
          <p className="text-sm text-[#8b6f47] flex items-center gap-2">
            {bean.roaster} • {bean.roast_level}
          </p>
          <div className={`flex gap-4 mt-1 transition-opacity ${bean.is_active !== false ? 'opacity-100' : 'opacity-40'}`}>
            {bean.roast_date && (
              <span className="text-[10px] text-[#8b6f47] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(bean.roast_date)}
              </span>
            )}
            {bean.origin && (
              <span className="text-[10px] text-[#8b6f47] flex items-center gap-1">
                <Globe className="w-3 h-3" /> {bean.origin}
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
            {pot.type} • {pot.size_cups} {t('moka_form.size').replace(' (Cups)', '')}
          </p>
        </div>
      )
    }
  }

  if (items.length === 0) {
    const itemLabel = type === 'beans' ? t('inventory.your_beans') : type === 'grinders' ? t('inventory.your_grinders') : t('inventory.your_moka_pots')
    return (
      <div className="text-center py-8 text-[#8b6f47] italic">
        {t('dashboard.no_brews').replace('brews logged', itemLabel.toLowerCase())}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`bg-[#2d2520] border border-[#3d3530] rounded-lg p-4 flex items-center justify-between hover:border-[#5a4f4a] transition ${
            type === 'beans' && (item as Bean).is_active === false ? 'opacity-70 bg-[#251e1a]' : ''
          }`}
        >
          <div className="flex items-center gap-4 flex-1">
            {type === 'beans' && onToggleActive && (
              <button
                onClick={() => onToggleActive(item)}
                className={`flex-shrink-0 w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${
                  (item as Bean).is_active !== false ? 'bg-yellow-600' : 'bg-[#1a1410] border border-[#3d3530]'
                }`}
                title={(item as Bean).is_active !== false ? t('common.deactivate') : t('common.activate')}
              >
                <div
                  className={`absolute top-0.5 left-1 w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${
                    (item as Bean).is_active !== false ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
            {renderItem(item)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-2 hover:bg-[#3d3530] rounded transition text-[#8b6f47] hover:text-[#d4a574]"
              title={t('common.edit')}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="p-2 hover:bg-red-900/30 rounded transition disabled:opacity-50"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
