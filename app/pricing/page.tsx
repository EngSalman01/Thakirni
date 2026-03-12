"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Check, X, Sparkles, User, Zap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { Switch } from "@/components/ui/switch";

// ── Animation Variants ────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type TierId = "free" | "individual" | "team";

interface Feature {
  ar: string;
  en: string;
  included: boolean;
}

interface PricingTier {
  id: TierId;
  nameAr: string;
  nameEn: string;
  targetAr: string;
  targetEn: string;
  /** Monthly price in SAR */
  monthlyPrice: number;
  /** Annual price in SAR (total for the year) */
  annualPrice: number;
  icon: React.ElementType;
  features: Feature[];
  ctaAr: string;
  ctaEn: string;
  popular: boolean;
  /** Show "coming soon" overlay */
  comingSoon?: boolean;
  /** Extra pricing note shown after the amount */
  noteSuffixAr?: string;
  noteSuffixEn?: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    nameAr: "الباقة المجانية",
    nameEn: "Free",
    targetAr: "للطلاب والمستخدمين الخفيفين",
    targetEn: "Students & Light Users",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    features: [
      { ar: "٥٠ رسالة / شهرياً", en: "50 messages / month", included: true },
      { ar: "مساعد ذكي أساسي", en: "Basic AI assistant", included: true },
      { ar: "احتفاظ بالذاكرة ٧ أيام", en: "7-day history retention", included: true },
      { ar: "مستخدم واحد", en: "Single user", included: true },
      { ar: "تحليل الذكاء الاصطناعي", en: "AI analysis", included: false },
      { ar: "مزامنة التقويم", en: "Calendar sync", included: false },
    ],
    ctaAr: "ابدأ مجاناً",
    ctaEn: "Start Free",
    popular: false,
  },
  {
    id: "individual",
    nameAr: "باقة الأفراد",
    nameEn: "Individual",
    targetAr: "للمحترفين والمستقلين",
    targetEn: "Professionals & Freelancers",
    monthlyPrice: 29,
    annualPrice: 278,   // 29 × 12 × 0.8 = ~278  →  true 20% saving
    icon: User,
    features: [
      { ar: "رسائل وملاحظات صوتية غير محدودة", en: "Unlimited messages & voice notes", included: true },
      { ar: "حفظ الذاكرة وتنظيمها", en: "Memory saving & organisation", included: true },
      { ar: "مساعد ذكي للملاحظات والتذكيرات", en: "AI assistant for notes & reminders", included: true },
      { ar: "مزامنة التقويم والمهام الشخصية", en: "Personal calendar & task sync", included: true },
      { ar: "بحث كامل في الذاكرة", en: "Full memory search", included: true },
      { ar: "دعم فني عبر البريد", en: "Email support", included: true },
    ],
    ctaAr: "اشترك الآن",
    ctaEn: "Subscribe Now",
    popular: true,
  },
  {
    id: "team",
    nameAr: "باقة الفرق",
    nameEn: "Team",
    targetAr: "للفرق والمشاريع الصغيرة",
    targetEn: "Teams & Small Projects",
    monthlyPrice: 79,
    annualPrice: 758,   // 79 × 12 × 0.8 = ~758
    icon: Users,
    noteSuffixAr: "حتى ١٠ مستخدمين",
    noteSuffixEn: "up to 10 users",
    features: [
      { ar: "كل مميزات الأفراد", en: "Everything in Individual", included: true },
      { ar: "لوحة كانبان لإدارة المشاريع", en: "Kanban board for project management", included: true },
      { ar: "إدارة المهام والتعيين", en: "Task management & assignment", included: true },
      { ar: "ذاكرة جماعية للفريق", en: "Shared team memory", included: true },
      { ar: "تذكيرات جماعية", en: "Team reminders", included: true },
      { ar: "دعم فني ذو أولوية", en: "Priority support", included: true },
    ],
    ctaAr: "ابدأ الآن",
    ctaEn: "Get Started",
    popular: false,
    comingSoon: true,
  },
];

// ── Trust Badges ──────────────────────────────────────────────────────────────

const trustBadges = [
  { ar: "ضمان استرداد ٣٠ يوم", en: "30-day money back", icon: Sparkles },
  { ar: "دعم فني على مدار الساعة", en: "24 / 7 support", icon: User },
  { ar: "إلغاء في أي وقت", en: "Cancel anytime", icon: X },
  { ar: "بياناتك آمنة ومحفوظة", en: "Secure data", icon: Shield },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<TierId | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function displayedPrice(tier: PricingTier): string {
    if (tier.monthlyPrice === 0) return "0";
    if (isAnnual) {
      // Show effective monthly cost when billed annually
      return Math.round(tier.annualPrice / 12).toString();
    }
    return tier.monthlyPrice.toString();
  }

  function annualSaving(tier: PricingTier): number {
    return Math.round(100 - (tier.annualPrice / (tier.monthlyPrice * 12)) * 100);
  }

  // ── Subscribe handler ─────────────────────────────────────────────────────

  async function handleSubscribe(tierId: TierId) {
    if (loading) return;
    setLoading(tierId);

    const destinations: Record<TierId, string> = {
      free: "/auth",
      individual: "/checkout/individual",
      team: "/checkout/team",
    };

    // Small delay so the spinner is visible before navigation
    await new Promise((r) => setTimeout(r, 400));
    router.push(destinations[tierId]);
    // Don't reset loading — navigation will unmount the component
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />

      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 start-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 end-1/4 w-96 h-96 bg-emerald-500/5  rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
              {t("خـطط مرنة تناسب طموحك", "Flexible Plans for Your Ambition")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              {t(
                "سواء كنت فرداً يريد تنظيم حياته أو فريقاً يبحث عن ذكاء جماعي، لدينا ما يناسبك.",
                "Whether you're an individual organising your life or a team seeking collective intelligence, we have you covered.",
              )}
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 bg-muted/50 border border-border rounded-full px-5 py-2.5">
              <span className={cn("text-sm transition-colors", !isAnnual ? "text-foreground font-medium" : "text-muted-foreground")}>
                {t("شهري", "Monthly")}
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className={cn("text-sm transition-colors flex items-center gap-2", isAnnual ? "text-foreground font-medium" : "text-muted-foreground")}>
                {t("سنوي", "Yearly")}
                <span className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  {t("وفر ٢٠٪", "Save 20%")}
                </span>
              </span>
            </div>
          </motion.div>

          {/* ── Cards ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch"
          >
            {pricingTiers.map((tier) => (
              <motion.div key={tier.id} variants={cardVariants} className="h-full">
                <Card
                  className={cn(
                    "relative h-full flex flex-col transition-all duration-300 border overflow-hidden rounded-2xl",
                    tier.popular
                      ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-2xl shadow-emerald-500/15 lg:scale-105"
                      : "border-border hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
                  )}
                >

                  {/* ── Coming Soon Overlay ── */}
                  {tier.comingSoon && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-2xl">
                      <div className="bg-muted border border-border rounded-xl px-6 py-5 text-center shadow-xl">
                        <p className="text-lg font-bold text-foreground mb-1">
                          {t("قريباً", "Coming Soon")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("قيد التطوير", "Under development")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Popular Badge ── */}
                  {tier.popular && (
                    <div className="absolute -top-px inset-x-0 flex justify-center">
                      <div className="bg-emerald-500 text-white px-4 py-1 rounded-b-full text-xs font-semibold flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3" />
                        {t("الأكثر شعبية", "Most Popular")}
                      </div>
                    </div>
                  )}

                  {/* ── Header ── */}
                  <CardHeader className={cn("pb-4 pt-8 px-6", tier.comingSoon && "opacity-40")}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground mb-1">
                          {t(tier.nameAr, tier.nameEn)}
                        </CardTitle>
                        <CardDescription>
                          {t(tier.targetAr, tier.targetEn)}
                        </CardDescription>
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg",
                        tier.popular
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}>
                        <tier.icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-4xl font-bold text-foreground tabular-nums">
                        {displayedPrice(tier)}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-lg font-semibold">
                        {t("ر.س", "SAR")}
                      </span>
                      <span className="text-muted-foreground text-sm ms-1">
                        / {t("شهر", "month")}
                      </span>
                    </div>

                    {/* Annual note */}
                    <div className="min-h-[1.25rem] mt-1">
                      {isAnnual && tier.monthlyPrice > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {t(
                            `يُفوتر ${tier.annualPrice} ر.س سنوياً`,
                            `Billed ${tier.annualPrice} SAR / year`,
                          )}
                          {" · "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {t(`وفر ${annualSaving(tier)}٪`, `Save ${annualSaving(tier)}%`)}
                          </span>
                        </p>
                      ) : tier.noteSuffixEn ? (
                        <p className="text-xs text-muted-foreground">
                          {t(tier.noteSuffixAr ?? "", tier.noteSuffixEn)}
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>

                  {/* ── Features ── */}
                  <div className={cn("flex flex-col flex-1", tier.comingSoon && "opacity-40 pointer-events-none")}>
                    <CardContent className="flex-1 px-6 pt-2">
                      <div className="w-full h-px bg-border mb-5" />
                      <ul className="space-y-3.5">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            {feature.included ? (
                              <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : (
                              <div className="mt-0.5 w-5 h-5 flex items-center justify-center shrink-0">
                                <X className="w-4 h-4 text-muted-foreground/40" />
                              </div>
                            )}
                            <span className={cn(
                              "text-sm leading-snug",
                              feature.included ? "text-foreground/90" : "text-muted-foreground/60",
                            )}>
                              {t(feature.ar, feature.en)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    {/* ── CTA ── */}
                    <CardFooter className="px-6 pb-7 pt-5">
                      <Button
                        className={cn(
                          "w-full h-11 text-sm font-medium rounded-xl transition-all duration-200",
                          tier.popular
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : tier.id === "free"
                              ? "variant-secondary"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                        disabled={!!tier.comingSoon || loading === tier.id}
                        onClick={() => handleSubscribe(tier.id)}
                        variant={tier.popular || tier.id === "team" ? "default" : "secondary"}
                      >
                        {loading === tier.id ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t("جاري...", "Loading...")}
                          </span>
                        ) : (
                          t(tier.ctaAr, tier.ctaEn)
                        )}
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Trust badges ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-20 border-t border-border pt-10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
              {trustBadges.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                    <item.icon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium leading-snug">
                    {t(item.ar, item.en)}
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