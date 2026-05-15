export interface Bean {
  id: string
  user_id: string
  name: string
  roaster: string
  roast_level: string
  roast_date?: string
  origin?: string
  weight_g?: number
  is_active?: boolean
  is_pre_ground?: boolean
  created_at: string
  updated_at: string
}

export interface Grinder {
  id: string
  user_id: string
  brand: string
  model: string
  microns_per_click?: number
  created_at: string
  updated_at: string
}

export interface MokaPot {
  id: string
  user_id: string
  brand: string
  model: string
  type: string
  size_cups: number
  created_at: string
  updated_at: string
}

export interface Brew {
  id: string
  user_id: string
  bean_id: string
  grinder_id?: string
  moka_pot_id: string
  grinder_setting?: number
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g?: number
  milk_type?: string
  brew_ratio_input?: number
  extraction_ratio_output?: number
  vibe_rating: number
  tasting_notes: string
  water_temp?: string
  heat_level?: string
  has_paper_filter?: boolean
  flow_type?: string
  ai_recap?: string
  created_at: string
  updated_at: string
  bean?: Bean
  grinder?: Grinder
  moka_pot?: MokaPot
}

export interface BrewCreateInput {
  bean_id: string
  grinder_id?: string
  moka_pot_id: string
  grinder_setting?: number
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g?: number
  milk_type?: string
  vibe_rating: number
  tasting_notes: string
  water_temp: string
  heat_level: string
  has_paper_filter: boolean
  flow_type: string
  /** UI locale only — not persisted; all DB enum fields use English canonical values */
  language?: string
}
