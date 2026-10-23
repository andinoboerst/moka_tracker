-- Bean species (Arabica / Robusta / Blend) and manual bean mixes per brew.

ALTER TABLE public.beans
  ADD COLUMN IF NOT EXISTS bean_type VARCHAR(20)
  CHECK (bean_type IN ('Arabica', 'Robusta', 'Blend'));

-- For pre-blended products: share of Arabica (0-100). Only meaningful when bean_type = 'Blend'.
ALTER TABLE public.beans
  ADD COLUMN IF NOT EXISTS arabica_percent SMALLINT
  CHECK (arabica_percent >= 0 AND arabica_percent <= 100);

-- A brew made from a mix of several beans. brews.bean_id stays as the main (largest) component;
-- single-bean brews simply have no rows here.
CREATE TABLE IF NOT EXISTS public.brew_beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brew_id UUID NOT NULL REFERENCES public.brews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  bean_id UUID NOT NULL REFERENCES public.beans(id) ON DELETE CASCADE,
  percentage SMALLINT NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
  UNIQUE (brew_id, bean_id)
);

CREATE INDEX IF NOT EXISTS idx_brew_beans_brew_id ON public.brew_beans(brew_id);
CREATE INDEX IF NOT EXISTS idx_brew_beans_bean_id ON public.brew_beans(bean_id);
CREATE INDEX IF NOT EXISTS idx_brew_beans_user_id ON public.brew_beans(user_id);

ALTER TABLE public.brew_beans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.brew_beans;
CREATE POLICY "owner_select" ON public.brew_beans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert" ON public.brew_beans;
CREATE POLICY "owner_insert" ON public.brew_beans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update" ON public.brew_beans;
CREATE POLICY "owner_update" ON public.brew_beans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete" ON public.brew_beans;
CREATE POLICY "owner_delete" ON public.brew_beans FOR DELETE USING (auth.uid() = user_id);

-- Shared brew view now also exposes the mix and the bean species.
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
    'bean', json_build_object('name', be.name, 'roaster', be.roaster, 'origin', be.origin, 'roast_level', be.roast_level, 'bean_type', be.bean_type),
    'mix', COALESCE((
      SELECT json_agg(json_build_object('percentage', bb.percentage, 'bean', json_build_object('name', mb.name, 'roaster', mb.roaster, 'bean_type', mb.bean_type)) ORDER BY bb.percentage DESC)
      FROM public.brew_beans bb JOIN public.beans mb ON mb.id = bb.bean_id
      WHERE bb.brew_id = b.id
    ), '[]'::json),
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
