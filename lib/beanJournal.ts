import { Bean, Brew, BeanJournalEntry, BeanCatalogEntry } from './types'
import { normalizeRoastLevel, RoastLevel } from './dbValues'

export function beanCatalogKey(name: string, roaster: string): string {
  return `${name.trim().toLowerCase()}::${roaster.trim().toLowerCase()}`
}

const ROAST_SORT_ORDER: Record<string, number> = {
  Light: 0,
  Medium: 1,
  Dark: 2,
  French: 3,
}

export type BeanCatalogSort =
  | 'rating_desc'
  | 'rating_asc'
  | 'roast'
  | 'name'
  | 'flavor'
  | 'brews'
  | 'date_desc'
  | 'date_asc'

function effectiveRating(entry: BeanCatalogEntry): number {
  if (entry.personal_rating != null) return entry.personal_rating
  if (entry.avg_brew_rating != null) return entry.avg_brew_rating
  return -1
}

export function sortBeanCatalog(
  entries: BeanCatalogEntry[],
  sort: BeanCatalogSort
): BeanCatalogEntry[] {
  const sorted = [...entries]
  switch (sort) {
    case 'rating_asc':
      return sorted.sort((a, b) => effectiveRating(a) - effectiveRating(b))
    case 'roast':
      return sorted.sort((a, b) => {
        const ao = ROAST_SORT_ORDER[a.roast_level || ''] ?? 99
        const bo = ROAST_SORT_ORDER[b.roast_level || ''] ?? 99
        if (ao !== bo) return ao - bo
        return effectiveRating(b) - effectiveRating(a)
      })
    case 'name':
      return sorted.sort((a, b) =>
        `${a.name}${a.roaster}`.localeCompare(`${b.name}${b.roaster}`, undefined, {
          sensitivity: 'base',
        })
      )
    case 'flavor':
      return sorted.sort((a, b) => {
        const af = (a.flavor_notes || a.brew_tasting_notes[0] || '').toLowerCase()
        const bf = (b.flavor_notes || b.brew_tasting_notes[0] || '').toLowerCase()
        if (!af && !bf) return effectiveRating(b) - effectiveRating(a)
        if (!af) return 1
        if (!bf) return -1
        return af.localeCompare(bf)
      })
    case 'brews':
      return sorted.sort((a, b) => b.brew_count - a.brew_count)
    case 'date_desc':
      return sorted.sort((a, b) => (b.first_added_at || '').localeCompare(a.first_added_at || ''))
    case 'date_asc':
      return sorted.sort((a, b) => (a.first_added_at || '').localeCompare(b.first_added_at || ''))
    case 'rating_desc':
    default:
      return sorted.sort((a, b) => effectiveRating(b) - effectiveRating(a))
  }
}

type MutableCatalogEntry = BeanCatalogEntry & { _ratingSum?: number; _ratingCount?: number; _bestBrewRating?: number; _bestBrewDate?: string }

export function buildBeanCatalog(
  journalEntries: BeanJournalEntry[],
  brews: Brew[],
  inventoryBeans: Bean[] = []
): BeanCatalogEntry[] {
  const map = new Map<string, MutableCatalogEntry>()

  const ensure = (name: string, roaster: string): MutableCatalogEntry => {
    const key = beanCatalogKey(name, roaster)
    let entry = map.get(key)
    if (!entry) {
      entry = {
        key,
        name: name.trim(),
        roaster: roaster.trim(),
        brew_count: 0,
        brew_tasting_notes: [],
        inventory_bean_ids: [],
      }
      map.set(key, entry)
    }
    return entry
  }

  for (const j of journalEntries) {
    const entry = ensure(j.name, j.roaster)
    entry.journal_id = j.id
    entry.personal_rating = j.personal_rating ?? undefined
    entry.flavor_notes = j.flavor_notes ?? undefined
    if (j.roast_level) entry.roast_level = j.roast_level as RoastLevel
    
    if (!entry.first_added_at || j.created_at < entry.first_added_at) {
      entry.first_added_at = j.created_at
    }
  }

  for (const brew of brews) {
    const bean = brew.bean
    if (!bean?.name || !bean?.roaster) continue
    const entry = ensure(bean.name, bean.roaster)
    entry.brew_count += 1
    if (bean.origin && !entry.origins?.includes(bean.origin)) {
      entry.origins = [...(entry.origins || []), bean.origin]
    }
    if (bean.roast_level && !entry.roast_level) {
      entry.roast_level = normalizeRoastLevel(bean.roast_level) as RoastLevel
    }
    if (bean.id && !entry.inventory_bean_ids?.includes(bean.id)) {
      entry.inventory_bean_ids = [...(entry.inventory_bean_ids || []), bean.id]
    }
    if (brew.tasting_notes?.trim()) {
      const note = brew.tasting_notes.trim()
      if (!entry.brew_tasting_notes.includes(note)) {
        entry.brew_tasting_notes.push(note)
      }
    }
    const brewDate = brew.created_at
    if (!entry.last_brewed_at || brewDate > entry.last_brewed_at) {
      entry.last_brewed_at = brewDate
    }
    if (!entry.first_added_at || brewDate < entry.first_added_at) {
      entry.first_added_at = brewDate
    }
    if (brew.vibe_rating != null) {
      entry._ratingSum = (entry._ratingSum || 0) + brew.vibe_rating
      entry._ratingCount = (entry._ratingCount || 0) + 1

      const isBetter =
        entry._bestBrewRating == null ||
        brew.vibe_rating > entry._bestBrewRating ||
        (brew.vibe_rating === entry._bestBrewRating && brew.created_at > (entry._bestBrewDate || ''))
      if (isBetter) {
        entry._bestBrewRating = brew.vibe_rating
        entry._bestBrewDate = brew.created_at
        entry.best_brew = {
          vibe_rating: brew.vibe_rating,
          coffee_weight_g: brew.coffee_weight_g,
          water_added_g: brew.water_added_g,
          grinder_setting: brew.grinder_setting ?? undefined,
          grinder_brand: (brew as any).grinder?.brand,
          grinder_model: (brew as any).grinder?.model,
          grinder_microns_per_click: (brew as any).grinder?.microns_per_click,
          water_temp: brew.water_temp,
          heat_level: brew.heat_level,
          has_paper_filter: brew.has_paper_filter,
          flow_type: brew.flow_type,
          extraction_time_s: brew.extraction_time_s,
        }
      }
    }
  }

  for (const bean of inventoryBeans) {
    const entry = ensure(bean.name, bean.roaster)
    if (bean.id && !entry.inventory_bean_ids?.includes(bean.id)) {
      entry.inventory_bean_ids = [...(entry.inventory_bean_ids || []), bean.id]
    }
    if (bean.roast_level && !entry.roast_level) {
      entry.roast_level = normalizeRoastLevel(bean.roast_level) as RoastLevel
    }
    if (bean.origin && !entry.origins?.includes(bean.origin)) {
      entry.origins = [...(entry.origins || []), bean.origin]
    }
    if (bean.is_pre_ground) {
      entry.is_pre_ground = true
    }
    if (!entry.first_added_at || bean.created_at < entry.first_added_at) {
      entry.first_added_at = bean.created_at
    }
  }

  return Array.from(map.values())
    .filter((entry) => {
      // Hide orphaned journal entries: no brews and no beans in inventory
      const hasBrews = entry.brew_count > 0
      const hasInventory = (entry.inventory_bean_ids?.length ?? 0) > 0
      return hasBrews || hasInventory
    })
    .map((entry) => {
      const { _ratingSum, _ratingCount, _bestBrewRating, _bestBrewDate, ...rest } = entry
      if (_ratingCount && _ratingCount > 0) {
        rest.avg_brew_rating = Math.round((_ratingSum! / _ratingCount) * 10) / 10
      }
      return rest
    })
}

export function makeJournalKeys(name: string, roaster: string) {
  return {
    name_key: name.trim().toLowerCase(),
    roaster_key: roaster.trim().toLowerCase(),
  }
}
