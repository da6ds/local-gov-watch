-- Create guest_jobs table for tracking refresh operations
CREATE TABLE public.guest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  scope TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  estimated_duration_ms INTEGER,
  progress_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guest_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for guest jobs (rate limited in edge function)
CREATE POLICY "Anyone can create guest jobs"
  ON public.guest_jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read guest jobs"
  ON public.guest_jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update guest jobs"
  ON public.guest_jobs
  FOR UPDATE
  USING (true);

-- Add index for efficient lookups
CREATE INDEX idx_guest_jobs_session_id ON public.guest_jobs(session_id);
CREATE INDEX idx_guest_jobs_status ON public.guest_jobs(status);