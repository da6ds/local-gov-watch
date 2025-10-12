-- Security fix: Ensure digest_subscription table is properly protected
-- This migration ensures email addresses cannot be publicly harvested

-- Drop any existing public read policies
DROP POLICY IF EXISTS "Anyone can read digest subscriptions" ON public.digest_subscription;
DROP POLICY IF EXISTS "Users can read own subscription" ON public.digest_subscription;

-- Ensure public can still sign up (INSERT only)
DROP POLICY IF EXISTS "Anyone can create digest subscriptions" ON public.digest_subscription;
CREATE POLICY "Public can create digest subscriptions"
  ON public.digest_subscription 
  FOR INSERT
  WITH CHECK (true);

-- Ensure backend/service role has full access for managing subscriptions
DROP POLICY IF EXISTS "Backend can manage digest subscriptions" ON public.digest_subscription;
DROP POLICY IF EXISTS "Service role can manage digest subscriptions" ON public.digest_subscription;

CREATE POLICY "Backend can manage digest subscriptions"
  ON public.digest_subscription
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Note: Users can unsubscribe via the unsubscribe_by_token() function
-- which uses SECURITY DEFINER to update without exposing email addresses