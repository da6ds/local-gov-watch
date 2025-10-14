-- Add source_detail_url field to store meeting detail page URLs for minutes discovery
ALTER TABLE meeting ADD COLUMN source_detail_url TEXT;

-- Create index for efficient querying
CREATE INDEX idx_meeting_source_detail_url ON meeting(source_detail_url);

-- Create composite index for efficient minutes discovery queries
CREATE INDEX idx_meeting_minutes_discovery 
  ON meeting(status, minutes_url, starts_at) 
  WHERE status = 'completed' AND minutes_url IS NULL;