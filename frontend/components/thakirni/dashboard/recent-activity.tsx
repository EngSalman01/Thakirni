"use client"

import { motion } from "framer-motion"
import { FileText, Mic, ImageIcon, Clock, Inbox } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { useMemories } from "@/hooks/use-memories"
import type { Memory } from "@/lib/types"

function memoryIcon(type: Memory["type"]) {
  if (type === "voice") return Mic
  if (type === "photo") return ImageIcon
  return FileText
}

function relativeTime(iso: string, isArabic: boolean): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (isArabic) {
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function memoryLabel(type: Memory["type"], isArabic: boolean) {
  if (type === "voice") return isArabic ? "صوتي" : "Voice"
  if (type === "photo") return isArabic ? "صورة" : "Photo"
  return isArabic ? "نص" : "Text"
}

export function RecentActivity() {
  const { t, isArabic } = useLanguage()
  const { memories, isLoading } = useMemories()

  const recent = memories.slice(0, 3)

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      // Secondary card — border only, no shadow
      className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("آخر نشاط", "Recent Activity")}
        </h2>
        <Link
          href="/vault/memories"
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          {t("عرض الكل", "View all")}
        </Link>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="px-5 py-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 dark:bg-white/[0.06] rounded-full animate-pulse w-4/5" />
                  <div className="h-2.5 bg-slate-100 dark:bg-white/[0.06] rounded-full animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-3">
            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t("ما في نشاط بعد", "No activity yet")}
            </p>
            <Link
              href="/vault/plans"
              className="inline-block text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              {t("أضف أول مهمة ←", "Add your first task →")}
            </Link>
          </div>
        ) : (
          recent.map((memory, i) => {
            const Icon = memoryIcon(memory.type)
            const label = memoryLabel(memory.type, isArabic)
            const preview = memory.description || memory.title || ""
            const time = relativeTime(memory.created_at, isArabic)

            return (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 + i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug truncate">
                    {preview || label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{time}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </section>
  )
}
