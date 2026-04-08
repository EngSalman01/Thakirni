"use client"

import { motion } from "framer-motion"
import { MessageSquare, Brain, CalendarCheck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const STEPS = [
  {
    icon: MessageSquare,
    num: "01",
    titleAr: "قل له",
    titleEn: "Tell it",
    bodyAr: "قل لـ ذكّرني بالكلام العادي — واتساب أو التطبيق أو فويس — وهو يفهمك بدون ما تكتب بالضبط.",
    bodyEn: "Tell Thakirni in plain language — WhatsApp, the app, or voice — and it understands without you needing to be precise.",
  },
  {
    icon: Brain,
    num: "02",
    titleAr: "يفهمك",
    titleEn: "It understands",
    bodyAr: "الذكاء الاصطناعي يحلل اللي قلته ويحدد النية — تذكير، مهمة، تلخيص، أو خطة — ويرتبها تلقائيًا.",
    bodyEn: "AI analyses what you said and identifies the intent — reminder, task, summary, or plan — and organises it automatically.",
  },
  {
    icon: CalendarCheck,
    num: "03",
    titleAr: "ينفذ ويرتب يومك",
    titleEn: "Executes & organises your day",
    bodyAr: "يحط التذكير، يرتب جدولك، ويرسلك ملخص صباحي — كل شي بدون ما ترفع إصبعك.",
    bodyEn: "Sets the reminder, organises your schedule, and sends you a morning briefing — all without you lifting a finger.",
  },
]

const STATS = [
  { valueAr: "+١,٠٠٠", valueEn: "+1,000", labelAr: "تذكير تم إنشاؤه", labelEn: "reminders created" },
  { valueAr: "+٣٠٠",   valueEn: "+300",   labelAr: "مستخدم نشط",       labelEn: "active users" },
  { valueAr: "٩٨٪",    valueEn: "98%",    labelAr: "رضا المستخدمين",   labelEn: "satisfaction rate" },
]

export function TrustSignals() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-16 sm:py-32 relative overflow-hidden bg-amber-50/40 dark:bg-[#0d0b08]" id="process">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #D97706 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
            {t("كيف يشتغل", "How it works")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight text-foreground">
            {t("٣ خطوات بس — وبعدها هو يشتغل", "3 steps — then it works for you")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {t(
              "يستخدمه طلاب وموظفين في السعودية يومياً.",
              "Used daily by students and professionals across Saudi Arabia."
            )}
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-4 mb-16 sm:mb-24 max-w-2xl mx-auto"
        >
          {STATS.map((s) => (
            <div key={s.valueEn} className="text-center">
              <div className="text-2xl sm:text-3xl font-headline font-extrabold gradient-text tabular">
                {isArabic ? s.valueAr : s.valueEn}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isArabic ? s.labelAr : s.labelEn}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden lg:block absolute top-[4.5rem] left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-32" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map(({ icon: Icon, num, titleAr, titleEn, bodyAr, bodyEn }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="relative bg-white dark:bg-white/[0.04] rounded-2xl p-7 sm:p-9 border border-amber-100/60 dark:border-white/[0.07] shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/40 transition-all duration-300"
              >
                {/* Step number watermark */}
                <div className="absolute top-6 end-6 text-5xl font-extrabold text-amber-400/15 dark:text-amber-400/10 leading-none select-none tabular">
                  {num}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl power-gradient flex items-center justify-center mb-6 shadow-sm">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl sm:text-2xl font-headline font-bold mb-3 text-foreground">
                  {isArabic ? titleAr : titleEn}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
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
