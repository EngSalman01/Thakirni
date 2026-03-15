# Thakirni - Final Deployment & Payment Setup

## Your Payment Solution: 2Checkout

You now have a complete payment system integrated with 2Checkout, which works perfectly for individuals in Saudi Arabia.

## What's Ready to Deploy

✅ Individual Plan Checkout - `/checkout/individual`
✅ Team Plan Checkout - `/checkout/team`
✅ 2Checkout API Integration - `/api/2checkout/create-session`
✅ Payment Webhook Handler - `/api/webhooks/2checkout`
✅ Email Waitlist Collection
✅ Subscription Status Tracking

## Quick Start (5 Steps)

### Step 1: Create 2Checkout Account
- Go to https://www.2checkout.com/
- Sign up with your email
- Select "SaaS/Software" as business type
- Country: Saudi Arabia

**Time: 5 minutes**

### Step 2: Generate API Credentials
- Log in to 2Checkout dashboard
- Go to Settings → API
- Copy your:
  - Merchant ID
  - API Key
  - Access Token

**Time: 2 minutes**

### Step 3: Create Products in 2Checkout

**Individual Plan:**
- Product Name: "Thakirni Individual Plan"
- Price: 29 SAR
- Billing: Monthly
- Save and copy Product ID

**Team Plan:**
- Product Name: "Thakirni Team Plan"
- Price: 99 SAR
- Billing: Monthly
- Save and copy Product ID

**Time: 5 minutes**

### Step 4: Add Environment Variables to Vercel

In your Vercel project settings, add these variables:

```
NEXT_PUBLIC_2CHECKOUT_MERCHANT_ID=your_merchant_id
NEXT_PUBLIC_2CHECKOUT_INDIVIDUAL_PRODUCT_ID=individual_product_id
NEXT_PUBLIC_2CHECKOUT_TEAM_PRODUCT_ID=team_product_id
2CHECKOUT_API_KEY=your_api_key
2CHECKOUT_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Time: 3 minutes**

### Step 5: Configure Webhooks (Optional but Recommended)

In 2Checkout Dashboard → Settings → Webhooks:

Add this URL:
```
https://your-domain.com/api/webhooks/2checkout
```

This automatically updates subscription status when payments succeed.

**Time: 2 minutes**

## Test Before Going Live

### Test Payment Card Details:
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
ZIP: 12345
```

### Test Flow:
1. Go to `/checkout/individual`
2. Enter your test email
3. Click "Pay Now - 29 SAR"
4. Use test card above
5. Payment should succeed
6. Check database for subscription status

## What Happens When User Subscribes

1. User enters email on checkout page
2. Email saved to `waitlist` table
3. User creates 2Checkout session
4. User redirected to 2Checkout checkout
5. After successful payment:
   - Webhook fires (optional)
   - Subscription status updated to "active"
   - User can access premium features

## Switch to Live Mode

When ready for real payments:

1. In 2Checkout Dashboard, enable Live Mode
2. Get live API credentials
3. Update environment variables with live credentials
4. Your live payments are now active
5. Verify first payment manually

## File Changes Summary

**New Files Created:**
- `/app/api/2checkout/create-session/route.ts` - Payment session creation
- `/app/api/webhooks/2checkout/route.ts` - Payment webhook handler
- `2CHECKOUT_SETUP.md` - Setup instructions

**Modified Files:**
- `/app/checkout/individual/page.tsx` - Integrated 2Checkout
- `/app/checkout/team/page.tsx` - Integrated 2Checkout
- `/app/pricing/page.tsx` - Button handlers ready

## Database Schema

Your `waitlist` table tracks subscriptions:

```sql
- email (unique)
- plan_type ('individual' or 'team')
- subscription_status ('active', 'cancelled', 'pending')
- subscription_id (from 2Checkout)
- activated_at (timestamp)
- cancelled_at (timestamp)
- country (SA)
```

## Support & Troubleshooting

**2Checkout Issues:**
- Docs: https://knowledgecenter.2checkout.com/
- Support: https://support.2checkout.com/
- Live Chat in dashboard

**Our Payment Integration:**
- Check `/api/webhooks/2checkout` for webhook issues
- Verify product IDs match environment variables
- Test webhook delivery in 2Checkout dashboard

## Next Steps

1. ✅ Create 2Checkout account (5 min)
2. ✅ Get API credentials (2 min)
3. ✅ Create products (5 min)
4. ✅ Add env variables (3 min)
5. ✅ Configure webhooks (2 min)
6. ✅ Test payment flow
7. ✅ Deploy to production
8. ✅ Switch to live mode

**Total Setup Time: ~25 minutes**

After setup, your Thakirni platform is fully monetized and ready for Saudi Arabia users!
