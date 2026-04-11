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
      className="py-16 sm:py-24 overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, #0A0500 0%, #0E0A06 100%)" }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Ambient amber glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(217,119,6,0.12) 0%, transparent 70%)", width: "100%", height: "100%" }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center gap-6"
        >
          {/* Badge row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-bold tracking-wide">
              🇸🇦 {t("رؤية ٢٠٣٠ · عام الذكاء الاصطناعي ٢٠٢٦", "Vision 2030 · Year of AI 2026")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-700/40 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
              SDAIA Aligned
            </span>
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-[#F0E8D8] leading-tight mb-3">
              {t("ذكرني يخدم رؤية ٢٠٣٠", "Thakirni Serves Vision 2030")}
            </h2>
            <p className="text-sm sm:text-base text-[#A39890] max-w-xl mx-auto leading-relaxed">
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
                className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-950/40 border border-amber-700/40 text-amber-300 cursor-default"
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
