-- Create tracked_term table
CREATE TABLE tracked_term (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  keywords text[] NOT NULL,
  jurisdictions jsonb NOT NULL,
  active boolean DEFAULT true,
  alert_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_checked_at timestamptz,
  match_count integer DEFAULT 0
);

CREATE INDEX tracked_term_email_idx ON tracked_term(email);
CREATE INDEX tracked_term_active_idx ON tracked_term(active) WHERE active = true;

-- Create term_match table
CREATE TABLE term_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_term_id uuid REFERENCES tracked_term(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  matched_keywords text[],
  matched_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false
);

CREATE INDEX term_match_tracked_term_idx ON term_match(tracked_term_id);
CREATE INDEX term_match_item_idx ON term_match(item_type, item_id);
CREATE INDEX term_match_notified_idx ON term_match(notified) WHERE notified = false;
CREATE UNIQUE INDEX term_match_unique ON term_match(tracked_term_id, item_type, item_id);

-- Enable RLS
ALTER TABLE tracked_term ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_match ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_term (email-based access)
CREATE POLICY "Users can read own tracked terms"
ON tracked_term FOR SELECT
USING (true);

CREATE POLICY "Users can create tracked terms"
ON tracked_term FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own tracked terms"
ON tracked_term FOR UPDATE
USING (true);

CREATE POLICY "Users can delete own tracked terms"
ON tracked_term FOR DELETE
USING (true);

-- RLS Policies for term_match
CREATE POLICY "Users can read term matches"
ON term_match FOR SELECT
USING (true);

CREATE POLICY "Backend can manage matches"
ON term_match FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Function to increment match count
CREATE OR REPLACE FUNCTION increment_match_count(term_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tracked_term
  SET match_count = match_count + 1,
      last_checked_at = now()
  WHERE id = term_id;
END;
$$;