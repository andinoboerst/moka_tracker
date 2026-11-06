-- Espresso support.
--  * moka_pots now holds all brewing gear ("brewers"): kind = 'moka' | 'espresso'.
--  * grinders can be stepped (clicks, optional microns_per_click) or stepless (setting = grind size in microns).
--  * brews can carry a pressure profile (list of stages) and a brew temperature in °C.

ALTER TABLE public.moka_pots ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'moka';
-- moka_pots.type holds the moka type (Stovetop...) or the espresso machine type (Manual lever...).
ALTER TABLE public.moka_pots ADD COLUMN IF NOT EXISTS max_pressure_bar DECIMAL(4, 1);
ALTER TABLE public.moka_pots ALTER COLUMN size_cups DROP NOT NULL;

ALTER TABLE public.grinders ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(20) NOT NULL DEFAULT 'stepped';

-- Stepless grinders log the grind size itself, which may be fractional.
ALTER TABLE public.brews ALTER COLUMN grinder_setting TYPE DECIMAL(8, 2);
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS brew_temp_c DECIMAL(4, 1);
-- [{ "type": "preinfusion|ramp|hold|decline", "duration_s": 10, "pressure_bar": 3 }, ...]
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS pressure_profile JSONB;

CREATE OR REPLACE FUNCTION public.get_shared_brew(p_token UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'id', b.id,
    'created_at', b.created_at,
    'vibe_rating', b.vibe_rating,
    'coffee_weight_g', b.coffee_weight_g,
    'water_added_g', b.water_added_g,
    'final_yield_g', b.final_yield_g,
    'extraction_time_s', b.extraction_time_s,
    'brew_ratio_input', b.brew_ratio_input,
    'extraction_ratio_output', b.extraction_ratio_output,
    'grinder_setting', b.grinder_setting,
    'grinder_id', b.grinder_id,
    'milk_added_g', b.milk_added_g,
    'milk_type', b.milk_type,
    'water_temp', b.water_temp,
    'heat_level', b.heat_level,
    'flow_type', b.flow_type,
    'has_paper_filter', b.has_paper_filter,
    'brew_temp_c', b.brew_temp_c,
    'pressure_profile', b.pressure_profile,
    'tasting_notes', b.tasting_notes,
    'bean', json_build_object('name', be.name, 'roaster', be.roaster, 'origin', be.origin, 'roast_level', be.roast_level),
    'grinder', CASE WHEN g.id IS NULL THEN NULL ELSE json_build_object('brand', g.brand, 'model', g.model, 'microns_per_click', g.microns_per_click, 'adjustment_type', g.adjustment_type) END,
    'moka_pot', json_build_object('brand', m.brand, 'model', m.model, 'nickname', m.nickname, 'size_cups', m.size_cups, 'kind', m.kind)
  )
  FROM public.brews b
  JOIN public.beans be ON be.id = b.bean_id
  JOIN public.moka_pots m ON m.id = b.moka_pot_id
  LEFT JOIN public.grinders g ON g.id = b.grinder_id
  WHERE b.share_token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_shared_brew(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_brew(UUID) TO anon, authenticated;
