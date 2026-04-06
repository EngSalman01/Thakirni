-- Fix: affiliates table was missing INSERT policy.
-- The affiliate POST route uses createClient() (authenticated user),
-- so without this policy, any attempt to join the affiliate program fails with RLS denied.

CREATE POLICY IF NOT EXISTS "affiliates_own_insert" ON affiliates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
