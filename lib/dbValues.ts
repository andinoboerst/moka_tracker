/**
 * Canonical English values stored in the database.
 * UI labels are translated via i18n; analytics always query these keys.
 */

export const ROAST_LEVELS = ['Light', 'Medium', 'Dark', 'French'] as const
export type RoastLevel = (typeof ROAST_LEVELS)[number]

export const WATER_TEMPS = ['Boiling', 'Warm', 'Cold'] as const
export type WaterTemp = (typeof WATER_TEMPS)[number]

export const HEAT_LEVELS = ['Low', 'Medium-Low', 'Medium', 'High'] as const
export type HeatLevel = (typeof HEAT_LEVELS)[number]

export const FLOW_TYPES = ['Honey-like', 'Steady', 'Sputtering'] as const
export type FlowType = (typeof FLOW_TYPES)[number]

export const MILK_TYPES = [
  'Whole Milk',
  'Semi-skimmed',
  'Skimmed',
  'Oat Milk',
  'Almond Milk',
  'Soy Milk',
  'Coconut Milk',
  'Cashew Milk',
  'Pea Milk',
  'Other',
] as const
export type MilkType = (typeof MILK_TYPES)[number]

export const MOKA_POT_TYPES = ['Stovetop', 'Electric', 'Induction'] as const
export type MokaPotType = (typeof MOKA_POT_TYPES)[number]

/** brew_form.* keys for expert-variable display */
export const EXPERT_VALUE_I18N: Record<string, string> = {
  Boiling: 'brew_form.temp_boiling',
  Warm: 'brew_form.temp_warm',
  Cold: 'brew_form.temp_cold',
  Low: 'brew_form.heat_low',
  'Medium-Low': 'brew_form.heat_med_low',
  Medium: 'brew_form.heat_med',
  High: 'brew_form.heat_high',
  'Honey-like': 'brew_form.flow_honey',
  Steady: 'brew_form.flow_steady',
  Sputtering: 'brew_form.flow_sputtering',
}

export const MILK_TYPE_I18N: Record<MilkType, string> = {
  'Whole Milk': 'brew_form.whole_milk',
  'Semi-skimmed': 'brew_form.semi_skimmed',
  Skimmed: 'brew_form.skimmed',
  'Oat Milk': 'brew_form.oat_milk',
  'Almond Milk': 'brew_form.almond_milk',
  'Soy Milk': 'brew_form.soy_milk',
  'Coconut Milk': 'brew_form.coconut_milk',
  'Cashew Milk': 'brew_form.cashew_milk',
  'Pea Milk': 'brew_form.pea_milk',
  Other: 'common.none',
}

export const ROAST_LEVEL_I18N: Record<RoastLevel, string> = {
  Light: 'bean_form.light',
  Medium: 'bean_form.medium',
  Dark: 'bean_form.dark',
  French: 'bean_form.french',
}

/** Reverse-map localized labels (and common variants) back to canonical English */
const ROAST_ALIASES: Record<string, RoastLevel> = {
  Leggera: 'Light',
  leggera: 'Light',
  Media: 'Medium',
  media: 'Medium',
  Scura: 'Dark',
  scura: 'Dark',
}

const MILK_ALIASES: Record<string, MilkType> = {
  'Latte Intero': 'Whole Milk',
  'Parzialmente Scremato': 'Semi-skimmed',
  Scremato: 'Skimmed',
  "Latte d'Avena": 'Oat Milk',
  'Latte di Mandorla': 'Almond Milk',
  'Latte di Soia': 'Soy Milk',
  'Latte di Cocco': 'Coconut Milk',
  'Latte di Anacardi': 'Cashew Milk',
  'Latte di Piselli': 'Pea Milk',
}

const WATER_TEMP_ALIASES: Record<string, WaterTemp> = {
  Bollente: 'Boiling',
  Calda: 'Warm',
  Fredda: 'Cold',
}

const HEAT_ALIASES: Record<string, HeatLevel> = {
  Basso: 'Low',
  'Medio-Basso': 'Medium-Low',
  Medio: 'Medium',
  Alto: 'High',
}

const FLOW_ALIASES: Record<string, FlowType> = {
  'A Miele': 'Honey-like',
  Costante: 'Steady',
  'A spruzzi': 'Sputtering',
  Sputtering: 'Sputtering',
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  aliases: Record<string, T>,
  fallback: T
): T {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if ((allowed as readonly string[]).includes(trimmed)) return trimmed as T
  const alias = aliases[trimmed] ?? aliases[trimmed.toLowerCase()]
  if (alias) return alias
  return fallback
}

export function normalizeRoastLevel(value: unknown): RoastLevel {
  return normalizeEnum(value, ROAST_LEVELS, ROAST_ALIASES, 'Medium')
}

export function normalizeWaterTemp(value: unknown): WaterTemp {
  return normalizeEnum(value, WATER_TEMPS, WATER_TEMP_ALIASES, 'Boiling')
}

export function normalizeHeatLevel(value: unknown): HeatLevel {
  return normalizeEnum(value, HEAT_LEVELS, HEAT_ALIASES, 'Medium-Low')
}

export function normalizeFlowType(value: unknown): FlowType {
  return normalizeEnum(value, FLOW_TYPES, FLOW_ALIASES, 'Steady')
}

export function normalizeMilkType(value: unknown): MilkType | null {
  if (value === null || value === undefined || value === '') return null
  return normalizeEnum(value, MILK_TYPES, MILK_ALIASES, 'Other')
}

export function normalizeMokaPotType(value: unknown): MokaPotType {
  return normalizeEnum(
    value,
    MOKA_POT_TYPES,
    { 'a fuoco': 'Stovetop', Elettrica: 'Electric', Induzione: 'Induction' },
    'Stovetop'
  )
}

export function translateStoredExpertValue(
  value: string | undefined,
  t: (path: string) => string,
  fallback: string = 'Boiling'
): string {
  const key = EXPERT_VALUE_I18N[value || fallback]
  return key ? t(key) : value || fallback
}

export function translateMilkType(value: string | undefined, t: (path: string) => string): string {
  if (!value) return ''
  const normalized = normalizeMilkType(value)
  if (normalized) {
    const key = MILK_TYPE_I18N[normalized]
    if (key) return t(key)
  }
  return value
}

export function translateRoastLevel(value: string | undefined, t: (path: string) => string): string {
  if (!value) return ''
  const normalized = normalizeRoastLevel(value)
  const key = ROAST_LEVEL_I18N[normalized]
  return key ? t(key) : value
}
