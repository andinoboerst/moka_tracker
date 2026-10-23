-- Roaster / expected flavour notes per bean (e.g. "dark chocolate, hazelnut")
ALTER TABLE public.beans
  ADD COLUMN IF NOT EXISTS tasting_notes TEXT;
