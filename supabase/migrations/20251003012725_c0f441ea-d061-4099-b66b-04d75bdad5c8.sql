-- Fix remaining security issues from linter

-- 1. Add RLS policies for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix remaining functions missing search_path
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

-- Update semantic_search function
CREATE OR REPLACE FUNCTION public.semantic_search(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10)
RETURNS TABLE(id uuid, entity_type text, title text, summary text, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      l.id,
      'legislation'::text as entity_type,
      l.title,
      COALESCE(l.ai_summary, l.summary) as summary,
      1 - (l.embedding <=> query_embedding) as similarity
    FROM legislation l
    WHERE l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
    ORDER BY l.embedding <=> query_embedding
    LIMIT match_count
  )
  UNION ALL
  (
    SELECT 
      m.id,
      'meeting'::text as entity_type,
      m.title,
      m.ai_summary as summary,
      1 - (m.embedding <=> query_embedding) as similarity
    FROM meeting m
    WHERE m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count
  );
END;
$$;

-- Update cleanup_expired_guest_sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.guest_profile
  WHERE expires_at < now();
END;
$$;