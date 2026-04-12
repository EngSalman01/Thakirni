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
    <section className="relative overflow-hidden py-16 sm:py-24" id="process">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #D97706 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        <div className="shell-panel-strong p-6 sm:p-8 lg:p-10">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          >
            <div className="eyebrow-badge">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t("كيف يشتغل", "How it works")}
            </div>
            <h2 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t("٣ خطوات واضحة — وبعدها هو يشتغل عنك", "Three clear steps, then it runs for you")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t(
                "من الطلب إلى التنفيذ، التجربة مبنية لتكون مباشرة وسهلة.",
                "From request to execution, the flow is built to feel immediate and effortless."
              )}
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line — desktop */}
            <div className="mx-32 hidden h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent lg:absolute lg:left-0 lg:right-0 lg:top-[4.5rem] lg:block" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              {STEPS.map(({ icon: Icon, num, titleAr, titleEn, bodyAr, bodyEn }, i) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="shell-panel relative p-7 sm:p-9"
                >
                  {/* Step number watermark */}
                  <div className="absolute end-6 top-6 select-none text-5xl font-extrabold leading-none text-amber-400/15 tabular dark:text-amber-400/10">
                    {num}
                  </div>

                  {/* Icon */}
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl power-gradient shadow-sm">
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="mb-3 text-xl font-headline font-bold text-foreground sm:text-2xl">
                    {isArabic ? titleAr : titleEn}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {isArabic ? bodyAr : bodyEn}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
