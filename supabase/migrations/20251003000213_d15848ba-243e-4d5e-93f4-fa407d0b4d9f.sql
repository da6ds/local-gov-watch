-- Refine fix: use a SECURITY DEFINER RPC for unsubscribe-by-token and remove incorrect update policy

-- 1) Drop the previously added UPDATE policy (not usable without custom JWT claims)
DROP POLICY IF EXISTS "Users can update own subscription via token" ON public.digest_subscription;

-- 2) Create secure RPC to unsubscribe by token without exposing emails
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

-- 3) Lock down function privileges: only allow anon/authenticated/service_role to call it
REVOKE ALL ON FUNCTION public.unsubscribe_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(uuid) TO anon, authenticated, service_role;