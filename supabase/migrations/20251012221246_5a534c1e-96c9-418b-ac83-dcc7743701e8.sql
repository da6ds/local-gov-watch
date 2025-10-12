-- Fix North Bay connector jurisdiction slugs to match expected "type:slug" format
-- The getJurisdictionId function in run-connector expects this format

UPDATE connector 
SET jurisdiction_slug = 'county:sonoma-county-ca'
WHERE key IN ('sonoma-county-meetings', 'sonoma-county-legislation');

UPDATE connector 
SET jurisdiction_slug = 'county:napa-county-ca'
WHERE key IN ('napa-county-meetings', 'napa-county-legislation');

UPDATE connector 
SET jurisdiction_slug = 'city:santa-rosa-ca'
WHERE key IN ('santa-rosa-meetings', 'santa-rosa-legislation');

UPDATE connector 
SET jurisdiction_slug = 'city:napa-ca'
WHERE key IN ('napa-city-meetings', 'napa-city-legislation');

-- Verify the updates
SELECT key, jurisdiction_slug, kind, parser_key, enabled, last_status
FROM connector 
WHERE jurisdiction_slug LIKE '%ca%'
ORDER BY jurisdiction_slug, kind;