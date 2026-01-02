-- Add speed column to subscribers table for tracking internet speed per subscriber
ALTER TABLE public.subscribers ADD COLUMN speed integer NOT NULL DEFAULT 0;