-- Fix source_kind_check constraint to include 'legislation'
ALTER TABLE public.source DROP CONSTRAINT IF EXISTS source_kind_check;

ALTER TABLE public.source ADD CONSTRAINT source_kind_check 
CHECK (kind = ANY (ARRAY['meetings'::text, 'ordinances'::text, 'elections'::text, 'legislation'::text, 'rss'::text, 'docs'::text]));