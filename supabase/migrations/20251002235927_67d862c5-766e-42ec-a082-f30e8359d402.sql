-- Fix critical security issue: Remove public read access to subscriber emails
-- This prevents email harvesting by spammers while maintaining functionality

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Anyone can read digest subscriptions" ON public.digest_subscription;

-- Allow users to update their own subscription via unsubscribe token
-- This enables the unsubscribe flow without exposing email addresses
CREATE POLICY "Users can update own subscription via token"
ON public.digest_subscription
FOR UPDATE
TO public
USING (unsubscribe_token = (current_setting('request.jwt.claims', true)::jsonb->>'unsubscribe_token')::uuid)
WITH CHECK (unsubscribe_token = (current_setting('request.jwt.claims', true)::jsonb->>'unsubscribe_token')::uuid);

-- Note: Public INSERT policy remains (users can subscribe without login)
-- Note: Service role policy remains (for sending digest emails)