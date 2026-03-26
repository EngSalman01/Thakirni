"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    qAr: "ما هو ذكرني؟",
    qEn: "What is Thakirni?",
    aAr: "ذكرني هو مساعدك الذكي الشخصي — مصمم لمساعدتك على تنظيم خططك اليومية، حفظ ذكرياتك، تتبع عاداتك وأهدافك، وتلخيص اجتماعاتك. كل ذلك بمساعدة الذكاء الاصطناعي.",
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
  },
  {
    qAr: "كيف يساعدني المساعد الذكي؟",
    qEn: "How does the AI assistant help me?",
    aAr: "المساعد الذكي يفهم سياق يومك — يقرأ خططك وذكرياتك وعاداتك، ويساعدك على التخطيط، الإجابة على أسئلتك، واقتراح خطوات عملية نحو أهدافك.",
    aEn: "The AI assistant understands the context of your day — it reads your plans, memories, and habits to help you plan, answer questions, and suggest practical steps toward your goals.",
  },
  {
    qAr: "هل يعمل ذكرني على الهاتف المحمول؟",
    qEn: "Does Thakirni work on mobile?",
    aAr: "نعم. ذكرني يعمل بالكامل على متصفح الهاتف. يمكنك أيضاً إضافته للشاشة الرئيسية كـ PWA للحصول على تجربة تشبه التطبيق.",
    aEn: "Yes. Thakirni works fully in your mobile browser. You can also add it to your home screen as a PWA for an app-like experience.",
  },
];

function FAQItem({
  qAr,
  qEn,
  aAr,
  aEn,
  highlight,
}: {
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
  highlight?: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        highlight
          ? "bg-white/5 border border-[#2552ca]/50 hover:border-[#2552ca]"
          : "bg-white/5 border border-white/10 hover:border-white/30"
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/5 transition-colors"
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
            <div className="px-6 pb-5 text-slate-400 leading-relaxed text-sm border-t border-white/10 pt-4">
              {t(aAr, aEn)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CTASection() {
  const { t } = useLanguage();

  return (
    <>
      {/* FAQ section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden" id="faq">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#2552ca,transparent_70%)] opacity-30 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              {t("أسئلة شائعة", "Frequently Asked Questions")}
            </h2>
            <p className="text-xl text-slate-400">
              {t(
                "إجابات على أكثر الأسئلة التي تصلنا.",
                "Answers to the questions we hear most."
              )}
            </p>
          </motion.div>

          <div className="space-y-3 mb-12">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <FAQItem {...faq} highlight={i === 2} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 decoration-slate-600 hover:decoration-white"
            >
              {t("عرض جميع الأسئلة الشائعة ←", "View all FAQs →")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,101,194,0.05)_0,transparent_50%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-6xl font-headline font-extrabold text-white mb-10 leading-tight">
              {t("جاهز تنظم حياتك؟", "Ready to get organised?")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-12 py-5 rounded-full power-gradient text-white font-bold text-xl shadow-2xl btn-glow"
                >
                  {t("ابدأ مجاناً", "Get Started for Free")}
                </motion.button>
              </Link>
            </div>
            <p className="mt-8 text-slate-500 italic">
              {t("انضم لذكرني اليوم.", "Join Thakirni today.")}
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
