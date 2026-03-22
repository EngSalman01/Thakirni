-- Fix: ensure plan_tier defaults to 'FREE' for all new users
-- and back-fill any existing rows that have NULL or empty plan_tier

ALTER TABLE profiles
  ALTER COLUMN plan_tier SET DEFAULT 'FREE';

UPDATE profiles
SET plan_tier = 'FREE'
WHERE plan_tier IS NULL OR plan_tier = '';
