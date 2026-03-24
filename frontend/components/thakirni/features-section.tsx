"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

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
              "كل اللي تحتاجه في مكان واحد",
              "Everything you need to stay on top of your life"
            )}
          </h2>
          <p className="text-xl text-slate-500">
            {t(
              "أضف مواعيد، احفظ ملاحظات، وتكلم مع مساعدك الذكي — في ثواني.",
              "Add plans, save memories, and chat with your AI assistant — in seconds."
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
            className="md:col-span-2 bg-[#f6f3f2] rounded-2xl p-12 relative overflow-hidden group hover-lift cursor-default"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="text-4xl text-[#2552ca] mb-6 block">✦</span>
                <h3 className="text-3xl font-headline font-bold mb-4 text-slate-900">
                  {t("المساعد الذكي", "AI Assistant")}
                </h3>
                <p className="text-lg text-slate-500 max-w-md">
                  {t(
                    "تكلم ذكرني بالطبيعي وهو يضيف المواعيد ويحفظ الملاحظات. يفهمك ويتذكر كل شي قلته.",
                    "Chat naturally to add reminders, schedule meetings, and save notes. Thakirni understands you and remembers everything you tell it."
                  )}
                </p>
              </div>
              <div className="mt-12" />
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
            className="bg-[#456ce4] text-white rounded-2xl p-12 flex flex-col justify-between hover-lift cursor-default"
          >
            <div>
              <span className="text-4xl mb-6 block">🎙️</span>
              <h3 className="text-3xl font-headline font-bold mb-4">
                {t("تسجيل صوتي", "Voice Notes")}
              </h3>
              <p className="text-lg opacity-90">
                {t(
                  "سجّل صوتية وذكرني يحفظها لك على طول. ترجع لها متى تبي من الفولت.",
                  "Record a voice note and Thakirni saves it instantly to your Second Brain. Access it anytime from your vault."
                )}
              </p>
            </div>
            {/* Waveform */}
            <div className="h-16 bg-white/10 rounded-xl flex items-center justify-center mt-8">
              <div className="flex gap-1 items-center h-10">
                {[10, 28, 18, 36, 14, 32, 22, 12, 26].map((maxH, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-white rounded-full"
                    animate={{ height: [6, maxH, 6] }}
                    transition={{
                      duration: 0.8 + i * 0.07,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: i * 0.09,
                    }}
                    style={{ height: 6 }}
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
            className="bg-[#f6f3f2] rounded-2xl p-12 flex flex-col items-center text-center hover-lift cursor-default"
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
            className="md:col-span-2 bg-[#e4e2e1] rounded-2xl p-12 grid md:grid-cols-2 gap-12 items-center hover-lift cursor-default"
          >
            <div>
              <h3 className="text-3xl font-headline font-bold mb-4 text-slate-900">
                {t("لوحة التحكم", "Smart Dashboard")}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {t(
                  "شوف مواعيدك القادمة وآخر ملاحظاتك — كل شي في شاشة وحدة تتحدث بشكل لحظي.",
                  "See your upcoming plans, recent memories, and daily focus — all on one clean dashboard that updates in real time."
                )}
              </p>
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

          {/* Card 5 — WhatsApp */}
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="bg-[#25d366] text-white rounded-2xl p-12 flex flex-col justify-between hover-lift cursor-default"
          >
            <div>
              <span className="text-4xl mb-6 block">💬</span>
              <h3 className="text-3xl font-headline font-bold mb-4">
                {t("يشتغل على واتساب", "Works on WhatsApp")}
              </h3>
              <p className="text-lg opacity-90">
                {t(
                  "تكلم ذكرني على واتساب وهو يتكفل بالباقي. أضف مواعيد، احفظ ملاحظات، وخلّه يذكرك — ما تحتاج تفتح التطبيق أبد.",
                  "Chat with your Thakirni assistant directly on WhatsApp. Add plans, save notes, and get reminders — without opening the app."
                )}
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
