# Paddle Integration - Database Schema

## Subscriptions Table Updates

The following columns have been added to the `subscriptions` table to support Paddle integration:

### New Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `paddle_subscription_id` | `text` | YES | Unique Paddle subscription identifier |
| `paddle_customer_id` | `text` | YES | Unique Paddle customer identifier |
| `paddle_transaction_id` | `text` | YES | Transaction ID from the payment |
| `next_billing_date` | `timestamp with time zone` | YES | Next scheduled billing date from Paddle |
| `cancel_at_period_end` | `boolean` | YES | Flag indicating if subscription will cancel at period end |

### Indexes Created

```sql
CREATE INDEX idx_subscriptions_paddle_subscription_id 
ON subscriptions(paddle_subscription_id);

CREATE INDEX idx_subscriptions_paddle_customer_id 
ON subscriptions(paddle_customer_id);
```

These indexes optimize webhook processing for fast lookups by Paddle IDs.

## Data Flow

### 1. Checkout Completion
```
User clicks "Subscribe" 
  → Paddle Checkout opens 
  → User enters payment info 
  → Payment processes 
  → onCheckoutComplete callback fires
```

### 2. Verification Flow
```
onCheckoutComplete 
  → Send transactionId to /api/paddle/verify-payment
  → Verify transaction with Paddle API
  → Fetch subscription details from Paddle
  → Create/update subscriptions table row
  → Update users table plan_tier
  → Return success response
  → Redirect to /vault
```

### 3. Webhook Sync
```
Paddle event occurs (subscription.created/updated/cancelled)
  → Webhook sent to /api/webhooks/paddle
  → Signature verified
  → Extract event data
  → Find user by paddle_customer_id
  → Update subscription row
  → Done (no response needed)
```

## Example Subscription Record

After successful payment, a subscription record looks like:

```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "paddle_subscription_id": "sub_01234567890",
  "paddle_customer_id": "ctm_01234567890",
  "paddle_transaction_id": "txn_01234567890",
  "plan_tier": "individual",
  "billing_cycle": "monthly",
  "status": "active",
  "next_billing_date": "2026-04-14T00:00:00Z",
  "cancel_at_period_end": false,
  "created_at": "2026-03-14T00:00:00Z",
  "updated_at": "2026-03-14T00:00:00Z"
}
```

## Users Table Updates

The `users` table should have these columns (verify they exist):

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `uuid` | Primary key (from auth) |
| `plan_tier` | `text` | Current plan: "free", "individual", "team" |
| `paddle_customer_id` | `text` | Links user to Paddle customer |

## Price ID Format

Price IDs in Paddle follow this pattern in your env vars:

```
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_MONTHLY=pri_01234567890
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_ANNUAL=pri_01234567891
```

The service functions extract plan tier by checking:
- If price ID contains "individual" → plan_tier = "individual"
- If price ID contains "team" → plan_tier = "team"
- Default → plan_tier = "free"

Billing cycle is extracted by checking:
- If price ID contains "annual" → billing_cycle = "annual"
- Default → billing_cycle = "monthly"

## Subscription Statuses

Valid statuses from Paddle:

| Status | Meaning |
|--------|---------|
| `active` | Subscription is active, payments are current |
| `paused` | Subscription is paused, will resume on resume action |
| `cancelled` | Subscription has been cancelled |
| `past_due` | Payment failed, grace period active |
| `trialing` | Subscription is in trial period |

## Query Examples

### Get user's active subscription
```sql
SELECT * FROM subscriptions 
WHERE user_id = 'user-uuid' 
  AND status = 'active' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Find subscription by Paddle ID
```sql
SELECT * FROM subscriptions 
WHERE paddle_subscription_id = 'sub_01234567890';
```

### Get all subscriptions expiring soon
```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
  AND next_billing_date <= NOW() + INTERVAL '7 days';
```

### Get cancelled subscriptions
```sql
SELECT * FROM subscriptions 
WHERE status = 'cancelled' 
ORDER BY updated_at DESC;
```

## Webhook Event Payloads

### subscription.created
```json
{
  "type": "subscription.created",
  "data": {
    "subscriptionId": "sub_01234567890",
    "customerId": "ctm_01234567890",
    "status": "active",
    "priceId": "pri_01234567890",
    "nextBilledAt": "2026-04-14T00:00:00Z"
  }
}
```

### subscription.updated
```json
{
  "type": "subscription.updated",
  "data": {
    "subscriptionId": "sub_01234567890",
    "status": "paused",
    "pausedAt": "2026-03-14T10:30:00Z"
  }
}
```

### subscription.cancelled
```json
{
  "type": "subscription.cancelled",
  "data": {
    "subscriptionId": "sub_01234567890",
    "cancelledAt": "2026-03-14T10:30:00Z"
  }
}
```

## Migration Status

Run this to check if migration is applied:

```sql
-- Check if paddle_subscription_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name = 'paddle_subscription_id';
```

If you get a result, the migration has been applied. If not, execute the migration from `scripts/004_add_paddle_fields.sql`.
