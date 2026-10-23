-- Baseline schema. Fully idempotent so it is safe to run against a database that
-- already contains these tables (created earlier via the SQL editor).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  roaster VARCHAR(255) NOT NULL,
  roast_level VARCHAR(50) NOT NULL,
  roast_date DATE,
  weight_g INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.beans ADD COLUMN IF NOT EXISTS origin VARCHAR(255);
ALTER TABLE public.beans ADD COLUMN IF NOT EXISTS is_pre_ground BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.grinders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  microns_per_click INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moka_pots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'Stovetop',
  size_cups INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bean_id UUID NOT NULL REFERENCES public.beans(id) ON DELETE CASCADE,
  grinder_id UUID REFERENCES public.grinders(id) ON DELETE CASCADE,
  moka_pot_id UUID NOT NULL REFERENCES public.moka_pots(id) ON DELETE CASCADE,
  grinder_setting INTEGER,
  coffee_weight_g DECIMAL(6, 2) NOT NULL,
  water_added_g DECIMAL(6, 2) NOT NULL,
  final_yield_g DECIMAL(6, 2) NOT NULL,
  brew_ratio_input DECIMAL(8, 2),
  extraction_ratio_output DECIMAL(8, 2),
  extraction_time_s INTEGER NOT NULL DEFAULT 0,
  milk_added_g DECIMAL(6, 2),
  vibe_rating INTEGER CHECK (vibe_rating >= 1 AND vibe_rating <= 10),
  tasting_notes TEXT,
  ai_recap TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS milk_type VARCHAR(100);
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS water_temp VARCHAR(50);
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS heat_level VARCHAR(50);
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS has_paper_filter BOOLEAN DEFAULT false;
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS flow_type VARCHAR(50);

CREATE TABLE IF NOT EXISTS public.bean_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  roaster VARCHAR(255) NOT NULL,
  name_key VARCHAR(255) NOT NULL,
  roaster_key VARCHAR(255) NOT NULL,
  roast_level VARCHAR(50),
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 10),
  flavor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name_key, roaster_key)
);

CREATE INDEX IF NOT EXISTS idx_beans_user_id ON public.beans(user_id);
CREATE INDEX IF NOT EXISTS idx_grinders_user_id ON public.grinders(user_id);
CREATE INDEX IF NOT EXISTS idx_moka_pots_user_id ON public.moka_pots(user_id);
CREATE INDEX IF NOT EXISTS idx_brews_user_id ON public.brews(user_id);
CREATE INDEX IF NOT EXISTS idx_brews_created_at ON public.brews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bean_journal_user_id ON public.bean_journal(user_id);

-- Row level security: each user owns their rows.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['beans', 'grinders', 'moka_pots', 'brews', 'bean_journal']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_select" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "owner_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_insert" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "owner_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_update" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "owner_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_delete" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "owner_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id)', tbl);
  END LOOP;
END $$;
