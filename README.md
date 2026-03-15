<div align="center">

<img src="https://nzetbvkkxairfglmougn.supabase.co/storage/v1/object/public/Public/logo-full.png" alt="Thakirni Logo" width="100" />

# ذكرني · Thakirni

### Your AI-Powered Second Brain — Built for Arabs

**Chat on the web or directly on WhatsApp. Never forget anything again.**

[![Live](https://img.shields.io/badge/🌐_Live-thakirni.com-10b981?style=for-the-badge)](https://thakirni.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-f55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-Source_Available-orange?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<br />

> **"You weren't designed to remember everything. Thakirni was."**
> 
> **"لست مصمماً لتتذكر كل شيء.. ذكرني تتكفل بذلك"**

</div>

---

## 🌟 We Build in Public!

Thakirni is **source available** — the code is public so the community can learn, contribute, and help improve it.

**Your name will be featured in this README** if you contribute — whether it's code, design, bug fixes, translations, or documentation.

👉 **[See how to contribute](#-contributing)**

---

## ✨ What is Thakirni?

Thakirni (ذكرني — Arabic for *"Remind me"*) is a bilingual AI personal assistant that acts as your second brain. It remembers your tasks, meetings, notes, and personal facts — and makes them available wherever you are, whether on the web or directly through WhatsApp.

Built in Saudi Arabia 🇸🇦 for the Arab world — Arabic-first, privacy-focused, and AI-powered.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🧠 **AI Second Brain** | Chat with your AI to create plans, save memories, and organize your life |
| 📱 **WhatsApp Native** | Message your AI directly on WhatsApp — no app needed |
| 🎤 **Voice Notes** | Record voice notes, auto-transcribed by Groq Whisper |
| 📅 **Smart Calendar** | AI schedules meetings and tasks from natural language |
| 🔍 **Memory Search** | Search everything you've ever saved |
| 🌐 **Bilingual** | Arabic-first, English-supported, fully RTL-aware |
| 👥 **Team Collaboration** | Shared workspaces, Kanban boards, and team memory |
| 🔒 **Privacy First** | Your data is encrypted and hosted securely |

---

## 🛠 Tech Stack

```
Frontend        Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · shadcn/ui
Backend         Next.js API Routes · Vercel Serverless Functions
AI              Groq (llama-3.3-70b-versatile) · Whisper (voice) · Vercel AI SDK
Database        Supabase (PostgreSQL) · Row Level Security · Real-time
Auth            Supabase Auth · Google OAuth
WhatsApp        Kapso · @kapso/whatsapp-cloud-api
Payments        Paddle (Merchant of Record · handles Saudi VAT)
Deployment      Vercel · Edge Network
```

---

## 📁 Project Structure

```
thakirni/
├── app/
│   ├── api/
│   │   ├── chat/              # AI chat endpoint (Groq + 10 tools)
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
│   ├── pricing/               # Pricing + Paddle checkout
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
│   ├── supabase/              # Supabase clients
│   └── whatsapp/              # Kapso WhatsApp client
├── hooks/                     # Custom React hooks
└── supabase/migrations/       # Database migrations
```

---

## 🤖 AI Architecture

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
Groq LLaMA 3.3 70B
    ↓
Tool Execution (10 tools → Supabase)
    ↓
Response → User (Web or WhatsApp)
```

**Tools:** `create_plan` · `update_plan` · `delete_plan` · `mark_done` · `list_plans` · `save_memory` · `search_memories` · `store_fact` · `get_my_facts` · `get_timeline`

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Groq API key

### Installation

```bash
# Clone the repo
git clone https://github.com/EngSalman01/Thakirni.git
cd Thakirni

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys

# Run the database schema
# Copy schema.sql → paste into Supabase SQL Editor → Run

# Start dev server
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

## 🗺 Branching Strategy

| Branch | Purpose | URL |
|---|---|---|
| `main` | Production | thakirni.com |
| `dev` | Development & testing | dev.thakirni.com |

All changes must go through `dev` and be tested before merging to `main` via Pull Request.

---

## 🗺 Roadmap

- [x] AI chat with tool calling
- [x] WhatsApp integration
- [x] Voice note transcription
- [x] Personal fact extraction
- [x] Conversation history
- [x] Timeline events
- [x] Paddle payments
- [x] Team collaboration
- [ ] Mobile app (React Native)
- [ ] Vector search for memories
- [ ] Google Calendar sync
- [ ] Recurring WhatsApp reminders
- [ ] AI weekly summaries
- [ ] Multi-language support

---

## 🤝 Contributing

We welcome contributions of all kinds — code, design, bug reports, translations, and documentation.

### How to contribute

1. **Fork** the repository
2. **Create** your feature branch from `dev`:
   ```bash
   git checkout dev
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes
4. **Test** on `dev.thakirni.com` equivalent locally
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push** to your fork and open a **Pull Request** into `dev`
7. **Your name gets added** to the Contributors section below ⬇️

### What we need help with

- 🎨 UI/UX improvements
- 🌐 Translations (we want to support more Arabic dialects)
- 🧪 Writing tests
- 📱 React Native mobile app
- 🔍 Vector search implementation
- 📅 Google Calendar sync
- 📖 Documentation improvements
- 🐛 Bug fixes

### Commit conventions

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Formatting, no logic change
refactor: Code restructure
perf:     Performance improvement
chore:    Build process or tooling
```

Please open an issue before starting work on large features so we can discuss the approach.

---

## 👥 Contributors

Thanks to everyone who has contributed to Thakirni! Your name belongs here. 🌟

<!-- ALL-CONTRIBUTORS-LIST:START -->

| Avatar | Name | Contribution |
|---|---|---|
| <img src="https://github.com/EngSalman01.png" width="50" style="border-radius:50%" /> | **[Salman Almnaseer](https://github.com/EngSalman01)** | 🏗️ Creator & Lead Developer |

*Want to see your name here? [Contribute to Thakirni](#-contributing)!*

<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 📄 License

This project uses a **Source Available License** — see the [LICENSE](LICENSE) file for full details.

**In short:**
- ✅ You can view, study, and learn from the code
- ✅ You can contribute via pull requests
- ✅ You can use it for personal or educational purposes
- ❌ You cannot launch a competing commercial product using this code
- ❌ You cannot rebrand and redistribute it as your own

For commercial licensing inquiries: support@thakirni.com

---

## 📞 Contact

- **Website:** [thakirni.com](https://thakirni.com)
- **Email:** eng.salman01@outlook.com
- **Location:** 🇸🇦

---

<div align="center">

**صنع بـ ❤️ في المملكة العربية السعودية**

*Made with ❤️ in Saudi Arabia*

© 2026 Thakirni. All rights reserved.

⭐ **If you find this project useful, please give it a star!** ⭐

</div>
