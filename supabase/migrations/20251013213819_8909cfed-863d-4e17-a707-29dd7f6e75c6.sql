-- Add meeting_type enum
CREATE TYPE public.meeting_type AS ENUM (
  'city_council',
  'board_of_supervisors',
  'committee',
  'commission',
  'authority'
);

-- Add new columns to meeting table
ALTER TABLE public.meeting
ADD COLUMN meeting_type public.meeting_type,
ADD COLUMN is_legislative boolean DEFAULT false;

-- Update existing meetings based on body_name patterns
UPDATE public.meeting
SET 
  meeting_type = CASE
    WHEN body_name ILIKE '%city council%' THEN 'city_council'::meeting_type
    WHEN body_name ILIKE '%board of supervisors%' THEN 'board_of_supervisors'::meeting_type
    WHEN body_name ILIKE '%commissioners court%' THEN 'board_of_supervisors'::meeting_type
    WHEN body_name ILIKE '%authority%' THEN 'authority'::meeting_type
    WHEN body_name ILIKE '%commission%' THEN 'commission'::meeting_type
    WHEN body_name ILIKE '%committee%' THEN 'committee'::meeting_type
    ELSE 'committee'::meeting_type
  END,
  is_legislative = CASE
    WHEN body_name ILIKE '%city council%' THEN true
    WHEN body_name ILIKE '%board of supervisors%' THEN true
    WHEN body_name ILIKE '%commissioners court%' THEN true
    ELSE false
  END
WHERE body_name IS NOT NULL;

-- Create index for performance
CREATE INDEX idx_meeting_type ON public.meeting(meeting_type);
CREATE INDEX idx_meeting_is_legislative ON public.meeting(is_legislative);