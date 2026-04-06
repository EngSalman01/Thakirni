"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ListTodo, BookOpen, CalendarRange } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { usePlans } from "@/hooks/use-plans"
import { useMemories } from "@/hooks/use-memories"

/**
 * SmartCard — the ONLY component with a gradient.
 * Logic:
 *   1. No tasks (plans.length === 0)         → Task CTA
 *   2. No memories (memories.length === 0)   → Memory CTA
 *   3. Inactive (no plan in last 48h)        → Planning suggestion
 */
export function SmartCard() {
  const { t, isArabic } = useLanguage()
  const router = useRouter()
  const { plans, isLoading: plansLoading } = usePlans()
  const { memories, isLoading: memoriesLoading } = useMemories()

  if (plansLoading || memoriesLoading) return null

  // Determine card content from real state
  let gradient = "from-indigo-500 via-violet-500 to-pink-500"
  let Icon = ListTodo
  let heading = ""
  let body = ""
  let cta = ""
  let href = ""

  const hasTasks = plans.length > 0
  const hasMemories = memories.length > 0

  if (!hasTasks) {
    // No tasks at all
    Icon = ListTodo
    gradient = "from-indigo-500 via-violet-500 to-pink-500"
    heading = t("خلنا نرتب يومك 📋", "Let's plan your day 📋")
    body = t("ما عندك مهام بعد — أضف أول مهمة وخلنا نبدأ", "No tasks yet — add your first task and let's get started")
    cta = t("أضف مهمة →", "Add a task →")
    href = "/vault/plans"
  } else if (!hasMemories) {
    // Has tasks but no memories
    Icon = BookOpen
    gradient = "from-teal-500 via-emerald-500 to-cyan-500"
    heading = t("سجّل أول ذكرة 📖", "Capture your first memory 📖")
    body = t("الذكريات تساعدك تتذكر الأفكار المهمة — سجّل أول شي الحين", "Memories help you remember important thoughts — capture something now")
    cta = t("سجّل ذكرة →", "Add a memory →")
    href = "/vault/memories"
  } else {
    // Check for inactivity — no plan created in last 48h
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const recentPlan = plans.find((p) => p.created_at >= cutoff)
    const recentMemory = memories.find((m) => m.created_at >= cutoff)
    const isInactive = !recentPlan && !recentMemory

    if (isInactive) {
      Icon = CalendarRange
      gradient = "from-amber-500 via-orange-500 to-rose-500"
      heading = t("وين الخطة؟ 👀", "Time to plan 👀")
      body = t("ما سجّلت شي من يومين — خلنا نرتب الأسبوع الجاي", "No activity in 2 days — let's plan the week ahead")
      cta = t("رتب معي →", "Plan with AI →")
      href = "/vault/assistant?prompt=%D8%B1%D8%AA%D8%A8+%D9%84%D9%8A+%D8%A7%D9%84%D8%A3%D8%B3%D8%A8%D9%88%D8%B9"
    } else {
      // Active user — show encouraging summary, no gradient card needed
      return null
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(href)}
      dir={isArabic ? "rtl" : "ltr"}
      style={{ willChange: "transform" }}
      className={`w-full text-start rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-md space-y-3 cursor-pointer`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-white/80 shrink-0" />
        <h3 className="text-sm font-bold text-white">{heading}</h3>
      </div>
      <p className="text-xs text-white/80 leading-relaxed">{body}</p>
      <p className="text-sm font-semibold text-white">{cta}</p>
    </motion.button>
  )
}
