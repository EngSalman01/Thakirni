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

export default function CheckoutTeamPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    teamName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.email || !formData.fullName || !formData.teamName) {
        toast.error(t("يرجى ملء جميع الحقول", "Please fill all fields"));
        setLoading(false);
        return;
      }

      // Simulate storing team info in waitlist
      console.log("[v0] Team signup collected:", formData);
      
      setSubmitted(true);
      toast.success(t("شكراً على اهتمامك!", "Thank you for your interest!"));

      // Redirect to auth after 2 seconds
      setTimeout(() => {
        router.push("/auth?plan=team");
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
            {t("باقة الفريق", "Team Plan")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "79 ريال / شهر (حتى ١٠ مستخدمين)",
              "79 SAR / month (Up to 10 users)"
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("إنشاء فريقك", "Create Your Team")}</CardTitle>
            <CardDescription>
              {t(
                "أخبرنا عن فريقك وسنبدأ من هناك",
                "Tell us about your team and we'll get started"
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

              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">
                  {t("اسم الفريق", "Team Name")} *
                </Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder={t("فريق التطوير", "Development Team")}
                  value={formData.teamName}
                  onChange={(e) =>
                    setFormData({ ...formData, teamName: e.target.value })
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
                  t("إنشاء الفريق", "Create Team")
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
              <span>{t("لوحة كانبان", "Kanban board")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("إدارة المهام", "Task management")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("ذاكرة جماعية", "Shared memory")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("حتى ١٠ مستخدمين", "Up to 10 users")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
