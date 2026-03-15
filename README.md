<div align="center">

<img src="https://nzetbvkkxairfglmougn.supabase.co/storage/v1/object/public/Public/logo-full.png" alt="Thakirni Logo" width="100" />

# ذكرني · Thakirni

### Your AI-Powered Second Brain — Built for Arabs

**Chat on the web or directly on WhatsApp. Never forget anything again.**

[![Live](https://img.shields.io/badge/Live-thakirni.com-10b981?style=for-the-badge&logoColor=white)](https://thakirni.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-f55036?style=for-the-badge)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

</div>

---

## ✨ What is Thakirni?

Thakirni (ذكرني — Arabic for *"Remind me"*) is a bilingual AI personal assistant that acts as your second brain. It remembers your tasks, meetings, notes, and personal facts — and makes them available wherever you are, whether on the web or directly through WhatsApp.

> **"You weren't designed to remember everything. Thakirni was."**

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🧠 **AI Second Brain** | Chat with your AI assistant to create plans, save memories, and organize your life |
| 📱 **WhatsApp Native** | Message your AI directly on WhatsApp — no app needed |
| 🎤 **Voice Notes** | Record voice notes, auto-transcribed by Groq Whisper |
| 📅 **Smart Calendar** | AI schedules meetings and tasks by understanding natural language |
| 🔍 **Memory Search** | Search everything you've ever saved — notes, files, voice recordings |
| 🌐 **Bilingual** | Arabic-first, English-supported, fully RTL-aware |
| 👥 **Team Collaboration** | Shared workspaces, Kanban boards, and team memory |
| 🔒 **Privacy First** | Your data is encrypted and hosted securely |

---

## 🛠 Tech Stack

```
Frontend        Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · shadcn/ui
Backend         Next.js API Routes · Vercel Serverless Functions
AI              Groq (llama-3.3-70b-versatile) · Whisper (voice transcription) · Vercel AI SDK
Database        Supabase (PostgreSQL) · Row Level Security · Real-time
Auth            Supabase Auth · Google OAuth
WhatsApp        Kapso WhatsApp Business API · @kapso/whatsapp-cloud-api
Payments        Paddle (Merchant of Record · handles Saudi VAT)
Deployment      Vercel · Edge Network
```

---

## 📁 Project Structure

```
thakirni/
├── app/
│   ├── api/
│   │   ├── chat/              # AI chat endpoint (Groq + tools)
│   │   ├── webhooks/
│   │   │   ├── whatsapp/      # Kapso WhatsApp webhook
│   │   │   └── paddle/        # Paddle subscription webhook
│   │   └── waitlist/          # Waitlist signup
│   ├── auth/                  # Login, signup, forgot password
│   ├── vault/                 # Main app dashboard
│   │   ├── page.tsx           # Home / AI chat
│   │   ├── plans/             # Tasks & meetings
│   │   ├── calendar/          # Calendar view
│   │   ├── teams/             # Team management
│   │   ├── upload/            # File uploads
│   │   ├── voice-note/        # Voice recording
│   │   └── settings/          # User preferences
│   ├── pricing/               # Pricing page + Paddle checkout
│   ├── features/              # Features showcase
│   ├── about/                 # About page
│   ├── contact/               # Contact form
│   ├── faq/                   # FAQ accordion
│   ├── blog/                  # Blog (static)
│   ├── privacy/               # Privacy policy
│   ├── terms/                 # Terms of service
│   └── refund/                # Refund policy
├── components/
│   ├── thakirni/              # App-specific components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── supabase/              # Supabase clients (anon + service role)
│   └── whatsapp/              # Kapso WhatsApp client
├── hooks/                     # Custom React hooks
└── supabase/migrations/       # Database migrations
```

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profiles, phone numbers, subscription status, Paddle IDs |
| `plans` | Calendar events, tasks, meetings, shopping lists |
| `memories` | Second brain — notes, voice recordings, files, images |
| `user_facts` | AI-extracted personal facts injected into every prompt |
| `conversations` | Chat history for AI context continuity |
| `timeline_events` | Auto-populated life log (via DB triggers) |
| `teams` | Team workspaces |
| `team_members` | Team membership and roles |
| `team_invitations` | Invite tokens with expiry |
| `projects` | Kanban project boards |
| `task_columns` | Kanban columns |
| `tasks` | Kanban tasks with assignments |
| `subscriptions` | Paddle subscription tracking |
| `waitlist` | Pre-launch waitlist with auto-position |

---

## 🤖 AI Architecture

The AI system is built around a **tool-calling** architecture. Every chat message goes through:

```
User Message
    ↓
Language Detection (Arabic / English)
    ↓
Context Injection:
  • User facts (personal knowledge base)
  • Last 20 conversation turns
  • Current Saudi Arabia date/time
    ↓
Groq LLaMA 3.3 70B (with 10 tools)
    ↓
Tool Execution (Supabase writes/reads)
    ↓
AI Response → User
```

**Available Tools:**
`create_plan` · `update_plan` · `delete_plan` · `mark_done` · `list_plans`
`save_memory` · `search_memories` · `store_fact` · `get_my_facts` · `get_timeline`

---

## 📱 WhatsApp Integration

Users can interact with the full AI assistant directly on WhatsApp:

```
User sends WhatsApp message
    ↓
Kapso receives & forwards to webhook
    ↓
/api/webhooks/whatsapp
    ↓
Look up user by phone_number in profiles
    ↓
Load user_facts + conversation history
    ↓
Groq AI processes with same tools as web
    ↓
Response sent back via Kapso → WhatsApp
```

Voice messages are automatically transcribed using Groq Whisper before processing.

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Groq API key
- Kapso account (for WhatsApp)
- Paddle account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/EngSalman01/Thakirni.git
cd Thakirni

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in all required env vars (see below)

# Run database migrations
# Paste schema.sql into Supabase SQL Editor

# Start development server
pnpm dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=

# WhatsApp (Kapso)
KAPSO_API_KEY=
KAPSO_WEBHOOK_SECRET=
KAPSO_PHONE_NUMBER_ID=

# Payments (Paddle)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_INDIVIDUAL_ANNUAL=
PADDLE_WEBHOOK_SECRET=
```

---

## 💳 Pricing

| Plan | Price | Features |
|---|---|---|
| **Free** | 0 SAR/month | 50 messages, basic AI, 7-day history |
| **Individual** | 29 SAR/month | Unlimited messages, full memory, calendar sync |
| **Team** | 79 SAR/month | Everything + Kanban, shared memory, priority support |

Payments processed by **Paddle** — Saudi VAT handled automatically.

---

## 🌍 Deployment

The app is deployed on **Vercel** with automatic deployments from the `main` branch.

```bash
# Deploy to production
git push origin main
# Vercel auto-deploys on every push
```

**Production URL:** [thakirni.com](https://thakirni.com)

---

## 🗺 Roadmap

- [x] AI chat with tool calling
- [x] WhatsApp integration
- [x] Voice note transcription
- [x] Personal fact extraction
- [x] Conversation history persistence
- [x] Timeline events
- [x] Paddle payments
- [x] Team collaboration
- [ ] Mobile app (React Native)
- [ ] Vector search for memories
- [ ] Calendar sync (Google Calendar)
- [ ] Recurring plan reminders via WhatsApp
- [ ] AI-generated weekly summaries

---

## 🤝 Contributing

This is a private commercial project. Contributions are not open at this time.

---

## 📄 Legal

- [Terms of Service](https://thakirni.com/terms)
- [Privacy Policy](https://thakirni.com/privacy)
- [Refund Policy](https://thakirni.com/refund)

---

<div align="center">

**صنع بـ  ❤️ في المملكة العربية السعودية**

*Made with ❤️ in Saudi Arabia*

© 2026 Thakirni. All rights reserved.

</div>
