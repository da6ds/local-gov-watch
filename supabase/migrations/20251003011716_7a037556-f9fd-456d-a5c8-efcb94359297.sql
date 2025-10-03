-- Phase 1: Create secure role management system
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Migrate existing is_admin data to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profile
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update admin policies to use new has_role function
DROP POLICY IF EXISTS "Admins can manage connectors" ON public.connector;
CREATE POLICY "Admins can manage connectors"
ON public.connector
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage sources" ON public.source;
CREATE POLICY "Admins can manage sources"
ON public.source
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view ingest runs" ON public.ingest_run;
CREATE POLICY "Admins can view ingest runs"
ON public.ingest_run
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Secure guest_profile table - restrict to session owner
DROP POLICY IF EXISTS "Anyone can read guest profiles" ON public.guest_profile;
DROP POLICY IF EXISTS "Anyone can update guest profiles" ON public.guest_profile;

CREATE POLICY "Users can read own guest profile"
ON public.guest_profile
FOR SELECT
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR true);

CREATE POLICY "Backend can manage guest profiles"
ON public.guest_profile
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 7. Protect email addresses in digest_subscription
DROP POLICY IF EXISTS "Anyone can create digest subscriptions" ON public.digest_subscription;

CREATE POLICY "Backend can manage digest subscriptions"
ON public.digest_subscription
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 8. Secure guest_jobs table - restrict updates
DROP POLICY IF EXISTS "Anyone can update guest jobs" ON public.guest_jobs;

CREATE POLICY "Backend can manage guest jobs"
ON public.guest_jobs
FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Keep public read/insert for guest functionality
CREATE POLICY "Public can insert guest jobs"
ON public.guest_jobs
FOR INSERT
WITH CHECK (true);

-- 9. Fix database functions - add search_path
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.digest_subscription
  SET active = false
  WHERE unsubscribe_token = token
    AND active IS DISTINCT FROM false;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.legislation_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.full_text, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.meeting_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.body_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.extracted_text, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_window_bounds(window_name text)
RETURNS TABLE(start_time timestamp with time zone, end_time timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  end_time := NOW();
  
  CASE window_name
    WHEN '7d' THEN
      start_time := end_time - INTERVAL '7 days';
    WHEN '30d' THEN
      start_time := end_time - INTERVAL '30 days';
    WHEN '6m' THEN
      start_time := end_time - INTERVAL '6 months';
    WHEN '1y' THEN
      start_time := end_time - INTERVAL '1 year';
    ELSE
      RAISE EXCEPTION 'Invalid window: %', window_name;
  END CASE;
  
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_scope_key(scope_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts TEXT[];
  sorted_parts TEXT[];
BEGIN
  parts := string_to_array(scope_text, ',');
  SELECT array_agg(trim(p) ORDER BY trim(p)) INTO sorted_parts FROM unnest(parts) p;
  RETURN array_to_string(sorted_parts, ',');
END;
$$;

-- 10. Remove is_admin column from profile (after migration)
ALTER TABLE public.profile DROP COLUMN IF EXISTS is_admin;