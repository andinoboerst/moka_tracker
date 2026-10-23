-- Saved mix recipes (e.g. "Morning blend": 70% bag A + 30% bag B).
-- Brews copy the recipe into brew_beans, so editing or deleting a recipe never changes history.
CREATE TABLE IF NOT EXISTS public.bean_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name VARCHAR(100) NOT NULL,
  -- [{ "bean_id": "<uuid>", "percentage": 70 }, ...]
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bean_mixes_user_id ON public.bean_mixes(user_id);

ALTER TABLE public.bean_mixes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.bean_mixes;
CREATE POLICY "owner_select" ON public.bean_mixes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert" ON public.bean_mixes;
CREATE POLICY "owner_insert" ON public.bean_mixes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update" ON public.bean_mixes;
CREATE POLICY "owner_update" ON public.bean_mixes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete" ON public.bean_mixes;
CREATE POLICY "owner_delete" ON public.bean_mixes FOR DELETE USING (auth.uid() = user_id);
