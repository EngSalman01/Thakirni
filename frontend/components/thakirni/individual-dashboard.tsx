"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { AIInputBox } from "@/components/thakirni/dashboard/ai-input-box"
import { TodayFocus } from "@/components/thakirni/dashboard/today-focus"
import { ProgressCard } from "@/components/thakirni/dashboard/progress-card"
import { SmartCard } from "@/components/thakirni/dashboard/smart-card"
import { RecentActivity } from "@/components/thakirni/dashboard/recent-activity"
import { WhatsAppBanner } from "@/components/thakirni/whatsapp-banner"
import { UpgradeNudge } from "@/components/thakirni/upgrade-nudge"
import { UsageWidget } from "@/components/thakirni/usage-widget"

const ease = [0.22, 1, 0.36, 1] as const

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
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden" dir={isArabic ? "rtl" : "ltr"}>
      {/* Warm ambient glow */}
      <div className="fixed top-0 end-0 w-[600px] h-[400px] pointer-events-none -z-0 opacity-40">
        <div className="w-full h-full" style={{ background: "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(217,119,6,0.08) 0%, transparent 70%)" }} />
      </div>

      <main className="pt-14 relative z-10">

        {/* ── GREETING HERO ── */}
        <section className="pt-10 pb-10 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_480px] gap-8 lg:gap-12 items-start">

              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="space-y-1 pt-2"
              >
                <p className="text-sm font-medium text-amber-600 dark:text-amber-500 tracking-wide uppercase">
                  {dateLine}
                </p>
                <h1 className={`${isArabic ? "font-arabic" : "font-headline"} text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]`}>
                  {headline}
                </h1>
                <p className="text-xl text-muted-foreground font-medium">{accent}</p>
              </motion.div>

              {/* AI input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease }}
              >
                <AIInputBox />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT ── */}
        <section className="pb-24 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-6">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0.1 }}
            >
              <WhatsAppBanner />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0.16 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main column */}
                <div className="lg:col-span-2 space-y-6">
                  <TodayFocus />
                  <RecentActivity />
                </div>

                {/* Side column */}
                <div className="space-y-6">
                  <ProgressCard />
                  <UsageWidget />
                  <SmartCard />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0.22 }}
            >
              <UpgradeNudge />
            </motion.div>

          </div>
        </section>

      </main>
    </div>
  )
}
