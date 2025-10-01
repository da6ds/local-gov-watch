-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Jurisdictions table
CREATE TABLE jurisdiction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('city','county','state')) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sources table
CREATE TABLE source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('meetings','ordinances','elections','rss','docs')) NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_source_jurisdiction ON source(jurisdiction_id);
CREATE INDEX idx_source_enabled ON source(enabled);

-- Legislation table with pgvector for embeddings
CREATE TABLE legislation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction(id) ON DELETE SET NULL,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  status TEXT,
  introduced_at DATE,
  passed_at DATE,
  effective_at DATE,
  tags TEXT[] DEFAULT '{}',
  full_text TEXT,
  doc_url TEXT,
  pdf_url TEXT,
  people JSONB,
  districts TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_legislation_jurisdiction ON legislation(jurisdiction_id);
CREATE INDEX idx_legislation_status ON legislation(status);
CREATE INDEX idx_legislation_tags ON legislation USING GIN(tags);
CREATE INDEX idx_legislation_dates ON legislation(introduced_at, passed_at, effective_at);
CREATE INDEX idx_legislation_fulltext ON legislation USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(full_text,'')));
CREATE INDEX idx_legislation_embedding ON legislation USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Meetings table
CREATE TABLE meeting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction(id) ON DELETE SET NULL,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  external_id TEXT,
  title TEXT,
  body_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  agenda_url TEXT,
  minutes_url TEXT,
  attachments JSONB,
  extracted_text TEXT,
  ai_summary TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meeting_jurisdiction ON meeting(jurisdiction_id);
CREATE INDEX idx_meeting_starts_at ON meeting(starts_at);
CREATE INDEX idx_meeting_body ON meeting(body_name);
CREATE INDEX idx_meeting_embedding ON meeting USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Elections table
CREATE TABLE election (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction(id) ON DELETE SET NULL,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('general','primary','runoff','special')) NOT NULL,
  date DATE NOT NULL,
  registration_deadline DATE,
  info_url TEXT,
  results_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_election_date ON election(date);
CREATE INDEX idx_election_jurisdiction ON election(jurisdiction_id);

-- Tags table
CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table for user data
CREATE TABLE profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Watchlists table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profile(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);

-- Watchlist items table
CREATE TABLE watchlist_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES watchlist(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('legislation','meeting','election')) NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_watchlist_item_watchlist ON watchlist_item(watchlist_id);
CREATE INDEX idx_watchlist_item_entity ON watchlist_item(entity_type, entity_id);

-- Subscriptions table for email alerts
CREATE TABLE subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profile(id) ON DELETE CASCADE,
  query_json JSONB NOT NULL,
  cadence TEXT CHECK (cadence IN ('instant','daily','weekly')) NOT NULL DEFAULT 'weekly',
  channel TEXT CHECK (channel IN ('email')) NOT NULL DEFAULT 'email',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscription_user ON subscription(user_id);
CREATE INDEX idx_subscription_cadence ON subscription(cadence);

-- Ingest runs table for tracking ingestion jobs
CREATE TABLE ingest_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  stats_json JSONB,
  log TEXT
);

CREATE INDEX idx_ingest_run_source ON ingest_run(source_id);
CREATE INDEX idx_ingest_run_started ON ingest_run(started_at DESC);

-- AI usage tracking for cost control
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_created ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_entity ON ai_usage(entity_type, entity_id);

-- Insert seed jurisdictions
INSERT INTO jurisdiction (type, name, slug) VALUES
  ('city', 'Austin, TX', 'austin-tx'),
  ('county', 'Travis County, TX', 'travis-county-tx'),
  ('state', 'Texas', 'texas');

-- Enable RLS on all tables
ALTER TABLE jurisdiction ENABLE ROW LEVEL SECURITY;
ALTER TABLE source ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE election ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Public read access for core tables
CREATE POLICY "Public read jurisdictions" ON jurisdiction FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read sources" ON source FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read legislation" ON legislation FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read meetings" ON meeting FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read elections" ON election FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read tags" ON tag FOR SELECT TO anon, authenticated USING (true);

-- Profile policies
CREATE POLICY "Users can read own profile" ON profile FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profile FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Watchlist policies
CREATE POLICY "Users can read own watchlists" ON watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own watchlists" ON watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlists" ON watchlist FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlists" ON watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Watchlist item policies
CREATE POLICY "Users can read own watchlist items" ON watchlist_item FOR SELECT TO authenticated USING (
  watchlist_id IN (SELECT id FROM watchlist WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create own watchlist items" ON watchlist_item FOR INSERT TO authenticated WITH CHECK (
  watchlist_id IN (SELECT id FROM watchlist WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own watchlist items" ON watchlist_item FOR DELETE TO authenticated USING (
  watchlist_id IN (SELECT id FROM watchlist WHERE user_id = auth.uid())
);

-- Subscription policies
CREATE POLICY "Users can read own subscriptions" ON subscription FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON subscription FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscription FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON subscription FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admin policies for source management
CREATE POLICY "Admins can manage sources" ON source FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profile WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can view ingest runs" ON ingest_run FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profile WHERE id = auth.uid() AND is_admin = true)
);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for semantic search using embeddings
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  entity_type text,
  title text,
  summary text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      l.id,
      'legislation'::text as entity_type,
      l.title,
      COALESCE(l.ai_summary, l.summary) as summary,
      1 - (l.embedding <=> query_embedding) as similarity
    FROM legislation l
    WHERE l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
    ORDER BY l.embedding <=> query_embedding
    LIMIT match_count
  )
  UNION ALL
  (
    SELECT 
      m.id,
      'meeting'::text as entity_type,
      m.title,
      m.ai_summary as summary,
      1 - (m.embedding <=> query_embedding) as similarity
    FROM meeting m
    WHERE m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count
  );
END;
$$ LANGUAGE plpgsql;