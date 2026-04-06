"use client"

import { useLanguage } from "@/components/language-provider"

function getGreeting(isArabic: boolean): string {
  const h = new Date().getHours()
  if (isArabic) {
    if (h >= 5 && h < 12) return "صباح النور ☀️ جاهز نكسر اليوم؟"
    if (h >= 12 && h < 18) return "مساك الله بالخير 👋 وش عندك اليوم؟"
    return "مساء النور 🌙 كيف كان يومك؟"
  }
  if (h >= 5 && h < 12) return "Good morning ☀️ Ready to crush today?"
  if (h >= 12 && h < 18) return "Good afternoon 👋 What's on your plate?"
  return "Good evening 🌙 How was your day?"
}

function getDateLine(isArabic: boolean): string {
  const now = new Date()
  const locale = isArabic ? "ar-SA" : "en-US"
  const dateStr = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const city = isArabic ? "الخبر" : "Khobar"
  return `${dateStr} · ${city}`
}

export function GreetingHeader() {
  const { isArabic } = useLanguage()
  const greeting = getGreeting(isArabic)
  const dateLine = getDateLine(isArabic)

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-snug">
        {greeting}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">{dateLine}</p>
    </div>
  )
}
