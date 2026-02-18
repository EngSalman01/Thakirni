-- Create waitlist table for email collection
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  plan VARCHAR(50) DEFAULT 'individual',
  country VARCHAR(10) DEFAULT 'SA',
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Allow public to join waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own entry
CREATE POLICY "Allow users to view their waitlist entry" ON waitlist
  FOR SELECT
  USING (
    auth.uid() = referred_by OR
    auth.role() = 'authenticated'
  );

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS waitlist_updated_at_trigger ON waitlist;
CREATE TRIGGER waitlist_updated_at_trigger
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();
