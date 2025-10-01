-- Add user role, onboarding tracking, and jurisdiction selection to profile table
CREATE TYPE user_role AS ENUM ('activist', 'government', 'nonprofit');

ALTER TABLE profile 
ADD COLUMN user_role user_role,
ADD COLUMN onboarding_completed boolean DEFAULT false,
ADD COLUMN selected_jurisdiction_id uuid REFERENCES jurisdiction(id);

-- Create index for faster jurisdiction lookups
CREATE INDEX idx_profile_jurisdiction ON profile(selected_jurisdiction_id);

-- Update default_scope to have a better default
ALTER TABLE profile ALTER COLUMN default_scope SET DEFAULT 'city';