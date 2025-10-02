-- Add source_id to connector table
ALTER TABLE public.connector ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.source(id);

-- Update existing connectors to use proper parser keys
UPDATE public.connector SET parser_key = 'austin.councilMeetings' WHERE parser_key = 'austin_council_meetings';
UPDATE public.connector SET parser_key = 'austin.ordinances' WHERE parser_key = 'austin_ordinances';
UPDATE public.connector SET parser_key = 'travis.elections' WHERE parser_key = 'travis_elections';
