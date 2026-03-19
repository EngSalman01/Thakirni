"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import type { ReactNode } from "react";

const plans = [
  {
    nameAr: "المتدرب",
    nameEn: "The Apprentice",
    price: "$0",
    periodAr: "/ للأبد",
    periodEn: "/ forever",
    featuresAr: ["1,000 اتصال عصبي", "مزامنة الجوال والويب"],
    featuresEn: ["1,000 Neural Connections", "Mobile & Web Sync"],
    disabledAr: ["التقاط صوتي محيطي"],
    disabledEn: ["Voice Ambient Capture"],
    cta: { ar: "ابدأ الآن", en: "Get Started" },
    highlight: false,
  },
  {
    nameAr: "الحكيم",
    nameEn: "The Sage",
    price: "$12",
    periodAr: "/ شهر",
    periodEn: "/ month",
    featuresAr: [
      "اتصالات عصبية غير محدودة",
      "معالجة الصوت المحيطي",
      "استخراج PDF والويب",
      "رؤى Aura المتقدمة",
    ],
    featuresEn: [
      "Unlimited Neural Connections",
      "Ambient Voice Processing",
      "PDF & Web Clipping",
      "Advanced Aura Insights",
    ],
    disabledAr: [],
    disabledEn: [],
    cta: { ar: "اذهب غير محدود", en: "Go Unlimited" },
    highlight: true,
    badge: { ar: "الأقوى", en: "Most Powerful" },
  },
];

export function CTASection() {
  const { t, isArabic } = useLanguage();

  return (
    <>
      {/* Pricing section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden" id="pricing">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#2552ca,transparent_70%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              {t("فوضاك، خطتك", "Your chaos, your plan")}
            </h2>
            <p className="text-xl text-slate-400">
              {t("طوّر قيودك البيولوجية بسعر قهوة.", "Upgrade your biological limitations for the price of a coffee.")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.nameEn}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="relative"
              >
                {plan.highlight && (
                  <div className="absolute -inset-0.5 power-gradient rounded-[1.3rem] blur opacity-40 animate-soft-pulse" />
                )}
                <div
                  className={`relative rounded-2xl p-10 h-full ${
                    plan.highlight
                      ? "bg-slate-950 border border-[#2552ca]"
                      : "bg-white/5 border border-white/10 hover:border-[#2552ca] hover:bg-white/10 transition-all duration-300"
                  }`}
                >
                  {plan.highlight && plan.badge && (
                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-[#ad1d7f] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                      {t(plan.badge.ar, plan.badge.en)}
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-2xl font-headline font-bold mb-2">
                      {t(plan.nameAr, plan.nameEn)}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-slate-400">{t(plan.periodAr, plan.periodEn)}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {(isArabic ? plan.featuresAr : plan.featuresEn).map((f: string) => (
                      <li key={f} className="flex items-center gap-3">
                        <span className={`text-xl ${plan.highlight ? "text-[#ad1d7f]" : "text-[#2552ca]"}`}>✓</span>
                        {f}
                      </li>
                    ))}
                    {(isArabic ? plan.disabledAr : plan.disabledEn).map((f: string) => (
                      <li key={f} className="flex items-center gap-3 text-slate-500">
                        <span className="text-xl">✕</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-4 rounded-full font-bold transition-all ${
                        plan.highlight
                          ? "power-gradient text-white shadow-xl btn-glow"
                          : "border border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      {t(plan.cta.ar, plan.cta.en)}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
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
              {t("مستعد لبناء أوراك الرقمية؟", "Ready to build your digital aura?")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-12 py-5 rounded-full power-gradient text-white font-bold text-xl shadow-2xl btn-glow"
                >
                  {t("إنشاء حساب مجاني", "Create Free Account")}
                </motion.button>
              </Link>
            </div>
            <p className="mt-8 text-slate-500 italic">
              {t("انضم إلى +45,000 مفكر يستخدم ذكرني.", "Join 45,000+ thinkers using Thakirni.")}
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
