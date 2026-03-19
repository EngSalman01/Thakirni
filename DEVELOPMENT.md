# Thakirni — Development Guide

## Architecture

```
Thakirni/
├── frontend/          → Next.js 15 (UI, pages, auth)          Port 3000
├── backend/           → Hono API server (AI, meetings, goals)  Port 3001
├── packages/shared/   → Shared types (future)
├── supabase/          → Database migrations
└── scripts/           → Admin scripts
```

## Quick Start

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment variables

**frontend/.env.local** — copy from `.env.example` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY` / `NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL`
- `NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY` / `NEXT_PUBLIC_PADDLE_PRICE_TEAMS_ANNUAL`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

**backend/.env** — copy from `.env.example` and fill in:
- All Supabase keys
- `GROQ_API_KEY`
- `PADDLE_API_KEY` & `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_PRO_MONTHLY` etc.
- `FRONTEND_URL=http://localhost:3000`
- `PORT=3001`

### 3. Run the database migrations
In Supabase SQL Editor, run in order:
1. `supabase/migrations/20260319_complete_schema.sql`
2. `supabase/migrations/20260319_fix_rls_recursion.sql`
3. `supabase/migrations/20260319_new_features.sql`

### 4. Start development servers
```bash
pnpm dev          # Starts both frontend (3000) and backend (3001)
```

Or separately:
```bash
pnpm --filter frontend dev    # Next.js only
pnpm --filter backend dev     # Hono API only
```

## Backend API Endpoints

All endpoints require `Authorization: Bearer <supabase_access_token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings/upload` | Upload audio → AI meeting summary |
| GET | `/api/meetings` | List meetings |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| POST | `/api/goals/ai-suggest` | AI milestone suggestions |
| GET | `/api/habits` | List habits with today's status |
| POST | `/api/habits/:id/complete` | Mark habit done |
| POST | `/api/focus/start` | Start Pomodoro session |
| PATCH | `/api/focus/:id/complete` | Complete session |
| GET | `/api/focus/stats` | Weekly focus stats |
| POST | `/api/documents/summarize` | AI document summary |
| GET | `/api/subscriptions/me` | User plan & limits |
| GET | `/api/subscriptions/plans` | All available plans |
| POST | `/api/webhooks/paddle` | Paddle payment webhooks |
| GET/POST | `/api/webhooks/whatsapp` | WhatsApp webhooks |

## Subscription Plans

| Feature | Free | Pro ($9/mo) | Teams ($19/user/mo) |
|---------|------|-------------|---------------------|
| Plans/day | 10 | Unlimited | Unlimited |
| Memories | 25 | Unlimited | Unlimited |
| Projects | 1 | 10 | Unlimited |
| Meeting Summary | ❌ | ✅ (30/mo) | ✅ Unlimited |
| Document AI | ❌ | ✅ | ✅ |
| Team features | ❌ | ❌ | ✅ |

## Meeting Voice Summary

Upload an audio file → The backend:
1. Transcribes via Groq Whisper
2. Identifies speakers (with name detection from context)
3. Generates meeting summary, key points, and action items

Supported formats: MP3, WAV, M4A, MP4, WebM (up to 100MB)

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```
Set all `NEXT_PUBLIC_*` env vars in Vercel dashboard. Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend → Railway / Fly.io / Render
```bash
cd backend
pnpm build
# Deploy dist/ folder
```
Set all backend env vars including `FRONTEND_URL` pointing to your Vercel URL.
