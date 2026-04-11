"use client"

import { motion } from "framer-motion"
import { MessageSquare, Brain, CalendarCheck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const STEPS = [
  {
    icon: MessageSquare,
    num: "01",
    titleAr: "قول",
    titleEn: "Say it",
    bodyAr: "تكلم ذكرني على واتساب أو التطبيق — بالكلام العادي أو صوتية — وهو يفهمك.",
    bodyEn: "Talk to Thakirni on WhatsApp or the app — in everyday language or a voice note — and it gets you.",
  },
  {
    icon: Brain,
    num: "02",
    titleAr: "يفهم",
    titleEn: "It understands",
    bodyAr: "يعرف وش تبي بالضبط — تذكير، موعد، مهمة، أو ملاحظة — ويحفظها لك على طول.",
    bodyEn: "Knows exactly what you need — reminder, appointment, task, or note — and saves it instantly.",
  },
  {
    icon: CalendarCheck,
    num: "03",
    titleAr: "يرتب",
    titleEn: "It organises",
    bodyAr: "يضبط جدولك، يرسلك ملخص الصبح، ويذكرك بكل شي — عشانك تركز على اللي يهم.",
    bodyEn: "Sorts your schedule, sends you a morning briefing, and reminds you of everything — so you focus on what matters.",
  },
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
          viewport={{ once: true, amount: 0 }}
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
              "٣ خطوات وكل شي يتنظم.",
              "3 steps — and everything falls into place."
            )}
          </p>
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
                viewport={{ once: true, amount: 0 }}
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
