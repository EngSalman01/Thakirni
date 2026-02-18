"use client";

import { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Types
interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  plan_tier?: "FREE" | "INDIVIDUAL" | "COMPANY";
  updated_at?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  friday: boolean;
}

// Sub-components
const PageHeader = ({ t }: { t: (ar: string, en: string) => string }) => (
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
          {t("إدارة حسابك وتفضيلاتك", "Manage your account and preferences")}
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
);

const ProfileSkeleton = () => (
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
);

const ProfileCard = ({
  profile,
  email,
  name,
  setName,
  loading,
  saving,
  onSave,
  t,
}: {
  profile: Profile | null;
  email: string;
  name: string;
  setName: (name: string) => void;
  loading: boolean;
  saving: boolean;
  onSave: () => void;
  t: (ar: string, en: string) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("الملف الشخصي", "Profile")}
        </h2>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={name || "User avatar"}
                  className="w-full h-full object-cover"
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
              <p className="text-sm text-muted-foreground truncate" dir="ltr">
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
                placeholder={t("أدخل اسمك", "Enter your name")}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1 opacity-60 cursor-not-allowed"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {t(
                  "لا يمكن تغيير البريد الإلكتروني",
                  "Email cannot be changed",
                )}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={onSave}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t("جاري الحفظ...", "Saving...")}
                </>
              ) : (
                t("حفظ التغييرات", "Save Changes")
              )}
            </Button>
          </div>
        </>
      )}
    </Card>
  </motion.div>
);

const NotificationCard = ({
  notifications,
  onToggle,
  t,
}: {
  notifications: NotificationSettings;
  onToggle: (key: keyof NotificationSettings) => void;
  t: (ar: string, en: string) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("الإشعارات", "Notifications")}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Mail
              className="w-5 h-5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <Label
                htmlFor="email-notifications"
                className="font-medium text-foreground text-sm cursor-pointer"
              >
                {t("إشعارات البريد", "Email Notifications")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  "استلام التذكيرات عبر البريد",
                  "Receive reminders via email",
                )}
              </p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={notifications.email}
            onCheckedChange={() => onToggle("email")}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Smartphone
              className="w-5 h-5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <Label
                htmlFor="push-notifications"
                className="font-medium text-foreground text-sm cursor-pointer"
              >
                {t("إشعارات الهاتف", "Push Notifications")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("إشعارات فورية على الهاتف", "Instant push notifications")}
              </p>
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={notifications.push}
            onCheckedChange={() => onToggle("push")}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Crown
              className="w-5 h-5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <Label
                htmlFor="friday-reminders"
                className="font-medium text-foreground text-sm cursor-pointer"
              >
                {t("تذكيرات الجمعة", "Friday Reminders")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  "رسائل جمعة مباركة أسبوعية",
                  "Weekly Jumma Mubarak messages",
                )}
              </p>
            </div>
          </div>
          <Switch
            id="friday-reminders"
            checked={notifications.friday}
            onCheckedChange={() => onToggle("friday")}
          />
        </div>
      </div>
    </Card>
  </motion.div>
);

const SubscriptionCard = ({ t }: { t: (ar: string, en: string) => string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="lg:col-span-2"
  >
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("الاشتراك", "Subscription")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <Card className="p-4 border-2 border-border hover:shadow-md transition-shadow">
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
              <CheckCircle2
                className="w-4 h-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("ذاكرة محدودة", "Limited memory")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("مساعد ذكي أساسي", "Basic AI assistant")}</span>
            </li>
          </ul>
          <Button className="w-full" variant="outline" disabled>
            {t("الخطة الحالية", "Current Plan")}
          </Button>
        </Card>

        {/* Pro Plan */}
        <Card className="p-4 border-2 border-primary relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-es-xl font-bold">
            {t("الأكثر شيوعاً", "Most Popular")}
          </div>
          <h3 className="text-lg font-bold text-foreground text-center mt-2">
            {t("برو", "Pro")}
          </h3>
          <p className="text-center text-2xl font-bold text-primary my-2">
            <span dir="ltr">{t("٣٠ ريال", "30 SAR")}</span>
            <span className="text-sm text-muted-foreground">
              {t("/شهر", "/month")}
            </span>
          </p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {t("للمستخدمين النشطين", "For active users")}
          </p>
          <ul className="text-sm space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("ذاكرة غير محدودة", "Unlimited memory")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("أولوية في الدعم", "Priority support")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("تحليل متقدم", "Advanced analytics")}</span>
            </li>
          </ul>
          <Button className="w-full" disabled>
            {t("قريباً", "Coming Soon")}
          </Button>
        </Card>
      </div>
    </Card>
  </motion.div>
);

const SecurityCard = ({
  onSignOut,
  t,
}: {
  onSignOut: () => void;
  t: (ar: string, en: string) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("الأمان", "Security")}
        </h2>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          disabled
        >
          <Lock className="w-4 h-4" aria-hidden="true" />
          {t("تغيير كلمة المرور", "Change Password")}
          <span className="ms-auto text-xs text-muted-foreground">
            {t("قريباً", "Soon")}
          </span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onSignOut}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {t("تسجيل الخروج من جميع الأجهزة", "Sign Out From All Devices")}
        </Button>
      </div>
    </Card>
  </motion.div>
);

const AppearanceCard = ({ t }: { t: (ar: string, en: string) => string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
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
);

// Main Component
export default function SettingsPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    friday: true,
  });

  // Fetch user profile
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user || !mounted) return;

        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (mounted) {
          if (error) {
            console.error("[Settings] Error fetching profile:", error);
            // Fallback to user metadata
            setName(
              user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            );
          } else {
            setProfile(data);
            setName(data.full_name || "");
          }
        }
      } catch (error) {
        console.error("[Settings] Error:", error);
        toast.error(t("حدث خطأ في تحميل البيانات", "Error loading data"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [t]);

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      toast.error(t("الاسم مطلوب", "Name is required"));
      return;
    }

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
          full_name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("تم حفظ التغييرات بنجاح", "Changes saved successfully"));

      // Update local state
      setProfile((prev) => (prev ? { ...prev, full_name: name.trim() } : null));
    } catch (error) {
      console.error("[Settings] Error saving profile:", error);
      toast.error(t("حدث خطأ أثناء الحفظ", "Error saving changes"));
    } finally {
      setSaving(false);
    }
  }, [name, t]);

  const handleNotificationChange = useCallback(
    (key: keyof NotificationSettings) => {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
      toast.success(t("تم تحديث الإعدادات", "Settings updated"));
    },
    [t],
  );

  const handleSignOut = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast.success(t("تم تسجيل الخروج", "Signed out successfully"));
      window.location.href = "/auth";
    } catch (error) {
      console.error("[Settings] Error signing out:", error);
      toast.error(t("حدث خطأ أثناء تسجيل الخروج", "Error signing out"));
      // Force redirect even on error
      window.location.href = "/auth";
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 p-4 md:p-6 lg:p-8 transition-all duration-300">
        <PageHeader t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-5xl">
          <ProfileCard
            profile={profile}
            email={email}
            name={name}
            setName={setName}
            loading={loading}
            saving={saving}
            onSave={handleSaveProfile}
            t={t}
          />

          <NotificationCard
            notifications={notifications}
            onToggle={handleNotificationChange}
            t={t}
          />

          <SubscriptionCard t={t} />

          <SecurityCard onSignOut={handleSignOut} t={t} />

          <AppearanceCard t={t} />
        </div>
      </main>
    </div>
  );
}
