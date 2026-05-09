export interface Bean {
  id: string
  user_id: string
  name: string
  roaster: string
  roast_level: string
  created_at: string
  updated_at: string
}

export interface Grinder {
  id: string
  user_id: string
  brand: string
  model: string
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
  grinder_id: string
  moka_pot_id: string
  grinder_setting: number
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g?: number
  brew_ratio_input?: number
  extraction_ratio_output?: number
  vibe_rating: number
  tasting_notes: string
  ai_recap?: string
  created_at: string
  updated_at: string
  bean?: Bean
  grinder?: Grinder
  moka_pot?: MokaPot
}

export interface BrewCreateInput {
  bean_id: string
  grinder_id: string
  moka_pot_id: string
  grinder_setting: number
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g?: number
  vibe_rating: number
  tasting_notes: string
}
