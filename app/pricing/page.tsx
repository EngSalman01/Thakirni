"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Check, X, Sparkles, Building2, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function PricingPage() {
  const { t, isArabic } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingTiers = [
    {
      id: "free",
      nameAr: "الباقة المجانية",
      nameEn: "Free",
      targetAr: "للطلاب والمستخدمين الخفيفين",
      targetEn: "Students & Light Users",
      price: "0",
      priceAnnual: "0",
      icon: Zap,
      features: [
        { ar: "٥٠ رسالة / شهرياً", en: "50 Messages/month", included: true },
        {
          ar: "استخدام بوت الواتساب",
          en: "WhatsApp Bot Access",
          included: true,
        },
        {
          ar: "احتفاظ بالذاكرة ٧ أيام",
          en: "7-day history retention",
          included: true,
        },
        { ar: "مستخدم واحد", en: "Single User", included: true },
        { ar: "تحليل الذكاء الاصطناعي", en: "AI Analysis", included: false },
        { ar: "مزامنة التقويم", en: "Calendar Sync", included: false },
      ],
      ctaAr: "ابدأ مجاناً",
      ctaEn: "Start Free",
      buttonVariant: "outline",
      popular: false,
    },
    {
      id: "individual",
      nameAr: "باقة الأفراد",
      nameEn: "Individual",
      targetAr: "للمحترفين والمستقلين",
      targetEn: "Professionals & Freelancers",
      price: "29",
      priceAnnual: "290", // 29 * 12 = 348, saving ~17% by paying 290. Prompt says "290/year".
      icon: User,
      features: [
        {
          ar: "رسائل وملاحظات صوتية غير محدودة",
          en: "Unlimited Messages & Voice Notes",
          included: true,
        },
        {
          ar: 'تحليل "الدماغ الثاني" بالذكاء الاصطناعي',
          en: '"Second Brain" AI Analysis',
          included: true,
        },
        {
          ar: "مزامنة التقويم والمهام",
          en: "Calendar & Task Sync",
          included: true,
        },
        { ar: "بحث كامل في الذاكرة", en: "Full Memory Search", included: true },
        { ar: "دعم فني عبر البريد", en: "Email Support", included: true },
      ],
      ctaAr: "اشترك الآن",
      ctaEn: "Subscribe Now",
      buttonVariant: "emerald", // Custom logic below
      popular: true,
    },
    {
      id: "companies",
      nameAr: "باقة الشركات",
      nameEn: "Companies",
      targetAr: "للشركات والفرق الناشئة",
      targetEn: "Teams & Startups",
      price: "99",
      priceAnnual: "990",
      priceSuffixAr: "/ مستخدم",
      priceSuffixEn: "/ user",
      icon: Building2,
      features: [
        {
          ar: "كل مميزات الأفراد",
          en: "Everything in Individual",
          included: true,
        },
        {
          ar: "لوحة تحكم لإدارة الفريق",
          en: "Admin Dashboard for Team Management",
          included: true,
        },
        {
          ar: "قاعدة معرفة مشتركة (دماغ الشركة)",
          en: "Shared Knowledge Base (Company Brain)",
          included: true,
        },
        {
          ar: "دعم ذو أولوية واتفاقية مستوى خدمة",
          en: "Priority Support & SLA",
          included: true,
        },
        { ar: "دخول عبر API", en: "API Access", included: true },
      ],
      ctaAr: "تواصل مع المبيعات",
      ctaEn: "Contact Sales",
      buttonVariant: "secondary",
      popular: false,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <section className="pt-32 pb-20 overflow-hidden relative">
        {/* Background acccents */}
        <div className="absolute top-20 start-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 end-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t("خـطط مرنة تناسب طموحك", "Flexible Plans for Your Ambition")}
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
              {t(
                "سواء كنت فرداً يريد تنظيم حياته أو شركة تبحث عن ذكاء جماعي، لدينا ما يناسبك.",
                "Whether you're an individual organizing your life or a company seeking collective intelligence, we have you covered.",
              )}
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span
                className={cn(
                  "text-sm transition-colors",
                  !isAnnual ? "text-white font-medium" : "text-zinc-500",
                )}
              >
                {t("شهري", "Monthly")}
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span
                className={cn(
                  "text-sm transition-colors",
                  isAnnual ? "text-white font-medium" : "text-zinc-500",
                )}
              >
                {t("سنوي", "Yearly")}
                <span className="ms-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {t("وفر ٢٠٪", "Save 20%")}
                </span>
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start"
          >
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="h-full"
              >
                <Card
                  className={cn(
                    "relative h-full flex flex-col transition-all duration-300 border",
                    tier.popular
                      ? "bg-zinc-900/40 backdrop-blur-md border-emerald-500/50 shadow-2xl shadow-emerald-900/20"
                      : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700",
                  )}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <div className="bg-emerald-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t("الأكثر شعبية", "Most Popular")}
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-2xl font-bold text-white mb-1">
                          {t(tier.nameAr, tier.nameEn)}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {t(tier.targetAr, tier.targetEn)}
                        </CardDescription>
                      </div>
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          tier.popular
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-zinc-800 text-zinc-400",
                        )}
                      >
                        <tier.icon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        {isAnnual ? tier.priceAnnual : tier.price}
                      </span>
                      <span className="text-emerald-500 text-xl font-bold">
                        {t("ر.س", "SAR")}
                      </span>
                      <span className="text-zinc-500 text-sm ms-2">
                        {tier.priceSuffixAr &&
                          t(tier.priceSuffixAr, tier.priceSuffixEn)}
                        / {isAnnual ? t("سنة", "year") : t("شهر", "month")}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="w-full h-px bg-zinc-800 mb-6" />
                    <ul className="space-y-4">
                      {tier.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          {feature.included ? (
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0">
                              <X className="w-4 h-4 text-zinc-700" />
                            </div>
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              feature.included
                                ? "text-zinc-300"
                                : "text-zinc-600",
                            )}
                          >
                            {t(feature.ar, feature.en)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className={cn(
                        "w-full h-12 text-base font-medium rounded-xl transition-all duration-300",
                        tier.buttonVariant === "emerald"
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:shadow-lg hover:shadow-emerald-500/20"
                          : tier.buttonVariant === "outline"
                            ? "bg-transparent border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
                            : "bg-zinc-800 text-white hover:bg-zinc-700",
                      )}
                    >
                      {t(tier.ctaAr, tier.ctaEn)}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ / Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 border-t border-zinc-800 pt-10"
          >
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                {
                  labelAr: "ضمان استرداد ٣٠ يوم",
                  labelEn: "30-Day Money Back",
                  icon: Sparkles,
                },
                {
                  labelAr: "دعم فني على مدار الساعة",
                  labelEn: "24/7 Support",
                  icon: User,
                },
                {
                  labelAr: "إلغاء في أي وقت",
                  labelEn: "Cancel Anytime",
                  icon: X,
                },
                {
                  labelAr: "بياناتك آمنة ومحفوظة",
                  labelEn: "Secure Data",
                  icon: Check,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 text-zinc-500"
                >
                  <item.icon className="w-5 h-5 mb-1 text-emerald-500/50" />
                  <span className="text-sm">
                    {t(item.labelAr, item.labelEn)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
