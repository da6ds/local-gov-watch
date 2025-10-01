-- Add hierarchy to jurisdictions
ALTER TABLE jurisdiction ADD COLUMN parent_jurisdiction_id uuid REFERENCES jurisdiction(id);
CREATE INDEX idx_jurisdiction_parent ON jurisdiction(parent_jurisdiction_id);

-- Add user default scope
ALTER TABLE profile ADD COLUMN default_scope text CHECK (default_scope IN ('city', 'county', 'state')) DEFAULT 'county';
ALTER TABLE profile ADD COLUMN default_jurisdiction_id uuid REFERENCES jurisdiction(id);

-- Topic trends table
CREATE TABLE topic_trend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id uuid REFERENCES jurisdiction(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  tag text NOT NULL,
  cluster_label text,
  item_ids uuid[] NOT NULL,
  cities text[] NOT NULL,
  item_count int NOT NULL,
  ai_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_topic_trend_county_week ON topic_trend(county_id, week_start);
CREATE INDEX idx_topic_trend_tag ON topic_trend(tag);

-- Update subscriptions to support digest preferences
ALTER TABLE subscription ADD COLUMN scope text CHECK (scope IN ('city', 'county', 'both')) DEFAULT 'county';
ALTER TABLE subscription ADD COLUMN topics text[] DEFAULT '{}';

-- Enable RLS on topic_trend
ALTER TABLE topic_trend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read topic trends"
ON topic_trend FOR SELECT
USING (true);

-- Update jurisdiction hierarchy for seed data
UPDATE jurisdiction SET parent_jurisdiction_id = (
  SELECT id FROM jurisdiction WHERE slug = 'travis-county-tx'
) WHERE slug = 'austin-tx';

UPDATE jurisdiction SET parent_jurisdiction_id = (
  SELECT id FROM jurisdiction WHERE slug = 'texas'
) WHERE slug = 'travis-county-tx';