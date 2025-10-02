-- Drop and recreate item_topic table
DROP TABLE IF EXISTS public.item_topic CASCADE;

CREATE TABLE public.item_topic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('meeting', 'legislation', 'election')),
  topic TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  jurisdiction_id UUID REFERENCES public.jurisdiction(id),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  doc_hash TEXT,
  cache_version TEXT DEFAULT 'topics-v1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for item_topic
CREATE INDEX idx_item_topic_item ON public.item_topic(item_id, item_type);
CREATE INDEX idx_item_topic_topic_jurisdiction ON public.item_topic(topic, jurisdiction_id, occurred_at DESC);
CREATE INDEX idx_item_topic_doc_hash ON public.item_topic(doc_hash, cache_version);

-- Enable RLS
ALTER TABLE public.item_topic ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads
CREATE POLICY "Anonymous can read item topics"
  ON public.item_topic FOR SELECT
  USING (true);

-- Drop and recreate topic_trend table
DROP TABLE IF EXISTS public.topic_trend CASCADE;

CREATE TABLE public.topic_trend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  jurisdiction_id UUID REFERENCES public.jurisdiction(id),
  time_window TEXT NOT NULL CHECK (time_window IN ('7d', '30d', '180d', '365d')),
  period_start DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  meeting_count INTEGER DEFAULT 0,
  legislation_count INTEGER DEFAULT 0,
  election_count INTEGER DEFAULT 0,
  new_since_prev INTEGER DEFAULT 0,
  pct_change DOUBLE PRECISION DEFAULT 0.0,
  spread_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  item_ids UUID[] NOT NULL DEFAULT '{}',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(topic, jurisdiction_id, time_window, period_start)
);

-- Create indexes for topic_trend
CREATE INDEX idx_topic_trend_topic_jurisdiction ON public.topic_trend(topic, jurisdiction_id, time_window, period_start DESC);
CREATE INDEX idx_topic_trend_window ON public.topic_trend(time_window, period_start DESC);
CREATE INDEX idx_topic_trend_count ON public.topic_trend(item_count DESC);

-- Enable RLS
ALTER TABLE public.topic_trend ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads
CREATE POLICY "Anonymous can read topic trends"
  ON public.topic_trend FOR SELECT
  USING (true);

-- Add indexes for performance on existing tables (IF NOT EXISTS to avoid errors)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meeting_starts_at') THEN
    CREATE INDEX idx_meeting_starts_at ON public.meeting(starts_at) WHERE starts_at IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_election_date') THEN
    CREATE INDEX idx_election_date ON public.election(date) WHERE date IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_legislation_updated_at') THEN
    CREATE INDEX idx_legislation_updated_at ON public.legislation(updated_at) WHERE updated_at IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_legislation_introduced_at') THEN
    CREATE INDEX idx_legislation_introduced_at ON public.legislation(introduced_at) WHERE introduced_at IS NOT NULL;
  END IF;
END
$$;