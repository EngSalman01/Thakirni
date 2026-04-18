# Thakirni → Obsidian-Assembly-style Redesign Plan

> Status: **draft for approval**. No code changes yet.
> After you sign off (or redline this doc), I'll execute in phases.

---

## 0. TL;DR

We're turning Thakirni from a warm-amber productivity SaaS into an editorial, atelier-style private application styled after **obsidianassembly.com**. That means:

- **New design system** — dark stone/cream palette, serif display type, generous whitespace, slow deliberate motion.
- **Full brand overhaul** — new wordmark treatment, new copy voice, new section naming (Places / Objects / Updates / Admission / People → adapted to Thakirni's domain).
- **Every surface restyled** — landing, vault (22 routes), admin (11 pages), auth, checkout.
- **Functionality preserved** — we keep all Supabase/Paddle/i18n/Framer-Motion wiring; only the visual layer and copy change.

---

## 1. Obsidian Assembly — captured design system

### 1.1 Color tokens (verbatim from their CSS)

| Token | Hex | Role |
|---|---|---|
| `--c-black` | `#151415` | Page base / deep background |
| `--c-stone` | `#242324` | Elevated surface on dark |
| `--c-grey` | `#3f383c` | Muted surface / hairline |
| `--c-brown` | `#7b5136` | Warm gradient accent |
| `--c-red` | `#ff5113` | Single strong accent (links, dots) |
| `--c-stroke` | `#9faf9b` | Sage stroke / divider |
| `--c-yellow` | `#f1eade` | Cream light-mode base |
| `--c-white` | `#fff` | Pure white |

Backgrounds alternate: **deep (black→stone→brown gradient)** for immersive / gallery sections, **cream (`#f1eade`)** for editorial / text sections. The whole page sits inside a soft warm vignette (outer glow).

### 1.2 Typography

| Role | Family | Notes |
|---|---|---|
| Display (hero) | **Voyage Regular** | Huge, 180–240px, ultra-contrast serif, ligatured |
| Display (sections) | **OT Jubilee Platinum** | 40–84px, tall condensed serif for section titles + wordmark |
| Body / UI | **Switzer** (Regular & Medium) | 14–22px, neutral geometric sans, 1.3 line-height |

- Body base: `1rem / 24px, line-height 1.3`.
- Wordmark "The / Obsidian / Assembly" is stacked on three lines in OT Jubilee.
- All caps labels use Switzer Medium with heavy letter-spacing (tabs, buttons).

Substitutes on Google Fonts (since OT Jubilee and Voyage are licensed):
- **Display serif** → `Cormorant Garamond` (already in Thakirni) or **Fraunces** at optical-size 144 + high contrast axis.
- **Body sans** → Switzer is free from Fontshare — we'll ship it via `@fontsource` or self-host; fallback `Inter`.

### 1.3 Motion & interaction

- Easings: `cubic-bezier(.35,.35,0,1)` (primary), `.5,0,.3,1` (smooth), `.2,.75,.35,1` (fast), a springy `.6,.5,0,3`.
- Page reveals are ~800ms, sections fade-up as they enter viewport.
- Header "pill" buttons animate between active/inactive on scroll.
- Carousels: horizontal peek-cards with ← → arrows and a `1/7`, `4/7` counter.
- Decorative SVG orbit line threads through sections.

### 1.4 Layout patterns

1. **Hero** — oversized display type, images anchored in corners, small callouts in far corners, single CTA pill button.
2. **Gallery cards** — large image, small lowercase label, numeric counter, no borders.
3. **Updates feed** — 3-column stacked cards, each: tag / title / one-sentence body.
4. **Admission form** — wide form with inline labels ("Full Name", "Email Address", "Country", "Context for Admission"), checkbox consent, pill submit button.
5. **Footer** — enormous serif links (`Places / Objects / About / Contacts / People`) on cream, curved decorative line, small legal row at bottom.

---

## 2. Brand overhaul for Thakirni

### 2.1 New name treatment

The word "Thakirni" stays (domain + legal continuity). But we treat it like Obsidian Assembly treats theirs:

- Stacked wordmark in the top-left corner:
  ```
  Thakirni
  ذكرني
  ```
  (English in OT-Jubilee-style serif, Arabic in a matched display Arabic — e.g. `IBM Plex Sans Arabic` or `Reem Kufi` at display weight).
- Tagline beside the wordmark in Switzer Medium 14px: **"A Private Second Brain"** (English) / **"ذاكرة خاصة"** (Arabic).

### 2.2 Domain mapping (OA section → Thakirni equivalent)

| Obsidian Assembly | Thakirni |
|---|---|
| **Places** (physical locations) | **Vaults** — the rooms inside your second brain (memories, projects, plans, focus) |
| **Objects** (items made in places) | **Artifacts** — what your vaults produce (notes, summaries, decisions, voice captures) |
| **Updates** (status changes) | **Dispatches** — recent activity / reminders / AI suggestions |
| **Admission** (gated entry form) | **Admission** — waitlist / sign-up (kept verbatim; matches the "intentional" tone) |
| **People** (anonymous collective) | **Assembly** — team members & collaborators |
| **About** | **About** |
| **Contacts** | **Contacts** |

Dashboard nav becomes: `Vaults · Artifacts · Dispatches · Assembly · Admission · Settings`.

### 2.3 Copy voice

Thakirni's current copy is bright, product-marketing, Vision-2030-forward. New voice mirrors OA:

- Short declarative fragments. No marketing superlatives.
- Present tense, passive voice allowed.
- Arabic/English bilingual but with the same measured cadence in both.
- Example transformations:
  - Before: *"AI-powered second brain for Vision 2030 — remember everything, effortlessly."*
  - After: *"Nothing Shown First. / Commitment Precedes Entry. / A private second brain, kept by invitation."*
  - Before: *"Upgrade to Pro"*
  - After: *"Seek Full Admission"*
  - Before: *"Add a memory"*
  - After: *"Commit an artifact"*

### 2.4 Logo / favicon

- Replace current amber squircle logo with:
  - A stacked wordmark SVG (English top, Arabic bottom).
  - A new mark: a sharp obsidian shard or tessellated dot — rendered in cream on dark, charcoal on cream.
- Keep `brand-logo.tsx`'s four states (idle / action / voice / thinking) but redraw the animations as **slow fades and a single orbit line** instead of amber particle bursts.

---

## 3. New Thakirni design system

Concrete replacement for `frontend/app/globals.css` + `tailwind.config`.

### 3.1 Color tokens

```css
:root {
  /* dark mode is the default in OA — we match that */
  --c-obsidian:   #151415;  /* page base */
  --c-stone:      #242324;  /* elevated surface */
  --c-grey:       #3f383c;  /* muted surface / hairline */
  --c-brown:      #7b5136;  /* warm gradient accent */
  --c-ember:      #ff5113;  /* single strong accent */
  --c-sage:       #9faf9b;  /* sage stroke / divider */
  --c-parchment:  #f1eade;  /* cream — light surfaces */
  --c-ivory:      #ffffff;

  /* semantic */
  --bg:           var(--c-obsidian);
  --surface:      var(--c-stone);
  --text:         var(--c-parchment);
  --text-muted:   rgba(241,234,222,0.6);
  --text-subtle:  rgba(241,234,222,0.4);
  --border:       rgba(159,175,155,0.15);
  --accent:       var(--c-ember);
  --success:      #9faf9b;  /* sage doubles as success */
  --warn:         #e6a15b;
  --error:        var(--c-ember);
}

.parchment {
  --bg: var(--c-parchment);
  --surface: #ffffff;
  --text: var(--c-obsidian);
  --text-muted: rgba(21,20,21,0.65);
  --text-subtle: rgba(21,20,21,0.45);
  --border: rgba(21,20,21,0.12);
}
```

### 3.2 Typography

```ts
// next/font
import { Fraunces } from 'next/font/google';          // display serif
import localFont from 'next/font/local';               // Switzer self-hosted

export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
  variable: '--font-display',
});
export const switzer = localFont({
  src: [
    { path: '../fonts/Switzer-Regular.woff2', weight: '400' },
    { path: '../fonts/Switzer-Medium.woff2',  weight: '500' },
  ],
  variable: '--font-body',
});
export const reemKufi = Reem_Kufi({ subsets: ['arabic'], variable: '--font-arabic' });
```

Type scale:

| Token | Size / line-height | Usage |
|---|---|---|
| `display-xl` | `clamp(120px, 18vw, 240px)` / 0.95 | Hero ("Nothing Shown First" equivalent) |
| `display-lg` | `clamp(72px, 10vw, 140px)` / 1.0 | Section titles (Vaults, Artifacts) |
| `display-md` | `clamp(42px, 5vw, 84px)` / 1.05 | Sub-section titles |
| `display-sm` | `clamp(28px, 3vw, 44px)` / 1.15 | Card titles |
| `body-lg` | `22px / 1.3` | Lead paragraph |
| `body` | `18px / 1.35` | Default |
| `body-sm` | `14px / 1.4` | Meta, labels |
| `label` | `12px / 1 / tracking 0.12em / uppercase` | Pill buttons, tabs |

### 3.3 Spacing / layout

- 12-column grid, `--col` width computed, gutter `1rem`.
- Section vertical rhythm: `clamp(96px, 12vw, 200px)` top/bottom.
- Container: `max-width: 1600px` with 48–96px side padding.

### 3.4 Shape + motion

- Radii: `--r-pill: 999px` (used for nav/buttons), `--r-card: 16px`, otherwise zero.
- Shadows: almost none. Depth comes from value contrast, not blur.
- Motion defaults: `duration: 0.7s, ease: cubic-bezier(.35,.35,0,1)`.
- Reveal-on-scroll: translateY(24px) + opacity — no scale.
- Global outer vignette: `box-shadow: inset 0 0 180px 40px rgba(255,81,19,0.18)` on `<html>`.

### 3.5 Shared components to (re)build

These replace or re-skin existing `components/ui/*` and Thakirni-specific components:

- `Pill` — rounded full label/button used for all top-nav actions.
- `SectionTitle` — huge serif display with an optional numeric counter (e.g. `4/7`).
- `GalleryCarousel` — horizontal card peek with arrow controls and counter; reused on landing + vault list views.
- `DispatchCard` — 3-col update card (tag / title / one-line body).
- `AdmissionForm` — wide form with inline labels & checkbox consent.
- `FooterConstellation` — huge serif link grid with a curved decorative SVG.
- `OrbitSVG` — the thin decorative curve line that runs through pages.
- `WordmarkStacked` — the new 3-line wordmark.

---

## 4. Page-by-page redesign intent

### 4.1 Landing & marketing

| Route | Treatment |
|---|---|
| `/` | Rewrite as: hero ("Nothing Shown First" analog) → Vaults gallery carousel → Artifacts carousel → Connection essay (OA's "Item Shown at Point of Origin" layout) → Dispatches feed → Assembly (People) arch → Admission form → Constellation footer. |
| `/about` | Huge stacked wordmark hero, short editorial paragraphs on cream background. |
| `/contact` | Minimal form matching the Admission component + small map/coordinates footer. |
| `/pricing` | Becomes "**Admission Tiers**" — two cream cards (Standard / Full Admission) with serif prices. |
| `/enterprise` | "**Assembly Plans**" — editorial one-pager. |
| `/help`, `/privacy`, `/terms`, `/refund`, `/legal/*` | Long-form editorial layout — cream bg, serif H1, Switzer body, 720px measure. |

### 4.2 Vault (authenticated app)

The tension: OA is a gallery, Thakirni's vault is a working dashboard. Our resolution:

- **Chrome** — replace the current left sidebar with a **top pill nav** (Vaults / Artifacts / Dispatches / Assembly / Settings) + a second-level tab strip per section. Matches OA's horizontal button groups. Mobile gets a bottom-sheet drawer.
- **Dashboard** (`/vault`) — hero strip: time of day greeting in serif display, single-line dispatch of today's focus, then four wide horizontal cards (Vaults / Artifacts / Dispatches / Focus) on dark.
- **Memories / Artifacts** (`/vault/memories`, `/vault/new-memory`) — editorial list view with large serif titles, a thin sage divider between rows, no card shadows.
- **Projects** (`/vault/projects/[id]`) — split layout: left = table of contents in Switzer Medium caps; right = document body in Fraunces-ish serif editable region.
- **Calendar / Reminders / Habits / Goals / Plans / Health / Analytics / Focus / Meetings / Voice-note / Tributes / Teams / Upload / Workspace** — each gets the same chrome and the same list/gallery primitives. Data dense tables become **editorial rows** (type-led, not cell-led); charts get restyled to 2-color (ember on stone).
- **Settings** — OA-style dual column: serif section titles on cream panel, form controls in Switzer.
- **Assistant** (`/vault/assistant`) — becomes a quiet, centered text column. User messages right-aligned in parchment, AI responses full-width in sage italic serif.

### 4.3 Admin panel

- **Login** — black bg, centered stacked wordmark, two fields, pill button "Seek Admission" styled as "Enter".
- **Layout** — same top pill nav as vault, but secondary tabs for: `Users / Subscriptions / Discounts / Announcements / Leads / Analytics / Logs / Jobs / Compliance / Settings`.
- **Pages** — data tables keep their density but get the ember/sage palette, serif column headers, cream row-hover. Recharts charts restyled.

### 4.4 Auth + checkout

- **`/auth`** — full-bleed dark page, huge "Admission" serif title, subtle sage orbit, form lives in a cream card centered. HCaptcha re-themed dark.
- **`/auth/reset-password`, `/update-password`** — same template, different serif title.
- **`/checkout/individual`, `/checkout/team`** — cream page, serif title "Finalize Admission", Paddle embedded checkout restyled (via Paddle's theme options).
- **`/join-team`** — "Accept Invitation" in serif.

---

## 5. Implementation plan (phased)

Each phase ends in a working app — no long-lived broken branches.

### Phase 0 — Foundations (no visual change yet)
- Add new fonts (self-host Switzer; add Fraunces + Reem Kufi via next/font/google).
- Introduce new CSS variables in `globals.css` behind a class flag `.oa-theme` (fallback: existing theme stays default).
- Add shared primitives (`Pill`, `SectionTitle`, `GalleryCarousel`, `DispatchCard`, `AdmissionForm`, `FooterConstellation`, `OrbitSVG`, `WordmarkStacked`) in `components/thakirni/atelier/*`.
- Ship new logo SVGs (`/logo-stacked.svg`, `/logo-mark.svg`) and favicon set.

### Phase 1 — Landing + marketing flip
- Rebuild `app/page.tsx` to compose the new sections with the new primitives.
- Rewrite `landing-header.tsx`, `hero-section.tsx`, `features-section.tsx`, `pricing-section.tsx`, `vision2030-section.tsx`, `testimonials-section.tsx`, `cta-section.tsx`, `landing-footer.tsx` as atelier versions (keep file names for git diff clarity).
- Restyle `/about`, `/contact`, `/pricing`, `/enterprise`, `/help`, legal pages.
- Remove `.oa-theme` gate on marketing routes — becomes default there.

### Phase 2 — Auth + checkout
- Redesign `app/auth/*`, `app/checkout/*`, `app/join-team/*`.
- Theme Paddle + HCaptcha.

### Phase 3 — Vault chrome + dashboard
- Replace `app/vault/layout.tsx` sidebar with top pill nav + mobile drawer.
- Redesign dashboard (`app/vault/page.tsx`, dashboards/*) with hero + four horizontal cards.

### Phase 4 — Vault inner pages
- Roll the new primitives through memories, projects, calendar, focus, tasks, goals, habits, plans, reminders, analytics, health, meetings, voice-note, tributes, teams, workspace, upload, settings, assistant.
- Restyle recharts.
- Restyle `CommandPalette`, `GlobalSearch`, `BulkActionBar`, toasts.

### Phase 5 — Admin panel
- Restyle login, layout, every `(panel)` route.
- Restyle admin charts + tables.

### Phase 6 — Polish
- Motion pass (fade-ups, header transitions, carousel arrows).
- Vignette + orbit SVGs on every page.
- Delete the old theme class and amber tokens.
- RTL QA for every page.
- Lighthouse / a11y audit.

---

## 6. Risks & trade-offs (you should know)

1. **Data-dense admin tables lose a little clarity** with serif headers + minimal borders. I'll keep Switzer (sans) for numeric cells to mitigate.
2. **Font licensing** — OT Jubilee Platinum and Voyage Regular are commercial. We can't use them. Fraunces (Google, open) is the closest substitute for OT Jubilee; no free drop-in for Voyage's hero face — Fraunces handles both with two different optical-size settings.
3. **Bilingual Arabic** — the OA aesthetic was designed for Latin only. Getting an Arabic display serif that feels equally editorial is non-trivial. `Reem Kufi Fun` or a custom Noto Naskh variable is the best I can do from Google Fonts.
4. **Vision 2030 / SDAIA copy** — that's locally meaningful marketing. The OA voice is deliberately decontextual. I'll remove the Vision-2030 section by default; if you want it, we can keep a restrained "Context" page that references it in editorial prose.
5. **Scope** — this is a 6-phase job. Realistic breakdown below.

### Time estimate (approximate)

| Phase | Size |
|---|---|
| 0. Foundations | ~1 session |
| 1. Landing + marketing | ~1 session |
| 2. Auth + checkout | ~half session |
| 3. Vault chrome + dashboard | ~1 session |
| 4. Vault inner pages (19 routes) | ~2 sessions |
| 5. Admin panel (11 routes) | ~1 session |
| 6. Polish | ~half session |

---

## 7. Decisions I need from you before I start

1. **Name**: keep "Thakirni" verbatim? Or introduce a secondary "atelier" name (e.g. *Thakirni / ذكرني — a Private Second Brain*)?
2. **Fonts**: OK with Fraunces + Switzer + Reem Kufi? Or do you want me to source Cormorant (already installed) as display instead?
3. **Vision 2030 section**: remove entirely, or keep as a quiet "Context" page?
4. **Sidebar vs top nav in vault**: OA uses top pills; Thakirni currently uses a left sidebar. Do we commit to top pills? (I recommend yes — it's what makes it feel OA-ish.)
5. **Section names**: Vaults / Artifacts / Dispatches / Assembly / Admission — OK? Or prefer different Arabic-first labels?
6. **Pricing → "Admission Tiers"**: is that rename OK, or keep "Pricing"?
7. **Phase gating**: approve the whole plan and execute end-to-end, or approve Phase 0+1 first and review before we continue?

Reply with answers (even terse ones) and I'll start Phase 0.
