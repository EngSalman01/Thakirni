"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"

function getGreeting(isArabic: boolean): { title: string; sub: string } {
  const h = new Date().getHours()
  if (isArabic) {
    if (h >= 5 && h < 12)
      return { title: "صباح النور ☀️", sub: "جاهز نكسر اليوم؟ 👀" }
    if (h >= 12 && h < 14)
      return { title: "الله يعطيك العافية 💪", sub: "وش عندك اليوم؟" }
    if (h >= 14 && h < 18)
      return { title: "مساك الله بالخير 🌤️", sub: "وش باقي عليك؟" }
    if (h >= 18 && h < 21)
      return { title: "مساء النور 🌙", sub: "كيف يومك جاء؟" }
    return { title: "الليل طويل 🌙", sub: "وش تبغى ترتب قبل تنام؟" }
  }
  if (h >= 5 && h < 12)
    return { title: "Good morning ☀️", sub: "Ready to crush today?" }
  if (h >= 12 && h < 18)
    return { title: "Good afternoon 🌤️", sub: "How's the day going?" }
  return { title: "Good evening 🌙", sub: "What's still on your plate?" }
}

export function GreetingHeader() {
  const { isArabic } = useLanguage()
  const { title, sub } = getGreeting(isArabic)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-snug">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
    </motion.div>
  )
}
