-- Add new columns to meeting table for enhanced document tracking and status
ALTER TABLE meeting
ADD COLUMN IF NOT EXISTS livestream_url TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
ADD COLUMN IF NOT EXISTS agenda_available_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS minutes_available_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for filtering by status
CREATE INDEX IF NOT EXISTS idx_meeting_status ON meeting(status);
CREATE INDEX IF NOT EXISTS idx_meeting_starts_at ON meeting(starts_at);

-- Add comments for documentation
COMMENT ON COLUMN meeting.livestream_url IS 'URL to live meeting stream';
COMMENT ON COLUMN meeting.recording_url IS 'URL to meeting recording/archive';
COMMENT ON COLUMN meeting.status IS 'Current status: upcoming, in_progress, completed, cancelled';
COMMENT ON COLUMN meeting.agenda_available_at IS 'Timestamp when agenda became available';
COMMENT ON COLUMN meeting.minutes_available_at IS 'Timestamp when minutes became available';