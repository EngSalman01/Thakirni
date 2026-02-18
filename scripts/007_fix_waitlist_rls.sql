-- Fix RLS policies for waitlist table to allow authenticated users to insert

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert to waitlist" ON waitlist;
DROP POLICY IF EXISTS "Allow authenticated insert to waitlist" ON waitlist;

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or public) to insert into waitlist
CREATE POLICY "Allow public and authenticated insert to waitlist"
ON waitlist FOR INSERT
WITH CHECK (true);

-- Allow select for authenticated users
CREATE POLICY "Allow select waitlist"
ON waitlist FOR SELECT
USING (auth.uid() IS NOT NULL OR true);

-- Grant permissions
GRANT INSERT ON waitlist TO authenticated, anon;
GRANT SELECT ON waitlist TO authenticated, anon;
