"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const PLANS = [
  {
    id: "free",
    nameAr: "مجاني",
    nameEn: "Free",
    priceAr: "٠",
    priceEn: "0",
    currencyAr: "ريال",
    currencyEn: "SAR",
    descAr: "ابدأ بدون بطاقة ائتمانية",
    descEn: "Start with no credit card",
    cta: { ar: "ابدأ مجاناً", en: "Start Free" },
    featured: false,
    featuresAr: [
      "١٠ تذكيرات يومية",
      "٢٥ ذاكرة في الفولت",
      "مشروع واحد",
      "محادثة AI أساسية",
      "تتبع العادات والأهداف",
    ],
    featuresEn: [
      "10 daily reminders",
      "25 vault memories",
      "1 project",
      "Basic AI chat",
      "Habit & goal tracking",
    ],
  },
  {
    id: "student",
    nameAr: "طالب 🎓",
    nameEn: "Student 🎓",
    priceAr: "١٩",
    priceEn: "19",
    priceAnnualAr: "١٥",
    priceAnnualEn: "15",
    currencyAr: "ريال / شهر",
    currencyEn: "SAR / mo",
    descAr: "مخصص للطلاب — تجربة مجانية ٣٠ يوم",
    descEn: "Built for students — 30-day free trial",
    cta: { ar: "ابدأ مجاناً 🎓", en: "Start Free 🎓" },
    featured: false,
    featuresAr: [
      "١٠ تذكيرات يومية",
      "٢٥ ذاكرة في الفولت",
      "قوالب الدراسة (١٠ قوالب) 📚",
      "تتبع الواجبات والاختبارات",
      "جدول المذاكرة الذكي",
    ],
    featuresEn: [
      "10 daily reminders",
      "25 vault memories",
      "Study templates (10 templates) 📚",
      "Assignment & exam tracking",
      "Smart study schedule",
    ],
  },
  {
    id: "pro",
    nameAr: "برو",
    nameEn: "Pro",
    priceAr: "٤٩",
    priceEn: "49",
    priceAnnualAr: "٣٩",
    priceAnnualEn: "39",
    currencyAr: "ريال / شهر",
    currencyEn: "SAR / mo",
    descAr: "لمن يريد المزيد من القوة",
    descEn: "For those who want more power",
    cta: { ar: "ابدأ الحين 👀", en: "Start Now 👀" },
    featured: true,
    featuresAr: [
      "تذكيرات غير محدودة",
      "ذاكرة غير محدودة في الفولت",
      "مشاريع غير محدودة",
      "فويس → تنفيذ مباشر 🎤",
      "تلخيص PDF والمستندات",
      "متابعة تلقائية ذكية",
      "رسالة صباحية يومية",
      "دعم واتساب كامل",
    ],
    featuresEn: [
      "Unlimited reminders",
      "Unlimited vault memory",
      "Unlimited projects",
      "Voice → direct execution 🎤",
      "PDF & document summarisation",
      "Smart automatic follow-up",
      "Daily morning briefing",
      "Full WhatsApp support",
    ],
  },
  {
    id: "team",
    nameAr: "فريق",
    nameEn: "Team",
    priceAr: "٢٤٩",
    priceEn: "249",
    priceAnnualAr: "١٩٩",
    priceAnnualEn: "199",
    currencyAr: "ريال / شهر",
    currencyEn: "SAR / mo",
    descAr: "للفرق والمؤسسات",
    descEn: "For teams & organisations",
    cta: { ar: "تواصل معنا", en: "Contact Us" },
    featured: false,
    featuresAr: [
      "كل مميزات البرو",
      "مساحة عمل مشتركة",
      "حتى ١٠ أعضاء",
      "تقارير الفريق",
      "مدير حساب مخصص",
      "دعم أولوية",
    ],
    featuresEn: [
      "Everything in Pro",
      "Shared workspace",
      "Up to 10 members",
      "Team analytics",
      "Dedicated account manager",
      "Priority support",
    ],
  },
]

function BillingToggle({
  annual,
  onToggle,
  isArabic,
}: {
  annual: boolean
  onToggle: () => void
  isArabic: boolean
}) {
  return (
    <div className="mb-10 flex items-center justify-center gap-3 sm:mb-14">
      <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
        {isArabic ? "شهري" : "Monthly"}
      </span>
      <button
        onClick={onToggle}
        className={`relative h-7 w-14 rounded-full border transition-colors duration-200 ${annual ? "border-amber-400/40 power-gradient" : "border-border bg-white dark:bg-white/[0.06]"}`}
        aria-label="Toggle billing"
      >
        <motion.div
          className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: annual ? "28px" : "0px" }}
          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
        />
      </button>
      <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
        {isArabic ? "سنوي" : "Annual"}
        <span className="ms-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
          {isArabic ? "وفّر ٢٠٪" : "Save 20%"}
        </span>
      </span>
    </div>
  )
}

function PlanCard({
  plan,
  annual,
  isArabic,
  index,
}: {
  plan: typeof PLANS[0]
  annual: boolean
  isArabic: boolean
  index: number
}) {
  const price = annual
    ? (isArabic ? plan.priceAnnualAr ?? plan.priceAr : plan.priceAnnualEn ?? plan.priceEn)
    : (isArabic ? plan.priceAr : plan.priceEn)
  const currency = isArabic ? plan.currencyAr : plan.currencyEn
  const features = isArabic ? plan.featuresAr : plan.featuresEn

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.2, 1, 0.3, 1] }}
      whileHover={{ y: plan.featured ? -6 : -3 }}
      className={`relative flex flex-col overflow-hidden transition-all duration-300 ${
        plan.featured
          ? "shell-panel-dark border-amber-500/50 shadow-[0_0_48px_rgba(217,119,6,0.18)]"
          : "shell-panel"
      }`}
    >
      {/* Top accent line */}
      {plan.featured && (
        <div className="absolute top-0 inset-x-0 h-0.5 power-gradient" />
      )}

      {/* Popular badge */}
      {plan.featured && (
        <div className="absolute end-4 top-4 flex items-center gap-1 rounded-full power-gradient px-2.5 py-1 text-[10px] font-bold text-white">
          <Sparkles className="w-3 h-3" />
          {isArabic ? "الأكثر شعبية" : "Most Popular"}
        </div>
      )}

      <div className="p-7 sm:p-8 flex-1 flex flex-col">
        {/* Name */}
        <div className="mb-6">
          <h3 className={`text-lg font-headline font-bold mb-1 ${plan.featured ? "text-white" : "text-foreground"}`}>
            {isArabic ? plan.nameAr : plan.nameEn}
          </h3>
          <p className={`text-sm ${plan.featured ? "text-amber-200/60" : "text-muted-foreground"}`}>
            {isArabic ? plan.descAr : plan.descEn}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-end gap-1">
            <span className={`text-4xl sm:text-5xl font-extrabold font-headline tabular ${plan.featured ? "text-white" : "text-foreground"}`}>
              {price}
            </span>
            <span className={`text-sm mb-1.5 ${plan.featured ? "text-amber-200/60" : "text-muted-foreground"}`}>
              {currency}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full power-gradient flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
              <span className={`text-sm leading-relaxed ${plan.featured ? "text-amber-100/80" : "text-muted-foreground"}`}>
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link href={plan.id === "student" ? "/auth?plan=student" : "/auth"}>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
              plan.featured
                ? "power-gradient text-white btn-glow"
                : "border border-slate-200 bg-slate-100 text-foreground hover:bg-slate-200 dark:border-white/[0.10] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
            }`}
          >
            {isArabic ? plan.cta.ar : plan.cta.en}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

export function PricingSection() {
  const { t, isArabic } = useLanguage()
  const [annual, setAnnual] = useState(false)

  return (
    <section className="relative overflow-hidden py-16 sm:py-24" id="pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="shell-panel-strong p-6 sm:p-8 lg:p-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-4 max-w-2xl text-center sm:mb-8"
          >
            <div className="eyebrow-badge">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t("الأسعار", "Pricing")}
            </div>
            <h2 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t("بدّل يومك بدون ما تكسر جيبك", "Upgrade your day without breaking the budget")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t("ابدأ مجاناً. رقّي متى ما تجهز.", "Start free. Upgrade whenever you are ready.")}
            </p>
          </motion.div>

          <BillingToggle annual={annual} onToggle={() => setAnnual(!annual)} isArabic={isArabic} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} annual={annual} isArabic={isArabic} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-3 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t(
                "كل الأسعار بالريال السعودي. بدون عقد — ألغي في أي وقت.",
                "All prices in SAR. No contract. Cancel any time."
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="stat-chip text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("بدون بطاقة في البداية", "No card to start")}
              </span>
              <span className="stat-chip text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("ترقية فورية", "Instant upgrade")}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
