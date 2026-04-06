"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { GreetingHeader } from "@/components/thakirni/dashboard/greeting-header"
import { AIInputBox } from "@/components/thakirni/dashboard/ai-input-box"
import { TodayFocus } from "@/components/thakirni/dashboard/today-focus"
import { ProgressCard } from "@/components/thakirni/dashboard/progress-card"
import { SmartCard } from "@/components/thakirni/dashboard/smart-card"
import { RecentActivity } from "@/components/thakirni/dashboard/recent-activity"
import { WhatsAppBanner } from "@/components/thakirni/whatsapp-banner"
import { UpgradeNudge } from "@/components/thakirni/upgrade-nudge"
import { UsageWidget } from "@/components/thakirni/usage-widget"

const ease = [0.22, 1, 0.36, 1] as const

function Stagger({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

export function IndividualDashboard() {
  const { isArabic } = useLanguage()

  return (
    <div
      className="h-full overflow-auto bg-[#FAFAF8] dark:bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        <Stagger delay={0}>
          <WhatsAppBanner />
        </Stagger>

        <Stagger delay={0.06}>
          <GreetingHeader />
        </Stagger>

        <Stagger delay={0.12}>
          <AIInputBox />
        </Stagger>

        <Stagger delay={0.18}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column — 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              <TodayFocus />
              <RecentActivity />
            </div>

            {/* Sidebar — 1/3 width */}
            <div className="space-y-6">
              <ProgressCard />
              <UsageWidget />
              <SmartCard />
            </div>
          </div>
        </Stagger>

        <Stagger delay={0.24}>
          <UpgradeNudge />
        </Stagger>

      </div>
    </div>
  )
}
