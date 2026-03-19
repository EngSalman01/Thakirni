"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mic, Shield, BarChart3 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function FeaturesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-surface" id="features">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-headline font-bold mb-6 tracking-tight text-on-background"
          >
            {t("قدرات خارقة لعقل لا يتوقف", "Superpowers for minds that can't do it all")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-on-surface-variant leading-relaxed"
          >
            {t(
              "تدوين الملاحظات التقليدي انتهى. ذكرني يعيش حيث تحدث أفكارك.",
              "Traditional note-taking is dead. Thakirni lives where your thoughts happen.",
            )}
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1 — wide: Semantic Threading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 bg-surface-container-low rounded-xl p-12 relative overflow-hidden group hover-lift"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <BrainCircuit className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4 text-on-surface">
                  {t("ربط المعاني تلقائياً", "Semantic Threading")}
                </h3>
                <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                  {t(
                    "الذكاء الاصطناعي لا يحفظ الكلمات فقط، بل يفهم المفاهيم ويربط أفكارك تلقائياً.",
                    "Our AI doesn't just store words; it understands concepts and automatically links your ideas.",
                  )}
                </p>
              </div>
              <div className="mt-12 flex gap-3 flex-wrap">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {t("ربط تلقائي", "Automatic Linking")}
                </span>
                <span className="px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                  {t("بحث سياقي", "Contextual Search")}
                </span>
              </div>
            </div>
            {/* Decorative gradient */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-xl" />
          </motion.div>

          {/* Card 2 — tall: Ambient Capture */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-primary-container text-on-primary-container rounded-xl p-12 flex flex-col justify-between hover-lift"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-6">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-headline font-bold mb-4">
                {t("التقاط محيطي", "Ambient Capture")}
              </h3>
              <p className="text-lg opacity-90 leading-relaxed">
                {t(
                  "تحدث وأنت تمشي. ذكرني يحوّل كلامك إلى نصوص ومهام منظمة فوراً.",
                  "Talk as you walk. Thakirni transcribes and organizes your stream of consciousness in real-time.",
                )}
              </p>
            </div>
            {/* Waveform visual */}
            <div className="h-16 bg-white/10 rounded-lg flex items-center justify-center mt-8">
              <div className="flex gap-1 items-end h-10">
                {[40, 70, 55, 90, 45, 80, 60, 75, 50, 85].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white rounded-full opacity-80"
                    style={{
                      height: `${h}%`,
                      animation: `bounce 1s ease-in-out ${i * 0.1}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 3 — centered: Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-surface-container-low rounded-xl p-12 flex flex-col items-center text-center hover-lift"
          >
            <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-8 animate-soft-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-on-surface">
              {t("خصوصية بالتصميم", "Privacy by Design")}
            </h3>
            <p className="text-on-surface-variant leading-relaxed">
              {t(
                "عقلك خاص. بياناتك مشفرة محلياً وأنت وحدك تملك المفاتيح.",
                "Your mind is private. Your data is encrypted locally and only you hold the keys.",
              )}
            </p>
          </motion.div>

          {/* Card 4 — wide: Cognitive Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2 bg-surface-container-highest rounded-xl p-12 grid md:grid-cols-2 gap-12 items-center hover-lift"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-3xl font-headline font-bold mb-4 text-on-surface">
                {t("لوحة التحكم المعرفية", "Cognitive Dashboard")}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                {t(
                  "تصوّر صحة إنتاجك الذهني. اكتشف أين يتجه تركيزك.",
                  "Visualize the health of your mental output. Discover where your focus is trending.",
                )}
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: t("الذاكرة", "Memory"), width: "75%", color: "bg-primary" },
                { label: t("المهام", "Tasks"), width: "50%", color: "bg-secondary" },
                { label: t("الأفكار", "Ideas"), width: "83%", color: "bg-tertiary-container" },
              ].map((bar, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>{bar.label}</span>
                    <span>{bar.width}</span>
                  </div>
                  <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: bar.width }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.2, ease: "easeOut" }}
                      className={`h-full ${bar.color} rounded-full`}
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
