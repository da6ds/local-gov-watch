-- Add North Bay jurisdictions for California expansion

-- California state
INSERT INTO jurisdiction (type, name, slug, parent_jurisdiction_id) VALUES
  ('state', 'California', 'california', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Counties
INSERT INTO jurisdiction (type, name, slug, parent_jurisdiction_id) VALUES
  ('county', 'Marin County, CA', 'marin-county-ca', (SELECT id FROM jurisdiction WHERE slug = 'california')),
  ('county', 'Sonoma County, CA', 'sonoma-county-ca', (SELECT id FROM jurisdiction WHERE slug = 'california')),
  ('county', 'Napa County, CA', 'napa-county-ca', (SELECT id FROM jurisdiction WHERE slug = 'california'))
ON CONFLICT (slug) DO NOTHING;

-- Cities
INSERT INTO jurisdiction (type, name, slug, parent_jurisdiction_id) VALUES
  ('city', 'San Rafael, CA', 'san-rafael-ca', (SELECT id FROM jurisdiction WHERE slug = 'marin-county-ca')),
  ('city', 'Santa Rosa, CA', 'santa-rosa-ca', (SELECT id FROM jurisdiction WHERE slug = 'sonoma-county-ca')),
  ('city', 'Napa, CA', 'napa-ca', (SELECT id FROM jurisdiction WHERE slug = 'napa-county-ca')),
  ('city', 'Petaluma, CA', 'petaluma-ca', (SELECT id FROM jurisdiction WHERE slug = 'sonoma-county-ca'))
ON CONFLICT (slug) DO NOTHING;

-- Add connectors for Legistar-based jurisdictions
INSERT INTO connector (
  key, kind, url, jurisdiction_slug, parser_key, enabled, schedule
) VALUES
  -- Sonoma County Board of Supervisors
  ('sonoma-county-meetings', 'meetings', 'https://sonoma-county.legistar.com', 'sonoma-county-ca', 'legistar.meetings', true, 'every 6h'),
  ('sonoma-county-legislation', 'ordinances', 'https://sonoma-county.legistar.com', 'sonoma-county-ca', 'legistar.legislation', true, 'every 6h'),
  
  -- Napa County Board of Supervisors  
  ('napa-county-meetings', 'meetings', 'https://napa.legistar.com', 'napa-county-ca', 'legistar.meetings', true, 'every 6h'),
  ('napa-county-legislation', 'ordinances', 'https://napa.legistar.com', 'napa-county-ca', 'legistar.legislation', true, 'every 6h'),
  
  -- Santa Rosa City Council
  ('santa-rosa-meetings', 'meetings', 'https://santa-rosa.legistar.com', 'santa-rosa-ca', 'legistar.meetings', true, 'every 6h'),
  ('santa-rosa-legislation', 'ordinances', 'https://santa-rosa.legistar.com', 'santa-rosa-ca', 'legistar.legislation', true, 'every 6h'),
  
  -- Napa City Council
  ('napa-city-meetings', 'meetings', 'https://napacity.legistar.com', 'napa-ca', 'legistar.meetings', true, 'every 6h'),
  ('napa-city-legislation', 'ordinances', 'https://napacity.legistar.com', 'napa-ca', 'legistar.legislation', true, 'every 6h')
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  url = EXCLUDED.url,
  schedule = EXCLUDED.schedule;

-- Create comment for documentation
COMMENT ON TABLE connector IS 'Data source connectors for ingesting legislation, meetings, and elections from various jurisdictions';