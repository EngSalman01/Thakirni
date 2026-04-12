"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"

export function Vision2030Section() {
  const { t, isArabic } = useLanguage()

  const tags = [
    { ar: "🕌 تذكير الصلاة", en: "🕌 Prayer Times" },
    { ar: "💪 جودة الحياة",  en: "💪 Quality of Life" },
    { ar: "🎓 الشباب والطلاب", en: "🎓 Youth & Students" },
    { ar: "🤖 ذكاء اصطناعي عربي", en: "🤖 Arabic AI" },
  ]

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24"
      style={{ background: "linear-gradient(180deg, #0A0500 0%, #0E0A06 100%)" }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Ambient amber glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(217,119,6,0.12) 0%, transparent 70%)", width: "100%", height: "100%" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="shell-panel-dark flex flex-col items-center gap-6 px-6 py-8 text-center sm:px-10 sm:py-10"
        >
          {/* Badge row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-950/60 px-4 py-1.5 text-xs font-bold tracking-wide text-amber-300">
              🇸🇦 {t("رؤية ٢٠٣٠ · عام الذكاء الاصطناعي ٢٠٢٦", "Vision 2030 · Year of AI 2026")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              SDAIA Aligned
            </span>
          </div>

          {/* Headline */}
          <div>
            <h2 className="mb-3 text-3xl font-headline font-bold leading-tight text-[#F0E8D8] sm:text-4xl md:text-5xl">
              {t("ذكرني يخدم رؤية ٢٠٣٠", "Thakirni Serves Vision 2030")}
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#A39890] sm:text-base">
              {t(
                "من تذكير الصلاة إلى تتبع الصحة إلى تمكين الشباب — كل ميزة مصممة لتدعم مستهدفات رؤية ٢٠٣٠",
                "From prayer reminders to health tracking to youth empowerment — every feature built to support Vision 2030 objectives."
              )}
            </p>
          </div>

          {/* Feature tags */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {tags.map((tag) => (
              <motion.span
                key={tag.en}
                whileHover={{ y: -2 }}
                className="cursor-default rounded-full border border-amber-700/40 bg-amber-950/40 px-4 py-2 text-sm font-semibold text-amber-300"
              >
                {isArabic ? tag.ar : tag.en}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
