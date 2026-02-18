"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

export default function CheckoutIndividualPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, just collect email - no actual payment processing
      // This simulates a waitlist/email collection
      if (!formData.email || !formData.fullName) {
        toast.error(t("يرجى ملء جميع الحقول", "Please fill all fields"));
        setLoading(false);
        return;
      }

      // Simulate storing email in waitlist
      console.log("[v0] Email collected for Individual plan:", formData);
      
      setSubmitted(true);
      toast.success(t("شكراً على اهتمامك!", "Thank you for your interest!"));

      // Redirect to auth or vault after 2 seconds
      setTimeout(() => {
        router.push("/auth?plan=individual");
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(t("حدث خطأ", "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("تم التسجيل بنجاح!", "Registered Successfully!")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t(
                "سيتم توجيهك قريباً...",
                "You'll be redirected shortly..."
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("باقة الأفراد", "Individual Plan")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "29 ريال / شهر",
              "29 SAR / month"
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("أكمل التسجيل", "Complete Registration")}</CardTitle>
            <CardDescription>
              {t(
                "سنبدأ بجمع بيانات الاتصال الخاصة بك",
                "We'll start with your contact information"
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {t("الاسم الكامل", "Full Name")} *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("محمد أحمد", "Mohammed Ahmed")}
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("البريد الإلكتروني", "Email")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              {/* Info Message */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t(
                    "نحن في مرحلة مبكرة. سيتم تفعيل الدفع قريباً.",
                    "We're in beta. Payment processing will be enabled soon."
                  )}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("جاري...", "Processing...")}
                  </>
                ) : (
                  t("تابع", "Continue")
                )}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => router.back()}
                className="w-full"
              >
                {t("رجوع", "Back")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground mb-3">
            {t("ما تحصل عليه:", "What's Included:")}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("رسائل وملاحظات صوتية غير محدودة", "Unlimited messages & voice notes")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("حفظ الذكريات", "Memory saving & organization")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("مساعد ذكي", "AI assistant")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
