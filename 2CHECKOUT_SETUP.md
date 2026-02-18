# 2Checkout Setup Guide for Thakirni

## Why 2Checkout?
- ✅ **No Company Registration** - Works perfectly for individuals
- ✅ **Saudi Arabia Supported** - Handles local payments and VAT (15%)
- ✅ **Global Payments** - Accepts payments from 190+ countries
- ✅ **Multiple Payment Methods** - Cards, digital wallets, local methods
- ✅ **Easy Integration** - Simple API and payment links
- ✅ **Free Test Mode** - Test before going live

## Step 1: Create 2Checkout Account

1. Go to https://www.2checkout.com/
2. Click **"Sign Up"** (top right)
3. Fill in your details:
   - **Email**: Your email
   - **Password**: Create strong password
   - **Country**: Saudi Arabia (or your location)
   - **Business Type**: Select "Software as a Service (SaaS)"
4. Verify your email
5. Complete your profile:
   - Business name: "Thakirni" (or your name)
   - Website: your-domain.com
   - Product type: "Digital Products/SaaS"

## Step 2: Get Your API Credentials

1. Log in to 2Checkout dashboard
2. Go to **Settings** → **API**
3. Generate **API Key** (for backend)
4. Copy your **Merchant ID** (visible in Settings)
5. Get your **Access Token** (in API section)

### Your Environment Variables

Add these to your Vercel project environment:

```
NEXT_PUBLIC_2CHECKOUT_MERCHANT_ID=YOUR_MERCHANT_ID
2CHECKOUT_API_KEY=YOUR_API_KEY
2CHECKOUT_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
```

## Step 3: Create Products in 2Checkout

### Individual Plan Product
1. Go to **Products** → **Add New Product**
2. Product Details:
   - **Name**: "Thakirni Individual Plan"
   - **SKU**: `individual-monthly`
   - **Price**: 29 SAR
   - **Description**: "Save unlimited memories and voice notes with AI assistant"
3. Billing:
   - **Billing Cycle**: Monthly
   - **Currency**: SAR
4. Save product
5. Copy the **Product ID**

### Team Plan Product
1. Repeat above with:
   - **Name**: "Thakirni Team Plan"
   - **SKU**: `team-monthly`
   - **Price**: 99 SAR
   - **Description**: "Collaborate with team members, manage multiple projects"
2. Copy the **Product ID**

### Store IDs in .env

```
NEXT_PUBLIC_2CHECKOUT_INDIVIDUAL_PRODUCT_ID=PRODUCT_ID_HERE
NEXT_PUBLIC_2CHECKOUT_TEAM_PRODUCT_ID=PRODUCT_ID_HERE
```

## Step 4: Test Payment Links

In your checkout page, the payment link format is:

```
https://secure.2checkout.com/checkout/buy/SESSION_ID
```

Where `SESSION_ID` is created via API with product and user details.

## Step 5: Set Up Webhooks (for successful payments)

1. Go to **Settings** → **Webhooks**
2. Add webhook URL:
   ```
   https://your-domain.com/api/webhooks/2checkout
   ```
3. Select events to listen:
   - `subscription.created` - When user subscribes
   - `subscription.activated` - When payment succeeds
   - `subscription.cancelled` - When subscription ends

## For Production

1. Switch from **Test Mode** to **Live Mode** in dashboard
2. Verify your business (quick process)
3. Your live credentials will be provided
4. Update environment variables with live credentials
5. Payments now go to your real account

## Test Credentials

For testing in sandbox mode:

```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
Zip Code: 12345
```

## Support

- Help: https://support.2checkout.com/
- Knowledge Base: https://knowledgecenter.2checkout.com/
- Live Chat: Available in dashboard

## Next Steps

1. Create 2Checkout account (takes 5 minutes)
2. Generate API credentials
3. Create products in dashboard
4. Add environment variables to Vercel
5. Test payment flow
6. Go live!
