-- Create guest_profile table for ephemeral guest sessions
CREATE TABLE public.guest_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_role text,
  selected_jurisdiction_id uuid REFERENCES public.jurisdiction(id),
  default_scope text DEFAULT 'city',
  topics text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  last_active_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on guest_profile
ALTER TABLE public.guest_profile ENABLE ROW LEVEL SECURITY;

-- Public can read their own guest profile by session_id
CREATE POLICY "Anyone can read guest profiles"
ON public.guest_profile
FOR SELECT
USING (true);

-- Public can insert guest profiles
CREATE POLICY "Anyone can create guest profiles"
ON public.guest_profile
FOR INSERT
WITH CHECK (true);

-- Public can update their own guest profile
CREATE POLICY "Anyone can update guest profiles"
ON public.guest_profile
FOR UPDATE
USING (true);

-- Create index for session_id lookups
CREATE INDEX idx_guest_profile_session_id ON public.guest_profile(session_id);

-- Create index for cleanup of expired sessions
CREATE INDEX idx_guest_profile_expires_at ON public.guest_profile(expires_at);

-- Create function to clean up expired guest sessions (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.guest_profile
  WHERE expires_at < now();
END;
$$;