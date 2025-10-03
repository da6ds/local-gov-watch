-- Add contact information fields to jurisdiction table
ALTER TABLE public.jurisdiction 
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Add sample contact data for existing jurisdictions
UPDATE public.jurisdiction 
SET 
  website = 'https://www.austintexas.gov',
  phone = '(512) 974-2000',
  email = 'atxclerk@austintexas.gov'
WHERE slug = 'austin-tx';

UPDATE public.jurisdiction
SET
  website = 'https://www.traviscountytx.gov',
  phone = '(512) 854-9473',
  email = 'county.clerk@traviscountytx.gov'
WHERE slug = 'travis-county-tx';

UPDATE public.jurisdiction
SET
  website = 'https://www.texas.gov',
  phone = '(512) 463-4630',
  email = 'sos.state@sos.texas.gov'
WHERE slug = 'texas';