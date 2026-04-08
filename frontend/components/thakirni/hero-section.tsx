"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Calendar, Bell } from "lucide-react"
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

// ── Floating notification badge ─────────────────────────────────────────────

function FloatingBadge({
  icon: Icon,
  text,
  delay,
  className,
}: {
  icon: React.ElementType
  text: string
  delay: number
  className: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 1, 0.3, 1] }}
      className={`absolute flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1F1A14] border border-amber-100 dark:border-amber-900/40 shadow-lg text-xs font-semibold text-slate-700 dark:text-amber-100 whitespace-nowrap backdrop-blur-sm z-10 ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      {text}
    </motion.div>
  )
}

// ── Phone mockup with WhatsApp chat ─────────────────────────────────────────

function PhoneMockup({ isArabic }: { isArabic: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72 rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-[60px]" />
      </div>

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.2, 1, 0.3, 1] }}
        className="relative w-[220px] sm:w-[260px] rounded-[2.5rem] border-[7px] border-slate-800 dark:border-[#2D2620] bg-[#ece5dd] dark:bg-[#1a1310] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden"
        style={{ aspectRatio: "9/19.5" }}
      >
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 flex justify-center z-10 pt-2">
          <div className="w-24 h-5 bg-slate-800 dark:bg-[#2D2620] rounded-full" />
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#075e54] px-4 pt-8 pb-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full power-gradient flex items-center justify-center shrink-0">
            <BrandLogo variant="icon" iconSize={14} animate={false} />
          </div>
          <div>
            <div className="text-white text-[11px] font-bold leading-tight">ذكرني</div>
            <div className="text-[#b2dfdb] text-[9px]">{isArabic ? "متصل الآن" : "Online"}</div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="px-2.5 py-3 space-y-2 overflow-hidden" dir="rtl">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="bg-[#dcf8c6] rounded-2xl rounded-ee-sm px-2.5 py-1.5 max-w-[85%] shadow-sm">
              <p className="text-[10px] text-slate-800 leading-relaxed">
                ذكّرني بكرة الدوام الساعة 9
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5 text-end">9:41 ✓✓</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-ss-sm px-2.5 py-1.5 max-w-[85%] shadow-sm">
              <p className="text-[10px] text-slate-800 leading-relaxed">
                تمام 👌 حطيت لك تذكير الساعة 9 بكرة
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5 text-end">9:41</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7, duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="bg-[#dcf8c6] rounded-2xl rounded-ee-sm px-2.5 py-1.5 max-w-[85%] shadow-sm">
              <p className="text-[10px] text-slate-800 leading-relaxed">
                وضيف لي اجتماع الخميس الساعة 3 عصر
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5 text-end">9:43 ✓✓</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.4 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-ss-sm px-2.5 py-1.5 max-w-[85%] shadow-sm">
              <p className="text-[10px] text-slate-800 leading-relaxed">
                ✅ أُضيف الاجتماع — الخميس 3:00 مساءً
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5 text-end">9:43</p>
            </div>
          </motion.div>
        </div>

        {/* Chat input bar */}
        <div className="absolute bottom-0 inset-x-0 px-2 py-2 bg-[#f0f0f0] dark:bg-[#1a1310] flex items-center gap-1.5">
          <div className="flex-1 h-6 rounded-full bg-white dark:bg-[#2a2010] border border-stone-200 dark:border-amber-900/30" />
          <div className="w-6 h-6 rounded-full bg-[#075e54] flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-sm bg-white" />
          </div>
        </div>
      </motion.div>

      {/* Floating badges */}
      <FloatingBadge
        icon={CheckCircle2}
        text={isArabic ? "تذكير تم ✓" : "Reminder set ✓"}
        delay={1.4}
        className="-top-4 -start-8 sm:-start-16"
      />
      <FloatingBadge
        icon={Calendar}
        text={isArabic ? "اجتماع — الخميس 3م" : "Meeting — Thu 3PM"}
        delay={1.7}
        className="top-1/3 -end-6 sm:-end-14"
      />
      <FloatingBadge
        icon={Bell}
        text={isArabic ? "خطة جديدة أُضيفت" : "New plan added"}
        delay={2.1}
        className="-bottom-4 -start-6 sm:-start-12"
      />
    </div>
  )
}

// ── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/[0.05] border border-amber-100 dark:border-amber-900/30 backdrop-blur-sm">
      <span className="text-sm font-bold text-slate-900 dark:text-amber-100">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

// ── Hero Section ─────────────────────────────────────────────────────────────

export function HeroSection() {
  const { t, isArabic } = useLanguage()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 400], [0, -50])

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight

  return (
    <>
      <section
        className="relative pt-24 pb-16 sm:pt-36 sm:pb-28 overflow-hidden hero-mesh min-h-screen flex items-center"
        id="hero"
      >
        {/* Background texture dots */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #92400E 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Warm radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(217,119,6,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 100% 100%, rgba(21,128,61,0.06) 0%, transparent 65%)",
          }}
        />

        <motion.div
          style={{ y }}
          className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 w-full"
        >
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">

            {/* ── Copy ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-7 max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t("مساعدك الذكي في السعودية 🇸🇦", "Your AI Assistant in Saudi Arabia 🇸🇦")}
              </motion.div>

              {/* Headline */}
              <div className="space-y-1">
                {isArabic ? (
                  <h1 className="font-arabic text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-[#F0E8D8]">
                    خلّي{" "}
                    <span className="relative inline-block">
                      <span className="gradient-text">ذكرني</span>
                      <span className="absolute -bottom-1 start-0 end-0 h-[3px] rounded-full power-gradient opacity-60" />
                    </span>
                    <br />
                    يرتّب يومك
                  </h1>
                ) : (
                  <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-[#F0E8D8]">
                    Let{" "}
                    <span className="relative inline-block">
                      <span className="gradient-text">Thakirni</span>
                      <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full power-gradient opacity-60" />
                    </span>
                    <br />
                    organise your day
                  </h1>
                )}
              </div>

              {/* Sub */}
              <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-[#A39890] leading-relaxed max-w-lg">
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
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl power-gradient text-white font-bold text-base shadow-lg btn-glow"
                  >
                    {t("ابدأ الحين", "Start Now")}
                    <ArrowIcon className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white dark:bg-white/[0.06] border border-amber-200 dark:border-amber-900/40 text-slate-700 dark:text-[#F0E8D8] font-bold text-base hover:border-amber-400 dark:hover:border-amber-700 transition-all backdrop-blur-sm"
                  >
                    <span className="text-base">🎤</span>
                    {t("جرّب واتساب", "Try WhatsApp")}
                  </motion.button>
                </Link>
              </div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap gap-2 pt-1"
              >
                <StatPill value="+1,000" label={t("تذكير تم إنشاؤه", "reminders created")} />
                <StatPill value="+300" label={t("مستخدم نشط", "active users")} />
                <StatPill value="🇸🇦" label={t("مصنوع للسوق السعودي", "Made for KSA")} />
              </motion.div>
            </motion.div>

            {/* ── Phone Visual ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              <PhoneMockup isArabic={isArabic} />
            </motion.div>

          </div>
        </motion.div>
      </section>

      <StickyCTA isArabic={isArabic} />
    </>
  )
}
