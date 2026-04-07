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
      <main className="pt-16">

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20 px-8 overflow-hidden">
          <div className="absolute -top-20 end-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-violet-600/6 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                    {headline}{" "}
                    <span className="gradient-text">{accent}</span>
                  </h1>
                  <p className="text-xl text-slate-500 mt-4">{dateLine}</p>
                </div>
              </motion.div>

              {/* AI input */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15, ease }}
              >
                <AIInputBox />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT ── */}
        <section className="pb-24 px-8">
          <div className="max-w-7xl mx-auto space-y-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: 0.1 }}
            >
              <WhatsAppBanner />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: 0.18 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main column — 2/3 */}
                <div className="lg:col-span-2 space-y-8">
                  <TodayFocus />
                  <RecentActivity />
                </div>

                {/* Side column — 1/3 */}
                <div className="space-y-8">
                  <ProgressCard />
                  <UsageWidget />
                  <SmartCard />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: 0.26 }}
            >
              <UpgradeNudge />
            </motion.div>

          </div>
        </section>

      </main>
    </div>
  )
}
