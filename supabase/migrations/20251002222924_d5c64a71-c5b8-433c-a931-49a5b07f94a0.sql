-- Add search_vector columns to legislation and meeting tables for optimized full-text search

-- ============================================================
-- LEGISLATION TABLE SEARCH ENHANCEMENTS
-- ============================================================

-- Add search_vector column to legislation table
ALTER TABLE legislation ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update legislation search vector with weighted fields
CREATE OR REPLACE FUNCTION legislation_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.full_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS legislation_search_vector_trigger ON legislation;
CREATE TRIGGER legislation_search_vector_trigger
BEFORE INSERT OR UPDATE ON legislation
FOR EACH ROW EXECUTE FUNCTION legislation_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS legislation_search_vector_idx ON legislation USING gin(search_vector);

-- Populate search_vector for existing records
UPDATE legislation SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(full_text, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================================
-- MEETING TABLE SEARCH ENHANCEMENTS
-- ============================================================

-- Add search_vector column to meeting table
ALTER TABLE meeting ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update meeting search vector with weighted fields
CREATE OR REPLACE FUNCTION meeting_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.body_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.extracted_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS meeting_search_vector_trigger ON meeting;
CREATE TRIGGER meeting_search_vector_trigger
BEFORE INSERT OR UPDATE ON meeting
FOR EACH ROW EXECUTE FUNCTION meeting_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS meeting_search_vector_idx ON meeting USING gin(search_vector);

-- Populate search_vector for existing records
UPDATE meeting SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(extracted_text, '')), 'C')
WHERE search_vector IS NULL;