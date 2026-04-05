"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, CheckCircle2, Target } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import Link from "next/link"

interface Progress {
  done: number
  total: number
  streak: number
  allDone: boolean
}

export function DailyProgress() {
  const { isArabic } = useLanguage()
  const [data, setData] = useState<Progress | null>(null)

  useEffect(() => {
    fetch("/api/vault/daily-progress")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) return null

  const { done, total, streak, allDone } = data
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const hasPlans = total > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
      >
        {/* Completion celebration */}
        {allDone ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            </motion.div>
            <p className="text-sm font-label font-bold text-white">
              {isArabic ? "خلصت كل شي اليوم 🔥 كفو!" : "All done today 🔥 Well done!"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/8 rounded-2xl px-4 py-3 space-y-2.5">
            {/* Progress row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-sm font-label font-semibold text-slate-700 truncate">
                  {hasPlans
                    ? isArabic
                      ? `أنجزت ${done} / ${total} اليوم 👌`
                      : `${done} / ${total} done today 👌`
                    : isArabic
                      ? "ما عندك مهام اليوم 👀"
                      : "No tasks today 👀"
                  }
                </p>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 shrink-0 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-orange-600">{streak}</span>
                </div>
              )}
            </div>

            {/* Progress bar — scaleX is GPU-composited unlike width */}
            {hasPlans && (
              <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pct / 100 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  style={{ originX: 0 }}
                  className={`absolute inset-0 rounded-full ${
                    pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-indigo-500" : "bg-pink-500"
                  }`}
                />
              </div>
            )}

            {/* CTA */}
            {!hasPlans && (
              <Link
                href="/vault/plans"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isArabic ? "أضف مهامك اليوم →" : "Add today's tasks →"}
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
