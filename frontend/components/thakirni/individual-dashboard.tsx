"use client"

import { useLanguage } from "@/components/language-provider"
import { AIInputBox } from "@/components/thakirni/dashboard/ai-input-box"
import { TodayFocus } from "@/components/thakirni/dashboard/today-focus"
import { ProgressCard } from "@/components/thakirni/dashboard/progress-card"
import { SmartCard } from "@/components/thakirni/dashboard/smart-card"
import { RecentActivity } from "@/components/thakirni/dashboard/recent-activity"
import { WhatsAppBanner } from "@/components/thakirni/whatsapp-banner"
import { UpgradeNudge } from "@/components/thakirni/upgrade-nudge"
import { UsageWidget } from "@/components/thakirni/usage-widget"
import { MiniCalendar } from "@/components/thakirni/dashboard/mini-calendar"
import { OrbitSvg } from "@/components/thakirni/atelier"

/* ─────────────────────────────────────────────────────────────────
   IndividualDashboard — atelier rewrite
   Chrome-only pass: greeting + grid + ambient orbit. Inner widgets
   (AIInputBox, TodayFocus, etc.) are wrapped in atelier surface
   cards but their internals remain legacy — Phase 4 will migrate
   them individually.
───────────────────────────────────────────────────────────────── */

function getGreeting(isArabic: boolean): {
  headline: string
  accent: string
} {
  const h = new Date().getHours()
  if (isArabic) {
    if (h >= 5 && h < 12)
      return { headline: "صباح النور", accent: "لنبدأ بهدوء." }
    if (h >= 12 && h < 18)
      return { headline: "مساء الخير", accent: "ما الذي يشغل بالك؟" }
    return { headline: "مساء النور", accent: "كيف كان يومك؟" }
  }
  if (h >= 5 && h < 12)
    return { headline: "Good morning", accent: "Let's begin, quietly." }
  if (h >= 12 && h < 18)
    return { headline: "Good afternoon", accent: "What's on your mind?" }
  return { headline: "Good evening", accent: "How was your day?" }
}

function getDateLine(isArabic: boolean): string {
  return new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/* Atelier surface wrapper — soft hairline card for legacy widgets. */
function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--atelier-bg-elevated)",
        border: "1px solid var(--atelier-border)",
      }}
    >
      {children}
    </div>
  )
}

export function IndividualDashboard() {
  const { isArabic } = useLanguage()
  const { headline, accent } = getGreeting(isArabic)
  const dateLine = getDateLine(isArabic)

  return (
    <div
      className="atelier-root relative"
      dir={isArabic ? "rtl" : "ltr"}
      style={{
        background: "var(--atelier-bg)",
        color: "var(--atelier-text)",
        fontFamily: "var(--atelier-font-body)",
        minHeight: "100vh",
        padding: "clamp(24px, 3vw, 56px) clamp(20px, 3vw, 48px) 96px",
      }}
    >
      {/* ── Ambient orbit backdrop ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute"
          style={{
            top: "-120px",
            insetInlineEnd: "-120px",
            opacity: 0.5,
          }}
        >
          <OrbitSvg preset="ambient" size={520} />
        </div>
        <div
          className="absolute"
          style={{
            top: 0,
            insetInlineEnd: 0,
            width: 640,
            height: 400,
            background:
              "radial-gradient(ellipse 70% 60% at 80% 0%, color-mix(in oklab, var(--c-ember) 10%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div
        className="relative mx-auto flex flex-col gap-8"
        style={{ maxWidth: 1300 }}
      >
        {/* ── Greeting row ──────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-6 pb-2">
          <div>
            <div
              className="flex items-center gap-3 mb-4"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--atelier-text-subtle)",
                fontFamily: "var(--atelier-font-body)",
              }}
            >
              <span
                className="tabular-nums"
                style={{ color: "var(--c-ember)" }}
              >
                01
              </span>
              <span>{dateLine}</span>
            </div>
            <h1
              className="atelier-h1"
              style={{
                color: "var(--atelier-text)",
                maxWidth: "20ch",
              }}
            >
              {headline}
              {isArabic ? "،" : ","}{" "}
              <em
                className="atelier-italic"
                style={{ color: "var(--c-ember)" }}
              >
                {accent}
              </em>
            </h1>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              border: "1px solid var(--atelier-border-strong)",
              color: "var(--atelier-text-muted)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "var(--atelier-font-mono)",
            }}
          >
            <span style={{ color: "var(--c-ember)" }}>⌘</span>
            <span>K</span>
            <span
              aria-hidden
              className="w-px h-4 mx-1"
              style={{ background: "var(--atelier-border-strong)" }}
            />
            <span>{isArabic ? "أوامر" : "Commands"}</span>
          </div>
        </header>

        <hr
          className="atelier-rule"
          style={{ borderColor: "var(--atelier-border)" }}
        />

        {/* ── AI input ──────────────────────────────────── */}
        <section>
          <div
            className="mb-4 flex items-baseline gap-2"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--atelier-text-subtle)",
            }}
          >
            <span
              className="tabular-nums"
              style={{ color: "var(--c-ember)" }}
            >
              02
            </span>
            <span>{isArabic ? "اسأل" : "Ask"}</span>
          </div>
          <SurfaceCard>
            <AIInputBox />
          </SurfaceCard>
        </section>

        {/* ── WhatsApp ─────────────────────────────────── */}
        <WhatsAppBanner />

        {/* ── Main grid ────────────────────────────────── */}
        <section
          className="grid gap-6"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            alignItems: "start",
          }}
        >
          {/* Main column */}
          <div className="flex flex-col gap-6 min-w-0">
            <div>
              <div
                className="mb-4 flex items-baseline gap-2"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--atelier-text-subtle)",
                }}
              >
                <span
                  className="tabular-nums"
                  style={{ color: "var(--c-ember)" }}
                >
                  03
                </span>
                <span>{isArabic ? "تركيز اليوم" : "Today's focus"}</span>
              </div>
              <SurfaceCard>
                <TodayFocus />
              </SurfaceCard>
            </div>

            <div>
              <div
                className="mb-4 flex items-baseline gap-2"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--atelier-text-subtle)",
                }}
              >
                <span
                  className="tabular-nums"
                  style={{ color: "var(--c-ember)" }}
                >
                  04
                </span>
                <span>{isArabic ? "النشاط الأخير" : "Recent activity"}</span>
              </div>
              <SurfaceCard>
                <RecentActivity />
              </SurfaceCard>
            </div>
          </div>

          {/* Side column */}
          <aside className="flex flex-col gap-4 min-w-0">
            <SurfaceCard>
              <MiniCalendar />
            </SurfaceCard>
            <SurfaceCard>
              <ProgressCard />
            </SurfaceCard>
            <SurfaceCard>
              <UsageWidget />
            </SurfaceCard>
            <SurfaceCard>
              <SmartCard />
            </SurfaceCard>
          </aside>
        </section>

        {/* ── Upgrade nudge ────────────────────────────── */}
        <div className="mt-2">
          <UpgradeNudge />
        </div>
      </div>

      {/* Responsive grid collapse */}
      <style>{`
        @media (max-width: 900px) {
          .atelier-root > div > section[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
