"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { BrandLogo } from "@/components/thakirni/brand-logo"
import { Mic, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react"

// ── Chat message type ───────────────────────────────────────────────────────

type Msg = {
  from: "user" | "bot"
  textAr: string
  textEn: string
  time: string
  emoji?: string
}

const MESSAGES: Msg[] = [
  {
    from: "user",
    textAr: "ذكّرني بكرة الدوام الساعة ٩",
    textEn: "Remind me of work tomorrow at 9",
    time: "9:38",
  },
  {
    from: "bot",
    textAr: "تمام 👌 حطيت لك تذكير — بكرة ٩ الصبح",
    textEn: "Done 👌 I set your reminder — tomorrow at 9 AM",
    time: "9:38",
  },
  {
    from: "user",
    textAr: "وكمان ذكّرني أراجع التقرير الساعة ٢ بعد الظهر",
    textEn: "Also remind me to review the report at 2 PM",
    time: "9:39",
  },
  {
    from: "bot",
    textAr: "خلاص 🔥 ضبطت الاثنين. راح تجيك إشعار قبل كل واحد بـ ١٥ دقيقة.",
    textEn: "Done 🔥 Both are set. You'll get a notification 15 minutes before each.",
    time: "9:39",
  },
  {
    from: "user",
    textAr: "أبدعت 👏",
    textEn: "Amazing 👏",
    time: "9:40",
  },
]

// ── Message bubble ──────────────────────────────────────────────────────────

function Bubble({ msg, isArabic, delay }: { msg: Msg; isArabic: boolean; delay: number }) {
  const isUser = msg.from === "user"
  const text = isArabic ? msg.textAr : msg.textEn

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35, ease: [0.2, 1, 0.3, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full power-gradient flex items-center justify-center me-2 shrink-0 self-end mb-0.5">
          <BrandLogo variant="icon" iconSize={14} animate={false} />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser
            ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-800 dark:text-slate-100 rounded-ee-sm"
            : "bg-white dark:bg-[#1f2c33] text-slate-800 dark:text-slate-100 rounded-ss-sm"
        }`}
      >
        <p className="text-sm leading-relaxed">{text}</p>
        <p className={`text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 ${isUser ? "text-end" : "text-start"}`}>
          {msg.time} {isUser ? "✓✓" : ""}
        </p>
      </div>
    </motion.div>
  )
}

// ── WhatsApp Demo Section ───────────────────────────────────────────────────

export function WhatsAppDemo() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-16 sm:py-32 bg-white dark:bg-[#0B0F1A] overflow-hidden" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Copy ── */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? 32 : -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              {t("جرّب على واتساب", "Try on WhatsApp")}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {isArabic ? (
                <>
                  تكلمه{" "}
                  <span className="gradient-text">بشكل طبيعي</span>
                  <br />
                  وهو يفهم
                </>
              ) : (
                <>
                  Talk to it{" "}
                  <span className="gradient-text">naturally</span>
                  <br />
                  and it understands
                </>
              )}
            </h2>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              {t(
                "ما تحتاج تعرف أوامر. قل اللي بذهنك بالعامية، وذكّرني يترجم ذلك إلى مهام وتذكيرات تلقائياً.",
                "No commands needed. Say what's on your mind in everyday language, and Thakirni translates it into tasks and reminders automatically."
              )}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { ar: "فويس 🎤", en: "Voice 🎤" },
                { ar: "واتساب 💬", en: "WhatsApp 💬" },
                { ar: "عربي وإنجليزي", en: "Arabic & English" },
                { ar: "٢٤/٧ متاح", en: "24/7 available" },
              ].map((f) => (
                <span
                  key={f.en}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                >
                  {isArabic ? f.ar : f.en}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Phone mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? -32 : 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-sm">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-pink-500/15 blur-2xl scale-110 pointer-events-none" />

              {/* Phone frame */}
              <div className="relative bg-white dark:bg-[#111b21] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/8 overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>

                {/* WhatsApp status bar */}
                <div className="bg-[#075e54] px-4 pt-3 pb-3">
                  {/* Back + contact */}
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5 text-white/80 rtl:rotate-180 shrink-0" />
                    <div className="w-9 h-9 rounded-full power-gradient flex items-center justify-center shrink-0">
                      <BrandLogo variant="icon" iconSize={20} animate={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold">ذكّرني</div>
                      <div className="text-[#b2dfdb] text-[11px]">
                        {t("يكتب...", "typing...")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-white/80">
                      <Video className="w-4 h-4" />
                      <Phone className="w-4 h-4" />
                      <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Chat area */}
                <div
                  className="px-3 py-4 space-y-3 min-h-[320px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {/* Date chip */}
                  <div className="flex justify-center mb-2">
                    <span className="px-3 py-1 rounded-full text-[10px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-white/5">
                      {t("اليوم", "Today")}
                    </span>
                  </div>

                  {MESSAGES.map((msg, i) => (
                    <Bubble
                      key={i}
                      msg={msg}
                      isArabic={isArabic}
                      delay={0.2 + i * 0.12}
                    />
                  ))}
                </div>

                {/* Input bar */}
                <div className="px-3 py-2.5 bg-[#f0f2f5] dark:bg-[#1f2c33] flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 text-sm text-slate-400 dark:text-slate-500">
                    {t("اكتب رسالة…", "Type a message…")}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
