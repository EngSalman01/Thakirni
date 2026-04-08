"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, CalendarDays, Plus, CalendarX } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { usePlans } from "@/hooks/use-plans"
import type { PlanWithSource } from "@/hooks/use-plans"
import type { Plan } from "@/lib/types"

function priorityDot(priority: Plan["priority"]) {
  if (priority === "high") return "bg-red-400"
  if (priority === "medium") return "bg-amber-400"
  return "bg-slate-300"
}

function formatTime(time?: string | null) {
  if (!time) return null
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? "م" : "ص"
  const display = hour > 12 ? hour - 12 : hour || 12
  return `${display}:${m} ${suffix}`
}

export function TodayFocus() {
  const { t, isArabic } = useLanguage()
  const { nextUp, plans, isLoading, updatePlanStatus } = usePlans()

  const focusItems = nextUp.slice(0, 3)
  const today = new Date().toISOString().split("T")[0]
  const nextMeeting = plans
    .filter(
      (p) =>
        p.category === "meeting" &&
        p.status === "pending" &&
        (!p.plan_date || p.plan_date >= today)
    )
    .sort((a, b) => {
      if (a.plan_date && b.plan_date) return a.plan_date.localeCompare(b.plan_date)
      if (a.plan_date) return -1
      if (b.plan_date) return 1
      return 0
    })[0]

  const isEmpty = !isLoading && focusItems.length === 0 && !nextMeeting

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      // Primary card — shadow-sm for lift
      className="bg-white dark:bg-card border border-amber-100/80 dark:border-border rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("وش أسوي الحين؟", "What to do now")}
        </h2>
        <Link
          href="/vault/plans"
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("إضافة", "Add")}
        </Link>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="px-5 py-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-slate-100 dark:bg-white/[0.06] rounded-full animate-pulse" style={{ width: `${75 - i * 10}%` }} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="px-5 py-10 text-center space-y-3">
            <CalendarX className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t("ما عندك شي مجدول اليوم", "You have nothing scheduled")}
            </p>
            <Link
              href="/vault/assistant?prompt=%D8%B1%D8%AA%D8%A8+%D9%84%D9%8A+%D9%8A%D9%88%D9%85%D9%8A"
              className="inline-block text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {t("خلني الذكاء يرتب لك ←", "Let AI plan your day →")}
            </Link>
          </div>
        ) : (
          <>
            {focusItems.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                onClick={() => !(plan as PlanWithSource)._source && updatePlanStatus(plan.id, plan.status === "done" ? "pending" : "done")}
                style={{ willChange: "transform" }}
              >
                <button
                  className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors"
                  aria-label="Toggle done"
                >
                  {(plan as PlanWithSource)._source === "gcal" ? (
                    <CalendarDays className="w-5 h-5 text-blue-400" />
                  ) : plan.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <span
                  className={[
                    "flex-1 text-sm leading-snug",
                    plan.status === "done"
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {plan.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {plan.plan_time && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTime(plan.plan_time)}
                    </span>
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot(plan.priority)}`} />
                </div>
              </motion.div>
            ))}

            {nextMeeting && !focusItems.some((p) => p.id === nextMeeting.id) && (
              <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/60 dark:bg-amber-950/20">
                <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {nextMeeting.title}
                  </p>
                  {nextMeeting.plan_time && (
                    <p className="text-xs text-muted-foreground">{formatTime(nextMeeting.plan_time)}</p>
                  )}
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                  {t("اجتماع", "Meeting")}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {!isEmpty && !isLoading && (
        <div className="px-5 py-3 border-t border-slate-50 dark:border-white/[0.04]">
          <Link
            href="/vault/plans"
            className="text-xs text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            {t("عرض كل المهام →", "View all tasks →")}
          </Link>
        </div>
      )}
    </section>
  )
}
