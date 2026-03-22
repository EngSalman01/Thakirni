"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

const steps = [
  {
    num: "01",
    numColor: "text-[#2552ca]/20",
    borderColor: "border-[#2552ca]",
    titleAr: "أضف أي شي بسرعة",
    titleEn: "Add anything instantly",
    bodyAr: "قول لـ ذكرني على واتساب، أو اكتب في التطبيق، أو سجّل صوتية — كل شي يتحفظ عندك في ثواني.",
    bodyEn: "Tell the AI on WhatsApp, type it in the app, or record a voice note — your plans and memories are saved in seconds.",
  },
  {
    num: "02",
    numColor: "text-[#ad1d7f]/20",
    borderColor: "border-[#ad1d7f]",
    titleAr: "كل شي منظم",
    titleEn: "Stay organised",
    bodyAr: "مواعيدك وملاحظاتك دايم جاهزة لما تحتاجها.",
    bodyEn: "Your plans, memories, and notes are always ready when you need them.",
  },
  {
    num: "03",
    numColor: "text-[#456ce4]/20",
    borderColor: "border-[#456ce4]",
    titleAr: "ما تنسى شي",
    titleEn: "Never forget again",
    bodyAr: "اسأل ذكرني عن أي شي حفظته. هو يتذكر عشانك.",
    bodyEn: "Ask the AI anything you've saved. It remembers so you don't have to.",
  },
];

export function TrustSignals() {
  const { t } = useLanguage();

  return (
    <section className="py-32 relative overflow-hidden bg-[#f6f3f2]/50 dark:bg-slate-900/50" id="process">
      <div className="max-w-7xl mx-auto px-8">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
          className="text-5xl font-headline font-bold text-center mb-20 tracking-tight text-slate-900 dark:text-white"
        >
          {t("كيف ستتوقف عن النسيان إلى الأبد", "How you'll stop forgetting forever")}
        </motion.h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-[#2552ca] via-[#ad1d7f] to-[#456ce4] -translate-y-1/2 opacity-20" />

          <div className="grid lg:grid-cols-3 gap-12 relative z-10">
            {steps.map(({ num, numColor, borderColor, titleAr, titleEn, bodyAr, bodyEn }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.2, ease: [0.2, 1, 0.3, 1] }}
                className={`bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-ambient border-t-8 ${borderColor} hover-lift`}
              >
                <div className={`text-5xl font-extrabold ${numColor} mb-6`}>{num}</div>
                <h4 className="text-2xl font-headline font-bold mb-4 text-slate-900 dark:text-white">
                  {t(titleAr, titleEn)}
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  {t(bodyAr, bodyEn)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm"
        >
          <span>
            {t("انضم لذكرني اليوم", "Join Thakirni today")}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
