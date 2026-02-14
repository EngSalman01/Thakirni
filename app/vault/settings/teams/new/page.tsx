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
import { createTeam } from "@/app/actions/teams";
import { useLanguage } from "@/components/language-provider";
import { Building2, Loader2 } from "lucide-react";

export default function NewTeamPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

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
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

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
              "أنشئ مساحة عمل مشتركة لفريقك",
              "Create a shared workspace for your team",
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <CardTitle>{t("تفاصيل الفريق", "Team Details")}</CardTitle>
                <CardDescription>
                  {t(
                    "باقة مبتدئ: حتى ٥ مستخدمين",
                    "Starter Plan: Up to 5 users",
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("اسم الفريق", "Team Name")} *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("مثال: شركة الأحلام", "e.g., Dream Company")}
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={loading}
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
                    placeholder="dream-company"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    disabled={loading}
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
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
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
