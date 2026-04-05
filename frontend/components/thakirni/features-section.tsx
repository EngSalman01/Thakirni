"use client"

import { motion } from "framer-motion"
import { Bell, Mic, FileText, Sunrise, Target, Zap } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.2, 1, 0.3, 1] },
  }),
}

// ── Feature card data ───────────────────────────────────────────────────────

const CARDS = [
  {
    wide: true,
    icon: Zap,
    iconBg: "bg-indigo-100 dark:bg-indigo-950",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-100 dark:border-indigo-900/50",
    accent: "from-indigo-500/20 to-violet-500/10",
    titleAr: "المساعد الذكي",
    titleEn: "AI Assistant",
    bodyAr: "تكلم ذكّرني بالطبيعي وهو يضيف المواعيد ويحفظ الملاحظات. يفهمك ويتذكر كل شي قلته — بالعامية.",
    bodyEn: "Chat naturally to add reminders, schedule meetings, and save notes. Thakirni understands you and remembers everything.",
    emoji: "✦",
  },
  {
    wide: false,
    icon: Mic,
    iconBg: "bg-violet-600",
    iconColor: "text-white",
    bg: "bg-gradient-to-br from-violet-600 to-purple-600",
    border: "border-violet-500/30",
    dark: true,
    titleAr: "فويس → تنفيذ 🎤",
    titleEn: "Voice → Execute 🎤",
    bodyAr: "سجّل صوتية وذكّرني يحوّلها لمهام ومواعيد فوراً. ما تحتاج تكتب.",
    bodyEn: "Record a voice note and Thakirni turns it into tasks and reminders instantly. No typing needed.",
    waveform: true,
  },
]

// ── Bottom 3 cards ──────────────────────────────────────────────────────────

const SMALL_CARDS = [
  {
    icon: Target,
    gradient: "from-pink-500 to-rose-500",
    titleAr: "متابعة تلقائية",
    titleEn: "Smart Follow-up",
    bodyAr: "ذكّرني يتابع مهامك تلقائياً ويرسل لك تنبيهات ذكية.",
    bodyEn: "Thakirni auto-tracks your tasks and sends smart alerts.",
    bg: "bg-slate-50 dark:bg-white/[0.03]",
    border: "border-slate-100 dark:border-white/8",
  },
  {
    icon: FileText,
    gradient: "from-indigo-500 to-blue-500",
    titleAr: "تلخيص PDF 📄",
    titleEn: "PDF Summary 📄",
    bodyAr: "ارفع أي مستند وذكّرني يلخّصه لك في ثواني.",
    bodyEn: "Upload any document and Thakirni summarises it in seconds.",
    bg: "bg-slate-50 dark:bg-white/[0.03]",
    border: "border-slate-100 dark:border-white/8",
  },
  {
    icon: Sunrise,
    gradient: "from-amber-400 to-orange-500",
    titleAr: "رسالة صباحية ☀️",
    titleEn: "Morning Briefing ☀️",
    bodyAr: "كل صبح يوصلك ملخص يومك مباشرة على واتساب.",
    bodyEn: "Every morning, get a summary of your day sent directly to WhatsApp.",
    bg: "bg-slate-50 dark:bg-white/[0.03]",
    border: "border-slate-100 dark:border-white/8",
  },
]

// ── Waveform animation ──────────────────────────────────────────────────────

function Waveform() {
  return (
    <div className="mt-8 h-14 bg-white/10 rounded-xl flex items-center justify-center px-4">
      <div className="flex gap-1 items-center h-8">
        {[8, 24, 16, 32, 12, 28, 20, 10, 22].map((maxH, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-white/80 rounded-full"
            animate={{ height: [4, maxH, 4] }}
            transition={{
              duration: 0.8 + i * 0.07,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: i * 0.09,
            }}
            style={{ height: 4 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── WhatsApp feature card (green) ────────────────────────────────────────────

function WhatsAppCard({ t, isArabic }: { t: ReturnType<typeof useLanguage>["t"]; isArabic: boolean }) {
  return (
    <motion.div
      custom={4}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
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
      <div className="space-y-2">
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

// ── Features Section ────────────────────────────────────────────────────────

export function FeaturesSection() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-16 sm:py-32 bg-white dark:bg-[#0B0F1A]" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-20"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            {t("المميزات", "Features")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
            {t("كل اللي تحتاجه في مكان واحد", "Everything you need in one place")}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
            {t(
              "أضف مواعيد، احفظ ملاحظات، وتكلم مع مساعدك الذكي — في ثواني.",
              "Add plans, save memories, and chat with your AI assistant — in seconds."
            )}
          </p>
        </motion.div>

        {/* Bento grid row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">

          {/* Card: AI Assistant (wide) */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="md:col-span-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-7 sm:p-10 relative overflow-hidden border border-indigo-100 dark:border-indigo-900/50 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(79,70,229,0.12)]"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold mb-3 text-slate-900 dark:text-white">
                {t("المساعد الذكي", "AI Assistant")}
              </h3>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                {t(
                  "تكلم ذكّرني بالطبيعي وهو يضيف المواعيد ويحفظ الملاحظات. يفهمك بالعامية ويتذكر كل شي قلته.",
                  "Chat naturally to add reminders, schedule meetings, and save notes. Understands everyday language and remembers everything."
                )}
              </p>
            </div>
            {/* Decorative gradient */}
            <div className="absolute -bottom-8 -end-8 w-48 h-48 rounded-full bg-gradient-to-tl from-indigo-500/15 to-violet-500/10 blur-2xl pointer-events-none" />
          </motion.div>

          {/* Card: Voice */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-2xl p-7 sm:p-10 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(124,58,237,0.3)]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-headline font-bold mb-3">
                {t("فويس → تنفيذ 🎤", "Voice → Execute 🎤")}
              </h3>
              <p className="text-sm sm:text-base text-violet-100 leading-relaxed">
                {t(
                  "سجّل صوتية وذكّرني يحوّلها لمهام ومواعيد فوراً. ما تحتاج تكتب.",
                  "Record a voice note and Thakirni converts it to tasks and reminders instantly."
                )}
              </p>
            </div>
            <Waveform />
          </motion.div>

        </div>

        {/* Bento grid row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">

          {SMALL_CARDS.map(({ icon: Icon, gradient, titleAr, titleEn, bodyAr, bodyEn, bg, border }, i) => (
            <motion.div
              key={titleEn}
              custom={i + 2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className={`${bg} rounded-2xl p-7 sm:p-9 border ${border} transition-all duration-300 hover:shadow-soft`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold mb-2 text-slate-900 dark:text-white">
                {isArabic ? titleAr : titleEn}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {isArabic ? bodyAr : bodyEn}
              </p>
            </motion.div>
          ))}

        </div>

        {/* WhatsApp row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <WhatsAppCard t={t} isArabic={isArabic} />

          {/* Privacy */}
          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-7 sm:p-9 flex flex-col items-center text-center border border-slate-100 dark:border-white/8 transition-all duration-300 hover:shadow-soft"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-5 shadow-md animate-soft-pulse">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h3 className="text-lg sm:text-xl font-headline font-bold mb-2 text-slate-900 dark:text-white">
              {t("خصوصية بالتصميم", "Privacy by Design")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
