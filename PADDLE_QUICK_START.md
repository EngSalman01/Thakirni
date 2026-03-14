# Paddle Integration - Quick Start (5 Minutes)

## TL;DR - Do This Now

### 1. Execute Migration (2 min)
```sql
-- Copy from scripts/004_add_paddle_fields.sql
-- Paste into Supabase → SQL Editor → Run
```

### 2. Set Environment Variables (1 min)
In Vercel Settings → Vars:
```
PADDLE_API_SECRET_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
PADDLE_ENVIRONMENT=sandbox
```

### 3. Add Webhook (1 min)
Paddle Dashboard → Webhooks → Add New:
- URL: `https://yourdomain.com/api/webhooks/paddle`
- Events: subscription.created, updated, cancelled
- Copy signing secret → use as PADDLE_WEBHOOK_SECRET

### 4. Test (1 min)
1. Go to `/pricing`
2. Click Subscribe
3. Use card: `4111 1111 1111 1111`
4. Expiry: Any future date
5. CVV: Any 3 digits
6. Check Supabase for subscription record

## Verification Checklist

```
✓ Database columns exist (paddle_subscription_id, etc.)
✓ Environment variables are set
✓ Webhook URL is reachable
✓ Webhook secret matches
✓ Test payment completes
✓ Subscription appears in DB
✓ Webhook delivery succeeds
```

## What Happens on Checkout

```
1. User clicks Subscribe
2. Paddle Checkout appears
3. Payment entered
4. Transaction processed by Paddle
5. onCheckoutComplete fires
6. transactionId sent to /api/paddle/verify-payment
7. Backend verifies with Paddle API
8. Subscription created in Supabase
9. User redirected to /vault
10. (Optional) Webhook confirms subscription
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/paddle/service.ts` | Paddle API calls |
| `app/api/paddle/verify-payment/route.ts` | Payment verification |
| `app/api/webhooks/paddle/route.ts` | Webhook handler |
| `app/pricing/page.tsx` | Checkout flow |
| `app/actions/subscriptions.ts` | Server actions |
| `scripts/004_add_paddle_fields.sql` | Database migration |

## Environment Variables

```
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN           # Already set ✓
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_MONTHLY    # Already set ✓
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_ANNUAL     # Already set ✓
PADDLE_API_SECRET_KEY                    # ADD THIS
PADDLE_WEBHOOK_SECRET                    # ADD THIS
PADDLE_ENVIRONMENT                       # ADD THIS ("sandbox")
```

## Webhook Events

```
subscription.created
├─ New subscription created
├─ Creates record in database
└─ Syncs customer ID

subscription.updated
├─ Status or billing changed
├─ Updates existing record
└─ Syncs next_billing_date

subscription.cancelled
├─ Subscription cancelled
├─ Marks as cancelled
└─ Sets cancel_at_period_end
```

## Database Schema

```sql
subscriptions {
  id: uuid
  user_id: uuid
  paddle_subscription_id: text          ← Paddle ID
  paddle_customer_id: text              ← Customer ID
  paddle_transaction_id: text           ← Transaction ID
  plan_tier: "individual" | "team" | "free"
  billing_cycle: "monthly" | "annual"
  status: "active" | "cancelled" | "paused"
  next_billing_date: timestamp          ← From Paddle
  cancel_at_period_end: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

## Common Issues & Fixes

### Payment not syncing to database
- Check webhook delivery in Paddle dashboard
- Verify webhook secret matches
- Check Vercel function logs for errors
- Ensure user is authenticated

### Webhook signature invalid
- Regenerate webhook secret in Paddle
- Update PADDLE_WEBHOOK_SECRET in Vercel
- Wait 60 seconds for propagation

### Subscription verification fails
- Check PADDLE_API_SECRET_KEY is correct
- Verify transaction is "completed" status
- Check user is authenticated
- Look at Vercel logs for API errors

### Price ID not found
- Verify price IDs are set in Vercel env
- Check price IDs match your Paddle account
- Ensure they're not expired or deleted

## Going Live

Change these when production-ready:
```
PADDLE_ENVIRONMENT=production      (instead of sandbox)
PADDLE_API_SECRET_KEY=prod_key     (from production account)
PADDLE_WEBHOOK_SECRET=prod_secret  (from production webhook)
app/pricing/page.tsx line 165:
  environment: "production"         (instead of sandbox)
```

## Testing Credit Cards

**Visa:**
- Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

**Mastercard:**
- Number: `5555 5555 5555 4444`
- Expiry: Any future date
- CVV: Any 3 digits

**All test cards:**
- Use in sandbox mode only
- No real charge

## API Endpoints

```
POST /api/paddle/verify-payment
├─ Body: { transactionId: string }
└─ Returns: { success, subscription }

POST /api/webhooks/paddle
├─ Receives Paddle events
├─ Verifies signature
└─ Updates database
```

## Server Actions

```typescript
import { syncPaddleSubscription } from "@/app/actions/subscriptions"

// Fetch latest from Paddle and update database
const result = await syncPaddleSubscription(paddleSubscriptionId)
```

## Debug Tips

```javascript
// Check subscription in database
console.log("[v0] User subscription:", subscription)

// Check webhook events
// Paddle Dashboard → Webhooks → Click webhook → View events

// Check API logs
// Vercel Dashboard → Functions → Select region → Logs

// Check Supabase activity
// Supabase Dashboard → SQL Editor → Run SELECT queries
```

## Success Indicators

✅ Subscription created in Supabase within 5 seconds
✅ plan_tier matches selected plan
✅ paddle_subscription_id is populated
✅ next_billing_date matches Paddle
✅ User redirected to /vault smoothly
✅ No errors in Vercel logs
✅ Webhook delivery succeeds

## Need Help?

1. Read full guides: PADDLE_SETUP_GUIDE.md
2. Check database: PADDLE_SCHEMA.md
3. Review implementation: IMPLEMENTATION_SUMMARY.md
4. Inspect code: `lib/paddle/service.ts`
5. Check logs: Vercel Dashboard → Functions

## Next: Vault & Subscription Management

After this integrates successfully, you'll want:
- Display current subscription on vault page
- Show next billing date
- Add cancel subscription button
- Implement plan upgrade/downgrade
- Show invoice history

These are out of scope for this integration but leverage the data now in your database.

Good luck! 🚀
