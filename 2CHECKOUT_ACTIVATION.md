# 2Checkout Activation Guide for Thakirni

Complete step-by-step instructions to activate 2Checkout payments for your Thakirni platform in Saudi Arabia.

## Step 1: Create Your 2Checkout Account

1. Visit https://www.2checkout.com/register
2. Select **"Individual"** as account type (not company - perfect for you!)
3. Fill in your details:
   - Email: Your active email
   - Password: Strong password (save this)
   - Country: **Saudi Arabia**
   - Currency: **SAR** (Saudi Riyal)

4. Click **"Create Account"**
5. Verify your email (check inbox for verification link)
6. Complete identity verification if prompted

## Step 2: Access Your Dashboard

1. Log in to https://merchant.2checkout.com
2. Go to **Settings** → **Developer Tools**
3. You'll see your credentials:
   - **Merchant Code** (save this)
   - **API Key** (save this - you'll need it!)

## Step 3: Create Products in 2Checkout

### Product 1: Individual Plan

1. In dashboard, go to **Catalog** → **Products**
2. Click **"+ New Product"**
3. Fill in:
   - **Name**: Thakirni Individual Plan
   - **SKU**: thakirni-individual
   - **Price**: 29.00
   - **Currency**: SAR
   - **Description**: Individual subscription for memory vault

4. Click **"Save"**
5. Copy the **Product ID** (you'll see it on the product page)

### Product 2: Team Plan

1. Click **"+ New Product"** again
2. Fill in:
   - **Name**: Thakirni Team Plan
   - **SKU**: thakirni-team
   - **Price**: 99.00
   - **Currency**: SAR
   - **Description**: Team subscription with collaboration features

3. Click **"Save"**
4. Copy the **Product ID**

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 4 variables:

```
NEXT_PUBLIC_2CHECKOUT_MERCHANT_CODE = [your-merchant-code]
NEXT_PUBLIC_2CHECKOUT_INDIVIDUAL_PRODUCT_ID = [individual-product-id]
NEXT_PUBLIC_2CHECKOUT_TEAM_PRODUCT_ID = [team-product-id]
NEXT_PUBLIC_2CHECKOUT_API_KEY = [your-api-key]
```

4. Click **"Save"**
5. **Redeploy** your Vercel project (it will auto-redeploy once variables are saved)

## Step 5: Set Up Webhooks (Payment Confirmations)

1. In 2Checkout dashboard, go to **Settings** → **Webhooks**
2. Click **"+ Add Webhook"**
3. Configure webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/2checkout`
   - **Events to subscribe**: 
     - `order.completed`
     - `order.paid`
     - `order.refunded`

4. Click **"Save Webhook"**
5. Test the webhook (2Checkout will send a test payload)

## Step 6: Configure Return URLs

1. Go to **Settings** → **Checkout Pages**
2. Set these URLs:
   - **Success URL**: `https://yourdomain.com/checkout/success`
   - **Failure URL**: `https://yourdomain.com/checkout/failure`
   - **Cancel URL**: `https://yourdomain.com/checkout/cancel`

3. Click **"Save"**

## Step 7: Test Payment Flow

### Test Mode

1. In your 2Checkout account, enable **Test Mode**:
   - Go to **Settings** → **Account**
   - Toggle **"Test Mode"** ON
   - Save changes

2. 2Checkout will provide test card numbers for testing

### Make a Test Payment

1. Go to your Thakirni site: `https://yourdomain.com/checkout/individual`
2. Enter test email: `test@example.com`
3. Click **"Pay Now"**
4. You'll be redirected to 2Checkout checkout page
5. Use 2Checkout's test card:
   - **Card Number**: 4111111111111111
   - **Expiry**: 12/25
   - **CVC**: 123

6. Complete the payment
7. You should be redirected to success page
8. Check your database - the payment should be recorded!

## Step 8: Go Live

Once testing is complete and everything works:

1. In 2Checkout dashboard, toggle **"Test Mode"** OFF
2. Keep environment variables the same (2Checkout auto-detects live mode)
3. Your live payments are now active!

## Verification Checklist

- [ ] 2Checkout account created
- [ ] Merchant Code saved
- [ ] API Key saved
- [ ] Individual Product created (ID saved)
- [ ] Team Product created (ID saved)
- [ ] Environment variables added to Vercel
- [ ] Vercel project redeployed
- [ ] Webhooks configured
- [ ] Return URLs set up
- [ ] Test payment completed successfully
- [ ] Webhook received and processed
- [ ] Test Mode disabled (for live)
- [ ] Live payment tested

## Troubleshooting

### Payment not redirecting to 2Checkout
- Check environment variables are set correctly
- Verify Product IDs are copied exactly
- Check Vercel logs for errors

### Webhook not triggering
- Verify webhook URL is correct
- Check firewall isn't blocking 2Checkout servers
- Test webhook manually from 2Checkout dashboard

### Currency/Pricing issues
- Ensure all products are set to SAR
- Verify prices match what's in your checkout pages
- Check conversion rates if showing in USD

## Support

- 2Checkout Support: https://2checkout.com/support
- Your Thakirni Tech Support: Contact via platform

---

**Created**: February 2026
**Last Updated**: February 2026
**Status**: Ready for Activation
