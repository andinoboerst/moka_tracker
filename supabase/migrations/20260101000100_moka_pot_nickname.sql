-- Optional nickname for moka pots (e.g. "Tricolore")
ALTER TABLE public.moka_pots ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
