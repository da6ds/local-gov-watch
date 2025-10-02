-- Enable anonymous/guest read access to public tables
-- These policies allow guests to view civic data without authentication

-- Allow anonymous users to read legislation
CREATE POLICY "Anonymous can read legislation"
ON public.legislation
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read meetings
CREATE POLICY "Anonymous can read meetings"
ON public.meeting
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read elections
CREATE POLICY "Anonymous can read elections"
ON public.election
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read jurisdictions
CREATE POLICY "Anonymous can read jurisdictions"
ON public.jurisdiction
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read connectors
CREATE POLICY "Anonymous can read connectors"
ON public.connector
FOR SELECT
TO anon
USING (enabled = true);

-- Allow anonymous users to read topic trends
CREATE POLICY "Anonymous can read topic trends"
ON public.topic_trend
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read tags
CREATE POLICY "Anonymous can read tags"
ON public.tag
FOR SELECT
TO anon
USING (true);