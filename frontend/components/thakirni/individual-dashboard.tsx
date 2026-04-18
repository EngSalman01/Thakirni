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

function getGreeting(isArabic: boolean): { headline: string; accent: string } {
  const h = new Date().getHours()
  if (isArabic) {
    if (h >= 5 && h < 12) return { headline: "صباح النور ☀️", accent: "جاهز تكسر اليوم؟" }
    if (h >= 12 && h < 18) return { headline: "مساك الله بالخير 👋", accent: "وش عندك اليوم؟" }
    return { headline: "مساء النور 🌙", accent: "كيف كان يومك؟" }
  }
  if (h >= 5 && h < 12) return { headline: "Good morning ☀️", accent: "Ready to crush today?" }
  if (h >= 12 && h < 18) return { headline: "Good afternoon 👋", accent: "What's on your plate?" }
  return { headline: "Good evening 🌙", accent: "How was your day?" }
}

function getDateLine(isArabic: boolean): string {
  return new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
    weekday: "long", day: "numeric", month: "long",
  })
}

export function IndividualDashboard() {
  const { isArabic } = useLanguage()
  const { headline, accent } = getGreeting(isArabic)
  const dateLine = getDateLine(isArabic)

  return (
    <div className="page-wrap" dir={isArabic ? "rtl" : "ltr"}
      style={{ fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif", color: "var(--tx)", minHeight: "100vh" }}>

      {/* ── Ambient orb ── */}
      <div className="orb" style={{ width: 600, height: 400, top: 0, insetInlineEnd: 0, background: "radial-gradient(ellipse 70% 60% at 80% 0%,rgba(217,119,6,.1),transparent 70%)", borderRadius: 0 }} />

      {/* ── Greeting ── */}
      <div className="fu" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--amb)", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 6 }}>{dateLine}</div>
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "var(--tx)", lineHeight: 1.1, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-syne),sans-serif" }}>{headline}</h1>
        <p style={{ color: "var(--tx2)", marginTop: 6, fontSize: "1rem" }}>{accent}</p>
      </div>

      {/* ── AI Input ── */}
      <div className="fu1" style={{ marginBottom: 28 }}>
        <AIInputBox />
      </div>

      {/* ── WhatsApp Banner ── */}
      <div className="fu2" style={{ marginBottom: 22 }}>
        <WhatsAppBanner />
      </div>

      {/* ── Main grid ── */}
      <div className="fu3" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <TodayFocus />
          <RecentActivity />
        </div>

        {/* Side column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MiniCalendar />
          <ProgressCard />
          <UsageWidget />
          <SmartCard />
        </div>
      </div>

      {/* ── Upgrade nudge ── */}
      <div className="fu4" style={{ marginTop: 22 }}>
        <UpgradeNudge />
      </div>

      <style>{`
        @media(max-width:900px){
          .page-wrap .fu3>div:first-child{grid-column:1/-1}
          .page-wrap .fu3{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  )
}
