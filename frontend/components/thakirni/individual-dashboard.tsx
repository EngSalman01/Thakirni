"use client"

import { useLanguage } from "@/components/language-provider"
import { GreetingHeader } from "@/components/thakirni/dashboard/greeting-header"
import { AIInputBox } from "@/components/thakirni/dashboard/ai-input-box"
import { TodayFocus } from "@/components/thakirni/dashboard/today-focus"
import { ProgressCard } from "@/components/thakirni/dashboard/progress-card"
import { SmartCard } from "@/components/thakirni/dashboard/smart-card"
import { RecentActivity } from "@/components/thakirni/dashboard/recent-activity"

export function IndividualDashboard() {
  const { isArabic } = useLanguage()

  return (
    <div
      className="h-full overflow-auto bg-slate-50 dark:bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">

        <GreetingHeader />

        <AIInputBox />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column — 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <TodayFocus />
            <RecentActivity />
          </div>

          {/* Sidebar — 1/3 width */}
          <div className="space-y-6">
            <ProgressCard />
            <SmartCard />
          </div>
        </div>

      </div>
    </div>
  )
}
