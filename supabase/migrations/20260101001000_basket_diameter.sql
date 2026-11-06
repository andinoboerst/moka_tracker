-- The basket is described by its diameter (e.g. 49, 54, 58 mm), not by a dose.
ALTER TABLE public.moka_pots ADD COLUMN IF NOT EXISTS basket_diameter_mm DECIMAL(4, 1);
ALTER TABLE public.moka_pots DROP COLUMN IF EXISTS basket_size_g;
