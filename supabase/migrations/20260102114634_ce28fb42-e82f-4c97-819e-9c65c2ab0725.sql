-- Add count column to sales table for tracking number of cards per sale
ALTER TABLE public.sales ADD COLUMN count integer NOT NULL DEFAULT 1;