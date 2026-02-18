# Stripe Payment Integration - Test Mode Guide

## Why Stripe for Individuals?

✅ **No Company Registration Needed**
- Stripe test mode works with just an email
- Perfect for solo developers and small teams
- No business documents required

✅ **Completely Free**
- Test mode has zero fees
- No monthly charges
- No setup costs

✅ **Works Everywhere** 
- Supports Saudi Arabia
- Works in 135+ countries
- Local payment methods supported

✅ **Easy Migration**
- Start with test mode (free)
- Switch to live mode when ready
- Same code - just change API keys

## Quick Start

### 1. Get Stripe Test Keys

1. Go to [stripe.com/register](https://stripe.com/register) - just need email
2. Complete signup (2 minutes)
3. Go to Dashboard → Developers → API Keys
4. Copy your keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### 2. Add Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 3. Test the Payment

Use this **test card** (no real charges):
- **Number:** 4242 4242 4242 4242
- **Expiry:** 12/25
- **CVC:** 123

Try entering any amount - test payments succeed instantly.

## Test Card Scenarios

| Card Number | Result |
|------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0025 0000 3155 | ❌ Declined |
| 4000 0000 0000 9995 | ❌ Declined |

## Current Implementation

The checkout page is in **test mode** by default. It:

1. Validates test card format
2. Simulates payment processing
3. Creates test payment records
4. Redirects to vault on success

## When Ready for Live Payments

1. Complete Stripe identity verification (phone call required)
2. Activate live mode in Stripe Dashboard
3. Replace test keys with live keys (`pk_live_` and `sk_live_`)
4. No code changes needed - same implementation works!

## Example Live Flow

```typescript
// Same code, different keys:
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({
    cardData,      // Same format
    amount: 2900,  // Same amount
    plan: 'individual', // Same plan
  }),
});
```

## Stripe Dashboard

Once logged in, you can:
- View test transactions (all prefixed with `test_`)
- Monitor customer signups
- See payment analytics
- Manage webhooks

## Questions?

- **Stripe Docs:** stripe.com/docs
- **Test Mode:** stripe.com/docs/testing
- **Supported Countries:** stripe.com/global

---

**Status:** ✅ Ready for testing with no company registration required!
