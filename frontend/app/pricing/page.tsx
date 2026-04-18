"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, X, ArrowRight, Sparkles, Shield, Repeat, Clock } from "lucide-react"
import { toast } from "sonner"
import { initializePaddle, Paddle } from "@paddle/paddle-js"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import {
  FooterConstellation,
  NavPills,
  OrbitSvg,
  Pill,
  SectionTitle,
  WordmarkStacked,
} from "@/components/thakirni/atelier"

/* ─────────────────────────────────────────────────────────────────
   /pricing — atelier rewrite
   The real checkout surface (the /checkout/* routes redirect here).
   Preserves Paddle + Supabase logic from the previous implementation.
───────────────────────────────────────────────────────────────── */

// ── Types ────────────────────────────────────────────────────────

type TierId = "free" | "individual" | "team"

interface Feature {
  ar: string
  en: string
  included: boolean
}

interface PricingTier {
  id: TierId
  nameAr: string
  nameEn: string
  targetAr: string
  targetEn: string
  monthlyPrice: number
  annualPrice: number
  features: Feature[]
  ctaAr: string
  ctaEn: string
  popular: boolean
  comingSoon?: boolean
  noteSuffixAr?: string
  noteSuffixEn?: string
}

// ── Paddle Price IDs (set in Vercel env vars) ────────────────────

const PADDLE_PRICES = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ?? "",
    annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL ?? "",
  },
  teams: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY ?? "",
    annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_ANNUAL ?? "",
  },
}

// ── Data ─────────────────────────────────────────────────────────

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    nameAr: "مجاني",
    nameEn: "Free",
    targetAr: "للمبتدئين",
    targetEn: "Get started",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { ar: "١٠ خطط يومياً", en: "10 plans per day", included: true },
      { ar: "٢٥ ذاكرة", en: "25 memories", included: true },
      { ar: "مشروع واحد", en: "1 project", included: true },
      { ar: "محادثة AI أساسية", en: "Basic AI chat", included: true },
      { ar: "تتبع العادات والأهداف", en: "Habit & goal tracking", included: true },
      { ar: "ملخص الاجتماعات", en: "Meeting summary", included: false },
      { ar: "تحليل الوثائق", en: "Document AI", included: false },
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Get Started",
    popular: false,
  },
  {
    id: "individual",
    nameAr: "برو",
    nameEn: "Pro",
    targetAr: "للمحترفين والمستقلين",
    targetEn: "Professionals & Freelancers",
    monthlyPrice: 29.99,
    annualPrice: 287.99,
    features: [
      { ar: "١٠٠ خطة يومياً", en: "100 plans per day", included: true },
      { ar: "١٠٠٠ ذاكرة", en: "1,000 memories", included: true },
      { ar: "١٠ مشاريع", en: "10 projects", included: true },
      { ar: "٣٠ ملخص اجتماع شهرياً", en: "30 meeting summaries / month", included: true },
      { ar: "٥٠ وثيقة بالذكاء الاصطناعي شهرياً", en: "50 document AI / month", included: true },
      { ar: "٣٠٠ دقيقة تسجيل شهرياً", en: "300 min voice / month", included: true },
      { ar: "تحليلات وتقارير", en: "Analytics & reports", included: true },
    ],
    ctaAr: "احصل على Pro",
    ctaEn: "Get Pro",
    popular: true,
  },
  {
    id: "team",
    nameAr: "فرق",
    nameEn: "Teams",
    targetAr: "للفرق والمشاريع",
    targetEn: "Teams & Organizations",
    monthlyPrice: 59.99,
    annualPrice: 575.99,
    noteSuffixAr: "لكل مستخدم",
    noteSuffixEn: "per user",
    features: [
      { ar: "كل شيء غير محدود", en: "Everything unlimited", included: true },
      { ar: "أعضاء فريق غير محدودين", en: "Unlimited team members", included: true },
      { ar: "مشاريع غير محدودة", en: "Unlimited projects", included: true },
      { ar: "ملخصات اجتماعات غير محدودة", en: "Unlimited meeting summaries", included: true },
      { ar: "ذكريات وملاحظات مشتركة", en: "Shared memories & notes", included: true },
      { ar: "دعم فني ذو أولوية", en: "Priority support", included: true },
    ],
    ctaAr: "احصل على Teams",
    ctaEn: "Get Teams",
    popular: false,
  },
]

// ── Trust pillars ─────────────────────────────────────────────────

const trustPillars = [
  {
    icon: Shield,
    ar: "ضمان استرداد ١٤ يوم",
    en: "14-day money back",
    numeral: "01",
  },
  {
    icon: Clock,
    ar: "دعم على مدار الساعة",
    en: "24 / 7 support",
    numeral: "02",
  },
  {
    icon: Repeat,
    ar: "إلغاء في أي وقت",
    en: "Cancel anytime",
    numeral: "03",
  },
  {
    icon: Sparkles,
    ar: "بياناتك آمنة ومحفوظة",
    en: "Your data, protected",
    numeral: "04",
  },
]

// ── Page ─────────────────────────────────────────────────────────

export default function PricingPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const routerRef = useRef(router)
  const tRef = useRef(t)
  routerRef.current = router
  tRef.current = t

  const isArabic = language === "ar"

  const [isAnnual, setIsAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState<TierId | null>(null)
  const [paddle, setPaddle] = useState<Paddle | null>(null)

  // ── Init Paddle once on mount ──────────────────────────────────
  useEffect(() => {
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment:
        (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as
          | "production"
          | "sandbox") ?? "production",
      eventCallback(event) {
        if (event.name === "checkout.completed") {
          toast.success(
            tRef.current(
              "تم تفعيل الاشتراك بنجاح!",
              "Subscription activated successfully!",
            ),
          )
          setTimeout(
            () => routerRef.current.push("/vault?subscribed=true"),
            500,
          )
        }
      },
    }).then((p) => {
      if (p) setPaddle(p)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Helpers ────────────────────────────────────────────────────
  function displayedPrice(tier: PricingTier): string {
    if (tier.monthlyPrice === 0) return "0"
    if (isAnnual) return Math.round(tier.annualPrice / 12).toString()
    return tier.monthlyPrice.toString()
  }

  function annualSaving(tier: PricingTier): number {
    return Math.round(
      100 - (tier.annualPrice / (tier.monthlyPrice * 12)) * 100,
    )
  }

  function getPriceId(tierId: TierId): string | null {
    if (tierId === "individual") {
      return isAnnual ? PADDLE_PRICES.pro.annual : PADDLE_PRICES.pro.monthly
    }
    if (tierId === "team") {
      return isAnnual ? PADDLE_PRICES.teams.annual : PADDLE_PRICES.teams.monthly
    }
    return null
  }

  // ── Subscribe handler ──────────────────────────────────────────
  async function handleSubscribe(tierId: TierId) {
    if (isLoading) return

    if (tierId === "free") {
      router.push("/auth")
      return
    }

    const priceId = getPriceId(tierId)
    if (!priceId) {
      toast.info(
        t(
          "الدفع الإلكتروني قيد الإعداد — سجّل دخولك وسنتواصل معك لإتمام الاشتراك",
          "Online payment is being set up — sign in and we will contact you to complete your subscription",
        ),
      )
      setTimeout(() => router.push("/auth"), 2000)
      return
    }
    if (!paddle) {
      toast.error(t("حدث خطأ، حاول مرة أخرى", "Something went wrong, please try again"))
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setIsLoading(tierId)
    try {
      await paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user?.email ? { email: user.email } : undefined,
        customData: {
          user_id: user?.id ?? "",
          plan_tier: tierId,
          billing: isAnnual ? "annual" : "monthly",
        },
        settings: {
          displayMode: "overlay",
          theme: "dark",
        },
      })
    } catch (err) {
      console.error("[Paddle] Checkout error:", err)
      toast.error(t("تعذّر فتح نافذة الدفع", "Could not open checkout"))
    } finally {
      setIsLoading(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      className="atelier-root min-h-screen"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* ─── Top nav ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          background: "color-mix(in oklab, var(--c-obsidian) 82%, transparent)",
          borderBottom: "1px solid var(--atelier-border)",
        }}
      >
        <div className="atelier-container flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <WordmarkStacked
              size="sm"
              orientation="inline"
              primary={isArabic ? "arabic" : "latin"}
            />
          </Link>
          <NavPills
            size="sm"
            items={[
              { label: t("الرئيسية", "Home"), href: "/" },
              { label: t("الميزات", "Features"), href: "/#features" },
              { label: t("الأسعار", "Pricing"), href: "/pricing" },
              { label: t("من نحن", "About"), href: "/#about" },
              { label: t("دخول", "Sign in"), href: "/auth", cta: true },
            ]}
          />
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative atelier-section-lg overflow-hidden">
        {/* Orbit backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-start justify-center pointer-events-none"
          style={{ paddingTop: "4rem" }}
        >
          <OrbitSvg preset="ambient" size={820} />
        </div>

        <div className="relative atelier-container text-center max-w-3xl">
          <span
            className="atelier-eyebrow block mb-5"
            style={{ color: "var(--atelier-text-subtle)" }}
          >
            01 / Pricing · الأسعار
          </span>
          <h1
            className="atelier-hero"
            style={{ color: "var(--atelier-text)" }}
          >
            {t("خطط ", "Plans ")}
            <em
              className="atelier-italic"
              style={{ color: "var(--c-ember)" }}
            >
              {t("هادئة", "that stay")}
            </em>
            <br />
            {t("بقدر ما تحتاج", "out of your way")}
          </h1>
          <p
            className="atelier-lead mt-8 mx-auto max-w-2xl"
            style={{ color: "var(--atelier-text-muted)" }}
          >
            {t(
              "سواء كنت فرداً يرتب حياته أو فريقاً يبني ذاكرة جماعية، خزنتك تبقى هادئة وكاملة.",
              "Whether you're one person keeping your life in order or a team building a shared memory, your vault stays quiet and whole.",
            )}
          </p>

          {/* Billing switch */}
          <div
            className="inline-flex items-center gap-6 mt-12 px-6 py-3 rounded-full"
            style={{
              border: "1px solid var(--atelier-border-strong)",
              background: "var(--atelier-bg-elevated)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className="atelier-eyebrow transition-colors"
              style={{
                color: !isAnnual
                  ? "var(--atelier-text)"
                  : "var(--atelier-text-subtle)",
              }}
            >
              {t("شهري", "Monthly")}
            </button>
            <span
              aria-hidden
              className="w-px h-4"
              style={{ background: "var(--atelier-border-strong)" }}
            />
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className="atelier-eyebrow transition-colors inline-flex items-center gap-2"
              style={{
                color: isAnnual
                  ? "var(--atelier-text)"
                  : "var(--atelier-text-subtle)",
              }}
            >
              {t("سنوي", "Yearly")}
              <span
                className="text-[10px] tracking-[0.12em] px-2 py-0.5 rounded-full"
                style={{
                  background:
                    "color-mix(in oklab, var(--c-ember) 15%, transparent)",
                  color: "var(--c-ember)",
                  border: "1px solid var(--c-ember)",
                }}
              >
                {t("وفر ٢٠٪", "−20%")}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Tiers ──────────────────────────────────────────────── */}
      <section className="atelier-section pb-0">
        <div className="atelier-container">
          <div className="grid md:grid-cols-3 gap-0 md:gap-px items-stretch"
               style={{ background: "var(--atelier-border)" }}>
            {pricingTiers.map((tier) => {
              const isPopular = tier.popular
              return (
                <article
                  key={tier.id}
                  className={cn(
                    "flex flex-col p-10 transition-colors",
                    "relative",
                  )}
                  style={{
                    background: isPopular
                      ? "var(--atelier-bg-elevated)"
                      : "var(--atelier-bg)",
                  }}
                >
                  {/* Popular ribbon */}
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                      <span
                        className="atelier-eyebrow px-4 py-1.5"
                        style={{
                          background: "var(--c-ember)",
                          color: "var(--c-obsidian)",
                          borderBottomLeftRadius: 9999,
                          borderBottomRightRadius: 9999,
                          letterSpacing: "0.18em",
                        }}
                      >
                        {t("الأكثر اختياراً", "Most chosen")}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-8 mt-4">
                    <div>
                      <span
                        className="atelier-eyebrow block mb-3"
                        style={{ color: "var(--atelier-text-subtle)" }}
                      >
                        {tier.id === "free"
                          ? "01"
                          : tier.id === "individual"
                          ? "02"
                          : "03"}{" "}
                        / {t(tier.targetAr, tier.targetEn)}
                      </span>
                      <h3
                        className="atelier-h2"
                        style={{ color: "var(--atelier-text)" }}
                      >
                        {t(tier.nameAr, tier.nameEn)}
                      </h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="font-serif tabular-nums"
                        style={{
                          fontFamily: "var(--atelier-font-display)",
                          fontSize: "clamp(3rem, 6vw, 5rem)",
                          lineHeight: 1,
                          color: "var(--atelier-text)",
                        }}
                      >
                        {displayedPrice(tier)}
                      </span>
                      <span
                        className="atelier-eyebrow"
                        style={{ color: "var(--c-ember)" }}
                      >
                        {t("ر.س", "SAR")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--atelier-font-body)",
                          color: "var(--atelier-text-subtle)",
                          fontSize: 14,
                        }}
                      >
                        / {t("شهر", "month")}
                      </span>
                    </div>
                    <div
                      className="min-h-[1.5rem] mt-2"
                      style={{
                        fontFamily: "var(--atelier-font-body)",
                        color: "var(--atelier-text-subtle)",
                        fontSize: 12,
                      }}
                    >
                      {isAnnual && tier.monthlyPrice > 0 ? (
                        <>
                          {t(
                            `يُفوتر ${tier.annualPrice} ر.س سنوياً`,
                            `Billed ${tier.annualPrice} SAR / year`,
                          )}{" "}
                          ·{" "}
                          <span style={{ color: "var(--c-ember)" }}>
                            {t(
                              `وفر ${annualSaving(tier)}٪`,
                              `Save ${annualSaving(tier)}%`,
                            )}
                          </span>
                        </>
                      ) : tier.noteSuffixEn ? (
                        <span>{t(tier.noteSuffixAr ?? "", tier.noteSuffixEn)}</span>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  </div>

                  <hr
                    className="atelier-rule mb-8"
                    style={{ borderColor: "var(--atelier-border)" }}
                  />

                  {/* Features */}
                  <ul className="flex flex-col gap-4 mb-10 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <span
                            className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background:
                                "color-mix(in oklab, var(--c-ember) 14%, transparent)",
                              border: "1px solid var(--c-ember)",
                            }}
                          >
                            <Check
                              className="w-3 h-3"
                              style={{ color: "var(--c-ember)" }}
                              strokeWidth={2.5}
                            />
                          </span>
                        ) : (
                          <span
                            className="mt-0.5 w-5 h-5 flex items-center justify-center shrink-0"
                            style={{ color: "var(--atelier-text-subtle)" }}
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--atelier-font-body)",
                            fontSize: 14,
                            lineHeight: 1.55,
                            color: feature.included
                              ? "var(--atelier-text-muted)"
                              : "var(--atelier-text-subtle)",
                          }}
                        >
                          {t(feature.ar, feature.en)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Pill
                    as="button"
                    type="button"
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={!!tier.comingSoon || isLoading === tier.id}
                    variant={isPopular ? "solid" : "outline"}
                    size="lg"
                    trailing={
                      isLoading === tier.id ? null : (
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      )
                    }
                    className="w-full justify-center"
                  >
                    {isLoading === tier.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full animate-spin"
                          style={{
                            border: "2px solid currentColor",
                            borderTopColor: "transparent",
                          }}
                        />
                        {t("جارٍ...", "Loading...")}
                      </span>
                    ) : (
                      t(tier.ctaAr, tier.ctaEn)
                    )}
                  </Pill>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust pillars ──────────────────────────────────────── */}
      <section className="atelier-section">
        <div className="atelier-container">
          <SectionTitle
            as="h2"
            eyebrowNumeral="02"
            eyebrow={t("ضمانات هادئة", "Quiet guarantees")}
            headline={t("بدون مخاطر", "No risk")}
            headlineAccent={t("بدون التزامات", "no lock-in")}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-14">
            {trustPillars.map((item) => (
              <div
                key={item.numeral}
                className="flex flex-col gap-3 pb-6 border-b"
                style={{ borderColor: "var(--atelier-border)" }}
              >
                <span
                  className="atelier-eyebrow"
                  style={{ color: "var(--c-ember)" }}
                >
                  {item.numeral}
                </span>
                <span
                  className="atelier-h3"
                  style={{ color: "var(--atelier-text)" }}
                >
                  {t(item.ar, item.en)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Enterprise CTA ─────────────────────────────────────── */}
      <section
        className="atelier-section relative overflow-hidden"
        style={{ background: "var(--atelier-bg-elevated)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--c-ember) 10%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="atelier-container relative text-center max-w-3xl">
          <span
            className="atelier-eyebrow block mb-5"
            style={{ color: "var(--atelier-text-subtle)" }}
          >
            03 / Enterprise
          </span>
          <h2
            className="atelier-display"
            style={{ color: "var(--atelier-text)" }}
          >
            {t("فريق أكبر،", "A larger team,")}
            <br />
            <em
              className="atelier-italic"
              style={{ color: "var(--c-ember)" }}
            >
              {t("احتياج خاص؟", "a bespoke need?")}
            </em>
          </h2>
          <p
            className="atelier-lead mt-8 mx-auto max-w-xl"
            style={{ color: "var(--atelier-text-muted)" }}
          >
            {t(
              "نعد خططاً مخصصة للشركات والجامعات والجهات الحكومية. رؤية 2030 وعام الذكاء الاصطناعي 2026 يحتاجان أدوات تليق.",
              "We craft custom plans for companies, universities, and government. Vision 2030 and the Year of AI 2026 deserve tools that belong.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Pill
              as="link"
              href="/enterprise"
              variant="solid"
              size="lg"
              trailing={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t("احجز عرضاً توضيحياً", "Book a demo")}
            </Pill>
            <Pill
              as="link"
              href="mailto:enterprise@thakirni.com"
              variant="ghost"
              size="lg"
            >
              enterprise@thakirni.com
            </Pill>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <FooterConstellation
        locale={isArabic ? "ar" : "en"}
        tagline={t(
          "عقلك الثاني، هادئ بقدر ما تحتاج.",
          "Your second brain, as quiet as you need it.",
        )}
        columns={[
          {
            heading: t("المنتج", "Product"),
            links: [
              { label: t("الميزات", "Features"), href: "/#features" },
              { label: t("الأسعار", "Pricing"), href: "/pricing" },
              { label: t("الفولت", "Vault"), href: "/vault" },
            ],
          },
          {
            heading: t("الشركة", "Company"),
            links: [
              { label: t("من نحن", "About"), href: "/#about" },
              { label: t("المدونة", "Stories"), href: "/stories" },
              { label: t("الشركات", "Enterprise"), href: "/enterprise" },
            ],
          },
          {
            heading: t("رؤية 2030", "Vision 2030"),
            links: [
              { label: t("SDAIA", "SDAIA"), href: "/sdaia" },
              { label: t("عام الذكاء 2026", "Year of AI 2026"), href: "/ai-year" },
              { label: t("الشراكات", "Partnerships"), href: "/partners" },
            ],
          },
          {
            heading: t("القانوني", "Legal"),
            links: [
              { label: t("الخصوصية", "Privacy"), href: "/privacy" },
              { label: t("الشروط", "Terms"), href: "/terms" },
              { label: t("الأمان", "Security"), href: "/security" },
            ],
          },
        ]}
        colophon={t(
          `© ${new Date().getFullYear()} ذكرني · الرياض · جميع الحقوق محفوظة`,
          `© ${new Date().getFullYear()} Thakirni · Riyadh · All rights reserved`,
        )}
      />
    </div>
  )
}
