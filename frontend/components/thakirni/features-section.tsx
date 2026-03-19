"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.2, 1, 0.3, 1] },
  }),
};

export function FeaturesSection() {
  const { t, isArabic } = useLanguage();

  return (
    <section className="py-32 bg-[#fbf9f8] dark:bg-slate-900" id="features">
      <div className="max-w-7xl mx-auto px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-5xl font-headline font-bold mb-6 tracking-tight text-slate-900 dark:text-white">
            {t(
              "قدرات خارقة لعقول لا تستطيع أن تفعل كل شيء",
              "Superpowers for minds that can't do it all"
            )}
          </h2>
          <p className="text-xl text-slate-500">
            {t(
              "أدوات تدوين الملاحظات التقليدية ماتت. ذكرني يعيش حيث تحدث أفكارك.",
              "Traditional note-taking is dead. Thakirni lives where your thoughts happen, automatically organizing chaos into actionable intelligence."
            )}
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1 — Semantic Threading (wide) */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="md:col-span-2 bg-[#f6f3f2] rounded-2xl p-12 relative overflow-hidden group hover-lift cursor-pointer"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="text-4xl text-[#2552ca] mb-6 block">✦</span>
                <h3 className="text-3xl font-headline font-bold mb-4 text-slate-900">
                  {t("الخيط الدلالي", "Semantic Threading")}
                </h3>
                <p className="text-lg text-slate-500 max-w-md">
                  {t(
                    "ذكاؤنا الاصطناعي لا يخزن الكلمات فحسب، بل يفهم المفاهيم. يربط تلقائياً ذلك البودكاست الذي سمعته بالمقترح الذي تكتبه اليوم.",
                    "Our AI doesn't just store words; it understands concepts. It automatically links that podcast you heard in June to the project proposal you're writing today."
                  )}
                </p>
              </div>
              <div className="mt-12 flex gap-3 flex-wrap">
                <span className="px-4 py-2 bg-[#2552ca]/10 text-[#2552ca] rounded-full text-sm font-semibold">
                  {t("ربط تلقائي", "Automatic Linking")}
                </span>
                <span className="px-4 py-2 bg-[#ad1d7f]/10 text-[#ad1d7f] rounded-full text-sm font-semibold">
                  {t("بحث سياقي", "Contextual Search")}
                </span>
              </div>
            </div>
            {/* Decorative bg element */}
            <div className="absolute right-0 bottom-0 w-1/2 translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-40">
              <div className="w-full h-48 bg-gradient-to-tl from-[#2552ca]/20 to-[#fd65c2]/20 rounded-tl-2xl" />
            </div>
          </motion.div>

          {/* Card 2 — Ambient Capture */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="bg-[#456ce4] text-white rounded-2xl p-12 flex flex-col justify-between hover-lift cursor-pointer"
          >
            <div>
              <span className="text-4xl mb-6 block">🎙️</span>
              <h3 className="text-3xl font-headline font-bold mb-4">
                {t("التقاط محيطي", "Ambient Capture")}
              </h3>
              <p className="text-lg opacity-90">
                {t(
                  "تحدث إلى ذكرني أثناء مشيك. يُحوّل ويُنظّف ويُصنّف تدفق وعيك في الوقت الفعلي.",
                  "Talk to Thakirni as you walk. It transcribes, cleans, and categorizes your stream of consciousness in real-time."
                )}
              </p>
            </div>
            {/* Waveform */}
            <div className="h-16 bg-white/10 rounded-xl flex items-center justify-center mt-8">
              <div className="flex gap-1 items-end h-10">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white rounded-full"
                    style={{
                      animation: `wave-bar 1s ease-in-out ${i * 0.1}s infinite`,
                      height: "8px",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Privacy */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="bg-[#f6f3f2] rounded-2xl p-12 flex flex-col items-center text-center hover-lift cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-[#fd65c2] flex items-center justify-center mb-8 animate-soft-pulse">
              <span className="text-white text-3xl">🔒</span>
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-slate-900">
              {t("خصوصية بالتصميم", "Privacy by Design")}
            </h3>
            <p className="text-slate-500">
              {t(
                "عقلك خاص. بياناتك مشفرة محليًا وأنت وحدك تملك المفاتيح.",
                "Your mind is private. Your data is encrypted locally and only you hold the keys. No AI training on your private life."
              )}
            </p>
          </motion.div>

          {/* Card 4 — Cognitive Dashboard (wide) */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="md:col-span-2 bg-[#e4e2e1] rounded-2xl p-12 grid md:grid-cols-2 gap-12 items-center hover-lift cursor-pointer"
          >
            <div>
              <h3 className="text-3xl font-headline font-bold mb-4 text-slate-900">
                {t("لوحة المعرفة الإدراكية", "Cognitive Dashboard")}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {t(
                  "تصوّر صحة إنتاجك الذهني. اكتشف أين تتجه تركيزك وتحديد الثغرات.",
                  "Visualize the health of your mental output. See where your focus is trending and discover blind spots in your knowledge base."
                )}
              </p>
              <Link href="/vault">
                <button className="mt-8 font-bold text-[#2552ca] flex items-center gap-2 group/btn hover:gap-3 transition-all">
                  {t("استكشاف التحليلات", "Explore Aura Analytics")}
                  <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </Link>
            </div>
            {/* Progress bars */}
            <div className="space-y-4">
              {[
                { color: "bg-[#2552ca]", width: "75%", label: t("احتفاظ", "Retention") },
                { color: "bg-[#ad1d7f]", width: "50%", label: t("وضوح", "Clarity") },
                { color: "bg-[#456ce4]", width: "83%", label: t("تركيز", "Focus") },
              ].map(({ color, width, label }) => (
                <div key={label as string}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                    <span className="text-xs text-slate-500">{width}</span>
                  </div>
                  <div className="h-3 w-full bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      className={`h-full ${color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
