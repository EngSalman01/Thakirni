"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

// ── Plan data ───────────────────────────────────────────────────────────────

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

// ── Toggle ──────────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 justify-center mb-10 sm:mb-14">
      <span className={`text-sm font-medium ${!annual ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
        {isArabic ? "شهري" : "Monthly"}
      </span>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? "power-gradient" : "bg-slate-200 dark:bg-slate-700"}`}
        aria-label="Toggle billing"
      >
        <motion.div
          layout
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
          animate={{ left: annual ? "calc(100% - 1.375rem)" : "0.125rem" }}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      </button>
      <span className={`text-sm font-medium ${annual ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
        {isArabic ? "سنوي" : "Annual"}
        <span className="ms-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
          {isArabic ? "وفّر ٢٠٪" : "Save 20%"}
        </span>
      </span>
    </div>
  )
}

// ── Plan card ───────────────────────────────────────────────────────────────

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
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.2, 1, 0.3, 1] }}
      whileHover={{ y: plan.featured ? -6 : -3 }}
      className={`relative flex flex-col rounded-2xl ${
        plan.featured
          ? "bg-slate-900 dark:bg-white/[0.06] border-2 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.25)]"
          : "bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/8 shadow-soft"
      } overflow-hidden transition-shadow duration-300`}
    >
      {/* Popular badge */}
      {plan.featured && (
        <div className="absolute top-0 inset-x-0 h-0.5 power-gradient" />
      )}
      {plan.featured && (
        <div className="absolute top-4 end-4 flex items-center gap-1 px-2.5 py-1 rounded-full power-gradient text-white text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          {isArabic ? "الأكثر شعبية" : "Most Popular"}
        </div>
      )}

      <div className="p-7 sm:p-8 flex-1 flex flex-col">
        {/* Name */}
        <div className="mb-6">
          <h3 className={`text-lg font-headline font-bold mb-1 ${plan.featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
            {isArabic ? plan.nameAr : plan.nameEn}
          </h3>
          <p className={`text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>
            {isArabic ? plan.descAr : plan.descEn}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-end gap-1">
            <span className={`text-4xl sm:text-5xl font-extrabold font-headline tabular ${plan.featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
              {price}
            </span>
            <span className={`text-sm mb-1.5 ${plan.featured ? "text-slate-400" : "text-slate-400"}`}>
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
              <span className={`text-sm leading-relaxed ${plan.featured ? "text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link href="/auth">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
              plan.featured
                ? "power-gradient text-white btn-glow"
                : "bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/12 border border-slate-200 dark:border-white/10"
            }`}
          >
            {isArabic ? plan.cta.ar : plan.cta.en}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

// ── Pricing Section ─────────────────────────────────────────────────────────

export function PricingSection() {
  const { t, isArabic } = useLanguage()
  const [annual, setAnnual] = useState(false)

  return (
    <section className="py-16 sm:py-32 bg-slate-50 dark:bg-[#0d1117] overflow-hidden" id="pricing">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-4 sm:mb-8"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            {t("الأسعار", "Pricing")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
            {t("بدّل يومك — بدون ما تكسر جيبك", "Transform your day — without breaking the bank")}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
            {t("ابدأ مجاناً. رقّي متى ما تجهز.", "Start free. Upgrade when you're ready.")}
          </p>
        </motion.div>

        {/* Billing toggle */}
        <BillingToggle annual={annual} onToggle={() => setAnnual(!annual)} isArabic={isArabic} />

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              isArabic={isArabic}
              index={i}
            />
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10"
        >
          {t(
            "كل الأسعار بالريال السعودي. بدون عقد — ألغي في أي وقت.",
            "All prices in SAR. No contract — cancel any time."
          )}
        </motion.p>
      </div>
    </section>
  )
}
