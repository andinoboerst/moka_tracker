-- Portafilter type per espresso brew: Pressurized | Spouted | Bottomless | Precision (see lib/dbValues.ts).
ALTER TABLE public.brews ADD COLUMN IF NOT EXISTS portafilter VARCHAR(30);

-- The inventory-item approach (migration ...1300) was dropped in favour of this simple list.
ALTER TABLE public.brews DROP COLUMN IF EXISTS basket_id;
DROP TABLE IF EXISTS public.baskets;
