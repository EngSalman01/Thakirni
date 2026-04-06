"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface DailyProgress {
  done: number
  total: number
  streak: number
  allDone: boolean
}

export function ProgressCard() {
  const { t, isArabic } = useLanguage()
  const [data, setData] = useState<DailyProgress | null>(null)

  useEffect(() => {
    fetch("/api/vault/daily-progress")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  const pct = data && data.total > 0 ? Math.round((data.done / data.total) * 100) : 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-4"
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {t("إنجازك اليوم", "Today's Progress")}
      </h2>

      {!data ? (
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 dark:bg-white/[0.06] rounded-full animate-pulse w-3/4" />
          <div className="h-2 bg-slate-100 dark:bg-white/[0.06] rounded-full animate-pulse" />
        </div>
      ) : data.allDone ? (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl px-4 py-3 text-center"
        >
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t("خلصت كل شي اليوم 🔥 كفو!", "All done today 🔥 Well done!")}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {/* Label + streak */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {data.total > 0
                ? t(`أنجزت ${data.done} / ${data.total} اليوم 👌`, `${data.done} / ${data.total} done today 👌`)
                : t("ما عندك مهام اليوم 👀", "No tasks for today 👀")}
            </p>
            {data.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 rounded-full px-2.5 py-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {data.streak}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar — scaleX is GPU-composited */}
          {data.total > 0 && (
            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{ originX: 0 }}
                className={`absolute inset-0 rounded-full ${
                  pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-indigo-500" : "bg-pink-500"
                }`}
              />
            </div>
          )}

          {/* Streak label */}
          {data.streak > 0 && (
            <p className="text-xs text-muted-foreground">
              {t(`🔥 ${data.streak} أيام متتالية`, `🔥 ${data.streak} day streak`)}
            </p>
          )}
        </div>
      )}
    </motion.section>
  )
}
