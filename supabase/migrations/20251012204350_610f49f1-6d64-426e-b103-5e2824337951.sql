-- Add legislation metadata fields for authorship and jurisdiction
ALTER TABLE legislation
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS author_role TEXT,
ADD COLUMN IF NOT EXISTS coauthors TEXT[],
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS district_number INTEGER;

-- Add indexes for filtering performance
CREATE INDEX IF NOT EXISTS idx_legislation_author ON legislation(author);
CREATE INDEX IF NOT EXISTS idx_legislation_city ON legislation(city);
CREATE INDEX IF NOT EXISTS idx_legislation_district_number ON legislation(district_number);

-- Add column comments for documentation
COMMENT ON COLUMN legislation.author IS 'Primary author/sponsor of the legislation (e.g., council member name)';
COMMENT ON COLUMN legislation.author_role IS 'Role of the author (e.g., Council Member, Supervisor)';
COMMENT ON COLUMN legislation.coauthors IS 'Array of co-sponsor names';
COMMENT ON COLUMN legislation.city IS 'City where legislation was introduced';
COMMENT ON COLUMN legislation.county IS 'County jurisdiction';
COMMENT ON COLUMN legislation.district IS 'District label (e.g., "District 3")';
COMMENT ON COLUMN legislation.district_number IS 'District number for filtering/sorting';