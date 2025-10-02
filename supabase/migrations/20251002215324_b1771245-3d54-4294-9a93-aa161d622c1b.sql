-- Remove unique constraint on email (allow multiple subscriptions per email)
ALTER TABLE public.digest_subscription DROP CONSTRAINT IF EXISTS digest_subscription_email_key;

-- Add unsubscribe_token column
ALTER TABLE public.digest_subscription 
ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Add index on email for performance
CREATE INDEX IF NOT EXISTS idx_digest_subscription_email_lookup ON public.digest_subscription(email);

-- Add index on unsubscribe_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_digest_subscription_unsubscribe_token ON public.digest_subscription(unsubscribe_token);

-- Add index on active subscriptions for cron jobs
CREATE INDEX IF NOT EXISTS idx_digest_subscription_active_cadence ON public.digest_subscription(active, cadence) WHERE active = true;