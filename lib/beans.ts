import type { Bean } from './types'

export type BeanType = 'Arabica' | 'Robusta' | 'Blend'
export const BEAN_TYPES: BeanType[] = ['Arabica', 'Robusta', 'Blend']

export interface MixComponent {
  percentage: number
  bean?: Pick<Bean, 'name' | 'roaster' | 'bean_type' | 'arabica_percent'> | null
}

export const normalizeBeanType = (value: unknown): BeanType | null =>
  BEAN_TYPES.includes(value as BeanType) ? (value as BeanType) : null

/** Share of Arabica (0-100) in a single bean product, or null when unknown. */
export function arabicaShare(
  bean?: Pick<Bean, 'bean_type' | 'arabica_percent'> | null
): number | null {
  if (!bean?.bean_type) return null
  if (bean.bean_type === 'Arabica') return 100
  if (bean.bean_type === 'Robusta') return 0
  return typeof bean.arabica_percent === 'number' ? bean.arabica_percent : null
}

/** Overall Arabica share of a mix, or null if any component's species is unknown. */
export function mixArabicaShare(mix: MixComponent[]): number | null {
  let total = 0
  for (const c of mix) {
    const share = arabicaShare(c.bean)
    if (share === null) return null
    total += (share * c.percentage) / 100
  }
  return Math.round(total)
}

/** "70% Miscela Rossa + 30% Syra" */
export function describeMix(mix: MixComponent[]): string {
  return [...mix]
    .sort((a, b) => b.percentage - a.percentage)
    .map((c) => `${c.percentage}% ${c.bean?.name ?? '?'}`)
    .join(' + ')
}

/** Stable signature for grouping brews that used the same recipe of beans. */
export function mixSignature(brew: { bean_id: string; mix?: { bean_id?: string; percentage: number }[] }): string {
  if (!brew.mix || brew.mix.length < 2) return brew.bean_id
  return [...brew.mix]
    .map((c) => `${c.bean_id}:${c.percentage}`)
    .sort()
    .join('|')
}
