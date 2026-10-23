-- Public share links for brews. A brew is only visible to anonymous visitors when its
-- owner has generated a share_token, and only through the function below.
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS share_token UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_brews_share_token ON public.brews(share_token) WHERE share_token IS NOT NULL;

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
    'tasting_notes', b.tasting_notes,
    'bean', json_build_object('name', be.name, 'roaster', be.roaster, 'origin', be.origin, 'roast_level', be.roast_level),
    'grinder', CASE WHEN g.id IS NULL THEN NULL ELSE json_build_object('brand', g.brand, 'model', g.model, 'microns_per_click', g.microns_per_click) END,
    'moka_pot', json_build_object('brand', m.brand, 'model', m.model, 'nickname', m.nickname, 'size_cups', m.size_cups)
  )
  FROM public.brews b
  JOIN public.beans be ON be.id = b.bean_id
  JOIN public.moka_pots m ON m.id = b.moka_pot_id
  LEFT JOIN public.grinders g ON g.id = b.grinder_id
  WHERE b.share_token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_shared_brew(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_brew(UUID) TO anon, authenticated;
