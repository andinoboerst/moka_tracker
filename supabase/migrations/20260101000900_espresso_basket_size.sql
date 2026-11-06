-- Optional basket size of an espresso machine (grams of coffee the basket is designed for).
ALTER TABLE public.moka_pots ADD COLUMN IF NOT EXISTS basket_size_g DECIMAL(4, 1);
