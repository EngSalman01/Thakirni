-- Add subscription_type column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'individual' CHECK (subscription_type IN ('individual', 'team', 'company'));

-- Create index for subscription type lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON subscriptions(subscription_type);

-- Update existing subscriptions to have default type
UPDATE subscriptions SET subscription_type = 'individual' WHERE subscription_type IS NULL;
