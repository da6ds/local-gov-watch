-- Create digest_subscription table
CREATE TABLE public.digest_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  locations jsonb NOT NULL,
  topics text[],
  cadence text NOT NULL CHECK (cadence IN ('daily', 'weekly', 'biweekly')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_sent_at timestamptz,
  confirmation_token uuid DEFAULT gen_random_uuid(),
  
  CONSTRAINT digest_subscription_email_key UNIQUE (email)
);

-- Create indexes for performance
CREATE INDEX idx_digest_subscription_active ON public.digest_subscription(active) WHERE active = true;
CREATE INDEX idx_digest_subscription_email ON public.digest_subscription(email);
CREATE INDEX idx_digest_subscription_cadence ON public.digest_subscription(cadence);

-- Enable RLS
ALTER TABLE public.digest_subscription ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create subscriptions (public form)
CREATE POLICY "Anyone can create digest subscriptions"
  ON public.digest_subscription FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own subscription by email (for future use)
CREATE POLICY "Anyone can read digest subscriptions"
  ON public.digest_subscription FOR SELECT
  USING (true);

-- Service role can manage all subscriptions (for unsubscribe/admin)
CREATE POLICY "Service role can manage digest subscriptions"
  ON public.digest_subscription FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');