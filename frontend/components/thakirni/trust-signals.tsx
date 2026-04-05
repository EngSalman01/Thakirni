"use client"

import { motion } from "framer-motion"
import { MessageSquare, Brain, CalendarCheck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

// ── Steps data ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: MessageSquare,
    gradient: "from-indigo-500 to-violet-500",
    ring: "ring-indigo-500/20",
    numColor: "text-indigo-500/20",
    titleAr: "قل له",
    titleEn: "Tell it",
    bodyAr: "قل لـ ذكّرني بالكلام العادي — واتساب أو التطبيق أو فويس — وهو يفهمك بدون ما تكتب بالضبط.",
    bodyEn: "Tell Thakirni in plain language — WhatsApp, the app, or voice — and it understands without you needing to be precise.",
    num: "01",
  },
  {
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    ring: "ring-violet-500/20",
    numColor: "text-violet-500/20",
    titleAr: "يفهمك",
    titleEn: "It understands",
    bodyAr: "الذكاء الاصطناعي يحلل اللي قلته ويحدد النية — تذكير، مهمة، تلخيص، أو خطة — ويرتبها تلقائيًا.",
    bodyEn: "AI analyses what you said and identifies the intent — reminder, task, summary, or plan — and organises it automatically.",
    num: "02",
  },
  {
    icon: CalendarCheck,
    gradient: "from-pink-500 to-rose-500",
    ring: "ring-pink-500/20",
    numColor: "text-pink-500/20",
    titleAr: "ينفذ ويرتب يومك",
    titleEn: "Executes & organises your day",
    bodyAr: "يحط التذكير، يرتب جدولك، ويرسلك ملخص صباحي — كل شي بدون ما ترفع إصبعك.",
    bodyEn: "Sets the reminder, organises your schedule, and sends you a morning briefing — all without you lifting a finger.",
    num: "03",
  },
]

// ── Social proof stats bar ──────────────────────────────────────────────────

const STATS = [
  { valueAr: "+١,٠٠٠", valueEn: "+1,000", labelAr: "تذكير تم إنشاؤه", labelEn: "reminders created" },
  { valueAr: "+٣٠٠",   valueEn: "+300",   labelAr: "مستخدم نشط",       labelEn: "active users" },
  { valueAr: "٩٨٪",    valueEn: "98%",    labelAr: "رضا المستخدمين",  labelEn: "satisfaction rate" },
]

function StatsBar({ isArabic }: { isArabic: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-3 gap-4 mb-16 sm:mb-24 max-w-2xl mx-auto"
    >
      {STATS.map((s) => (
        <div key={s.valueEn} className="text-center">
          <div className="text-2xl sm:text-3xl font-headline font-extrabold gradient-text tabular">
            {isArabic ? s.valueAr : s.valueEn}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isArabic ? s.labelAr : s.labelEn}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ── How It Works ────────────────────────────────────────────────────────────

export function TrustSignals() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-16 sm:py-32 relative overflow-hidden bg-slate-50 dark:bg-[#0d1117]" id="process">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#4F46E5 1px, transparent 1px), linear-gradient(90deg, #4F46E5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            {t("كيف يشتغل", "How it works")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
            {t("٣ خطوات بس — وبعدها هو يشتغل", "3 steps — then it works for you")}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
            {t(
              "يستخدمه طلاب وموظفين في السعودية يومياً.",
              "Used daily by students and professionals across Saudi Arabia."
            )}
          </p>
        </motion.div>

        {/* Stats */}
        <StatsBar isArabic={isArabic} />

        {/* Connecting line — desktop */}
        <div className="relative">
          <div className="hidden lg:block absolute top-[4.5rem] left-0 right-0 h-px bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 opacity-20 mx-40" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map(({ icon: Icon, gradient, ring, numColor, titleAr, titleEn, bodyAr, bodyEn, num }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.2, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className={`relative bg-white dark:bg-white/[0.04] rounded-2xl p-7 sm:p-9 border border-slate-100 dark:border-white/8 shadow-soft hover:shadow-[0_12px_40px_rgba(79,70,229,0.12)] transition-all duration-300 ring-1 ${ring}`}
              >
                {/* Step number */}
                <div className={`absolute top-6 end-6 text-5xl font-extrabold ${numColor} leading-none select-none`}>
                  {num}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl sm:text-2xl font-headline font-bold mb-3 text-slate-900 dark:text-white">
                  {isArabic ? titleAr : titleEn}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                  {isArabic ? bodyAr : bodyEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
