# Paddle Payment Integration - Setup Guide

This guide walks you through completing your Paddle integration setup.

## What's Been Implemented

### 1. **Database Schema** (`scripts/004_add_paddle_fields.sql`)
- Added Paddle-specific fields to `subscriptions` table:
  - `paddle_subscription_id` - Paddle subscription ID
  - `paddle_customer_id` - Paddle customer ID
  - `paddle_transaction_id` - Transaction ID from payment
  - `next_billing_date` - Next billing date from Paddle
  - `cancel_at_period_end` - Cancellation flag
- Indexes created for fast webhook lookups

**Status**: Script created, needs to be executed in Supabase dashboard

### 2. **Paddle Service Module** (`lib/paddle/service.ts`)
- `verifyPaddleTransaction()` - Verify transaction completion
- `getPaddleSubscription()` - Fetch subscription details from Paddle
- `getCustomerSubscriptions()` - List all subscriptions for a customer
- `cancelPaddleSubscription()` - Cancel subscription via API
- Uses Paddle Node SDK with your API secret key

### 3. **Webhook Handler** (`app/api/webhooks/paddle/route.ts`)
- Receives and processes Paddle webhook events
- Handles: `subscription.created`, `subscription.updated`, `subscription.cancelled`
- Verifies webhook signature using `PADDLE_WEBHOOK_SECRET`
- Automatically syncs subscription status to Supabase
- Extracts plan tier and billing cycle from price IDs

**Important**: Add this webhook URL to Paddle dashboard:
```
https://yourdomain.com/api/webhooks/paddle
```

### 4. **Payment Verification** (`app/api/paddle/verify-payment/route.ts`)
- Called after checkout completes
- Verifies transaction with Paddle API
- Creates/updates subscription in Supabase
- Updates user plan tier
- Returns subscription status to client

### 5. **Updated Checkout Flow** (`app/pricing/page.tsx`)
- Integrated `onCheckoutComplete` callback
- Calls verification endpoint after payment
- Shows success/error toasts with translations
- Redirects to `/vault?subscribed=true` after verification

### 6. **Subscription Sync Action** (`app/actions/subscriptions.ts`)
- New `syncPaddleSubscription()` function
- Fetches latest data from Paddle API
- Updates subscription status in Supabase
- Use when subscription status needs to be refreshed

## Setup Steps

### Step 1: Set Environment Variables

Add these to your Vercel project settings (Settings > Vars):

```
PADDLE_API_SECRET_KEY=<your-paddle-api-key>
PADDLE_WEBHOOK_SECRET=<your-webhook-secret>
PADDLE_ENVIRONMENT=sandbox  # Change to "production" when live
```

Where to find these:
- **API Secret Key**: Paddle Dashboard → Settings → Developers → API Keys
- **Webhook Secret**: After adding webhook URL (see step 3)

### Step 2: Execute Database Migration

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy content from `scripts/004_add_paddle_fields.sql`
4. Execute the query
5. Verify new columns appear in `subscriptions` table

### Step 3: Add Paddle Webhook

1. Go to Paddle Dashboard
2. Settings → Webhooks
3. Add new webhook with URL: `https://yourdomain.com/api/webhooks/paddle`
4. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `transaction.completed` (optional)
5. Copy the webhook signing secret and add to `PADDLE_WEBHOOK_SECRET`

### Step 4: Test the Integration

1. **Local Testing** (Sandbox mode):
   ```bash
   npm run dev
   ```
   - Go to `/pricing`
   - Try subscribing with test card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits

2. **Check Webhook Delivery**:
   - Paddle Dashboard → Webhooks → Click webhook
   - View event deliveries
   - Check status and response

3. **Verify Database**:
   - Supabase Dashboard → SQL Editor
   - Check `subscriptions` table for new records
   - Verify fields are populated correctly

### Step 5: Switch to Production

When ready for production:

1. **Update Paddle Account**:
   - Complete Paddle account verification
   - Get approval for live payments
   - Generate production API keys

2. **Update Environment**:
   - Change `PADDLE_ENVIRONMENT` to `production`
   - Update `PADDLE_API_SECRET_KEY` to production key
   - Update `PADDLE_WEBHOOK_SECRET` to production webhook secret
   - Update price IDs if they differ (in `PADDLE_PRICES`)

3. **Update Pricing Page**:
   - Change `environment: "sandbox"` to `environment: "production"` in `initializePaddle()`

## File Structure

```
lib/paddle/
├── service.ts                 # Paddle SDK wrapper & API calls

app/api/
├── paddle/
│   └── verify-payment/
│       └── route.ts          # Payment verification endpoint
└── webhooks/
    └── paddle/
        └── route.ts          # Webhook handler

app/actions/
└── subscriptions.ts          # Server actions (includes syncPaddleSubscription)

app/pricing/
└── page.tsx                  # Updated checkout flow

scripts/
└── 004_add_paddle_fields.sql # Database migration
```

## Key Features

### Automatic Subscription Sync
- Webhooks automatically update subscription status
- No manual database sync needed
- Handles cancellations and plan changes

### User Experience
- Bilingual support (Arabic/English)
- Loading states during checkout
- Error messages with toast notifications
- Automatic redirect to vault on success
- Monthly/annual toggle with savings display

### Security
- Webhook signature verification
- Service role key for database writes
- User authentication required for verification
- Transaction status validation

## Troubleshooting

### Webhook not receiving events?
1. Check webhook URL is correct and accessible
2. Verify webhook secret matches in Paddle dashboard
3. Check Vercel logs for errors
4. Test webhook manually from Paddle dashboard

### Payment not showing in database?
1. Check Supabase logs for SQL errors
2. Verify user is authenticated during checkout
3. Ensure Paddle transaction status is "completed"
4. Check that price ID matches an actual Paddle price

### Customer ID not syncing?
1. Verify customer object is sent in Paddle checkout
2. Check webhook payload includes customerId
3. Ensure user email is consistent

## API Reference

### Verification Endpoint
```
POST /api/paddle/verify-payment
Body: { transactionId: string }
Response: {
  success: boolean,
  subscription: {
    id: string,
    planTier: "individual" | "team" | "free",
    billingCycle: "monthly" | "annual",
    status: "active"
  }
}
```

### Webhook Events Handled
```
subscription.created - New subscription created
subscription.updated - Subscription status changed
subscription.cancelled - Subscription cancelled
transaction.completed - Payment transaction completed
```

## Support

For Paddle-specific help: [Paddle Documentation](https://developer.paddle.com)
For integration issues: Check Vercel logs and Supabase SQL editor
