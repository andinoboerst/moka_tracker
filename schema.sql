-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Beans table
CREATE TABLE IF NOT EXISTS public.beans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  roaster VARCHAR(255) NOT NULL,
  roast_level VARCHAR(50) NOT NULL, -- Light, Medium, Dark, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grinders table
CREATE TABLE IF NOT EXISTS public.grinders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moka Pots table
CREATE TABLE IF NOT EXISTS public.moka_pots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size_cups INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brews table
CREATE TABLE IF NOT EXISTS public.brews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bean_id UUID NOT NULL REFERENCES public.beans(id) ON DELETE CASCADE,
  grinder_id UUID NOT NULL REFERENCES public.grinders(id) ON DELETE CASCADE,
  moka_pot_id UUID NOT NULL REFERENCES public.moka_pots(id) ON DELETE CASCADE,
  grinder_setting INTEGER NOT NULL,
  coffee_weight_g DECIMAL(6, 2) NOT NULL,
  water_added_g DECIMAL(6, 2) NOT NULL,
  final_yield_g DECIMAL(6, 2) NOT NULL,
  brew_ratio_input DECIMAL(8, 2), -- Coffee : Water In (auto-calculated)
  extraction_ratio_output DECIMAL(8, 2), -- Coffee : Yield Out (auto-calculated)
  vibe_rating INTEGER CHECK (vibe_rating >= 1 AND vibe_rating <= 10),
  tasting_notes TEXT,
  ai_recap TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_beans_user_id ON public.beans(user_id);
CREATE INDEX IF NOT EXISTS idx_grinders_user_id ON public.grinders(user_id);
CREATE INDEX IF NOT EXISTS idx_moka_pots_user_id ON public.moka_pots(user_id);
CREATE INDEX IF NOT EXISTS idx_brews_user_id ON public.brews(user_id);
CREATE INDEX IF NOT EXISTS idx_brews_created_at ON public.brews(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.beans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grinders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moka_pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brews ENABLE ROW LEVEL SECURITY;

-- Beans RLS Policies
CREATE POLICY "Users can read their own beans"
  ON public.beans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own beans"
  ON public.beans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beans"
  ON public.beans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own beans"
  ON public.beans FOR DELETE
  USING (auth.uid() = user_id);

-- Grinders RLS Policies
CREATE POLICY "Users can read their own grinders"
  ON public.grinders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grinders"
  ON public.grinders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grinders"
  ON public.grinders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grinders"
  ON public.grinders FOR DELETE
  USING (auth.uid() = user_id);

-- Moka Pots RLS Policies
CREATE POLICY "Users can read their own moka pots"
  ON public.moka_pots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own moka pots"
  ON public.moka_pots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own moka pots"
  ON public.moka_pots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own moka pots"
  ON public.moka_pots FOR DELETE
  USING (auth.uid() = user_id);

-- Brews RLS Policies
CREATE POLICY "Users can read their own brews"
  ON public.brews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brews"
  ON public.brews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brews"
  ON public.brews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brews"
  ON public.brews FOR DELETE
  USING (auth.uid() = user_id);
