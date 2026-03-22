"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useState, useEffect } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const PADDLE_PRICES = {
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ?? "",
  teams: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY ?? "",
};

const plans = [
  {
    nameAr: "مجاني",
    nameEn: "Free",
    taglineAr: "للبدء",
    taglineEn: "Get started",
    price: "0",
    priceNoteAr: null,
    priceNoteEn: null,
    periodAr: "/ شهر",
    periodEn: "/ month",
    featuresAr: ["١٠ خطط يومياً", "٢٥ ذاكرة", "مشروع واحد", "محادثة AI أساسية", "تتبع العادات والأهداف"],
    featuresEn: ["10 plans per day", "25 memories", "1 project", "Basic AI chat", "Habit & goal tracking"],
    disabledAr: ["ملخص الاجتماعات", "تحليل الوثائق"],
    disabledEn: ["Meeting summary", "Document AI"],
    cta: { ar: "ابدأ مجاناً", en: "Get Started" },
    href: "/auth",
    highlight: false,
    badge: null,
    paddleKey: null as keyof typeof PADDLE_PRICES | null,
  },
  {
    nameAr: "برو",
    nameEn: "Pro",
    taglineAr: "للمحترفين والمستقلين",
    taglineEn: "Professionals & Freelancers",
    price: "30",
    priceNoteAr: null,
    priceNoteEn: null,
    periodAr: "/ شهر",
    periodEn: "/ month",
    featuresAr: ["١٠٠ خطة يومياً", "١٠٠٠ ذاكرة", "١٠ مشاريع", "٣٠ ملخص اجتماع/شهر 🎙️", "٥٠ وثيقة AI/شهر", "٣٠٠ دقيقة صوت/شهر", "تحليلات وتقارير"],
    featuresEn: ["100 plans per day", "1,000 memories", "10 projects", "30 meeting summaries/month 🎙️", "50 document AI/month", "300 min voice/month", "Analytics & reports"],
    disabledAr: [],
    disabledEn: [],
    cta: { ar: "احصل على Pro", en: "Get Pro" },
    href: null,
    highlight: true,
    badge: { ar: "الأكثر شعبية", en: "Most Popular" },
    paddleKey: "pro" as keyof typeof PADDLE_PRICES,
  },
  {
    nameAr: "فرق",
    nameEn: "Teams",
    taglineAr: "للفرق والمشاريع",
    taglineEn: "Teams & Organizations",
    price: "60",
    priceNoteAr: "لكل مستخدم",
    priceNoteEn: "per user",
    periodAr: "/ شهر",
    periodEn: "/ month",
    featuresAr: ["كل شيء غير محدود", "أعضاء فريق غير محدودين", "مشاريع غير محدودة", "ملخصات اجتماعات غير محدودة", "ذكريات وملاحظات مشتركة", "دعم فني ذو أولوية"],
    featuresEn: ["Everything unlimited", "Unlimited team members", "Unlimited projects", "Unlimited meeting summaries", "Shared memories & notes", "Priority support"],
    disabledAr: [],
    disabledEn: [],
    cta: { ar: "احصل على Teams", en: "Get Teams" },
    href: null,
    highlight: false,
    badge: null,
    paddleKey: "teams" as keyof typeof PADDLE_PRICES,
  },
];

export function CTASection() {
  const { t, isArabic } = useLanguage();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "production" | "sandbox") ?? "production",
    }).then((p) => { if (p) setPaddle(p); });
  }, []);

  async function handleSubscribe(plan: typeof plans[0]) {
    if (plan.href) { router.push(plan.href); return; }
    if (loadingPlan) return;

    const priceId = plan.paddleKey ? PADDLE_PRICES[plan.paddleKey] : "";
    if (!priceId) {
      toast.info(t(
        "الدفع الإلكتروني قيد الإعداد — سجّل دخولك وسنتواصل معك",
        "Online payment is being set up — sign in and we will contact you",
      ));
      setTimeout(() => router.push("/auth"), 1800);
      return;
    }
    if (!paddle) { toast.error(t("حاول مرة أخرى", "Please try again")); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    setLoadingPlan(plan.nameEn);
    try {
      await paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user?.email ? { email: user.email } : undefined,
        customData: { user_id: user?.id ?? "", plan_tier: plan.paddleKey, billing: "monthly" },
        settings: { displayMode: "overlay", theme: "dark" },
      });
      toast.success(t("تم تفعيل الاشتراك بنجاح!", "Subscription activated!"));
      setTimeout(() => router.push("/vault?subscribed=true"), 500);
    } catch {
      toast.error(t("تعذّر فتح نافذة الدفع", "Could not open checkout"));
    } finally {
      setLoadingPlan(null);
    }
  }

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
              {t("أسعار بسيطة وشفافة", "Simple, transparent pricing")}
            </h2>
            <p className="text-xl text-slate-400">
              {t("ابدأ مجاناً. طوّر عندما تكون مستعداً.", "Start free. Upgrade when you're ready.")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.nameEn}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className="relative"
              >
                {plan.highlight && (
                  <div className="absolute -inset-0.5 power-gradient rounded-[1.3rem] blur opacity-40 animate-soft-pulse" />
                )}
                <div
                  className={`relative rounded-2xl p-8 h-full flex flex-col ${
                    plan.highlight
                      ? "bg-slate-950 border border-[#2552ca]"
                      : "bg-white/5 border border-white/10 hover:border-[#2552ca] hover:bg-white/10 transition-all duration-300"
                  }`}
                >
                  {plan.highlight && plan.badge && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#ad1d7f] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                      {t(plan.badge.ar, plan.badge.en)}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-headline font-bold mb-0.5">
                      {t(plan.nameAr, plan.nameEn)}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                      {t(plan.taglineAr, plan.taglineEn)}
                    </p>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-slate-400 text-sm">{t("ر.س", "SAR")}</span>
                      <span className="text-slate-500 text-sm">{t(plan.periodAr, plan.periodEn)}</span>
                    </div>
                    {(plan.priceNoteAr ?? plan.priceNoteEn) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {t(plan.priceNoteAr ?? "", plan.priceNoteEn ?? "")}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {(isArabic ? plan.featuresAr : plan.featuresEn).map((f: string) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className={`text-base mt-0.5 ${plan.highlight ? "text-[#ad1d7f]" : "text-[#2552ca]"}`}>✓</span>
                        <span className="text-sm text-slate-200">{f}</span>
                      </li>
                    ))}
                    {(isArabic ? plan.disabledAr : plan.disabledEn).map((f: string) => (
                      <li key={f} className="flex items-start gap-3 text-slate-600">
                        <span className="text-base mt-0.5">✕</span>
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loadingPlan === plan.nameEn}
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-4 rounded-full font-bold transition-all disabled:opacity-60 ${
                      plan.highlight
                        ? "power-gradient text-white shadow-xl btn-glow"
                        : "border border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    {loadingPlan === plan.nameEn
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("جاري...", "Loading...")}</span>
                      : t(plan.cta.ar, plan.cta.en)
                    }
                  </motion.button>
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
