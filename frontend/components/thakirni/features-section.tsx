"use client"

import { motion } from "framer-motion"
import { Bell, Mic, FileText, Sunrise, Target, Zap } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const WAVE_HEIGHTS = [8, 24, 16, 32, 12, 28, 20, 10, 22]

function Waveform() {
  return (
    <div className="mt-8 h-14 bg-white/10 rounded-xl flex items-center justify-center px-4">
      <div className="flex gap-1 items-end h-8">
        {WAVE_HEIGHTS.map((maxH, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-white/80 rounded-full"
            style={{ height: maxH, originY: 1, willChange: "transform", transform: "translateZ(0)" }}
            animate={{ scaleY: [4 / maxH, 1, 4 / maxH] }}
            transition={{
              duration: 0.8 + i * 0.07,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: i * 0.09,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WhatsAppCard({ t, isArabic }: { t: ReturnType<typeof useLanguage>["t"]; isArabic: boolean }) {
  return (
    <motion.div
      custom={4}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0 }}
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="md:col-span-2 bg-[#075e54] text-white rounded-2xl p-7 sm:p-10 grid md:grid-cols-2 gap-6 items-center border border-[#128c7e]/30 transition-all duration-300"
    >
      <div>
        <div className="w-10 h-10 rounded-xl bg-[#25d366] flex items-center justify-center mb-5">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl font-headline font-bold mb-3">
          {t("تذكيرات ذكية على واتساب 💬", "Smart Reminders on WhatsApp 💬")}
        </h3>
        <p className="text-[#b2dfdb] text-sm sm:text-base leading-relaxed">
          {t(
            "تكلم ذكّرني على واتساب وهو يتكفل بالباقي. أضف مواعيد، احفظ ملاحظات، وخلّه يذكرك — ما تحتاج تفتح التطبيق.",
            "Chat with Thakirni on WhatsApp and it handles the rest. Add plans, save notes, get reminders — without opening the app."
          )}
        </p>
      </div>
      <div className="space-y-2.5">
        {[
          { ar: "✓ يشتغل بدون تطبيق", en: "✓ Works without an app" },
          { ar: "✓ فويس + كتابة", en: "✓ Voice + text" },
          { ar: "✓ متاح ٢٤/٧", en: "✓ Available 24/7" },
          { ar: "✓ ردود فورية", en: "✓ Instant responses" },
        ].map((f) => (
          <div key={f.en} className="text-sm text-[#b2dfdb] font-medium">
            {isArabic ? f.ar : f.en}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-16 sm:py-32 bg-background" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-20"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
            {t("المميزات", "Features")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight text-foreground">
            {t("كل اللي تحتاجه في مكان واحد", "Everything you need in one place")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {t(
              "أضف مواعيد، احفظ ملاحظات، وتكلم مع مساعدك الذكي — في ثواني.",
              "Add plans, save memories, and chat with your AI assistant — in seconds."
            )}
          </p>
        </motion.div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">

          {/* AI Assistant — wide */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0 }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="md:col-span-2 bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-7 sm:p-10 relative overflow-hidden border border-amber-100 dark:border-amber-900/40 transition-all duration-300 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold mb-3 text-foreground">
                {t("المساعد الذكي", "AI Assistant")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
                {t(
                  "تكلم ذكّرني بالطبيعي وهو يضيف المواعيد ويحفظ الملاحظات. يفهمك بالعامية ويتذكر كل شي قلته.",
                  "Chat naturally to add reminders, schedule meetings, and save notes. Understands everyday language and remembers everything."
                )}
              </p>
            </div>
            <div className="absolute -bottom-8 -end-8 w-48 h-48 rounded-full bg-gradient-to-tl from-amber-400/15 to-orange-300/10 blur-2xl pointer-events-none" />
          </motion.div>

          {/* Voice card */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0 }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-2xl p-7 sm:p-10 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-headline font-bold mb-3">
                {t("فويس → تنفيذ 🎤", "Voice → Execute 🎤")}
              </h3>
              <p className="text-sm sm:text-base text-amber-100 leading-relaxed">
                {t(
                  "سجّل صوتية وذكّرني يحوّلها لمهام ومواعيد فوراً. ما تحتاج تكتب.",
                  "Record a voice note and Thakirni converts it to tasks and reminders instantly."
                )}
              </p>
            </div>
            <Waveform />
          </motion.div>

        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
          {[
            {
              icon: Target,
              gradient: "from-amber-500 to-orange-500",
              titleAr: "متابعة تلقائية",
              titleEn: "Smart Follow-up",
              bodyAr: "ذكّرني يتابع مهامك تلقائياً ويرسل لك تنبيهات ذكية.",
              bodyEn: "Thakirni auto-tracks your tasks and sends smart alerts.",
            },
            {
              icon: FileText,
              gradient: "from-amber-600 to-yellow-500",
              titleAr: "تلخيص PDF 📄",
              titleEn: "PDF Summary 📄",
              bodyAr: "ارفع أي مستند وذكّرني يلخّصه لك في ثواني.",
              bodyEn: "Upload any document and Thakirni summarises it in seconds.",
            },
            {
              icon: Sunrise,
              gradient: "from-orange-400 to-amber-500",
              titleAr: "رسالة صباحية ☀️",
              titleEn: "Morning Briefing ☀️",
              bodyAr: "كل صبح يوصلك ملخص يومك مباشرة على واتساب.",
              bodyEn: "Every morning, get a summary of your day sent directly to WhatsApp.",
            },
          ].map(({ icon: Icon, gradient, titleAr, titleEn, bodyAr, bodyEn }, i) => (
            <motion.div
              key={titleEn}
              custom={i + 2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-white/[0.03] rounded-2xl p-7 sm:p-9 border border-slate-100 dark:border-white/[0.07] transition-all duration-300 hover:shadow-sm hover:border-amber-100 dark:hover:border-amber-900/30"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold mb-2 text-foreground">
                {isArabic ? titleAr : titleEn}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic ? bodyAr : bodyEn}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Row 3 — WhatsApp + Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <WhatsAppCard t={t} isArabic={isArabic} />

          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0 }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-white/[0.03] rounded-2xl p-7 sm:p-9 flex flex-col items-center text-center border border-slate-100 dark:border-white/[0.07] transition-all duration-300 hover:shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl power-gradient flex items-center justify-center mb-5 shadow-md">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h3 className="text-lg sm:text-xl font-headline font-bold mb-2 text-foreground">
              {t("خصوصية بالتصميم", "Privacy by Design")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "بياناتك مشفرة بالكامل. أنت وحدك تملك المفاتيح.",
                "Your data is fully encrypted. Only you hold the keys."
              )}
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
