"use client";

import React, { useState, useEffect } from "react";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
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
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  User,
  Globe,
  Moon,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is installed or I'll use simple alert/state
// If sonner not installed, I'll use local state for success message.
// utils.ts usually has toast but I didn't see it. providing local feedback.

export default function SettingsPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: t("تم تحديث الملف الشخصي بنجاح", "Profile updated successfully"),
      });

      // Force reload to update sidebar name
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: t("حدث خطأ أثناء التحديث", "Error updating profile"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: t(
          "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك",
          "Password reset link sent to your email",
        ),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VaultSidebar />

      <main className="lg:me-64 p-4 lg:p-8 transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              {t("الإعدادات", "Settings")}
            </h1>
            <p className="text-muted-foreground">
              {t(
                "إدارة حسابك وتفضيلاتك",
                "Manage your account and preferences",
              )}
            </p>
          </div>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("الملف الشخصي", "Profile")}
              </CardTitle>
              <CardDescription>
                {t(
                  "تحديث معلوماتك الشخصية",
                  "Update your personal information",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("البريد الإلكتروني", "Email")}
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("الاسم الكامل", "Full Name")}
                    </Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("ادخل اسمك", "Enter your name")}
                    />
                  </div>

                  {message && (
                    <div
                      className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {message.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving && (
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      )}
                      {t("حفظ التغييرات", "Save Changes")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("التفضيلات", "Preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t("اللغة", "Language")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("اختر لغة العرض", "Select display language")}
                  </p>
                </div>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t("المظهر", "Appearance")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("اختر وضع نهاري أو ليلي", "Choose light or dark mode")}
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t("الأمان", "Security")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>{t("كلمة المرور", "Password")}</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handlePasswordReset}
                >
                  {t(
                    "إرسال رابط تغيير كلمة المرور",
                    "Send Password Reset Link",
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
