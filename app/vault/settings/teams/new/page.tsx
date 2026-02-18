"use client";

import { useState, useEffect } from "react";
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
import { createTeam } from "@/app/actions/teams";
import { useLanguage } from "@/components/language-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewTeamPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { subscriptionType, loading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  // Check if user has permission to create teams (must have team or company subscription)
  useEffect(() => {
    if (!subscriptionLoading && subscriptionType === "individual") {
      setError(t(
        "يتطلب اشتراك في باقة فريق أو شركات",
        "Requires Team or Company subscription"
      ));
    }
  }, [subscriptionType, subscriptionLoading, t]);

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      // Auto-generate slug from name
      slug: name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify subscription again before creating
    if (subscriptionType === "individual") {
      setError(t(
        "يتطلب اشتراك في باقة فريق أو شركات",
        "Requires Team or Company subscription"
      ));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await createTeam(formData.name, formData.slug);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Redirect to team settings page
      router.push(`/vault/settings/teams/${result.data?.id}`);
    } catch (err) {
      console.error("Team creation error:", err);
      setError(t("حدث خطأ غير متوقع", "An unexpected error occurred"));
      setLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            {t("← رجوع", "← Back")}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {t("إنشاء فريق جديد", "Create New Team")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(
              "أنشئ مساحة عمل مشتركة لفريقك مع لوحة كانبان وإدارة المهام",
              "Create a shared workspace with Kanban board and task management",
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <CardTitle>{t("تفاصيل الفريق", "Team Details")}</CardTitle>
                  <CardDescription>
                    {subscriptionType === "team"
                      ? t("باقة فريق: حتى ١٠ مستخدمين", "Team Plan: Up to 10 users")
                      : t("باقة شركات: مستخدمين غير محدودين", "Company Plan: Unlimited users")}
                  </CardDescription>
                </div>
              </div>
              <div className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full">
                {t(subscriptionType === "team" ? "فريق" : "شركة", subscriptionType === "team" ? "Team" : "Company")}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {subscriptionType === "individual" && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">
                    {t("نطاق محدود", "Limited Access")}
                  </p>
                  <p className="text-xs text-destructive/90">
                    {t(
                      "يتطلب اشتراك في باقة فريق أو شركات لإنشاء فرق. انتقل إلى الترقية.",
                      "Requires Team or Company subscription. Upgrade to create teams."
                    )}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/pricing")}
                  >
                    {t("عرض الباقات", "View Plans")}
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" disabled={subscriptionType === "individual"}>
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("اسم الفريق", "Team Name")} *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("مثال: فريق التطوير", "e.g., Development Team")}
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={loading || subscriptionType === "individual"}
                  className="text-base"
                />
              </div>

              {/* Team Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  {t("معرف الفريق (URL)", "Team Slug (URL)")} *
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    thakirni.com/team/
                  </span>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="dev-team"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    disabled={loading || subscriptionType === "individual"}
                    pattern="[a-z0-9-]+"
                    title={t(
                      "حروف صغيرة وأرقام وشرطات فقط",
                      "Lowercase letters, numbers, and hyphens only",
                    )}
                    className="text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "سيتم استخدامه في رابط فريقك",
                    "Will be used in your team's URL",
                  )}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  {t("إلغاء", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || subscriptionType === "individual"}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {t("جاري الإنشاء...", "Creating...")}
                    </>
                  ) : (
                    t("إنشاء الفريق", "Create Team")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
