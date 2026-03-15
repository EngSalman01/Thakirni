# Paddle Integration - Next Steps (Action Items)

## ✅ What's Already Done

```
Code Implementation:
  ✅ Paddle Service Module (lib/paddle/service.ts)
  ✅ Payment Verification Endpoint (/api/paddle/verify-payment)
  ✅ Webhook Handler (/api/webhooks/paddle)
  ✅ Pricing Page Updated (onCheckoutComplete callback)
  ✅ Database Migration Script (scripts/004_add_paddle_fields.sql)
  ✅ Server Actions (syncPaddleSubscription function)
  ✅ TypeScript Types (all files)
  ✅ Error Handling (all endpoints)
  ✅ Logging (debug logging in place)
  ✅ Security (webhook verification, auth checks)

Documentation:
  ✅ Quick Start Guide
  ✅ Complete Setup Guide
  ✅ Database Schema Documentation
  ✅ Architecture Diagrams
  ✅ Implementation Summary
  ✅ Completion Checklist
  ✅ This Guide

Code Quality:
  ✅ Full TypeScript support
  ✅ Comprehensive error handling
  ✅ Bilingual support (Arabic/English)
  ✅ Consistent code style
  ✅ Best practices followed
```

## 🎯 Your Action Items (In Order)

### Phase 1: Database Setup (5 minutes)

#### Step 1: Execute Migration
```
Action: Run database migration
Time: 2 minutes
Location: Supabase Dashboard

Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire contents of: scripts/004_add_paddle_fields.sql
6. Paste into SQL editor
7. Click "RUN" button
8. Verify success message

Check: Confirm no errors in query results
```

#### Step 2: Verify Columns
```
Action: Verify migration applied
Time: 1 minute

Steps:
1. In SQL Editor, run:
   SELECT column_name FROM information_schema.columns 
   WHERE table_name='subscriptions' 
   ORDER BY ordinal_position;

2. Look for these columns:
   ✓ paddle_subscription_id
   ✓ paddle_customer_id
   ✓ paddle_transaction_id
   ✓ next_billing_date
   ✓ cancel_at_period_end

Check: All 5 columns should appear in results
```

### Phase 2: Environment Variables (3 minutes)

#### Step 3: Get Paddle Credentials
```
Action: Collect credentials from Paddle
Time: 2 minutes
Location: Paddle Dashboard

Get API Secret Key:
1. Go to https://dashboard.paddle.com/
2. Click "Settings" in sidebar
3. Click "Developers"
4. Under "API keys", find "Live Environments" or "Sandbox Environment"
5. Copy the "API Secret Key" (looks like: sk_sandbox_...)
6. Save safely (will use in step 5)

Note: If using sandbox mode, use the sandbox key
```

#### Step 4: Add to Vercel
```
Action: Set environment variables
Time: 1 minute
Location: Vercel Dashboard

Steps:
1. Go to https://vercel.com/dashboard
2. Select your "thakirni" project
3. Click "Settings" (gear icon at top)
4. Click "Environment Variables" in left sidebar
5. Add three new variables:

   Name: PADDLE_API_SECRET_KEY
   Value: sk_sandbox_... (from step 3)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Name: PADDLE_WEBHOOK_SECRET
   Value: (leave blank for now, will get after webhook setup)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Name: PADDLE_ENVIRONMENT
   Value: sandbox
   Environments: ✓ Production ✓ Preview ✓ Development

6. Click "Save" for each

Check: All variables should show without errors
```

### Phase 3: Paddle Webhook Setup (5 minutes)

#### Step 5: Create Webhook
```
Action: Add webhook to Paddle
Time: 3 minutes
Location: Paddle Dashboard

Steps:
1. Go to https://dashboard.paddle.com/
2. Click "Settings" in sidebar
3. Click "Webhooks" in sidebar
4. Click "Add Webhook" button
5. Fill in:

   Endpoint URL: https://yourdomain.com/api/webhooks/paddle
   (If local testing: use ngrok or similar to expose localhost)
   
   Events to subscribe to:
   ☑ subscription.created
   ☑ subscription.updated
   ☑ subscription.cancelled
   ☑ transaction.completed (optional)

6. Click "Save"

Note: Domain must be publicly accessible. Use ngrok for localhost:
   ngrok http 3000
   Then use: https://xxxxx.ngrok.io/api/webhooks/paddle
```

#### Step 6: Get Webhook Secret
```
Action: Copy webhook signing secret
Time: 1 minute
Location: Paddle Webhooks page

Steps:
1. In Paddle Dashboard, go back to Webhooks
2. Find your webhook URL in the list
3. Click on it to view details
4. Look for "Signing Secret" section
5. Copy the secret (looks like: set_sandbox_...)
6. Go back to Vercel (from step 4)
7. Edit PADDLE_WEBHOOK_SECRET variable
8. Paste the secret
9. Save

Check: Secret should start with "set_"
```

### Phase 4: Testing (5 minutes)

#### Step 7: Test Payment Flow
```
Action: Complete test payment
Time: 3 minutes

Steps:
1. In browser, go to: https://yourdomain.com/pricing
2. Click "Subscribe Now" button on Individual plan
3. Paddle Checkout should open
4. Fill in test details:
   
   Email: test@example.com
   Card: 4111 1111 1111 1111
   Expiry: 12/25
   CVV: 123
   Name: Test User
   Address: 123 Test St, City, Country

5. Click "Subscribe" button
6. You should see success message
7. Should redirect to /vault page

Check: No error messages shown
```

#### Step 8: Verify in Database
```
Action: Check if subscription was created
Time: 1 minute
Location: Supabase SQL Editor

Steps:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Run:
   SELECT * FROM subscriptions 
   WHERE status = 'active' 
   ORDER BY created_at DESC 
   LIMIT 1;

Look for:
✓ paddle_subscription_id (filled)
✓ paddle_customer_id (filled)
✓ paddle_transaction_id (filled)
✓ plan_tier = "individual"
✓ billing_cycle = "monthly"
✓ status = "active"
✓ next_billing_date (filled)

Check: All fields should have values
```

#### Step 9: Check Webhook Delivery
```
Action: Verify webhook was received
Time: 1 minute
Location: Paddle Dashboard

Steps:
1. Go to Paddle Dashboard
2. Click "Settings" → "Webhooks"
3. Click on your webhook URL
4. Scroll to "Event Deliveries" section
5. Should see recent event from your test payment
6. Click the event to view details
7. Look for "Response Status: 200"

Check: Status should be 200 (success)
```

### Phase 5: Production Setup (When Ready)

#### Step 10: Get Production Credentials
```
Action: Get Paddle production approval & keys
Time: Varies (usually 1-3 days)

When ready:
1. Complete Paddle account verification
2. Request production approval
3. Once approved, get:
   - Production API Secret Key
   - Production Webhook Secret
4. Keep these safe (different from sandbox)
```

#### Step 11: Update for Production
```
Action: Switch environment
Time: 3 minutes

In Vercel Settings → Environment Variables:
1. Update PADDLE_API_SECRET_KEY
   From: sk_sandbox_...
   To: sk_live_... (production key)

2. Update PADDLE_WEBHOOK_SECRET
   From: set_sandbox_...
   To: set_live_... (production secret)

3. Update PADDLE_ENVIRONMENT
   From: sandbox
   To: production

Then in code (app/pricing/page.tsx):
- Line ~165: Change initializePaddle environment
  From: environment: "sandbox"
  To: environment: "production"

Then deploy and verify webhook still works
```

## 📋 Pre-Launch Checklist

Before going live with real payments:

```
Database
☐ Migration executed in Supabase
☐ Verified paddle_subscription_id column exists
☐ Verified paddle_customer_id column exists
☐ Indexes created (check SQL output)

Environment
☐ PADDLE_API_SECRET_KEY set in Vercel
☐ PADDLE_WEBHOOK_SECRET set in Vercel
☐ PADDLE_ENVIRONMENT set to sandbox (or production)
☐ All env vars deployed successfully

Paddle Configuration
☐ Webhook URL added to Paddle
☐ Webhook secret copied to Vercel
☐ Events subscribed to (created, updated, cancelled)
☐ Webhook tested and working

Testing
☐ Test payment completes without errors
☐ Subscription appears in database
☐ Webhook delivery succeeds
☐ User redirected to vault page
☐ Plan tier is correct
☐ No errors in Vercel logs
☐ Paddle dashboard shows successful payment

Production Ready
☐ Have production API keys from Paddle
☐ Have production webhook secret
☐ Verified webhook URL is production domain
☐ Updated environment variables
☐ Updated code (environment: "production")
☐ Did final test with real payment
☐ Monitoring enabled (check logs after launch)
```

## 🆘 Troubleshooting Guide

### Issue: "Migration Failed" Error
```
Solution:
1. Copy-paste the entire SQL script again
2. Check Supabase is connected
3. Verify you're using correct project
4. Try running each ALTER TABLE separately
```

### Issue: "Environment Variable Not Found"
```
Solution:
1. Wait 60 seconds for Vercel to propagate
2. Redeploy project (push code again)
3. Check exact spelling of variable name
4. Ensure no spaces before/after value
```

### Issue: "Webhook Not Receiving Events"
```
Solution:
1. Verify webhook URL is publicly accessible
2. Check if ngrok tunnel is still running (localhost)
3. Verify webhook secret matches exactly
4. Check firewall/hosting provider allows inbound
5. Look at Paddle webhook delivery for error details
```

### Issue: "Payment Verification Failed"
```
Solution:
1. Check PADDLE_API_SECRET_KEY is correct
2. Verify API key is for sandbox/production as needed
3. Check transactionId is being sent
4. Look at Vercel function logs for exact error
5. Verify transaction status is "completed"
```

### Issue: "Subscription Not Appearing in Database"
```
Solution:
1. Check migration was executed
2. Verify user is authenticated
3. Check Vercel logs for errors
4. Verify Supabase connection works
5. Check if wrong database was used
```

## 📞 Getting Help

If stuck, check these in order:

1. **PADDLE_QUICK_START.md** - 5 minute guide
2. **PADDLE_SETUP_GUIDE.md** - Detailed setup
3. **PADDLE_SCHEMA.md** - Database info
4. **ARCHITECTURE.md** - System design
5. **Code comments** - Read function comments
6. **Vercel logs** - Check function errors
7. **Supabase logs** - Check database errors
8. **Paddle dashboard** - Check payment status

## ⏱️ Time Estimate

```
Setup:       15 minutes
Testing:     10 minutes
Troubleshoot: 5 minutes
Total:       30 minutes to production
```

## 🎯 Success Checklist

When all done, you should have:

```
✅ Payment checkout working
✅ Subscriptions in database
✅ Real-time webhook sync
✅ Plan tiers assigned
✅ Production-ready code
✅ Comprehensive documentation
✅ Monitoring in place
✅ Error handling active
```

## 🚀 You're Ready!

Everything is set up. Just follow the steps above in order and you'll have working Paddle payments.

**Questions?** Check the guide files.
**Errors?** Check the logs.
**Stuck?** Review the troubleshooting section.

---

**Current Status: Ready for Setup**

Next action: Execute database migration (Step 1)
