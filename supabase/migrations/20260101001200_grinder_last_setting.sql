-- Remember the most recent grind setting on the grinder itself, so a new brew can start from it.
ALTER TABLE public.grinders ADD COLUMN IF NOT EXISTS last_setting DECIMAL(8, 2);

-- Backfill from existing brews (latest brew per grinder that recorded a setting).
UPDATE public.grinders g
SET last_setting = (
  SELECT b.grinder_setting
  FROM public.brews b
  WHERE b.grinder_id = g.id AND b.grinder_setting IS NOT NULL
  ORDER BY b.created_at DESC
  LIMIT 1
);
