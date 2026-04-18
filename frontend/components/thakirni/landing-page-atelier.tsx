"use client"

/**
 * LandingPageAtelier — full landing composition using the atelier design system.
 *
 * Sections, top → bottom:
 *   1. TopNav       — stacked wordmark + pill nav + sign-in CTA
 *   2. Hero         — oversized editorial hero: "Thakirni / your second brain"
 *   3. Scroll index — eyebrow strip "01 Assembly · 02 Vaults · …"
 *   4. Assembly     — the 3-column proposition grid
 *   5. Vaults       — gallery carousel of "places" the vault holds
 *   6. Dispatches   — editorial card grid (blog / case studies)
 *   7. Admission    — the OA-style waitlist form
 *   8. Tiers        — admission tiers (pricing, reframed)
 *   9. Footer       — constellation with oversized serif links
 *
 * All copy is rendered bilingually via `t(ar, en)`.
 * Uses atelier primitives from @/components/thakirni/atelier for consistency.
 */

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

import {
  Pill,
  PillRow,
  SectionTitle,
  WordmarkStacked,
  OrbitSvg,
  DispatchCard,
  GalleryCarousel,
  AdmissionForm,
  FooterConstellation,
  type GallerySlide,
} from "@/components/thakirni/atelier"

// ── i18n helper ────────────────────────────────────────────────────────────
type L = "ar" | "en"
const tr = (lang: L) => (ar: string, en: string) => (lang === "ar" ? ar : en)

// ── Top nav ─────────────────────────────────────────────────────────────────

function TopNav({
  locale,
  isDark,
  onToggleTheme,
  onToggleLang,
  onGoAuth,
}: {
  locale: L
  isDark: boolean
  onToggleTheme: () => void
  onToggleLang: () => void
  onGoAuth: () => void
}) {
  const t = tr(locale)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--atelier-z-sticky)]",
        "backdrop-blur-md transition-all duration-[var(--atelier-dur-2)]",
        scrolled
          ? "bg-[color-mix(in_oklab,var(--atelier-bg)_85%,transparent)] border-b border-[var(--atelier-border)]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="atelier-container flex items-center justify-between py-5 md:py-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group inline-flex items-center gap-3"
          aria-label="Thakirni home"
        >
          <WordmarkStacked
            size="sm"
            orientation="inline"
            primary={locale === "ar" ? "arabic" : "latin"}
          />
        </button>

        <nav className="hidden md:block">
          <PillRow>
            <Pill as="link" href="#features" variant="outline" size="sm">
              {t("الميزات", "Features")}
            </Pill>
            <Pill as="link" href="#showcase" variant="outline" size="sm">
              {t("الفولت", "Vault")}
            </Pill>
            <Pill as="link" href="#pricing" variant="outline" size="sm">
              {t("الأسعار", "Pricing")}
            </Pill>
            <Pill as="link" href="#about" variant="outline" size="sm">
              {t("من نحن", "About")}
            </Pill>
          </PillRow>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--atelier-border-strong)] text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] hover:border-[var(--c-parchment)] transition-colors"
          >
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleLang}
            className="hidden md:inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--atelier-border-strong)] px-3 atelier-eyebrow text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] hover:border-[var(--c-parchment)] transition-colors"
          >
            {locale === "ar" ? "EN" : "ع"}
          </button>
          <Pill as="button" variant="solid" size="sm" onClick={onGoAuth}>
            {t("ابدأ مجاناً", "Start free")}
          </Pill>
        </div>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onGoAuth, locale }: { onGoAuth: () => void; locale: L }) {
  const t = tr(locale)
  return (
    <section className="relative isolate overflow-hidden">
      {/* Orbit decoration — centered behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"
      >
        <OrbitSvg preset="active" size={900} />
      </div>
      {/* Ember halo */}
      <div
        aria-hidden
        className="atelier-glow-pulse pointer-events-none absolute left-1/2 top-[40%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(255,81,19,0.22), transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      <div className="atelier-container relative pb-32 pt-24 md:pb-40 md:pt-28">
        {/* Eyebrow */}
        <div className="atelier-eyebrow mb-10 flex items-baseline gap-3 text-[var(--atelier-text-subtle)]">
          <span className="tabular-nums text-[var(--c-ember)]">00</span>
          <span aria-hidden>/</span>
          <span>{t("ذكرني · مساعدك الذكي · رؤية 2030", "Thakirni · Your AI assistant · Vision 2030")}</span>
        </div>

        {/* Hero headline — stacked editorial */}
        <h1
          className={cn(
            "atelier-hero",
            locale === "ar" ? "atelier-display-ar" : "atelier-display",
            "text-[var(--c-parchment)]",
            "max-w-[16ch]",
          )}
        >
          {locale === "ar" ? (
            <>
              <span className="block">عقلك</span>
              <span className="block atelier-italic text-[var(--c-parchment-2)]">
                الثاني
              </span>
            </>
          ) : (
            <>
              <span className="block">Your second</span>
              <span className="block atelier-italic text-[var(--c-parchment-2)]">
                brain
              </span>
            </>
          )}
        </h1>

        {/* Lede */}
        <p className="atelier-lead mt-10 max-w-[52ch] text-[var(--atelier-text-muted)]">
          {t(
            "ذكرني يحفظ ما يهمّك، يذكّرك حين تحتاج، ويعيد ترتيب يومك بهدوء. عبر واتساب والويب — بالعربية والإنجليزية.",
            "Thakirni keeps what matters, surfaces it when you need it, and restores order to your day — on WhatsApp and the web, in Arabic and English.",
          )}
        </p>

        {/* CTA row */}
        <div className="mt-12 flex flex-col items-start gap-6">
          <PillRow>
            <Pill
              as="button"
              variant="solid"
              size="lg"
              onClick={onGoAuth}
              trailing={<span aria-hidden>{locale === "ar" ? "←" : "→"}</span>}
            >
              {t("ابدأ الآن", "Start Now")}
            </Pill>
            <Pill as="link" href="#showcase" variant="outline" size="lg">
              {t("جرّب واتساب", "Try WhatsApp")}
            </Pill>
          </PillRow>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 atelier-label text-[var(--atelier-text-subtle)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-[2px] w-3 bg-[var(--c-ember)]" />
              {t("رؤية 2030", "Vision 2030")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-[2px] w-3 bg-[var(--c-sage)]" />
              {t("عام الذكاء الاصطناعي 2026", "Year of AI 2026")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-[2px] w-3 bg-[var(--c-parchment-2)]" />
              {t("مصنوع في الرياض", "Made in Riyadh")}
            </span>
          </div>
        </div>
      </div>

      {/* Thin bottom rule */}
      <div className="atelier-container">
        <hr className="atelier-rule" />
      </div>
    </section>
  )
}

// ── Scroll index ─────────────────────────────────────────────────────────────

function SectionIndex({ locale }: { locale: L }) {
  const t = tr(locale)
  const items = [
    { n: "01", href: "#features", label: t("الميزات", "Features") },
    { n: "02", href: "#showcase", label: t("الفولت", "Vault") },
    { n: "03", href: "#stories", label: t("قصص", "Stories") },
    { n: "04", href: "#pricing", label: t("الأسعار", "Pricing") },
    { n: "05", href: "#cta", label: t("ابدأ", "Get Started") },
  ]
  return (
    <nav aria-label="Section index" className="atelier-container py-10">
      <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
        {items.map((it) => (
          <li key={it.href}>
            <a
              href={it.href}
              className="group inline-flex items-baseline gap-3 atelier-eyebrow text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] transition-colors"
            >
              <span className="tabular-nums text-[var(--c-ember)] transition-colors">
                {it.n}
              </span>
              <span>{it.label}</span>
              <span
                aria-hidden
                className="h-[1px] w-6 origin-left scale-x-0 bg-[var(--c-ember)] transition-transform duration-[var(--atelier-dur-2)] group-hover:scale-x-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ── 01 · Assembly (feature proposition) ──────────────────────────────────────

function FeaturesSection({ locale }: { locale: L }) {
  const t = tr(locale)
  const cards = [
    {
      n: "01",
      title: t("ذاكرة تدوم", "A memory that persists"),
      body: t(
        "كل ما تقوله، كل ما تلاحظه، كل ما يستحق — محفوظ ومفهرس بذكاء.",
        "Everything you say, notice, or want to keep — indexed and retrievable.",
      ),
    },
    {
      n: "02",
      title: t("نظام يعرف سياقك", "A system that knows context"),
      body: t(
        "يذكّرك في المكان الصحيح، والوقت الصحيح، وبنبرة تشبهك.",
        "Reminders arrive at the right place, the right time, and in the voice you choose.",
      ),
    },
    {
      n: "03",
      title: t("خصوصية بالتصميم", "Privacy by design"),
      body: t(
        "مشفّر في الاستقرار وفي الانتقال. بياناتك لا تدرّب نموذجًا آخر.",
        "Encrypted at rest and in flight. Your data never trains anyone else's model.",
      ),
    },
  ]
  return (
    <section id="features" className="atelier-container atelier-section">
      <SectionTitle
        eyebrowNumeral="01"
        eyebrow={t("الميزات", "Features")}
        headline={t("كيف يعمل ذكرني", "How Thakirni works")}
        accent={t("بهدوء.", "quietly.")}
        kicker={t(
          "ثلاثة مبادئ تشكّل عمود الأداة — الذاكرة، السياق، والخصوصية. هذه ليست مجرد ميزات؛ هي الطريقة التي نرى بها ماذا يعني 'مساعد ذكي' فعلًا.",
          "Three principles form the instrument's spine — memory, context, and privacy. These aren't feature bullets; they're what we think an intelligent assistant actually is.",
        )}
        locale={locale}
      />

      <div className="mt-16 grid grid-cols-1 gap-[var(--atelier-gutter)] md:grid-cols-3">
        {cards.map((c, i) => (
          <article
            key={i}
            className={cn(
              "group relative flex flex-col gap-6 p-8",
              "border-t border-[var(--atelier-border-strong)]",
              "hover:border-[var(--c-ember)] transition-colors duration-[var(--atelier-dur-3)]",
            )}
          >
            <div className="flex items-baseline justify-between atelier-eyebrow">
              <span className="tabular-nums text-[var(--c-ember)]">{c.n}</span>
              <span className="text-[var(--atelier-text-subtle)]">
                {t("ميزة", "Feature")}
              </span>
            </div>
            <h3
              className={cn(
                "atelier-h3",
                locale === "ar" ? "atelier-display-ar" : "atelier-display",
                "text-[var(--atelier-text)]",
              )}
            >
              {c.title}
            </h3>
            <p className="atelier-body text-[var(--atelier-text-muted)]">
              {c.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

// ── 02 · Vaults (gallery) ────────────────────────────────────────────────────

function ShowcaseSection({ locale }: { locale: L }) {
  const t = tr(locale)

  const slides: GallerySlide[] = useMemo(
    () => [
      {
        id: "memories",
        label: t("الفولت / الذكريات", "Vault / Memories"),
        caption: t(
          "كل ذكرى محفوظة، مفهرسة، قابلة للاسترجاع عبر البحث أو السياق.",
          "Every memory stored, indexed, and recallable by search or context.",
        ),
        content: <VaultPlaceholder title="Memories" accent="ember" />,
      },
      {
        id: "projects",
        label: t("الفولت / المشاريع", "Vault / Projects"),
        caption: t(
          "مشاريع جارية مع مهامها، ملاحظاتها، وجدولها الزمني في مكان واحد.",
          "Live projects with their tasks, notes, and timeline in a single place.",
        ),
        content: <VaultPlaceholder title="Projects" accent="sage" />,
      },
      {
        id: "calendar",
        label: t("الفولت / التقويم", "Vault / Calendar"),
        caption: t(
          "تقويم يفهم الجملة الطبيعية ويعرف فرق المواعيد الرسمية من العادية.",
          "A calendar that parses natural language and distinguishes official from personal.",
        ),
        content: <VaultPlaceholder title="Calendar" accent="parchment" />,
      },
      {
        id: "habits",
        label: t("الفولت / العادات", "Vault / Habits"),
        caption: t(
          "متابعة العادات بدون ضغط — تذكير خفيف، قياس دقيق، مسار لطيف.",
          "Habits tracked without guilt — gentle nudges, honest metrics, a forgiving streak.",
        ),
        content: <VaultPlaceholder title="Habits" accent="brown" />,
      },
    ],
    [locale],
  )

  return (
    <section id="showcase" className="atelier-container atelier-section">
      <SectionTitle
        eyebrowNumeral="02"
        eyebrow={t("الفولت", "Vault")}
        headline={t("ما يسكن في داخل ذكرني", "Inside your vault")}
        accent={t("وكيف تراه.", "— how you see it.")}
        locale={locale}
      />

      <div className="mt-16">
        <GalleryCarousel slides={slides} perView={1} aspect="16/10" />
      </div>
    </section>
  )
}

/** Placeholder visual used inside each vault slide.
 * Replaces the real dashboard screenshots in later phases. */
function VaultPlaceholder({
  title,
  accent,
}: {
  title: string
  accent: "ember" | "sage" | "parchment" | "brown"
}) {
  const accentMap: Record<typeof accent, string> = {
    ember: "var(--c-ember)",
    sage: "var(--c-sage)",
    parchment: "var(--c-parchment)",
    brown: "var(--c-brown)",
  }
  return (
    <div className="relative h-full w-full bg-[var(--atelier-bg-elevated)]">
      {/* Warm radial */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 30% 40%, ${accentMap[accent]}22, transparent 60%)`,
        }}
      />
      {/* Orbit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <OrbitSvg preset="ambient" size={420} stroke={accentMap[accent]} />
      </div>
      {/* Label */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-3">
        <span className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
          Vault exhibit
        </span>
        <span className="atelier-display text-[clamp(2rem,5vw,3.5rem)] font-light text-[var(--c-parchment)]">
          {title}
        </span>
      </div>
      {/* Grid dots in corner */}
      <div className="absolute right-6 top-6 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full"
            style={{ background: "var(--atelier-border-strong)" }}
          />
        ))}
      </div>
    </div>
  )
}

// ── 03 · Dispatches ──────────────────────────────────────────────────────────

function StoriesSection({ locale }: { locale: L }) {
  const t = tr(locale)
  const posts = [
    {
      eyebrow: t("مقالة", "Essay"),
      date: t("٢٠٢٦٫٠٤", "2026.04"),
      title: t("لماذا الذاكرة؟", "Why memory?"),
      excerpt: t(
        "نحن لا نفقد المعلومات، نفقد السياق. هذه دعوة لبناء أدوات تستعيده.",
        "We don't lose information — we lose context. A case for tools that restore it.",
      ),
    },
    {
      eyebrow: t("ميدان", "Field"),
      date: t("٢٠٢٦٫٠٣", "2026.03"),
      title: t("أسبوع مع ذكرني", "A week with Thakirni"),
      excerpt: t(
        "سبعة أيام من الاستخدام الحقيقي — الانتصارات، الإخفاقات، وما بقي في الذاكرة.",
        "Seven days of real use — the wins, the misses, and what stayed in memory.",
      ),
    },
    {
      eyebrow: t("تصميم", "Design"),
      date: t("٢٠٢٦٫٠٢", "2026.02"),
      title: t("هدوء الواجهة", "The quiet interface"),
      excerpt: t(
        "كيف تبنى أداة لا تصرخ. دروس من التراث، وأدوات الكتابة، والمساجد.",
        "How to build a tool that doesn't shout. Lessons from heritage, writing instruments, and mosques.",
      ),
    },
  ]
  return (
    <section id="stories" className="atelier-container atelier-section">
      <SectionTitle
        eyebrowNumeral="03"
        eyebrow={t("قصص", "Stories")}
        headline={t("من المدونة", "From the blog")}
        locale={locale}
      />

      <div className="mt-16 grid grid-cols-1 gap-[var(--atelier-gutter)] md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <DispatchCard
            key={i}
            eyebrow={p.eyebrow}
            date={p.date}
            title={p.title}
            excerpt={p.excerpt}
            readLabel={t("اقرأ", "Read")}
            locale={locale}
            cover={
              <div className="h-full w-full bg-[var(--atelier-bg-elevated)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <OrbitSvg preset="quiet" size={320} />
                </div>
              </div>
            }
          />
        ))}
      </div>
    </section>
  )
}

// ── 04 · Admission ───────────────────────────────────────────────────────────

function CtaSection({ onGoAuth, locale }: { onGoAuth: () => void; locale: L }) {
  const t = tr(locale)

  const handleSubmit = async (email: string) => {
    // Placeholder — Phase 2 wires this to the real auth flow.
    await new Promise((r) => setTimeout(r, 400))
    // eslint-disable-next-line no-console
    console.log("[atelier] lead capture", email)
    onGoAuth()
  }

  return (
    <section
      id="cta"
      className="atelier-container atelier-section relative isolate overflow-hidden"
    >
      <div className="grid grid-cols-1 gap-[calc(var(--atelier-gutter)*1.5)] md:grid-cols-5">
        <div className="md:col-span-2">
          <SectionTitle
            eyebrowNumeral="05"
            eyebrow={t("ابدأ", "Get started")}
            headline={t("ابدأ مع ذكرني اليوم", "Start with Thakirni today")}
            accent={t("مجاناً.", "for free.")}
            kicker={t(
              "اكتب بريدك وسنفتح لك الفولت مباشرة. لا بطاقة ائتمان، لا رسوم مخفية — ابدأ بـ 50 رسالة شهرياً.",
              "Enter your email and we'll open the vault. No credit card, no hidden fees — you start with 50 free messages a month.",
            )}
            locale={locale}
            rule={false}
          />
        </div>
        <div className="md:col-span-3">
          <AdmissionForm
            eyebrow={t("ابدأ · 05", "Start · 05")}
            heading={t("افتح فولتك الآن", "Open your vault now")}
            description={t(
              "بريدك فقط — وتكون داخل ذكرني في ثوانٍ.",
              "Just your email — and you're inside Thakirni in seconds.",
            )}
            submitLabel={t("ابدأ مجاناً", "Start free")}
            placeholder={t("بريدك@الإلكتروني", "you@domain.com")}
            fineprint={t(
              "بالاستمرار توافق على الشروط وسياسة الخصوصية.",
              "By continuing you agree to our terms and privacy policy.",
            )}
            onSubmit={handleSubmit}
            locale={locale}
          />
        </div>
      </div>
    </section>
  )
}

// ── 05 · Tiers ───────────────────────────────────────────────────────────────

function PricingSection({
  onGoAuth,
  locale,
}: {
  onGoAuth: () => void
  locale: L
}) {
  const t = tr(locale)
  const tiers = [
    {
      n: "01",
      name: t("مجاني", "Free"),
      price: "0",
      unit: t("ر.س · شهرياً", "SAR · month"),
      blurb: t(
        "ابدأ بدون التزام. كل الأساسيات، بدون قيود زمنية.",
        "Begin without commitment. All essentials, no expiry.",
      ),
      features: [
        t("50 رسالة شهرياً", "50 messages / month"),
        t("ذاكرة أساسية", "Basic memory"),
        t("تاريخ 7 أيام", "7-day history"),
      ],
      cta: t("ابدأ مجاناً", "Start Free"),
      accent: false,
    },
    {
      n: "02",
      name: t("الفردي", "Individual"),
      price: "29",
      unit: t("ر.س · شهرياً", "SAR · month"),
      blurb: t(
        "للأفراد الذين يديرون حياة كاملة داخل ذكرني.",
        "For individuals running a full life through Thakirni.",
      ),
      features: [
        t("رسائل غير محدودة", "Unlimited messages"),
        t("ذاكرة كاملة", "Full memory"),
        t("مزامنة التقويم", "Calendar sync"),
        t("واتساب 24/7", "WhatsApp 24/7"),
        t("دعم ذو أولوية", "Priority support"),
      ],
      cta: t("ابدأ الآن", "Get started"),
      accent: true,
    },
    {
      n: "03",
      name: t("الفريق", "Teams"),
      price: "79",
      unit: t("ر.س · شهرياً", "SAR · month"),
      blurb: t(
        "للفرق التي تحتاج ذاكرة مشتركة ومهاماً موزّعة.",
        "For teams with shared memory and distributed tasks.",
      ),
      features: [
        t("كل ميزات الفردي", "All Individual features"),
        t("لوحة كانبان مشتركة", "Shared Kanban"),
        t("ذاكرة الفريق", "Team memory"),
        t("تحليلات متقدمة", "Advanced analytics"),
      ],
      cta: t("ابدأ مع فريقك", "Start with team"),
      accent: false,
    },
  ]
  return (
    <section id="pricing" className="atelier-container atelier-section">
      <SectionTitle
        eyebrowNumeral="04"
        eyebrow={t("الأسعار", "Pricing")}
        headline={t("خطط بسيطة وشفافة", "Simple, transparent pricing")}
        kicker={t(
          "لا رسوم مخفية. ضريبة القيمة المضافة مشمولة. يمكنك الترقية أو التنزيل في أي وقت.",
          "No hidden fees. VAT included. Upgrade or step down whenever you wish.",
        )}
        locale={locale}
      />

      <div className="mt-16 grid grid-cols-1 gap-[var(--atelier-gutter)] md:grid-cols-3">
        {tiers.map((tier, i) => (
          <article
            key={i}
            className={cn(
              "relative flex flex-col gap-8 p-10",
              "bg-[var(--atelier-surface)]",
              "border border-[var(--atelier-border)]",
              "rounded-[var(--atelier-radius-md)]",
              tier.accent && "border-[var(--c-ember)]",
            )}
          >
            {tier.accent && (
              <span
                aria-hidden
                className="absolute -top-0.5 left-0 h-1 w-16 bg-[var(--c-ember)]"
              />
            )}
            <div className="flex items-baseline justify-between atelier-eyebrow">
              <span className="tabular-nums text-[var(--c-ember)]">{tier.n}</span>
              <span className="text-[var(--atelier-text-subtle)]">{tier.name}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  "atelier-display text-[4.5rem] leading-none font-light",
                  tier.accent ? "text-[var(--c-ember)]" : "text-[var(--c-parchment)]",
                )}
              >
                {tier.price}
              </span>
              <span className="atelier-label text-[var(--atelier-text-subtle)]">
                {tier.unit}
              </span>
            </div>
            <p className="atelier-body text-[var(--atelier-text-muted)] max-w-[36ch]">
              {tier.blurb}
            </p>
            <ul className="flex flex-col gap-3 border-t border-[var(--atelier-border)] pt-6">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 atelier-body">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-[2px] w-3 shrink-0 bg-[var(--c-ember)]"
                  />
                  <span className="text-[var(--atelier-text)]">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Pill
                as="button"
                variant={tier.accent ? "solid" : "outline"}
                size="lg"
                onClick={onGoAuth}
                trailing={<span aria-hidden>{locale === "ar" ? "←" : "→"}</span>}
                className="w-full"
              >
                {tier.cta}
              </Pill>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ── Main composition ─────────────────────────────────────────────────────────

export function LandingPageAtelier() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"
  const locale: L = language === "ar" ? "ar" : "en"
  const t = tr(locale)

  const onGoAuth = useCallback(() => router.push("/auth"), [router])
  const onToggleTheme = useCallback(
    () => setTheme(isDark ? "light" : "dark"),
    [isDark, setTheme],
  )
  const onToggleLang = useCallback(
    () => setLanguage(locale === "ar" ? "en" : "ar"),
    [locale, setLanguage],
  )

  if (!mounted) return null

  return (
    <div
      className={cn(
        "atelier-root min-h-screen",
        locale === "ar" ? "dir-rtl" : "dir-ltr",
      )}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <TopNav
        locale={locale}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onToggleLang={onToggleLang}
        onGoAuth={onGoAuth}
      />

      <main>
        <Hero onGoAuth={onGoAuth} locale={locale} />
        <div className="atelier-container">
          <hr className="atelier-rule" />
        </div>
        <SectionIndex locale={locale} />
        <FeaturesSection locale={locale} />
        <ShowcaseSection locale={locale} />
        <StoriesSection locale={locale} />
        <PricingSection onGoAuth={onGoAuth} locale={locale} />
        <CtaSection onGoAuth={onGoAuth} locale={locale} />
      </main>

      <FooterConstellation
        locale={locale}
        tagline={t(
          "أداة هادئة تحفظ ما يهمّك، وتعيده حين تحتاجه — بالعربية والإنجليزية.",
          "A quiet instrument that keeps what matters and brings it back when you need it — in Arabic and English.",
        )}
        columns={[
          {
            heading: t("المنتج", "Product"),
            links: [
              { label: t("الميزات", "Features"), href: "#features" },
              { label: t("الفولت", "Vault"), href: "#showcase" },
              { label: t("الأسعار", "Pricing"), href: "#pricing" },
            ],
          },
          {
            heading: t("الشركة", "Company"),
            links: [
              { label: t("من نحن", "About"), href: "/about" },
              { label: t("المدونة", "Blog"), href: "/blog" },
              { label: t("تواصل", "Contact"), href: "mailto:hello@thakirni.com" },
            ],
          },
          {
            heading: t("رؤية 2030", "Vision 2030"),
            links: [
              { label: t("رؤية 2030", "Vision 2030"), href: "/vision" },
              { label: t("عام الذكاء الاصطناعي", "Year of AI"), href: "/year-of-ai" },
              { label: t("SDAIA", "SDAIA"), href: "/sdaia" },
            ],
          },
          {
            heading: t("القانوني", "Legal"),
            links: [
              { label: t("الشروط", "Terms"), href: "/terms" },
              { label: t("الخصوصية", "Privacy"), href: "/privacy" },
              { label: t("الاسترداد", "Refund"), href: "/refunds" },
            ],
          },
        ]}
        colophon={t(
          "© 2026 ذكرني · صُنع في الرياض · كل الحقوق محفوظة",
          "© 2026 Thakirni · Made in Riyadh · All rights reserved",
        )}
        controls={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--atelier-border-strong)] text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] hover:border-[var(--c-parchment)] transition-colors"
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--atelier-border-strong)] px-3 atelier-eyebrow text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] hover:border-[var(--c-parchment)] transition-colors"
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>
          </div>
        }
      />
    </div>
  )
}
