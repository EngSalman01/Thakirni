"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  VaultSidebar,
  MobileMenuButton,
} from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User, Bell, Shield, Globe, Smartphone,
  Mail, Lock, LogOut, Crown, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, Phone,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  notification_email: boolean;
  notification_push: boolean;
  notification_friday: boolean;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-64 rounded-xl ${i === 2 ? "lg:col-span-2" : ""}`} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { subscriptionType } = useSubscription();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [origName, setOrigName] = useState("");   // to detect dirty state
  const [phone, setPhone] = useState("");
  const [origPhone, setOrigPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Notification state — keys match DB columns
  const [notifs, setNotifs] = useState({
    notification_email: true,
    notification_push: true,
    notification_friday: true,
  });
  const [savingNotif, setSavingNotif] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch profile ──────────────────────────────────────────────────────────

  useEffect(() => {
    abortRef.current = new AbortController();

    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) { router.push("/auth"); return; }

        setEmail(user.email ?? "");

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, phone_number, notification_email, notification_push, notification_friday")
          .eq("id", user.id)
          .single();

        if (abortRef.current?.signal.aborted) return;

        if (error) {
          // Profile row may not exist yet — fall back to auth metadata
          const fallback = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
          setName(fallback);
          setOrigName(fallback);
        } else {
          setProfile(data as Profile);
          const n = data.full_name ?? "";
          setName(n);
          setOrigName(n);
          const p = data.phone_number ?? "";
          setPhone(p);
          setOrigPhone(p);
          setNotifs({
            notification_email: data.notification_email ?? true,
            notification_push: data.notification_push ?? true,
            notification_friday: data.notification_friday ?? true,
          });
        }
      } catch (err) {
        console.error("[Settings] fetch:", err);
        toast.error(t("فشل تحميل البيانات", "Failed to load profile"));
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    };

    fetch();
    return () => abortRef.current?.abort();
  }, [router, t]);

  // ── Save profile name ──────────────────────────────────────────────────────

  const handleSaveName = useCallback(async () => {
    if (!name.trim()) {
      toast.error(t("الاسم مطلوب", "Name is required"));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Normalise phone
      const rawPhone = phone.trim().replace(/\s+/g, "")
      const normPhone = rawPhone
        .replace(/^\+/, "")
        .replace(/^00/, "")
        .replace(/^0/, "966")

      if (normPhone && !/^966\d{9}$/.test(normPhone)) {
        toast.error(t("رقم الهاتف غير صحيح", "Invalid phone number"))
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          phone_number: normPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setOrigName(name.trim());
      setOrigPhone(normPhone);
      setPhone(normPhone);
      setProfile((p) => p ? { ...p, full_name: name.trim(), phone_number: normPhone || null } : null);
      toast.success(t("تم حفظ التغييرات", "Changes saved"));
    } catch (err) {
      console.error("[Settings] save name:", err);
      toast.error(t("فشل الحفظ", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }, [name, phone, t]);

  // ── Toggle notification + persist immediately ──────────────────────────────

  const handleToggleNotif = useCallback(async (
    key: "notification_email" | "notification_push" | "notification_friday",
  ) => {
    const newVal = !notifs[key];

    // Optimistic update
    setNotifs((prev) => ({ ...prev, [key]: newVal }));
    setSavingNotif(key);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ [key]: newVal, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("تم تحديث الإشعارات", "Notifications updated"));
    } catch (err) {
      // Rollback on error
      setNotifs((prev) => ({ ...prev, [key]: !newVal }));
      toast.error(t("فشل تحديث الإشعارات", "Failed to update notifications"));
    } finally {
      setSavingNotif(null);
    }
  }, [notifs, t]);

  // ── Sign out ───────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      // scope: 'global' signs out all sessions across all devices
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success(t("تم تسجيل الخروج من جميع الأجهزة", "Signed out from all devices"));
      router.push("/auth");
    } catch (err) {
      console.error("[Settings] sign out:", err);
      toast.error(t("حدث خطأ", "Something went wrong"));
      router.push("/auth");   // force redirect anyway
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  }, [router, t]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return <SettingsSkeleton />;

  const isDirty = name.trim() !== origName || phone.trim() !== origPhone;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 p-4 md:p-6 lg:p-8 transition-all duration-300">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {t("الإعدادات", "Settings")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("إدارة حسابك وتفضيلاتك", "Manage your account and preferences")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex"><LanguageToggle /></span>
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">

          {/* ── Profile ── */}
          <Section icon={User} title={t("الملف الشخصي", "Profile")} delay={0.05}>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary text-xl font-bold">
                    {name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{name || t("مستخدم", "User")}</p>
                <p className="text-sm text-muted-foreground truncate" dir="ltr">{email}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("الاسم", "Full Name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("أدخل اسمك", "Enter your name")}
                  maxLength={60}
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
                <Input id="email" type="email" value={email} disabled dir="ltr" className="opacity-60" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("لا يمكن تغيير البريد الإلكتروني", "Email cannot be changed")}
                </p>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  {t("رقم الجوال", "Phone Number")}
                  <span className="text-muted-foreground text-xs ms-1">
                    {t("(للواتساب)", "(for WhatsApp)")}
                  </span>
                </Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="ps-10"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "أضف رقمك لاستخدام ذكرني عبر واتساب مباشرة",
                    "Add your number to use Thakirni directly via WhatsApp",
                  )}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleSaveName}
                disabled={saving || !isDirty || !name.trim()}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("جاري الحفظ...", "Saving...")}
                  </span>
                ) : t("حفظ التغييرات", "Save Changes")}
              </Button>
            </div>
          </Section>

          {/* ── Notifications ── */}
          <Section icon={Bell} title={t("الإشعارات", "Notifications")} delay={0.1}>
            <div className="space-y-2">
              {([
                { key: "notification_email", icon: Mail, ar: "إشعارات البريد", en: "Email Notifications", descAr: "تذكيرات عبر البريد", descEn: "Reminders via email" },
                { key: "notification_push", icon: Smartphone, ar: "إشعارات الهاتف", en: "Push Notifications", descAr: "إشعارات فورية", descEn: "Instant notifications" },
                { key: "notification_friday", icon: Crown, ar: "تذكيرات الجمعة", en: "Friday Reminders", descAr: "جمعة مباركة أسبوعياً", descEn: "Weekly Jumma reminders" },
              ] as const).map(({ key, icon: Icon, ar, en, descAr, descEn }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                        {t(ar, en)}
                      </Label>
                      <p className="text-xs text-muted-foreground">{t(descAr, descEn)}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {savingNotif === key ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        id={key}
                        checked={notifs[key]}
                        onCheckedChange={() => handleToggleNotif(key)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Subscription ── */}
          <Section icon={Crown} title={t("الاشتراك", "Subscription")} delay={0.15} className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                {
                  id: "free", nameAr: "مجاني", nameEn: "Free",
                  priceAr: "٠ ريال", priceEn: "0 SAR",
                  features: [
                    { ar: "٥٠ رسالة / شهرياً", en: "50 messages / month" },
                    { ar: "مساعد ذكي أساسي", en: "Basic AI assistant" },
                  ],
                },
                {
                  id: "individual", nameAr: "أفراد", nameEn: "Individual",
                  priceAr: "٢٩ ريال", priceEn: "29 SAR",
                  popular: true,
                  features: [
                    { ar: "رسائل غير محدودة", en: "Unlimited messages" },
                    { ar: "مزامنة التقويم", en: "Calendar sync" },
                    { ar: "بحث كامل", en: "Full memory search" },
                  ],
                },
                {
                  id: "team", nameAr: "فرق", nameEn: "Team",
                  priceAr: "٧٩ ريال", priceEn: "79 SAR",
                  features: [
                    { ar: "كل مميزات الأفراد", en: "Everything in Individual" },
                    { ar: "لوحة كانبان", en: "Kanban board" },
                    { ar: "ذاكرة مشتركة", en: "Shared team memory" },
                  ],
                },
              ]).map((tier) => {
                const isCurrent = subscriptionType === tier.id ||
                  (tier.id === "free" && !subscriptionType);
                return (
                  <Card
                    key={tier.id}
                    className={`p-4 border-2 transition-all ${isCurrent
                        ? "border-primary shadow-md"
                        : tier.popular
                          ? "border-emerald-500/50"
                          : "border-border"
                      }`}
                  >
                    {tier.popular && (
                      <div className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full w-fit mb-2">
                        {t("الأكثر شيوعاً", "Most Popular")}
                      </div>
                    )}
                    <h3 className="font-bold text-foreground">{t(tier.nameAr, tier.nameEn)}</h3>
                    <p className="text-xl font-bold text-primary my-1" dir="ltr">
                      {t(tier.priceAr, tier.priceEn)}
                      <span className="text-xs text-muted-foreground font-normal ms-1">
                        {t("/شهر", "/mo")}
                      </span>
                    </p>
                    <ul className="space-y-1 mb-4">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          {t(f.ar, f.en)}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full text-xs" disabled>
                        {t("خطتك الحالية", "Current Plan")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => router.push("/pricing")}
                      >
                        {t("ترقية", "Upgrade")}
                        <ArrowRight className="w-3 h-3 ms-1 rtl:rotate-180" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>

          {/* ── Security ── */}
          <Section icon={Shield} title={t("الأمان", "Security")} delay={0.2}>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => router.push("/vault/settings/security/change-password")}
              >
                <Lock className="w-4 h-4" />
                {t("تغيير كلمة المرور", "Change Password")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setSignOutOpen(true)}
              >
                <LogOut className="w-4 h-4" />
                {t("تسجيل الخروج من جميع الأجهزة", "Sign Out From All Devices")}
              </Button>
            </div>
          </Section>

          {/* ── Appearance ── */}
          <Section icon={Globe} title={t("اللغة والمظهر", "Language & Theme")} delay={0.25}>
            <div className="space-y-2">
              {[
                { labelAr: "اللغة", labelEn: "Language", descAr: "اختر لغة التطبيق", descEn: "Choose app language", control: <LanguageToggle /> },
                { labelAr: "المظهر", labelEn: "Theme", descAr: "الوضع الليلي أو النهاري", descEn: "Dark or light mode", control: <ThemeToggle /> },
              ].map((row) => (
                <div key={row.labelEn} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div>
                    <p className="text-sm font-medium">{t(row.labelAr, row.labelEn)}</p>
                    <p className="text-xs text-muted-foreground">{t(row.descAr, row.descEn)}</p>
                  </div>
                  {row.control}
                </div>
              ))}
            </div>
          </Section>

        </div>
      </main>

      {/* ── Sign Out Confirmation ── */}
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("تسجيل الخروج من جميع الأجهزة", "Sign Out From All Devices")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "سيتم تسجيل خروجك من جميع الجلسات النشطة على كل الأجهزة. هل أنت متأكد؟",
                "This will end all active sessions across all your devices. Are you sure?",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>
              {t("إلغاء", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={signingOut}
              className="bg-destructive hover:bg-destructive/90"
            >
              {signingOut ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("جاري الخروج...", "Signing out...")}
                </span>
              ) : t("تسجيل الخروج", "Sign Out")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}