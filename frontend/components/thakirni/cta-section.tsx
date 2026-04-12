"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { useState } from "react"
import { ChevronDown, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

const faqs = [
  {
    qAr: "ما هو ذكّرني؟",
    qEn: "What is Thakirni?",
    aAr: "ذكّرني هو مساعدك الذكي الشخصي — مصمم لمساعدتك على تنظيم خططك اليومية، حفظ ذكرياتك، تتبع عاداتك وأهدافك، وتلخيص اجتماعاتك. كل ذلك بمساعدة الذكاء الاصطناعي.",
    aEn: "Thakirni is your personal AI assistant — designed to help you organise your daily plans, preserve memories, track habits and goals, and summarise meetings. All powered by AI.",
  },
  {
    qAr: "هل بياناتي خاصة وآمنة؟",
    qEn: "Is my data private and secure?",
    aAr: "نعم. بياناتك محمية ومشفرة بالكامل. كل ذاكرة وخطة وملاحظة مربوطة بحسابك فقط — لا يمكن لأحد غيرك الوصول إليها.",
    aEn: "Yes. Your data is fully protected and encrypted. Every memory, plan, and note is tied to your account only — no one else can access it.",
  },
  {
    qAr: "ماذا يمكنني فعله مع الخطة المجانية؟",
    qEn: "What can I do with the free plan?",
    aAr: "الخطة المجانية تشمل ١٠ خطط يومية، ٢٥ ذاكرة، مشروع واحد، محادثة AI أساسية، وتتبع العادات والأهداف — كل ذلك مجاناً بدون بطاقة ائتمانية.",
    aEn: "The free plan includes 10 daily plans, 25 memories, 1 project, basic AI chat, and habit & goal tracking — all free with no credit card required.",
    highlight: true,
  },
  {
    qAr: "كيف يساعدني المساعد الذكي؟",
    qEn: "How does the AI assistant help me?",
    aAr: "المساعد الذكي يفهم سياق يومك — يقرأ خططك وذكرياتك وعاداتك، ويساعدك على التخطيط، الإجابة على أسئلتك، واقتراح خطوات عملية نحو أهدافك.",
    aEn: "The AI assistant understands the context of your day — it reads your plans, memories, and habits to help you plan, answer questions, and suggest practical steps toward your goals.",
  },
  {
    qAr: "هل يعمل ذكّرني على الهاتف المحمول؟",
    qEn: "Does Thakirni work on mobile?",
    aAr: "نعم. ذكّرني يعمل بالكامل على متصفح الهاتف. يمكنك أيضاً إضافته للشاشة الرئيسية كـ PWA للحصول على تجربة تشبه التطبيق.",
    aEn: "Yes. Thakirni works fully in your mobile browser. You can also add it to your home screen as a PWA for an app-like experience.",
  },
]

function FAQItem({
  qAr,
  qEn,
  aAr,
  aEn,
  highlight,
}: {
  qAr: string
  qEn: string
  aAr: string
  aEn: string
  highlight?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${
        open
          ? highlight
            ? "bg-amber-500/10 border border-amber-400/40"
            : "bg-white/[0.06] border border-white/14"
          : highlight
            ? "bg-white/[0.03] border border-amber-400/25 hover:border-amber-400/45"
            : "bg-white/[0.03] border border-white/[0.08] hover:border-white/16"
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-base font-headline text-white">{t(qAr, qEn)}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className={`w-5 h-5 ${open ? "text-amber-400" : "text-slate-400"}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border-t border-white/[0.07] px-6 pb-5 pt-4 text-sm leading-relaxed text-slate-400">
              {t(aAr, aEn)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CTASection() {
  const { t, isArabic } = useLanguage()
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight

  return (
    <>
      {/* ── FAQ ── */}
      <section className="relative overflow-hidden bg-[#0E0B07] py-16 text-white sm:py-24" id="faq">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-amber-600/6 blur-[100px]" />
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-orange-600/5 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8">
          <div className="shell-panel-dark p-6 sm:p-8 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 text-center sm:mb-16"
            >
              <div className="eyebrow-badge border-white/10 bg-white/[0.04] text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {t("أسئلة شائعة", "FAQ")}
              </div>
              <h2 className="mt-4 text-3xl font-headline font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t("كل شيء مهم في مكان واحد", "Everything important, answered clearly")}
              </h2>
              <p className="mt-4 text-base text-slate-400 sm:text-xl">
                {t("إجابات على أكثر الأسئلة التي تصلنا.", "Answers to the questions we hear most.")}
              </p>
            </motion.div>

            <div className="mb-12 space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FAQItem {...faq} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-white hover:decoration-amber-500"
              >
                {t("عرض جميع الأسئلة الشائعة", "View all FAQs")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-[#0E0B07] py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(217,119,6,0.14) 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-amber-600/8 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="shell-panel-dark px-6 py-10 sm:px-10 sm:py-12"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 block text-5xl sm:text-6xl"
            >
              👀
            </motion.div>

            <h2 className="mb-6 text-3xl font-headline font-extrabold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {isArabic ? (
                <>
                  جاهز تخلي{" "}
                  <span className="gradient-text">يومك أسهل؟</span>
                </>
              ) : (
                <>
                  Ready to make{" "}
                  <span className="gradient-text">your day easier?</span>
                </>
              )}
            </h2>

            <p className="mx-auto mb-10 max-w-xl text-base text-slate-400 sm:text-xl">
              {t(
                "انضم لآلاف المستخدمين في السعودية اللي خلّوا ذكّرني يرتب حياتهم.",
                "Join thousands of users in Saudi Arabia who let Thakirni organise their lives."
              )}
            </p>

            <div className="flex justify-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 rounded-2xl power-gradient px-10 py-5 text-lg font-bold text-white shadow-2xl btn-glow"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("ابدأ الآن", "Start Now")}
                </motion.button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              {t("مجاناً — بدون بطاقة ائتمانية.", "Free — no credit card required.")}
            </p>
          </motion.div>
        </div>
      </section>
    </>
  )
}
