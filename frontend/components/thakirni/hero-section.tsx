"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Mic, Sparkles, ArrowLeft, ArrowRight } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { BrandLogo } from "@/components/thakirni/brand-logo"

// ── Sticky CTA ──────────────────────────────────────────────────────────────

function StickyCTA({ isArabic }: { isArabic: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 1, 0.3, 1] }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
          <Link href="/auth" className="pointer-events-auto">
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-3 px-6 py-3.5 rounded-full power-gradient text-white font-bold text-sm shadow-2xl btn-glow"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {isArabic ? "ابدأ الحين — مجاناً 👀" : "Start Free Now 👀"}
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Animated background particles ──────────────────────────────────────────

function Particles() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const particles: HTMLDivElement[] = []

    const colors = [
      "rgba(79,70,229,0.15)",
      "rgba(124,58,237,0.12)",
      "rgba(236,72,153,0.10)",
    ]

    for (let i = 0; i < 22; i++) {
      const p = document.createElement("div")
      const size = Math.random() * 10 + 4
      const duration = Math.random() * 25 + 12
      const delay = Math.random() * -25
      const color = colors[Math.floor(Math.random() * colors.length)]
      p.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        background:${color};border-radius:50%;filter:blur(3px);
        --drift-x:${(Math.random() - 0.5) * 180}px;
        --drift-y:${(Math.random() - 0.5) * 180}px;
        --duration:${duration}s;
        animation:particle-drift ${duration}s linear ${delay}s infinite;
        pointer-events:none;
      `
      container.appendChild(p)
      particles.push(p)
    }
    return () => particles.forEach((p) => p.remove())
  }, [])

  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />
}

// ── Stats pill ──────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

// ── WhatsApp chat preview card ──────────────────────────────────────────────

function ChatPreviewCard({ isArabic }: { isArabic: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 1, 0.3, 1] }}
      className="absolute -bottom-6 -start-6 w-64 sm:w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
    >
      {/* WA header */}
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full power-gradient flex items-center justify-center">
          <BrandLogo variant="icon" iconSize={18} animate={false} />
        </div>
        <div>
          <div className="text-white text-xs font-bold">ذكّرني</div>
          <div className="text-[#b2dfdb] text-[10px]">
            {isArabic ? "متصل الآن" : "Online"}
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="bg-[#ece5dd] dark:bg-[#1a1a1a] px-3 py-4 space-y-2" dir={isArabic ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="flex justify-end"
        >
          <div className="bg-[#dcf8c6] rounded-2xl rounded-ee-sm px-3 py-2 max-w-[80%] shadow-sm">
            <p className="text-xs text-slate-800 leading-relaxed">
              {isArabic ? "ذكّرني بكرة الدوام الساعة 9" : "Remind me of work tomorrow at 9"}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 text-end">9:41 AM ✓✓</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="flex justify-start"
        >
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl rounded-ss-sm px-3 py-2 max-w-[80%] shadow-sm">
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {isArabic ? "تمام 👌 حطيت لك تذكير الساعة 9 بكرة" : "Done 👌 Set your reminder for 9 AM tomorrow"}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 text-end">9:41 AM</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Aura visual ─────────────────────────────────────────────────────────────

function AuraVisual({ isArabic }: { isArabic: boolean }) {
  return (
    <div className="relative w-full h-[360px] sm:h-[460px] flex items-center justify-center">
      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-56 h-56 rounded-full bg-indigo-500/20 blur-[60px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-pink-500/15 blur-[60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-violet-500/20 blur-[40px]" />
      </div>

      {/* Rotating rings */}
      <div className="relative w-52 h-52 sm:w-64 sm:h-64">
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_24s_linear_infinite]" />
        <div className="absolute inset-6 rounded-full border border-violet-500/15 animate-[spin_18s_linear_infinite_reverse]" />
        <div className="absolute inset-12 rounded-full border border-pink-500/20 animate-[spin_12s_linear_infinite]" />

        {/* Core */}
        <div className="absolute inset-16 rounded-full power-gradient shadow-glow flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrandLogo variant="icon" iconSize={36} state="idle" />
          </motion.div>
        </div>

        {/* Orbital nodes */}
        {[
          { pos: "top-2 left-1/2 -translate-x-1/2", icon: "✦", bg: "bg-indigo-50 dark:bg-indigo-950", text: "text-indigo-600" },
          { pos: "bottom-2 left-1/2 -translate-x-1/2", icon: "⚡", bg: "bg-pink-50 dark:bg-pink-950", text: "text-pink-500" },
          { pos: isArabic ? "right-2 top-1/2 -translate-y-1/2" : "left-2 top-1/2 -translate-y-1/2", icon: "📄", bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-500" },
          { pos: isArabic ? "left-2 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2", icon: "🎙️", bg: "bg-slate-50 dark:bg-slate-900", text: "text-slate-500" },
        ].map(({ pos, icon, bg, text }) => (
          <div key={icon} className={`absolute ${pos} w-10 h-10 rounded-full ${bg} shadow-lg flex items-center justify-center text-base ${text}`}>
            {icon}
          </div>
        ))}
      </div>

      {/* Chat card */}
      <ChatPreviewCard isArabic={isArabic} />
    </div>
  )
}

// ── Hero Section ────────────────────────────────────────────────────────────

export function HeroSection() {
  const { t, isArabic } = useLanguage()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 400], [0, -60])

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight

  return (
    <>
      <section
        className="relative pt-24 pb-16 sm:pt-36 sm:pb-28 overflow-hidden hero-mesh min-h-screen flex items-center"
        id="hero"
      >
        <Particles />

        {/* Radial glow top center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(79,70,229,0.12) 0%, transparent 70%)",
          }}
        />

        <motion.div
          style={{ y }}
          className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── Copy ── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t("مساعدك الذكي في السعودية 🇸🇦", "Your AI Assistant in Saudi Arabia 🇸🇦")}
              </motion.div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                {isArabic ? (
                  <>
                    خل{" "}
                    <span className="gradient-text">ثكّرني</span>
                    {" "}يرتب{" "}
                    <br className="hidden sm:block" />
                    يومك{" "}
                    <span className="text-slate-400 dark:text-slate-500">👀</span>
                  </>
                ) : (
                  <>
                    Let{" "}
                    <span className="gradient-text">Thakirni</span>
                    {" "}organise{" "}
                    <br className="hidden sm:block" />
                    your day{" "}
                    <span className="text-slate-400 dark:text-slate-500">👀</span>
                  </>
                )}
              </h1>

              {/* Sub */}
              <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t(
                  "قل اللي بخاطرك… والباقي علينا. يذكّرك، يرتبلك يومك، ويشتغل على واتساب.",
                  "Say what's on your mind… we handle the rest. Reminds you, organises your day, and works on WhatsApp."
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full power-gradient text-white font-bold text-base shadow-xl btn-glow"
                  >
                    {t("ابدأ الحين", "Start Now")}
                    <ArrowIcon className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/8 border border-slate-200 dark:border-white/12 text-slate-700 dark:text-white font-bold text-base hover:border-indigo-300 dark:hover:border-indigo-700 transition-all backdrop-blur-sm"
                  >
                    <Mic className="w-4 h-4 text-violet-500" />
                    {t("جرّب واتساب 🎤", "Try WhatsApp 🎤")}
                  </motion.button>
                </Link>
              </div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap gap-2.5 pt-2"
              >
                <StatPill value="+1,000" label={t("تذكير تم إنشاؤه", "reminders created")} />
                <StatPill value="+300" label={t("مستخدم نشط", "active users")} />
                <StatPill value="🇸🇦" label={t("مصنوع للسوق السعودي", "Made for Saudi Arabia")} />
              </motion.div>
            </motion.div>

            {/* ── Visual ── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.2, 1, 0.3, 1] }}
              className="relative"
            >
              <AuraVisual isArabic={isArabic} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Sticky CTA — appears after scrolling past hero */}
      <StickyCTA isArabic={isArabic} />
    </>
  )
}
