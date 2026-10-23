import type { Brew } from './types'
import { mokaPotName } from './utils'
import { describeMix } from './beans'

const escapeCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function brewsToCsv(brews: Brew[]): string {
  const header = [
    'Date', 'Bean / Mix', 'Bean type', 'Roaster', 'Roast level', 'Moka pot', 'Grinder', 'Grinder setting',
    'Coffee (g)', 'Water (g)', 'Yield (g)', 'Time (s)', 'Brew ratio', 'Extraction ratio',
    'Start water temp', 'Heat', 'Flow', 'Paper filter', 'Milk (g)', 'Milk type', 'Rating', 'Notes',
  ]
  const rows = brews.map((b) => {
    const hasMix = (b.mix?.length ?? 0) > 1
    return [
      b.created_at.split('T')[0],
      hasMix ? describeMix(b.mix!) : b.bean?.name,
      hasMix ? [...new Set(b.mix!.map((c) => c.bean?.bean_type).filter(Boolean))].join(' + ') : b.bean?.bean_type,
      b.bean?.roaster,
      b.bean?.roast_level,
      b.moka_pot ? mokaPotName(b.moka_pot) : '',
      b.grinder ? `${b.grinder.brand} ${b.grinder.model}` : 'Pre-ground',
      b.grinder_setting,
      b.coffee_weight_g,
      b.water_added_g,
      b.final_yield_g,
      b.extraction_time_s,
      b.brew_ratio_input,
      b.extraction_ratio_output,
      b.water_temp,
      b.heat_level,
      b.flow_type,
      b.has_paper_filter ? 'yes' : 'no',
      b.milk_added_g,
      b.milk_type,
      b.vibe_rating,
      b.tasting_notes,
    ]
  })
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
