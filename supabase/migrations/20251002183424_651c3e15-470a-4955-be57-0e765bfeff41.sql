-- ==========================================
-- SCALABLE TRENDS SYSTEM MIGRATION (Final)
-- ==========================================

-- 1. Update jurisdiction table with new fields
ALTER TABLE public.jurisdiction 
  ADD COLUMN IF NOT EXISTS ocd_id TEXT,
  ADD COLUMN IF NOT EXISTS fips TEXT,
  ADD COLUMN IF NOT EXISTS geo JSONB;

-- Add indexes for jurisdiction
CREATE INDEX IF NOT EXISTS idx_jurisdiction_ocd ON public.jurisdiction(ocd_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_fips ON public.jurisdiction(fips);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_parent ON public.jurisdiction(parent_jurisdiction_id);

-- 2. Update legislation table
ALTER TABLE public.legislation
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Set occurred_at from introduced_at for existing records
UPDATE public.legislation 
SET occurred_at = introduced_at 
WHERE occurred_at IS NULL AND introduced_at IS NOT NULL;

-- Indexes for legislation
CREATE INDEX IF NOT EXISTS idx_legislation_jurisdiction_occurred ON public.legislation(jurisdiction_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_legislation_occurred ON public.legislation(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_legislation_content_hash ON public.legislation(content_hash);
CREATE INDEX IF NOT EXISTS idx_legislation_external_id ON public.legislation(external_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_legislation_fts ON public.legislation 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '')));

-- 3. Update meeting table
ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Set occurred_at from starts_at for existing records
UPDATE public.meeting 
SET occurred_at = starts_at 
WHERE occurred_at IS NULL AND starts_at IS NOT NULL;

-- Indexes for meeting
CREATE INDEX IF NOT EXISTS idx_meeting_jurisdiction_occurred ON public.meeting(jurisdiction_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_occurred ON public.meeting(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_content_hash ON public.meeting(content_hash);
CREATE INDEX IF NOT EXISTS idx_meeting_external_id ON public.meeting(external_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_meeting_fts ON public.meeting 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(ai_summary, '')));

-- 4. Update election table
ALTER TABLE public.election
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Indexes for election
CREATE INDEX IF NOT EXISTS idx_election_jurisdiction_date ON public.election(jurisdiction_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_election_date ON public.election(date DESC);
CREATE INDEX IF NOT EXISTS idx_election_content_hash ON public.election(content_hash);

-- 5. Update item_topic table structure
ALTER TABLE public.item_topic
  ADD COLUMN IF NOT EXISTS item_kind TEXT;

-- Add check constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'item_topic_item_kind_check'
  ) THEN
    ALTER TABLE public.item_topic 
    ADD CONSTRAINT item_topic_item_kind_check 
    CHECK (item_kind IN ('legislation', 'meeting', 'election'));
  END IF;
END $$;

-- Set item_kind based on item_type for existing records
UPDATE public.item_topic 
SET item_kind = item_type 
WHERE item_kind IS NULL AND item_type IS NOT NULL;

-- Indexes for item_topic
CREATE INDEX IF NOT EXISTS idx_item_topic_topic_occurred ON public.item_topic(topic, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_topic_jurisdiction_occurred ON public.item_topic(jurisdiction_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_topic_kind_item ON public.item_topic(item_kind, item_id);

-- 6. Create trend_aggregate table for precomputed trends
CREATE TABLE IF NOT EXISTS public.trend_aggregate (
  scope_key TEXT NOT NULL,
  time_window TEXT NOT NULL CHECK (time_window IN ('7d', '30d', '6m', '1y')),
  topic TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 0,
  by_kind JSONB DEFAULT '{}'::jsonb,
  sample_item_ids UUID[] DEFAULT ARRAY[]::UUID[],
  last_computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (scope_key, time_window, topic)
);

-- Indexes for trend_aggregate
CREATE INDEX IF NOT EXISTS idx_trend_aggregate_window_score ON public.trend_aggregate(time_window, score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_aggregate_computed ON public.trend_aggregate(last_computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_aggregate_topic ON public.trend_aggregate(topic);

-- RLS for trend_aggregate
ALTER TABLE public.trend_aggregate ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to avoid duplication
DROP POLICY IF EXISTS "Anonymous can read trend aggregates" ON public.trend_aggregate;
CREATE POLICY "Anonymous can read trend aggregates"
  ON public.trend_aggregate
  FOR SELECT
  USING (true);

-- 7. Create/update data_status table
CREATE TABLE IF NOT EXISTS public.data_status (
  scope_key TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  job_id UUID,
  counts JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for data_status
ALTER TABLE public.data_status ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Anonymous can read data status" ON public.data_status;
CREATE POLICY "Anonymous can read data status"
  ON public.data_status
  FOR SELECT
  USING (true);

-- 8. Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram index for topic search
CREATE INDEX IF NOT EXISTS idx_item_topic_topic_trgm ON public.item_topic USING gin(topic gin_trgm_ops);

-- 9. Create helper function to normalize scope keys
CREATE OR REPLACE FUNCTION public.normalize_scope_key(scope_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts TEXT[];
  sorted_parts TEXT[];
BEGIN
  -- Split by comma, trim, sort, and rejoin
  parts := string_to_array(scope_text, ',');
  SELECT array_agg(trim(p) ORDER BY trim(p)) INTO sorted_parts FROM unnest(parts) p;
  RETURN array_to_string(sorted_parts, ',');
END;
$$;

-- 10. Create function to compute time window bounds
CREATE OR REPLACE FUNCTION public.get_window_bounds(window_name TEXT)
RETURNS TABLE(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  end_time := NOW();
  
  CASE window_name
    WHEN '7d' THEN
      start_time := end_time - INTERVAL '7 days';
    WHEN '30d' THEN
      start_time := end_time - INTERVAL '30 days';
    WHEN '6m' THEN
      start_time := end_time - INTERVAL '6 months';
    WHEN '1y' THEN
      start_time := end_time - INTERVAL '1 year';
    ELSE
      RAISE EXCEPTION 'Invalid window: %', window_name;
  END CASE;
  
  RETURN NEXT;
END;
$$;