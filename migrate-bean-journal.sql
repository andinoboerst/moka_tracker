-- Bean journal: personal ratings & flavor notes (separate from inventory beans)
-- Identity = name + roaster (deduplicated in the app layer)

CREATE TABLE IF NOT EXISTS public.bean_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_bean_journal_user_id ON public.bean_journal(user_id);

ALTER TABLE public.bean_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bean journal"
  ON public.bean_journal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bean journal"
  ON public.bean_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bean journal"
  ON public.bean_journal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bean journal"
  ON public.bean_journal FOR DELETE
  USING (auth.uid() = user_id);
