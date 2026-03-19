"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

const steps = [
  {
    num: "01",
    numColor: "text-[#2552ca]/20",
    borderColor: "border-[#2552ca]",
    titleAr: "التقاط بلا احتكاك",
    titleEn: "Capture Frictionlessly",
    bodyAr: "سواء كانت رسالة Slack أو فكرة عابرة أو ملف PDF من 80 صفحة، أضفه إلى ذكرني. لا حاجة لوسوم.",
    bodyEn: "Whether it's a Slack message, a thought in the shower, or an 80-page PDF, throw it into Thakirni. No tagging required.",
  },
  {
    num: "02",
    numColor: "text-[#ad1d7f]/20",
    borderColor: "border-[#ad1d7f]",
    titleAr: "السياق العصبي",
    titleEn: "Neural Contextualization",
    bodyAr: "محركنا يبني خريطة دلالية من مدخلاتك. يُجمّع الأفكار المتشابهة ويكتشف المشاعر ويُعد الملخصات.",
    bodyEn: "Our engine builds a semantic map of your inputs. It clusters related ideas, detects sentiment, and prepares summaries.",
  },
  {
    num: "03",
    numColor: "text-[#456ce4]/20",
    borderColor: "border-[#456ce4]",
    titleAr: "استدعاء لا نهائي",
    titleEn: "Infinite Recall",
    bodyAr: "اسأل بلغة طبيعية. \"ما كانت تلك الفكرة حول الزراعة العمودية؟\" — موجودة في 0.2 ثانية.",
    bodyEn: "Ask anything in natural language. \"What was that idea about vertical farming while listening to Lex Fridman?\" — Found in 0.2s.",
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
            {t("انضم إلى +45,000 مفكر يستخدم ذكرني", "Join 45,000+ thinkers using Thakirni")}
          </span>
          <div className="flex -space-x-3">
            {[
              "bg-[#2552ca]",
              "bg-[#ad1d7f]",
              "bg-[#385b9b]",
              "bg-[#5274b6]",
              "bg-[#fd65c2]",
            ].map((color, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full ${color} border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-600 text-xs font-bold">
              +k
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-yellow-400 text-base">★</span>
            ))}
            <span className="ml-2">{t("4.9 من 5", "4.9 / 5")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
