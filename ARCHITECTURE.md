# Paddle Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /pricing page (Next.js)                                 │   │
│  │  - Renders pricing tiers                                 │   │
│  │  - Button click → handleSubscribe()                       │   │
│  │  - Opens Paddle Checkout                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Paddle Checkout (Hosted)                                │   │
│  │  - Collects payment details                              │   │
│  │  - Processes payment                                     │   │
│  │  - Returns transactionId                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  onCheckoutComplete callback                             │   │
│  │  - Calls /api/paddle/verify-payment                      │   │
│  │  - Shows success/error toast                             │   │
│  │  - Redirects to /vault                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         NETWORK
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS BACKEND (Edge)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/paddle/verify-payment                         │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 1. Parse request body (transactionId)             │  │   │
│  │  │ 2. Verify with Paddle API                         │  │   │
│  │  │ 3. Get subscription from Paddle                   │  │   │
│  │  │ 4. Extract plan tier & billing cycle              │  │   │
│  │  │ 5. Create subscription in Supabase                │  │   │
│  │  │ 6. Update user plan_tier                          │  │   │
│  │  │ 7. Return success response                        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Paddle Service Module (lib/paddle/service.ts)          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ - verifyPaddleTransaction()                        │  │   │
│  │  │ - getPaddleSubscription()                          │  │   │
│  │  │ - Handles Paddle API calls                         │  │   │
│  │  │ - Error handling & logging                         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────┬──────────────────────────────┐
│                                  │                              │
↓                                  ↓                              ↓
┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│  Paddle API      │   │   Supabase DB        │   │   Supabase Auth  │
│                  │   │                      │   │                  │
│ - Transactions   │   │ - subscriptions      │   │ - Current user   │
│ - Subscriptions  │   │ - users (plan_tier)  │   │ - Session check  │
│ - Customers      │   │ - Indexed lookups    │   │                  │
│                  │   │                      │   │                  │
└──────────────────┘   └──────────────────────┘   └──────────────────┘
```

## Webhook Flow

```
┌──────────────────┐
│   Paddle Event   │
│  (e.g. payment   │
│   completed)     │
└────────┬─────────┘
         │
         │ HTTP POST
         ↓
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/webhooks/paddle                                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Extract request body                                  │   │
│  │ 2. Get signature header                                  │   │
│  │ 3. Verify signature (HMAC-SHA256)                        │   │
│  │    ├─ Hash body with PADDLE_WEBHOOK_SECRET               │   │
│  │    └─ Compare with signature header                      │   │
│  │ 4. Parse event type                                      │   │
│  │ 5. Route to handler:                                     │   │
│  │    ├─ subscription.created → handleSubscriptionCreated   │   │
│  │    ├─ subscription.updated → handleSubscriptionUpdated   │   │
│  │    └─ subscription.cancelled → handleSubscriptionCancelled
│  │ 6. Update Supabase                                       │   │
│  │ 7. Return 200 OK                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │   Supabase DB        │
            │                      │
            │ Update subscriptions │
            │ table row            │
            └──────────────────────┘
```

## Data Model

```
USER (from Supabase Auth)
├── id (uuid)
├── email
└── plan_tier (free|individual|team)

SUBSCRIPTION (Supabase Database)
├── id (uuid) [primary key]
├── user_id (uuid) [foreign key → users.id]
├── paddle_subscription_id (text) ← From Paddle
├── paddle_customer_id (text) ← From Paddle
├── paddle_transaction_id (text) ← From payment
├── plan_tier (free|individual|team)
├── billing_cycle (monthly|annual)
├── status (active|cancelled|paused)
├── next_billing_date (timestamp) ← From Paddle
├── cancel_at_period_end (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)

INDEXES
├── idx_subscriptions_paddle_subscription_id
└── idx_subscriptions_paddle_customer_id
```

## Integration Points

### 1. Frontend → Backend
```
Pricing Page (app/pricing/page.tsx)
    ↓
handleSubscribe() function
    ↓
Paddle Checkout (hosted)
    ↓
onCheckoutComplete callback
    ↓
POST /api/paddle/verify-payment
    ↓
JSON Response
    ↓
Toast notification + Redirect
```

### 2. Backend → Paddle API
```
Verification Endpoint (app/api/paddle/verify-payment)
    ↓
lib/paddle/service.ts functions
    ↓
Paddle Node SDK
    ↓
Paddle REST API
    ↓
Response data
    ↓
Supabase write
```

### 3. Paddle → Backend (Webhook)
```
Paddle Event Triggered
    ↓
HTTP POST to webhook URL
    ↓
POST /api/webhooks/paddle
    ↓
Signature verification
    ↓
Event handler
    ↓
Supabase write
    ↓
200 OK response
```

## Environment & Configuration

```
Development (Sandbox)
├── PADDLE_ENVIRONMENT=sandbox
├── PADDLE_API_SECRET_KEY=sk_sandbox_...
├── PADDLE_WEBHOOK_SECRET=set_sandbox_...
├── NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=ctk_sandbox_...
└── Webhook URL: https://localhost:3000/api/webhooks/paddle

Production
├── PADDLE_ENVIRONMENT=production
├── PADDLE_API_SECRET_KEY=sk_live_...
├── PADDLE_WEBHOOK_SECRET=set_live_...
├── NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=ctk_live_...
└── Webhook URL: https://yourdomain.com/api/webhooks/paddle
```

## Error Handling Flow

```
User Action/Event
       ↓
   Try Block
       ↓
   ┌───┴───┐
   │       │
Success   Error
   │       │
   ↓       ↓
Return   Log Error
Success  (console.error)
Response     │
             ↓
          Return Error
          Response
             │
             ↓
          Frontend Toast
          (error message)
```

## State Transitions

```
Subscription Lifecycle:

CREATED (webhook: subscription.created)
    ↓
ACTIVE (user has paid, subscription is active)
    ├─→ PAUSED (webhook: subscription.paused)
    │       ├─→ ACTIVE (subscription resumed)
    │       └─→ CANCELLED
    │
    └─→ CANCELLED (webhook: subscription.cancelled)
           ↓
        SUBSCRIPTION ENDS
```

## API Contract

### Verification Endpoint
```
POST /api/paddle/verify-payment
Content-Type: application/json
Authorization: (Implicit from session)

Request:
{
  "transactionId": "txn_01234567890"
}

Response (Success):
{
  "success": true,
  "subscription": {
    "id": "sub_01234567890",
    "planTier": "individual",
    "billingCycle": "monthly",
    "status": "active"
  }
}

Response (Error):
{
  "error": "Description of error"
}
```

### Webhook Endpoint
```
POST /api/webhooks/paddle
Content-Type: application/json
paddle-signature: hmac_signature_header

Request (subscription.created):
{
  "type": "subscription.created",
  "data": {
    "subscriptionId": "sub_...",
    "customerId": "ctm_...",
    "status": "active",
    "priceId": "pri_...",
    "nextBilledAt": "2026-04-14T00:00:00Z"
  }
}

Response:
HTTP 200 OK
```

## Data Flow Diagram

```
┌─ PAYMENT PHASE ─────────────────────────────────┐
│                                                   │
│  User → Paddle Checkout → Payment Processed      │
│                               ↓                  │
│                    (transactionId returned)      │
└───────────────────────┬──────────────────────────┘
                        │
┌─ VERIFICATION PHASE ──┴──────────────────────────┐
│                                                   │
│  Frontend sends transactionId                    │
│           ↓                                       │
│  Backend verifies with Paddle API                │
│           ↓                                       │
│  Fetch subscription details                      │
│           ↓                                       │
│  Extract plan tier & billing cycle               │
│           ↓                                       │
│  Write to Supabase subscriptions                 │
│           ↓                                       │
│  Update user plan_tier                           │
│           ↓                                       │
│  Return success to frontend                      │
│           ↓                                       │
│  Redirect to vault page                          │
└───────────────────────┬──────────────────────────┘
                        │
┌─ WEBHOOK PHASE ───────┴──────────────────────────┐
│                                                   │
│  Paddle sends subscription events                │
│           ↓                                       │
│  Webhook handler verifies signature              │
│           ↓                                       │
│  Extract event data                              │
│           ↓                                       │
│  Find user by paddle_customer_id                 │
│           ↓                                       │
│  Update subscription status                      │
│           ↓                                       │
│  Return 200 OK                                   │
└───────────────────────────────────────────────────┘
```

## Component Dependencies

```
app/pricing/page.tsx
├── imports: Paddle SDK
├── uses: handleSubscribe()
├── calls: POST /api/paddle/verify-payment
└── depends on: Paddle Client Token

app/api/paddle/verify-payment/route.ts
├── imports: lib/paddle/service
├── uses: verifyPaddleTransaction()
├── calls: Supabase API
├── depends on: PADDLE_API_SECRET_KEY

app/api/webhooks/paddle/route.ts
├── imports: none
├── uses: Signature verification
├── calls: Supabase API
├── depends on: PADDLE_WEBHOOK_SECRET

lib/paddle/service.ts
├── imports: Paddle SDK
├── exports: All API functions
├── depends on: PADDLE_API_SECRET_KEY

app/actions/subscriptions.ts
├── imports: lib/paddle/service
├── uses: getPaddleSubscription()
├── calls: Supabase API
└── depends on: PADDLE_API_SECRET_KEY
```

## Performance Considerations

```
Checkout Flow Timing:
  User click → Paddle loads: 100-500ms
  User enters payment: 5-30s (user action)
  Payment processes: 1-5s
  Webhook fires: <100ms
  Total: 6-35s (mostly user action)

Verification Endpoint:
  Request → Parse: <10ms
  Paddle API call: 200-800ms
  Supabase write: 50-200ms
  Response: <10ms
  Total: 260-1010ms

Webhook Processing:
  Receive → Parse: <10ms
  Signature verify: <5ms
  Find user: 10-50ms (indexed)
  Update subscription: 50-200ms
  Response: <10ms
  Total: 75-275ms
```

## Security Layers

```
CLIENT
 ├─ HTTPS/TLS encryption
 └─ Secure session cookies

EDGE
 ├─ Authentication verification
 ├─ CORS policy
 └─ Request validation

API
 ├─ Signature verification (webhooks)
 ├─ Transaction validation (verification)
 ├─ User ownership checks
 └─ Parameterized queries

DATABASE
 ├─ Service role key (server-only)
 ├─ Row-level security (optional)
 └─ Indexed for quick lookups

EXTERNAL
 ├─ Paddle API authentication
 ├─ TLS encryption
 └─ Webhook signing
```

This architecture ensures:
- ✅ Real-time payment processing
- ✅ Reliable subscription management
- ✅ Webhook sync reliability
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Error handling & recovery
