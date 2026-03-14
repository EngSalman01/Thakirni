-- Add Paddle-specific fields to subscriptions table
-- Migration for Paddle payment integration

ALTER TABLE subscriptions
ADD COLUMN paddle_subscription_id TEXT UNIQUE,
ADD COLUMN paddle_customer_id TEXT,
ADD COLUMN paddle_transaction_id TEXT UNIQUE,
ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create index on paddle_subscription_id for webhook lookups
CREATE INDEX idx_subscriptions_paddle_subscription_id 
ON subscriptions(paddle_subscription_id);

-- Create index on paddle_customer_id for customer lookups
CREATE INDEX idx_subscriptions_paddle_customer_id 
ON subscriptions(paddle_customer_id);
