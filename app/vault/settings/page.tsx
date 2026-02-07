"use client";

import { useState, useEffect } from "react";
import { DataExport } from "@/components/settings/data-export";
import { DeleteAccount } from "@/components/settings/delete-account";
import { motion } from "framer-motion";
import {
  VaultSidebar,
  MobileMenuButton,
} from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Mail,
  Lock,
  LogOut,
  Crown,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    friday: true,
  });

  // Fetch real user data
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setName(data.full_name || "");
          setPhone(data.phone || "");
        } else {
          setName(
            user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          );
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("تم حفظ التغييرات", "Changes saved"));
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(t("حدث خطأ أثناء الحفظ", "Error saving changes"));
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success(t("تم تحديث الإعدادات", "Settings updated"));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 p-4 md:p-6 lg:p-8 transition-all duration-300">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {t("الإعدادات", "Settings")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {t(
                  "إدارة حسابك وتفضيلاتك",
                  "Manage your account and preferences",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="hidden sm:inline-flex">
              <LanguageToggle />
            </span>
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-5xl">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("الملف الشخصي", "Profile")}
                </h2>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary text-xl md:text-2xl font-bold">
                          {name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {name || t("مستخدم", "User")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t("الاسم", "Name")}</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">
                        {t("البريد الإلكتروني", "Email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="mt-1 opacity-60"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(
                          "لا يمكن تغيير البريد الإلكتروني من هنا",
                          "Email cannot be changed here",
                        )}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        {t("رقم الهاتف", "Phone Number")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="mt-1"
                        dir="ltr"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin me-2" />
                      ) : null}
                      {t("حفظ التغييرات", "Save Changes")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("الإشعارات", "Notifications")}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {t("إشعارات البريد", "Email Notifications")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "استلام التذكيرات عبر البريد",
                          "Receive reminders via email",
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange("email")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {t("إشعارات الهاتف", "Push Notifications")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "إشعارات فورية على الهاتف",
                          "Instant push notifications",
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange("push")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Crown className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {t("تذكيرات الجمعة", "Friday Reminders")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "رسائل جمعة مباركة أسبوعية",
                          "Weekly Jumma Mubarak messages",
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.friday}
                    onCheckedChange={() => handleNotificationChange("friday")}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("الاشتراك", "Subscription")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Plan */}
                <Card className="p-4 border-2 border-border">
                  <h3 className="text-lg font-bold text-foreground text-center">
                    {t("الباقة المجانية", "Free Plan")}
                  </h3>
                  <p className="text-center text-2xl font-bold text-primary my-2">
                    {t("مجاني", "Free")}
                  </p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {t("للاستخدام الشخصي", "For personal use")}
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t("ذاكرة محدودة", "Limited memory")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t("مساعد ذكي أساسي", "Basic AI assistant")}
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    disabled
                  >
                    {t("الخطة الحالية", "Current Plan")}
                  </Button>
                </Card>

                {/* Pro Plan */}
                <Card className="p-4 border-2 border-primary relative overflow-hidden">
                  <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-es-xl font-bold">
                    {t("الأكثر شيوعاً", "Most Popular")}
                  </div>
                  <h3 className="text-lg font-bold text-foreground text-center">
                    {t("برو", "Pro")}
                  </h3>
                  <p className="text-center text-2xl font-bold text-primary my-2">
                    {t("٣٠ ريال", "30 SAR")}
                    <span className="text-sm text-muted-foreground">
                      {t("/شهر", "/month")}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {t("للمستخدمين النشطين", "For active users")}
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t("ذاكرة غير محدودة", "Unlimited memory")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t("أولوية في الدعم", "Priority support")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t("تحليل متقدم", "Advanced analytics")}
                    </li>
                  </ul>
                  <Button className="w-full" variant="default" disabled>
                    {t("قريباً", "Coming Soon")}
                  </Button>
                </Card>
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("الأمان", "Security")}
                </h2>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent"
                >
                  <Lock className="w-4 h-4" />
                  {t("تغيير كلمة المرور", "Change Password")}
                </Button>

                <div className="pt-2 border-t border-border mt-2 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <DataExport />
                    <DeleteAccount />
                  </div>
                </div>

                <div className="pt-2 border-t border-border mt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 bg-transparent"
                  >
                    <Globe className="w-4 h-4" />
                    {t("ربط تقويم جوجل", "Sync Google Calendar")}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  {t(
                    "تسجيل الخروج من جميع الأجهزة",
                    "Sign Out From All Devices",
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Language & Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("اللغة والمظهر", "Language & Theme")}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {t("اللغة", "Language")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("اختر لغة التطبيق", "Choose app language")}
                    </p>
                  </div>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {t("المظهر", "Theme")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("الوضع الليلي أو النهاري", "Dark or light mode")}
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
