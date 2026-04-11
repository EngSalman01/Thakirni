"use client";

import { useState, useEffect, useRef } from "react";
import type { Paddle } from "@paddle/paddle-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import type { PlanTier } from "@/hooks/use-subscription";

const PRO_MONTHLY_PRICE_ID     = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY!;
const STUDENT_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDENT_MONTHLY!;
const TEAMS_MONTHLY_PRICE_ID   = process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY!;

interface PlanCard {
  id: PlanTier;
  nameEn: string;
  nameAr: string;
  price: string;
  noteSuffixEn?: string;
  noteSuffixAr?: string;
  badge?: string;
  features: { en: string; ar: string }[];
  accent: string;
}

const PLANS: PlanCard[] = [
  {
    id: "free",
    nameEn: "Free",
    nameAr: "مجاني",
    price: "0 SAR/mo",
    accent: "#64748b",
    features: [
      { en: "10 plans per day", ar: "١٠ خطط يومياً" },
      { en: "25 memories", ar: "٢٥ ذاكرة" },
      { en: "1 project", ar: "١ مشروع" },
      { en: "Basic AI chat", ar: "محادثة AI أساسية" },
    ],
  },
  {
    id: "student",
    nameEn: "Student 🎓",
    nameAr: "طالب 🎓",
    price: "19 SAR/mo",
    badge: "30-Day Trial",
    accent: "#10b981",
    features: [
      { en: "50 plans per day", ar: "٥٠ خطة يومياً" },
      { en: "200 memories", ar: "٢٠٠ ذاكرة" },
      { en: "3 projects", ar: "٣ مشاريع" },
      { en: "10 study templates 📚", ar: "١٠ قوالب دراسية 📚" },
      { en: "Assignment & exam tracking", ar: "تتبع الواجبات والاختبارات" },
    ],
  },
  {
    id: "pro",
    nameEn: "Pro",
    nameAr: "برو",
    price: "29.99 SAR/mo",
    badge: "Most Popular",
    accent: "#D97706",
    features: [
      { en: "100 plans per day", ar: "١٠٠ خطة يومياً" },
      { en: "1,000 memories", ar: "١٠٠٠ ذاكرة" },
      { en: "10 projects", ar: "١٠ مشاريع" },
      { en: "30 meeting summaries/month", ar: "٣٠ ملخص اجتماع شهرياً" },
      { en: "Analytics & reports", ar: "تحليلات وتقارير" },
    ],
  },
  {
    id: "teams",
    nameEn: "Teams",
    nameAr: "فرق",
    price: "59.99 SAR/mo",
    noteSuffixEn: "per user",
    noteSuffixAr: "لكل مستخدم",
    accent: "#F59E0B",
    features: [
      { en: "500 plans per day", ar: "٥٠٠ خطة يومياً" },
      { en: "10,000 memories", ar: "١٠٠٠٠ ذاكرة" },
      { en: "50 projects", ar: "٥٠ مشروعاً" },
      { en: "60 meeting summaries/month", ar: "٦٠ ملخص اجتماع شهرياً" },
      { en: "Shared memories & notes", ar: "ذكريات وملاحظات مشتركة" },
      { en: "Priority support", ar: "دعم فني ذو أولوية" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  currentTier: PlanTier;
  userEmail: string;
  onUpgradeComplete: (newTier: PlanTier) => void;
}

export function BillingModal({ open, onClose, currentTier, userEmail, onUpgradeComplete }: Props) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState<PlanTier | null>(null);
  const [processing, setProcessing] = useState<PlanTier | null>(null);
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({ student: 19, pro: 29.99, teams: 59.99 });
  const paddleRef = useRef<Paddle | null>(null);

  useEffect(() => {
    import("@paddle/paddle-js").then(({ initializePaddle }) => {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "production" | "sandbox") ?? "production",
        eventCallback(event) {
          if (event.name === "checkout.completed") {
            const planId = (paddleRef.current as any)?._pendingPlanId as "student" | "pro" | "teams" | undefined;
            if (!planId) return;
            const appliedCode = (paddleRef.current as any)?._pendingPromoCode as string | undefined;
            if (appliedCode) {
              fetch("/api/discount-codes/use", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: appliedCode }),
              }).catch((e) => console.error("[billing-modal] promo tracking error:", e));
            }
            onUpgradeComplete(planId);
            onClose();
            const planNameAr = planId === "pro" ? "برو" : planId === "student" ? "طالب" : "فرق";
            const planNameEn = planId === "pro" ? "Pro" : planId === "student" ? "Student" : "Teams";
            toast.success(t(`أنت الآن على خطة ${planNameAr}! 🎉`, `You're now on the ${planNameEn} plan! 🎉`));
          }
        },
      }).then((p) => { paddleRef.current = p ?? null; });
    });
  }, []);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data: Array<{ plan_key: string; price_sar: number }>) => {
        const prices: Record<string, number> = {};
        for (const p of data) prices[p.plan_key] = p.price_sar;
        setPlanPrices((prev) => ({ ...prev, ...prices }));
      })
      .catch((e) => console.error("[billing-modal] plan prices fetch error:", e));
  }, []);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  async function applyPromoCode(planId: "student" | "pro" | "teams") {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, planKey: planId }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ code: code.toUpperCase(), discountPercent: data.discountPercent });
        toast.success(t(`تم تطبيق الكود! خصم ${data.discountPercent}%`, `Code applied! ${data.discountPercent}% off`));
      } else {
        toast.error(data.message ?? t("كود غير صالح", "Invalid code"));
      }
    } catch {
      toast.error(t("تعذّر التحقق من الكود", "Could not validate code"));
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleUpgrade(planId: "student" | "pro" | "teams") {
    const priceId =
      planId === "pro" ? PRO_MONTHLY_PRICE_ID :
      planId === "student" ? STUDENT_MONTHLY_PRICE_ID :
      TEAMS_MONTHLY_PRICE_ID;
    if (!priceId) { toast.error("Price ID not configured"); return; }
    if (!paddleRef.current) { toast.error(t("جارٍ التحميل، حاول مرة أخرى", "Still loading, try again")); return; }

    const appliedCode = promoApplied?.code;
    (paddleRef.current as any)._pendingPlanId = planId;
    (paddleRef.current as any)._pendingPromoCode = appliedCode;

    setProcessing(planId);
    try {
      await paddleRef.current.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        ...(appliedCode ? { discountCode: appliedCode } : {}),
        settings: { displayMode: "overlay", theme: "dark" },
      });
    } catch (err) {
      console.error("[BillingModal] checkout error:", err);
      toast.error(t("تعذّر فتح نافذة الدفع", "Could not open checkout"));
    } finally {
      setProcessing(null);
    }
  }

  async function handleDowngrade() {
    setProcessing("free");
    try {
      const res = await fetch("/api/subscriptions/downgrade", { method: "POST" });
      if (!res.ok) throw new Error("Downgrade failed");
      onUpgradeComplete("free");
      onClose();
      toast.success(t(
        "تم تأكيد التخفيض. ستتغير خطتك في نهاية فترة الفوترة.",
        "Downgrade confirmed. Your plan changes at period end."
      ));
    } catch {
      toast.error(t("فشل التخفيض، حاول مرة أخرى", "Downgrade failed, please try again"));
    } finally {
      setProcessing(null);
      setConfirming(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirming(null); onClose(); } }}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold">
            {t("اختر خطتك", "Choose your plan")}
          </DialogTitle>
        </DialogHeader>

        {/* Downgrade confirmation */}
        {confirming === "free" ? (
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t(
                "هل أنت متأكد؟ ستفقد الوصول إلى الميزات المدفوعة في نهاية فترة الفوترة.",
                "Are you sure? You'll lose access to paid features at the end of your billing period."
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirming(null)} className="rounded-xl">
                {t("إلغاء", "Cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDowngrade}
                disabled={processing === "free"}
                className="rounded-xl"
              >
                {processing === "free" ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {t("تأكيد التخفيض", "Confirm Downgrade")}
              </Button>
            </div>
          </div>
        ) : (
          <>
          {/* Promo code */}
          <div className="flex gap-2 mt-3">
            {promoApplied ? (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm">
                <Tag className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-green-700 font-medium flex-1">
                  {promoApplied.code} — {promoApplied.discountPercent}% {t("خصم", "off")}
                </span>
                <button onClick={() => { setPromoApplied(null); setPromoInput(""); }} className="text-green-500 hover:text-green-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder={t("كود الخصم", "Promo code")}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyPromoCode(currentTier !== "free" ? currentTier as "student" | "pro" | "teams" : "pro")}
                  className="rounded-xl font-mono uppercase text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPromoCode(currentTier !== "free" ? currentTier as "student" | "pro" | "teams" : "pro")}
                  disabled={promoLoading || !promoInput.trim()}
                  className="rounded-xl shrink-0 px-4"
                >
                  {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("تطبيق", "Apply")}
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {PLANS.map((plan) => {
              const tierOrder: Record<string, number> = { free: 0, student: 1, pro: 2, teams: 3 };
              const currentOrder = tierOrder[currentTier] ?? 0;
              const planOrder = tierOrder[plan.id] ?? 0;
              const isCurrent = plan.id === currentTier;
              const isUpgrade = !isCurrent && planOrder > currentOrder;
              const isDowngrade = !isCurrent && planOrder < currentOrder;

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border p-5 flex flex-col gap-4 relative"
                  style={{ borderColor: isCurrent ? plan.accent : undefined }}
                >
                  {plan.badge && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                      style={{ background: plan.accent }}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <p className="font-headline font-bold text-base text-foreground">{t(plan.nameAr, plan.nameEn)}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: plan.accent }}>
                      {plan.id === "free" ? plan.price : `${planPrices[plan.id] ?? (plan.id === "student" ? 19 : plan.id === "pro" ? 29.99 : 59.99)} SAR/mo`}
                      {plan.noteSuffixEn && (
                        <span className="text-xs text-slate-400 font-normal ms-1">
                          {t(plan.noteSuffixAr!, plan.noteSuffixEn)}
                        </span>
                      )}
                    </p>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: plan.accent }} />
                        {t(f.ar, f.en)}
                      </li>
                    ))}
                  </ul>

                  {isCurrent && (
                    <Button disabled variant="outline" className="w-full rounded-xl text-slate-400 border-border">
                      {t("خطتك الحالية", "Current Plan")}
                    </Button>
                  )}
                  {isUpgrade && plan.id !== "free" && (
                    <Button
                      onClick={() => handleUpgrade(plan.id as "student" | "pro" | "teams")}
                      disabled={!!processing}
                      className="w-full rounded-xl text-white font-bold"
                      style={{ background: `linear-gradient(135deg, #D97706, ${plan.accent})` }}
                    >
                      {processing === plan.id ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                      {t(`ترقية إلى ${t(plan.nameAr, plan.nameEn)}`, `Upgrade to ${plan.nameEn}`)}
                    </Button>
                  )}
                  {isDowngrade && (
                    <Button
                      variant="outline"
                      onClick={() => plan.id === "free" ? setConfirming("free") : handleUpgrade("pro")}
                      disabled={!!processing}
                      className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {t(`التخفيض إلى ${t(plan.nameAr, plan.nameEn)}`, `Downgrade to ${plan.nameEn}`)}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
