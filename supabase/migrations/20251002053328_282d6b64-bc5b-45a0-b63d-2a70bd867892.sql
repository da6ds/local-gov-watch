-- Create item_topic table for AI-extracted topics
CREATE TABLE IF NOT EXISTS public.item_topic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('meeting', 'legislation', 'election')),
  topic TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  jurisdiction_id UUID REFERENCES public.jurisdiction(id),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  doc_hash TEXT,
  cache_version TEXT DEFAULT 'topics-v1'
);

-- Enable RLS on item_topic
ALTER TABLE public.item_topic ENABLE ROW LEVEL SECURITY;

-- Anonymous read for item_topic
CREATE POLICY "Anonymous can read item topics" ON public.item_topic
  FOR SELECT USING (true);

-- Create indexes for item_topic
CREATE INDEX IF NOT EXISTS idx_item_topic_topic_jurisdiction ON public.item_topic(topic, jurisdiction_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_topic_item ON public.item_topic(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_item_topic_doc_hash ON public.item_topic(doc_hash, cache_version);

-- Create plan table for tiered pricing scaffolding
CREATE TABLE IF NOT EXISTS public.plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  max_jurisdictions INTEGER NOT NULL,
  max_topics INTEGER,
  price_cents INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on plan
ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;

-- Anonymous read for plans
CREATE POLICY "Anyone can read active plans" ON public.plan
  FOR SELECT USING (is_active = true);

-- Insert default plans
INSERT INTO public.plan (name, slug, max_jurisdictions, max_topics, price_cents, features) VALUES
  ('Free', 'free', 3, 10, 0, '["Up to 3 cities/counties", "Basic alerts", "Public data access"]'::jsonb),
  ('Plus', 'plus', 5, 20, 999, '["Up to 5 jurisdictions", "Priority alerts", "Email digests", "Advanced filters"]'::jsonb),
  ('Pro', 'pro', 15, 50, 2999, '["Up to 15 jurisdictions", "Regional coverage", "API access", "Custom reports"]'::jsonb),
  ('Enterprise', 'enterprise', 999, 999, 9999, '["Unlimited jurisdictions", "US-wide coverage", "Dedicated support", "Custom integrations"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Add performance indexes on date columns
CREATE INDEX IF NOT EXISTS idx_meeting_starts_at ON public.meeting(starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_election_date ON public.election(date DESC);
CREATE INDEX IF NOT EXISTS idx_legislation_updated_at ON public.legislation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_legislation_introduced_at ON public.legislation(introduced_at DESC);