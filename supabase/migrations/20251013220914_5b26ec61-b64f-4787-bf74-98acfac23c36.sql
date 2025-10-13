-- Add agenda and minutes status enums
CREATE TYPE agenda_status_enum AS ENUM ('not_published', 'available', 'unavailable');
CREATE TYPE minutes_status_enum AS ENUM ('not_published', 'draft', 'approved', 'unavailable');

-- Add new fields to meeting table (agenda_available_at and minutes_available_at already exist)
ALTER TABLE public.meeting
ADD COLUMN agenda_status agenda_status_enum DEFAULT 'not_published',
ADD COLUMN minutes_status minutes_status_enum DEFAULT 'not_published',
ADD COLUMN packet_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN voting_records jsonb DEFAULT '[]'::jsonb;

-- Create indexes for filtering
CREATE INDEX idx_meeting_agenda_status ON public.meeting(agenda_status);
CREATE INDEX idx_meeting_minutes_status ON public.meeting(minutes_status);

-- Backfill existing meeting statuses
UPDATE public.meeting
SET status = 'completed'
WHERE status = 'upcoming'
  AND starts_at < NOW();

-- Set agenda_status based on existing agenda_url
UPDATE public.meeting
SET agenda_status = CASE
  WHEN agenda_url IS NOT NULL THEN 'available'::agenda_status_enum
  WHEN starts_at > NOW() + INTERVAL '72 hours' THEN 'not_published'::agenda_status_enum
  ELSE 'unavailable'::agenda_status_enum
END;

-- Set agenda_available_at if not set but agenda_url exists
UPDATE public.meeting
SET agenda_available_at = starts_at - INTERVAL '72 hours'
WHERE agenda_url IS NOT NULL
  AND agenda_available_at IS NULL;

-- Set minutes_status based on existing minutes_url
UPDATE public.meeting
SET minutes_status = CASE
  WHEN minutes_url IS NOT NULL THEN 'approved'::minutes_status_enum
  WHEN status = 'completed' AND starts_at < NOW() - INTERVAL '2 weeks' THEN 'unavailable'::minutes_status_enum
  ELSE 'not_published'::minutes_status_enum
END;

-- Set minutes_available_at if not set but minutes_url exists
UPDATE public.meeting
SET minutes_available_at = starts_at + INTERVAL '2 weeks'
WHERE minutes_url IS NOT NULL
  AND minutes_available_at IS NULL;

-- Create function to automatically update meeting statuses
CREATE OR REPLACE FUNCTION update_meeting_statuses()
RETURNS void AS $$
BEGIN
  -- Mark meetings as completed if they've passed
  UPDATE public.meeting
  SET status = 'completed'
  WHERE status IN ('upcoming', 'in_progress')
    AND starts_at < NOW() - INTERVAL '3 hours';
    
  -- Mark meetings as in_progress if they're happening now
  UPDATE public.meeting
  SET status = 'in_progress'
  WHERE status = 'upcoming'
    AND starts_at <= NOW()
    AND starts_at > NOW() - INTERVAL '3 hours';
    
  -- Mark agendas as unavailable if not published 72 hours before meeting
  UPDATE public.meeting
  SET agenda_status = 'unavailable'::agenda_status_enum
  WHERE agenda_status = 'not_published'
    AND starts_at < NOW()
    AND agenda_url IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;