"use client"

import { motion } from "framer-motion"
import { CalendarDays, CheckCircle2, Clock, Inbox, ShoppingCart, ListTodo } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { usePlans } from "@/hooks/use-plans"
import type { PlanWithSource } from "@/hooks/use-plans"
import { Skeleton } from "@/components/ui/skeleton"

function categoryIcon(plan: PlanWithSource) {
  if (plan._source === "gcal") return CalendarDays
  if (plan.category === "meeting") return CalendarDays
  if (plan.category === "grocery") return ShoppingCart
  if (plan.status === "done") return CheckCircle2
  return ListTodo
}

function categoryColor(plan: PlanWithSource) {
  if (plan._source === "gcal") return "text-blue-500"
  if (plan.category === "meeting") return "text-amber-500"
  if (plan.category === "grocery") return "text-emerald-500"
  if (plan.status === "done") return "text-emerald-500"
  return "text-slate-500 dark:text-slate-400"
}

function relativeTime(iso: string, isArabic: boolean): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (isArabic) {
    if (mins < 1) return "الآن"
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function categoryLabel(plan: PlanWithSource, isArabic: boolean): string {
  if (plan._source === "gcal") return isArabic ? "جوجل كالندر" : "Google Calendar"
  if (plan.category === "meeting") return isArabic ? "اجتماع" : "Meeting"
  if (plan.category === "grocery") return isArabic ? "مشتريات" : "Grocery"
  if (plan.category === "work") return isArabic ? "عمل" : "Work"
  if (plan.category === "health") return isArabic ? "صحة" : "Health"
  if (plan.status === "done") return isArabic ? "منجز" : "Done"
  return isArabic ? "مهمة" : "Task"
}

export function RecentActivity() {
  const { t, isArabic } = useLanguage()
  const { plans, isLoading } = usePlans()

  // Show the 3 most recently created Thakirni plans (not GCal — they have no real created_at)
  const recent = plans
    .filter(p => !p._source)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="card" style={{ overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <h2 className="text-base font-semibold text-foreground dark:text-slate-100">
          {t("آخر نشاط", "Recent Activity")}
        </h2>
        <Link
          href="/vault/plans"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          {t("عرض الكل", "View all")}
        </Link>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="px-5 py-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-4/5 rounded-full" />
                  <Skeleton className="h-2.5 w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-3">
            <Inbox className="w-8 h-8 text-slate-300 dark:text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t("ما في نشاط بعد", "No activity yet")}
            </p>
            <Link
              href="/vault/plans"
              className="inline-block text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {t("أضف أول مهمة ←", "Add your first task →")}
            </Link>
          </div>
        ) : (
          recent.map((plan, i) => {
            const Icon = categoryIcon(plan)
            const color = categoryColor(plan)
            const label = categoryLabel(plan, isArabic)
            const time = relativeTime(plan.created_at, isArabic)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug truncate ${plan.status === "done" ? "line-through text-slate-400 dark:text-slate-500" : "text-foreground dark:text-slate-200"}`}>
                    {plan.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{time}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                </div>
                {plan.status === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </section>
  )
}
