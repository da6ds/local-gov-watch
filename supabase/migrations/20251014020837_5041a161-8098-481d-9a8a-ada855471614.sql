-- Add live_stream_url field to meetings table
ALTER TABLE public.meeting
ADD COLUMN IF NOT EXISTS live_stream_url TEXT;

COMMENT ON COLUMN public.meeting.live_stream_url IS 'URL for live streaming (Zoom, YouTube, Granicus, etc.)';

-- Add index for efficient filtering of live meetings
CREATE INDEX IF NOT EXISTS idx_meeting_live_stream ON public.meeting(live_stream_url) WHERE live_stream_url IS NOT NULL;