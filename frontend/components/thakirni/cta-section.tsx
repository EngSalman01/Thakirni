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
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        highlight
          ? "bg-white/5 border border-indigo-500/40 hover:border-indigo-500/70"
          : "bg-white/5 border border-white/8 hover:border-white/20"
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-base font-headline text-white">{t(qAr, qEn)}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-slate-400" />
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
            <div className="px-6 pb-5 text-slate-400 leading-relaxed text-sm border-t border-white/8 pt-4">
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
      <section className="py-16 sm:py-32 bg-[#0B0F1A] text-white relative overflow-hidden" id="faq">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px]" />
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-pink-600/6 blur-[80px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10 sm:mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3">
              {t("أسئلة شائعة", "FAQ")}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight">
              {t("عندك سؤال؟", "Have a question?")}
            </h2>
            <p className="text-base sm:text-xl text-slate-400">
              {t("إجابات على أكثر الأسئلة التي تصلنا.", "Answers to the questions we hear most.")}
            </p>
          </motion.div>

          <div className="space-y-3 mb-12">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <FAQItem {...faq} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 decoration-slate-700 hover:decoration-white"
            >
              {t("عرض جميع الأسئلة الشائعة", "View all FAQs")}
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-36 bg-[#0B0F1A] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(79,70,229,0.20) 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl sm:text-6xl mb-8 block"
            >
              👀
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold text-white mb-6 leading-tight">
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

            <p className="text-base sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto">
              {t(
                "انضم لآلاف المستخدمين في السعودية اللي خلّوا ذكّرني يرتب حياتهم.",
                "Join thousands of users in Saudi Arabia who let Thakirni organise their lives."
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2.5 px-10 py-5 rounded-full power-gradient text-white font-bold text-lg shadow-2xl btn-glow"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("ابدأ الآن", "Start Now")}
                </motion.button>
              </Link>
            </div>

            <p className="mt-6 text-slate-500 text-sm">
              {t("مجاناً — بدون بطاقة ائتمانية.", "Free — no credit card required.")}
            </p>
          </motion.div>
        </div>
      </section>
    </>
  )
}
