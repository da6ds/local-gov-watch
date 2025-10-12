-- Add district fields to legislation table
ALTER TABLE legislation
ADD COLUMN IF NOT EXISTS city_district INTEGER,
ADD COLUMN IF NOT EXISTS county_district INTEGER,
ADD COLUMN IF NOT EXISTS state_senate_district INTEGER,
ADD COLUMN IF NOT EXISTS state_assembly_district INTEGER,
ADD COLUMN IF NOT EXISTS congressional_district INTEGER,
ADD COLUMN IF NOT EXISTS state_senator TEXT,
ADD COLUMN IF NOT EXISTS assembly_member TEXT,
ADD COLUMN IF NOT EXISTS congressional_rep TEXT;

-- Add same fields to meeting table
ALTER TABLE meeting
ADD COLUMN IF NOT EXISTS city_district INTEGER,
ADD COLUMN IF NOT EXISTS county_district INTEGER,
ADD COLUMN IF NOT EXISTS state_senate_district INTEGER,
ADD COLUMN IF NOT EXISTS state_assembly_district INTEGER,
ADD COLUMN IF NOT EXISTS congressional_district INTEGER,
ADD COLUMN IF NOT EXISTS state_senator TEXT,
ADD COLUMN IF NOT EXISTS assembly_member TEXT,
ADD COLUMN IF NOT EXISTS congressional_rep TEXT;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_legislation_state_senate ON legislation(state_senate_district);
CREATE INDEX IF NOT EXISTS idx_legislation_state_assembly ON legislation(state_assembly_district);
CREATE INDEX IF NOT EXISTS idx_legislation_congressional ON legislation(congressional_district);

CREATE INDEX IF NOT EXISTS idx_meeting_state_senate ON meeting(state_senate_district);
CREATE INDEX IF NOT EXISTS idx_meeting_state_assembly ON meeting(state_assembly_district);
CREATE INDEX IF NOT EXISTS idx_meeting_congressional ON meeting(congressional_district);

-- Add comments for documentation
COMMENT ON COLUMN legislation.state_senate_district IS 'State Senate District (CA: 1-40, TX: 1-31)';
COMMENT ON COLUMN legislation.state_assembly_district IS 'State Assembly/House District (CA: 1-80, TX: 1-150)';
COMMENT ON COLUMN legislation.congressional_district IS 'US Congressional District';

COMMENT ON COLUMN meeting.state_senate_district IS 'State Senate District (CA: 1-40, TX: 1-31)';
COMMENT ON COLUMN meeting.state_assembly_district IS 'State Assembly/House District (CA: 1-80, TX: 1-150)';
COMMENT ON COLUMN meeting.congressional_district IS 'US Congressional District';

-- Update existing Austin demo legislation with Texas district info
UPDATE legislation
SET 
  state_senate_district = 14,
  state_assembly_district = 49,
  congressional_district = 25,
  state_senator = 'Sarah Eckhardt',
  assembly_member = 'Gina Hinojosa',
  congressional_rep = 'Roger Williams'
WHERE (city ILIKE '%Austin%' OR county ILIKE '%Travis%') 
  AND state_senate_district IS NULL;

-- Update existing Austin demo meetings with Texas district info
UPDATE meeting
SET 
  state_senate_district = 14,
  state_assembly_district = 49,
  congressional_district = 25,
  state_senator = 'Sarah Eckhardt',
  assembly_member = 'Gina Hinojosa',
  congressional_rep = 'Roger Williams'
WHERE (jurisdiction_id IN (
  SELECT id FROM jurisdiction WHERE slug LIKE '%austin%' OR slug LIKE '%travis%'
))
AND state_senate_district IS NULL;