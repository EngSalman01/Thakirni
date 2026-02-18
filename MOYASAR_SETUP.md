# Moyasar Payment Integration Setup

## Overview
This guide sets up Moyasar, Saudi Arabia's leading payment gateway, for your Thakirni platform. Moyasar is free to integrate and supports all Saudi payment methods.

## What is Moyasar?
- **Official Gateway**: Works perfectly in Saudi Arabia
- **Free Integration**: No setup fees or monthly costs
- **Multiple Methods**: Cards, Apple Pay, local payment methods
- **Security**: PCI DSS compliant, SSL encrypted
- **No Data Storage**: Card data never touches your servers

## Setup Steps

### 1. Create Moyasar Account
1. Visit [moyasar.com](https://moyasar.com)
2. Sign up for a business account
3. Verify your Saudi bank details
4. Get approval (usually 1-2 hours)

### 2. Get Your API Keys
1. Go to Dashboard → Settings → API Keys
2. Copy your **Secret Key** (for backend)
3. Copy your **Publishable Key** (for frontend)

### 3. Set Environment Variables

Add these to your Vercel project:

```bash
# Required: Backend processing
MOYASAR_SECRET_KEY=sk_live_your_secret_key_here

# Required: Frontend payment form
NEXT_PUBLIC_MOYASAR_KEY=pk_live_your_publishable_key_here

# Required: App URL for callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. How It Works

**User Journey:**
1. User clicks "Pay Now" on checkout page
2. Moyasar payment form opens (hosted by Moyasar)
3. User enters card details securely
4. Payment processed on Moyasar's servers
5. Callback to your `/checkout/callback` endpoint
6. Subscription activated in database
7. User redirected to vault

**Data Protection:**
- ✅ Your servers NEVER see card data
- ✅ All payments encrypted with TLS/SSL
- ✅ PCI DSS Level 1 compliant
- ✅ No data storage on your servers

## Payment Methods Supported

- 💳 Visa & Mastercard
- 🍎 Apple Pay
- 🏦 Local Saudi bank transfers
- 📱 Mobile wallets

## Pricing

**Transaction Fees:**
- Individual users: 2.99% + 0.25 SAR per transaction
- Teams: Custom rates available
- No monthly fees
- No setup fees

## Testing

**Test Card Numbers:**
```
Visa:       4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
CVV:        Any 3 digits
Expiry:     Any future date
```

## API Endpoints

### Create Payment
```
POST /api/payments/moyasar
Body: {
  amount: 2900,        // Amount in halalas (29 SAR)
  currency: "SAR",
  description: "Individual subscription",
  metadata: { plan: "individual" }
}
```

### Payment Callback
```
GET /checkout/callback?payment_id=...&status=paid
```

### Waitlist Collection
```
POST /api/waitlist
Body: {
  email: "user@example.com",
  plan: "individual",
  country: "SA"
}
```

## Database Tables

### Waitlist Table
- Collects emails for free
- No payment required to join
- Used for announcements and launches

### Subscription Table
- Created when payment succeeds
- Links user to their subscription
- Tracks payment method and dates

## Security Checklist

- [x] Cards never stored on your server
- [x] All data encrypted with TLS
- [x] Callbacks verified with Moyasar
- [x] User authentication required for activation
- [x] Payment status verified before activation
- [x] RLS policies on database tables

## Support

- Moyasar Support: support@moyasar.com
- Documentation: docs.moyasar.com
- Test Mode: Available in dashboard settings

## Troubleshooting

**Payment form not loading?**
- Check `NEXT_PUBLIC_MOYASAR_KEY` is set
- Verify domain is whitelisted in Moyasar

**Payments not processing?**
- Check `MOYASAR_SECRET_KEY` is correct
- Verify callbacks are enabled
- Check database permissions

**Subscription not created?**
- Verify user is authenticated
- Check database connection
- Review server logs for errors

## Next Steps

1. Set up Moyasar account
2. Add environment variables
3. Run database migration
4. Test with test card numbers
5. Deploy to production
6. Switch from test to live mode

That's it! Your payment system is ready for Saudi Arabia. 🇸🇦
