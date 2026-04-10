# Vision 2030 Alignment — Design Spec
**Date:** 2026-04-10  
**Status:** Approved  
**Scope:** 5 features aligned with Saudi Vision 2030 and Year of AI 2026

---

## Overview

Five product improvements that align Thakirni with Saudi Arabia's Vision 2030 three pillars (Vibrant Society, Thriving Economy, Ambitious Nation) and the Year of AI 2026 initiative.

Dropped from scope (explicitly): Government Document Reminders, Hajj/Umrah Mode, Volunteer Tracker, SME/Saudization, Household Financial Goals.

---

## Feature 1 — Prayer Times WhatsApp Reminders

### What it does
Users opt in to receive WhatsApp reminders before each of the five daily prayers. Implemented as a backend cron — no new app page required.

### Data
New Supabase table `prayer_subscriptions`:
```sql
id            uuid primary key
user_id       uuid references auth.users
phone         text not null
prayers       text[] default '{fajr,dhuhr,asr,maghrib,isha}'
city          text default 'Riyadh'
enabled       boolean default true
created_at    timestamptz default now()
```

### Cron job
- Schedule: every 15 minutes via cron-job.org
- Route: `POST /api/cron/prayer-reminders` (protected by `CRON_SECRET`)
- Logic:
  1. Fetch prayer times from Aladhan API: `GET https://api.aladhan.com/v1/timingsByCity?city={city}&country=SA&method=4`
  2. For each prayer in the response, check if current Saudi time is within ±5 min of that prayer's time
  3. If match found, query `prayer_subscriptions` where `enabled = true` and the prayer name is in the `prayers` array
  4. Send WhatsApp message to each matched user via existing WhatsApp API helper

### WhatsApp opt-in flow
- User sends "صلاة" or "prayer" to the bot
- Bot replies with a numbered list: "أي الصلوات تبي أذكرك فيها؟ (١) الفجر (٢) الظهر (٣) العصر (٤) المغرب (٥) العشاء — أرسل الأرقام اللي تبيها"
- Bot parses the reply and upserts `prayer_subscriptions`
- User can send "إيقاف الصلاة" to set `enabled = false`

### Message format
```
🕌 وقت {صلاة الفجر}
حان وقت الصلاة — تقبل الله 🤲

Prayer time: {Fajr}
May Allah accept your prayer.
```

---

## Feature 2 — Vision 2030 Landing Section

### Placement
Above the footer, below the CTA section.

### Component
New file: `components/thakirni/vision2030-section.tsx`

### Design (Hero Statement — Option B, amber design tokens)
- Background: `bg-[#0A0500]` with subtle amber radial gradient overlay matching existing `hero-mesh` pattern
- Full-width section, `py-16 sm:py-24`
- Top badge row:
  - `🇸🇦` flag + "رؤية ٢٠٣٠ · Year of AI 2026" amber pill badge
  - "SDAIA Aligned" amber outlined badge (margin-start: auto)
- Arabic headline: `text-3xl sm:text-4xl font-headline font-bold` — "ذكرني يخدم رؤية ٢٠٣٠"
- English sub-line: `text-muted-foreground text-sm` — "Built for Saudi Arabia's Vision 2030"
- Four feature tag pills (amber `bg-amber-950/40 border-amber-700/40 text-amber-300`): 🕌 Prayer Times · 💪 Quality of Life · 🎓 Youth & Students · 🤖 Arabic AI
- All text and spacing uses existing Tailwind amber design tokens

### Hero section update
Add a small secondary badge below the main headline: `🇸🇦 رؤية ٢٠٣٠ · Vision 2030 Aligned` — same amber pill style as other landing labels.

### SEO
Update `app/layout.tsx` (or the landing page's `<head>`) metadata:
- Add keywords: `Vision 2030, ذكاء اصطناعي, SDAIA, Year of AI 2026, رؤية 2030, Saudi AI`
- Update `og:description` to mention Vision 2030 alignment

---

## Feature 3 — Arabic Dialect Excellence

### System prompt changes (`app/api/chat/route.ts`)

Replace the existing dialect/language section with:

```
━━━ LANGUAGE & DIALECT INTELLIGENCE ━━━

- اكتشف لهجة المستخدم من أول رسالة واتبعها طول المحادثة
- الأولوية:
  1) مطابقة لهجة المستخدم
  2) الثبات على نفس اللهجة
  3) إذا غير واضح → استخدم لهجة الشرقية (الخبر) كافتراضي

اللهجات المدعومة:
- الشرقية (الخبر / الدمام) ← الافتراضي
- نجدية
- حجازية
- خليجية (كويتية / إماراتية / بحرينية)
- فصحى

━━━ قواعد الاكتشاف (أمثلة) ━━━

- "وش / أبي / أبغى / الحين / خل / ترى" → سعودي (شرقية/نجد)
- "إيش / كذا / مرة" → حجازي
- "شنو / زين / هالسالفة" → خليجي
- "أريد / ماذا / هل" → فصحى

━━━ قواعد الرد ━━━

- طابق لهجة المستخدم EXACT
- لا تخلط بين لهجتين في نفس الرد
- لا تغيّر اللهجة في نفس المحادثة
- إذا المستخدم غيّر لهجته → غيّر معه مباشرة
- إذا المستخدم رسمي → رد بالفصحى

━━━ أسلوب الخبر (الافتراضي) ━━━

استخدم بشكل طبيعي:
"تمام" / "خلني أرتبها" / "خلصنا 👍" / "جاهز 👀" / "أبشر" / "ولا يهمك"

تجنب: اللغة الرسمية الزايدة، الردود الروبوتية، خلط لهجات

━━━ الذكاء الحواري ━━━

- افهم الأخطاء الإملائية بدون تصحيح المستخدم
- لا تقول "هل تقصد..." أو "يبدو أنك..."
- استخدم تأكيد طبيعي فقط إذا لزم: "تقصد اليوم ولا بكرة؟ 👀"
- مثال: "شكرني بعد ساعه" → تعامل معها كـ "ذكرني بعد ساعة" بدون تعليق

━━━ المطابقة العاطفية ━━━

- إذا المستخدم قال "تعبان اليوم" → رد: "واضح عليك 😅 تبغاني أرتب لك يومك أخف؟"
- بدل "تم إنشاء التذكير" → "تمام، حطيت لك التذكير 👌"
- بدل "تم الحفظ" → "خلصنا 👍"

━━━ قواعد صارمة ━━━

- لا تكشف التصحيحات للمستخدم
- لا تستخدم أسلوب أكاديمي
- الرد قصير + طبيعي + بشري
```

### WhatsApp handler changes (`app/api/webhooks/whatsapp/route.ts`)

#### A. Extend `fixCommonTypos()`
```ts
// New entries to add:
"شكرني"   → "ذكرني"
"الحفص"   → "الفحص"
"ابي"     → "أبي"
"ايش"     → "إيش"
// Remove excessive repetition: /(.)\1{2,}/g → "$1$1" (حلوووو → حلوو)
// Trim extra spaces: /\s{2,}/g → " "
```

#### B. Add `detectDialect(text: string)` helper
```ts
// Returns: 'khobar' | 'najdi' | 'hijazi' | 'gulf' | 'fus-ha'
// Rules:
// /شنو|زين|هالسالفة|بعدين/  → 'gulf'
// /إيش|كذا|عادي|مرة/        → 'hijazi'
// /وش|أبي|أبغى|الحين|ترى/   → 'khobar' (default Saudi)
// /أريد|ماذا|هل\s|يمكن/     → 'fus-ha'
// fallback                   → 'khobar'
```

#### C. Pass dialect as context hint to AI
When calling the AI, prepend a silent system hint based on detected/stored dialect:
```ts
// e.g.: "[dialect:khobar]" prepended to user message context
// AI uses this as confirmation to stay in that dialect
```

#### D. Persist dialect in `profiles` table
New Supabase migration — add column:
```sql
ALTER TABLE profiles ADD COLUMN dialect TEXT DEFAULT 'khobar';
```

Logic in WhatsApp handler:
1. On first message from a user, call `detectDialect(text)`
2. If profile `dialect` is still `'khobar'` (default) or null, update it with detected dialect
3. On all subsequent messages, read dialect from profile and pass as context hint — skip re-detection
4. If user clearly switches dialect mid-conversation, update the stored dialect

---

## Feature 4 — Health Vault `/vault/health`

### Data
New Supabase table `health_logs`:
```sql
id            uuid primary key
user_id       uuid references auth.users
date          date not null
water_cups    int default 0
steps         int default 0
sleep_hours   numeric(3,1) default 0
created_at    timestamptz default now()
unique(user_id, date)
```

### Page
New file: `app/vault/health/page.tsx`

### Design (Ring + List — Option B, full amber design system)
- Header: page title "الصحة والعافية 💚" + Hijri date (same pattern as dashboard)
- **Health score ring** (top, centered):
  - SVG circle ring, amber gradient stroke
  - Score = (water/8 × 0.4 + steps/8000 × 0.4 + sleep/8 × 0.2) × 100, clamped 0–100
  - Center text: score% + "اليوم"
  - If WhatsApp nudges enabled: small amber badge "واتساب مُفعّل ✓" below ring
- **Metric list** (below ring):
  - Three rows, each: `bg-white/[0.03] border border-amber-900/30 rounded-2xl p-5`
  - Row content: emoji + Arabic label + today's value / goal in amber
  - 💧 الماء — `{water_cups} / 8 أكواب`
  - 👟 الخطوات — `{steps} / 8,000`
  - 😴 النوم — `{sleep_hours} / 8 ساعات`
  - Tap any row to open a simple number input modal to log the value
- **Quick log** at bottom: `power-gradient` button "سجّل الآن" → opens log modal
- **WhatsApp nudges toggle**: amber toggle switch to enable/disable nudges — upserts to a `health_nudge_subscriptions` table

### WhatsApp nudge cron
New table `health_nudge_subscriptions`:
```sql
id        uuid primary key
user_id   uuid references auth.users
phone     text not null
enabled   boolean default true
```

- New cron route: `POST /api/cron/health-nudges` (protected by `CRON_SECRET`)
- Schedule: twice daily — 10:00 AM and 8:00 PM Saudi time
- Logic:
  1. Fetch today's `health_logs` for all enabled subscribers
  2. Calculate score per metric against goal
  3. If any metric < 60% of goal, send a friendly nudge
  4. Messages are motivating, not shaming (e.g., "تذكر تشرب الماء، وصلت ٣ أكواب من ٨ 💧")

### Sidebar
Add "الصحة 💚" nav item to `components/thakirni/vault-sidebar.tsx` pointing to `/vault/health`, positioned after Goals.

---

## Feature 5 — Student Plan + Templates + Onboarding

### Pricing
- New Paddle price: **19 SAR/month**, 30-day free trial
- Plan name: "طالب 🎓" / "Student 🎓"
- Limits: same as Free plan but with access to study templates
- Pricing section gets a 4th card between Free and Pro, following the exact same card style as existing cards

### Study Templates (10 total)
Pre-populated vault items created when user picks a template. Each template is a JSON structure of tasks/reminders/goals.

| # | Arabic | English |
|---|--------|---------|
| 1 | جدول المذاكرة | Study Schedule |
| 2 | تتبع المواد | Subject Tracker |
| 3 | أهداف الفصل | Semester Goals |
| 4 | مراجعة الاختبارات | Exam Review Planner |
| 5 | خطة المشروع | Project Plan |
| 6 | حفظ المحاضرات | Lecture Notes Log |
| 7 | تتبع الواجبات | Assignment Tracker |
| 8 | أهداف GPA | GPA Goals |
| 9 | جدول التدريب | Internship Schedule |
| 10 | خطة التخرج | Graduation Plan |

### Onboarding flow (Standard Auth + Template Picker — Option B)
- URL: `/signup?plan=student` pre-selects the student plan on the pricing page
- Auth flow is identical to standard (phone → OTP)
- After successful auth, if `plan=student` param was present OR user selected student plan: show `StudentTemplateModal`
- `StudentTemplateModal`: full-screen modal, amber design, 10 template cards in a 2-col grid, "اختر قالب تبدأ فيه" heading, skip link
- Selecting a template:
  1. Creates pre-populated vault items via Supabase insert
  2. Sets `user_metadata.plan = 'student'` and `user_metadata.template = templateId`
  3. Redirects to `/vault`

### Files
- `components/thakirni/student-template-modal.tsx` — the template picker modal
- `lib/student-templates.ts` — template data definitions
- Update `components/thakirni/pricing-section.tsx` — add Student card
- Update `app/vault/layout.tsx` or onboarding redirect logic — detect `plan=student` and trigger modal

---

## Design System Rules (all features)

- **Colors**: amber/orange only. No green, blue, or purple accents.
- **Cards**: `rounded-2xl`, `bg-white/[0.03]` dark or `bg-amber-50 dark:bg-amber-950/20` light
- **Borders**: `border-amber-900/30` dark, `border-amber-100` light
- **Buttons**: `power-gradient` for primary CTAs
- **Typography**: `font-headline` for headings, existing `text-foreground` / `text-muted-foreground`
- **Animations**: `motion` from framer-motion with existing `cardVariants` pattern
- **Bilingual**: all user-facing strings use `t("ar", "en")` via `useLanguage()`

---

## File Checklist

**New files:**
- `components/thakirni/vision2030-section.tsx`
- `app/vault/health/page.tsx`
- `components/thakirni/student-template-modal.tsx`
- `lib/student-templates.ts`
- `app/api/cron/prayer-reminders/route.ts`
- `app/api/cron/health-nudges/route.ts`
- Supabase migrations: `prayer_subscriptions`, `health_logs`, `health_nudge_subscriptions`, `profiles.dialect` column

**Modified files:**
- `components/thakirni/hero-section.tsx` — Vision 2030 badge
- `components/thakirni/vault-sidebar.tsx` — Health nav item
- `components/thakirni/pricing-section.tsx` — Student plan card
- `app/api/chat/route.ts` — dialect system prompt
- `app/api/webhooks/whatsapp/route.ts` — typo fixes + prayer/health opt-in handlers
- `app/layout.tsx` — SEO metadata
- Landing page component order — add `<Vision2030Section />` above footer
