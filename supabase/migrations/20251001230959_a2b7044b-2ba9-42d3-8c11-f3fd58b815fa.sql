-- Create connector table for registry
CREATE TABLE public.connector (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  jurisdiction_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('meetings', 'ordinances', 'elections', 'rss', 'state')),
  url TEXT NOT NULL,
  parser_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  schedule TEXT DEFAULT 'every 6h',
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_connector_jurisdiction_kind_enabled ON public.connector(jurisdiction_slug, kind, enabled);

-- Enable RLS
ALTER TABLE public.connector ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage connectors"
ON public.connector
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.id = auth.uid() AND profile.is_admin = true
  )
);

-- Public can view enabled connectors
CREATE POLICY "Public can view enabled connectors"
ON public.connector
FOR SELECT
USING (enabled = true);

-- Update source table to link to connector
ALTER TABLE public.source ADD COLUMN IF NOT EXISTS connector_id UUID REFERENCES public.connector(id);

-- Insert Austin connectors (enabled)
INSERT INTO public.connector (key, jurisdiction_slug, kind, url, parser_key, enabled, notes) VALUES
  ('austin.councilMeetings', 'city:austin-tx', 'meetings', 'https://www.austintexas.gov/department/city-council/council-meetings', 'austin_council_meetings', true, 'Austin City Council meetings - agendas, minutes, attachments'),
  ('austin.ordinances', 'city:austin-tx', 'ordinances', 'https://www.austintexas.gov/department/ordinances', 'austin_ordinances', true, 'Austin city ordinances and resolutions'),
  ('travis.elections', 'county:travis-county-tx', 'elections', 'https://countyclerk.traviscountytx.gov/elections/', 'travis_elections', true, 'Travis County election information'),
  ('texas.bills', 'state:texas', 'state', 'https://capitol.texas.gov/', 'texas_bills', true, 'Texas state legislature bills');

-- Insert LA connectors (disabled)
INSERT INTO public.connector (key, jurisdiction_slug, kind, url, parser_key, enabled, notes) VALUES
  ('la.councilFiles', 'city:los-angeles-ca', 'meetings', 'https://cityclerk.lacity.org/lacityclerkconnect/', 'la_council_files', false, 'LA City Council files - meetings and legislation'),
  ('la.county.board', 'county:los-angeles-ca', 'meetings', 'https://bos.lacounty.gov/', 'la_county_board', false, 'LA County Board of Supervisors meetings'),
  ('la.county.elections', 'county:los-angeles-ca', 'elections', 'https://lavote.gov/', 'la_elections', false, 'LA County election information'),
  ('california.bills', 'state:california', 'state', 'https://leginfo.legislature.ca.gov/', 'california_bills', false, 'California state legislature bills');