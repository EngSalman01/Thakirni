"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createTeam } from "@/app/actions/teams";
import { useLanguage } from "@/components/language-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import {
  Building2, ArrowLeft, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug from any string including Arabic.
 * Arabic text is transliterated via a simple map; fallback is a timestamp.
 */
function toSlug(input: string): string {
  const AR_MAP: Record<string, string> = {
    ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th",
    ج: "j", ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z",
    س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a",
    غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
    ه: "h", و: "w", ي: "y", ى: "a", ة: "h", ء: "", ئ: "y", ؤ: "w",
  };

  const transliterated = input
    .split("")
    .map((c) => AR_MAP[c] ?? c)
    .join("");

  const slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // strip non-alphanumeric (except spaces/hyphens)
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-{2,}/g, "-")          // collapse multiple hyphens
    .slice(0, 50);                   // max 50 chars

  // Fallback if result is empty (e.g. pure emoji input)
  return slug || `team-${Date.now().toString(36)}`;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,49}$/.test(slug);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-4 md:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewTeamPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { subscriptionType, isLoading: subscriptionLoading } = useSubscription();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false); // track if user manually edited slug
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation errors per field
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; slug?: string }>({});

  // ── Derived ────────────────────────────────────────────────────────────────

  const isTeamSubscription =
    subscriptionType === "team" || subscriptionType === "company";

  const canCreate = isTeamSubscription && !subscriptionLoading;

  // ── Sync slug with name (unless user has manually edited it) ───────────────

  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(toSlug(name));
    }
  }, [name, slugEdited]);

  // ── Validate fields ────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errs: { name?: string; slug?: string } = {};

    if (!name.trim()) {
      errs.name = t("اسم الفريق مطلوب", "Team name is required");
    } else if (name.trim().length < 2) {
      errs.name = t("الاسم قصير جداً", "Name is too short");
    } else if (name.trim().length > 60) {
      errs.name = t("الاسم طويل جداً (60 حرفاً كحد أقصى)", "Name is too long (max 60 chars)");
    }

    if (!slug) {
      errs.slug = t("معرّف الفريق مطلوب", "Team slug is required");
    } else if (!isValidSlug(slug)) {
      errs.slug = t(
        "أحرف صغيرة وأرقام وشرطات فقط، يبدأ بحرف أو رقم",
        "Lowercase letters, numbers, hyphens only. Must start with a letter or number.",
      );
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, slug, t]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    if (!validate()) return;

    setError("");
    setLoading(true);

    try {
      const result = await createTeam(name.trim(), slug);

      if (result.error) {
        // Slug taken is a common error — surface it on the field
        if (result.error.toLowerCase().includes("slug") ||
          result.error.toLowerCase().includes("already")) {
          setFieldErrors({ slug: t("هذا المعرّف مستخدم بالفعل", "This slug is already taken") });
        } else {
          setError(result.error);
        }
        return;
      }

      router.push(`/vault/settings/teams/${result.data?.id}`);
    } catch (err) {
      console.error("[NewTeam] error:", err);
      setError(t("حدث خطأ غير متوقع، حاول مرة أخرى", "An unexpected error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (subscriptionLoading) return <PageSkeleton />;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300 p-4 md:p-8">
        <div className="max-w-xl mx-auto">

          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6 -ms-2 gap-2"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("رجوع", "Back")}
          </Button>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("إنشاء فريق جديد", "Create New Team")}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t(
                "أنشئ مساحة عمل مشتركة مع لوحة كانبان وإدارة المهام",
                "Create a shared workspace with a Kanban board and task management",
              )}
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                      <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {t("تفاصيل الفريق", "Team Details")}
                      </CardTitle>
                      <CardDescription>
                        {subscriptionType === "team"
                          ? t("باقة الفرق: حتى ١٠ أعضاء", "Team plan: up to 10 members")
                          : subscriptionType === "company"
                            ? t("باقة الشركات: أعضاء غير محدودين", "Company plan: unlimited members")
                            : t("يتطلب ترقية الباقة", "Requires plan upgrade")}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Plan badge — only show for valid subscriptions */}
                  {isTeamSubscription && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full shrink-0">
                      {subscriptionType === "team"
                        ? t("فريق", "Team")
                        : t("شركة", "Company")}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>

                {/* Upgrade banner */}
                {!isTeamSubscription && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive mb-1">
                        {t("باقتك لا تدعم إنشاء الفرق", "Your plan doesn't support teams")}
                      </p>
                      <p className="text-xs text-destructive/80 mb-3">
                        {t(
                          "يتطلب إنشاء فريق الاشتراك في باقة الفرق أو الشركات.",
                          "Creating a team requires a Team or Company subscription.",
                        )}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/pricing")}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        {t("عرض الباقات", "View Plans")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Form — fieldset disabled blocks all inputs cleanly */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <fieldset disabled={!canCreate || loading} className="space-y-5 disabled:opacity-60">

                    {/* Team name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name">
                        {t("اسم الفريق", "Team Name")}
                        <span className="text-destructive ms-1">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("مثال: فريق التطوير", "e.g., Development Team")}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        maxLength={60}
                        className={cn(fieldErrors.name && "border-destructive")}
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground text-end">
                        {name.length}/60
                      </p>
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                      <Label htmlFor="slug">
                        {t("معرّف الفريق (URL)", "Team Slug (URL)")}
                        <span className="text-destructive ms-1">*</span>
                      </Label>

                      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap" dir="ltr">
                          thakirni.com/team/
                        </span>
                        <input
                          id="slug"
                          type="text"
                          placeholder="dev-team"
                          value={slug}
                          onChange={(e) => {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                            setSlugEdited(true);
                            setFieldErrors((prev) => ({ ...prev, slug: undefined }));
                          }}
                          maxLength={50}
                          className="flex-1 bg-transparent text-sm py-2.5 outline-none placeholder:text-muted-foreground"
                          dir="ltr"
                        />
                      </div>

                      {fieldErrors.slug ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.slug}
                        </p>
                      ) : slug && isValidSlug(slug) ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {t("معرّف صالح", "Valid slug")}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {t("أحرف صغيرة وأرقام وشرطات فقط", "Lowercase letters, numbers, and hyphens only")}
                        </p>
                      )}
                    </div>

                  </fieldset>

                  {/* Global error */}
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
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
                      disabled={!canCreate || loading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("جاري الإنشاء...", "Creating...")}
                        </span>
                      ) : (
                        t("إنشاء الفريق", "Create Team")
                      )}
                    </Button>
                  </div>
                </form>

              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}