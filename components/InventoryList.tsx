'use client'

import { Bean, Grinder, MokaPot } from '@/lib/types'
import { Trash2, Edit2, Package, Scale, Calendar, Zap, ZapOff, Globe } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

export type InventoryItem = Bean | Grinder | MokaPot

interface InventoryListProps {
  items: Bean[] | Grinder[] | MokaPot[]
  type: 'beans' | 'grinders' | 'moka-pots'
  onDelete: (id: string) => Promise<void>
  onEdit: (item: InventoryItem) => void
  onToggleActive?: (item: InventoryItem) => Promise<void>
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
  const renderItem = (item: InventoryItem) => {
    if (type === 'beans') {
      const bean = item as Bean
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium transition-all ${bean.is_active !== false ? 'text-ink' : 'text-muted line-through opacity-50'}`}>
              {bean.name}
            </h4>
            {bean.bean_type && (
              <span className="text-[10px] text-ink bg-accent/15 px-1.5 py-0.5 rounded border border-accent/30 font-bold uppercase">
                {bean.bean_type === 'Blend' && bean.arabica_percent != null
                  ? `${t('bean_form.type_blend').split(' ')[0]} ${bean.arabica_percent}% A`
                  : bean.bean_type}
              </span>
            )}
            {bean.is_pre_ground && (
              <span className="text-[10px] text-accent-ink bg-line px-1.5 py-0.5 rounded border border-line-strong font-bold uppercase">
                {t('brew_form.pre_ground')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted flex items-center gap-2">
            {bean.roaster} • {bean.roast_level}
          </p>
          <div className={`flex gap-4 mt-1 transition-opacity ${bean.is_active !== false ? 'opacity-100' : 'opacity-40'}`}>
            {bean.roast_date && (
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(bean.roast_date)}
              </span>
            )}
            {bean.origin && (
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Globe className="w-3 h-3" /> {bean.origin}
              </span>
            )}
            {typeof bean.weight_g === 'number' && (
              <span
                className={`text-[10px] flex items-center gap-1 ${
                  bean.weight_g === 0 ? 'text-red-400' : bean.weight_g <= 50 ? 'text-yellow-400' : 'text-muted'
                }`}
              >
                <Scale className="w-3 h-3" /> {bean.weight_g}g
                {bean.weight_g === 0 ? ` · ${t('feat.stock_out')}` : bean.weight_g <= 50 ? ` · ${t('feat.stock_low')}` : ''}
              </span>
            )}
            {bean.roast_date && (() => {
              const days = Math.floor((Date.now() - new Date(bean.roast_date).getTime()) / 86400000)
              if (days < 0) return null
              const label = days < 5 ? t('feat.fresh_rest') : days <= 30 ? t('feat.fresh_peak') : t('feat.fresh_old')
              const color = days < 5 ? 'text-blue-400' : days <= 30 ? 'text-green-400' : 'text-muted'
              return (
                <span className={`text-[10px] ${color}`}>
                  {label} · {t('feat.days_old', { days })}
                </span>
              )
            })()}
          </div>
        </div>
      )
    } else if (type === 'grinders') {
      const grinder = item as Grinder
      return (
        <div className="flex-1">
          <h4 className="font-medium text-ink">
            {grinder.brand} {grinder.model}
          </h4>
          {grinder.microns_per_click && (
            <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3" /> {t('inventory.microns_per_click', { microns: grinder.microns_per_click })}
            </p>
          )}
        </div>
      )
    } else {
      const pot = item as MokaPot
      return (
        <div className="flex-1">
          <h4 className="font-medium text-ink">
            {pot.nickname?.trim() || `${pot.brand} ${pot.model}`}
          </h4>
          {pot.nickname?.trim() && (
            <p className="text-xs text-muted">{pot.brand} {pot.model}</p>
          )}
          <p className="text-sm text-muted">
            {pot.type} • {pot.size_cups} {t('moka_form.size').replace(' (Cups)', '')}
          </p>
        </div>
      )
    }
  }

  if (items.length === 0) {
    const emptyKey =
      type === 'beans'
        ? 'inventory.empty_beans'
        : type === 'grinders'
          ? 'inventory.empty_grinders'
          : 'inventory.empty_moka_pots'
    return (
      <div className="text-center py-8 text-muted italic">
        {t(emptyKey)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`card p-4 flex items-center justify-between hover:border-line-strong transition ${
            type === 'beans' && (item as Bean).is_active === false ? 'opacity-70 bg-surface' : ''
          }`}
        >
          <div className="flex items-center gap-4 flex-1">
            {type === 'beans' && onToggleActive && (
              <button
                onClick={() => onToggleActive(item)}
                className={`flex-shrink-0 w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${
                  (item as Bean).is_active !== false ? 'bg-yellow-600' : 'bg-canvas border border-line'
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
              className="p-2 hover:bg-line rounded transition text-muted hover:text-accent-ink"
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
