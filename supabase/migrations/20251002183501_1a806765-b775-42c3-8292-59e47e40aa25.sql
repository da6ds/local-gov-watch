-- Fix search_path security warnings

CREATE OR REPLACE FUNCTION public.normalize_scope_key(scope_text TEXT)
RETURNS TEXT
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

CREATE OR REPLACE FUNCTION public.get_window_bounds(window_name TEXT)
RETURNS TABLE(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
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