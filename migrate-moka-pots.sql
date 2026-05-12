-- Migration script to add brand, model, and type fields to moka_pots table
-- Run this in Supabase SQL Editor if you have existing data

-- Add new columns to existing table
ALTER TABLE public.moka_pots 
ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
ADD COLUMN IF NOT EXISTS model VARCHAR(255), 
ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'Stovetop';

-- Update the size_cups constraint to include 2 cups
ALTER TABLE public.moka_pots 
DROP CONSTRAINT IF EXISTS moka_pots_size_cups_check;

ALTER TABLE public.moka_pots 
ADD CONSTRAINT moka_pots_size_cups_check 
CHECK (size_cups IN (1, 2, 3, 4, 6, 9, 12, 18));

-- Set default values for existing records (optional)
UPDATE public.moka_pots 
SET brand = 'Unknown', model = 'Legacy Pot', type = 'Stovetop' 
WHERE brand IS NULL OR model IS NULL;
