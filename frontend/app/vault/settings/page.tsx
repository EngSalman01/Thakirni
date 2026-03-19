"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell, Shield, Mail, LogOut,
  Crown, CheckCircle2, AlertCircle, Loader2, Phone,
  Key, Fingerprint, Sparkles, RefreshCw, Calendar, X,
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

// ── Card wrapper ──────────────────────────────────────────────────────────────

function SettingsCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 1, 0.3, 1] }}
      className={`bg-[#f6f3f2] rounded-2xl p-8 relative overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <VaultSidebar />
      <main className="lg:ml-72 pt-24 px-6 lg:px-12 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          {[7, 5, 7, 5].map((span, i) => (
            <Skeleton key={i} className={`h-64 rounded-2xl md:col-span-${span}`} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label, desc, checked, onChange, loading,
}: {
  label: string; desc: string; checked: boolean;
  onChange: () => void; loading?: boolean;
}) {
  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-xl">
      <div>
        <p className="font-label font-bold text-sm text-slate-800">{label}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        // dir="ltr" prevents RTL from reversing the switch thumb direction
        <div dir="ltr">
          <Switch checked={checked} onCheckedChange={onChange} />
        </div>
      )}
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
  const [origName, setOrigName] = useState("");
  const [phone, setPhone] = useState("");
  const [origPhone, setOrigPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

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
          const fallback = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
          setName(fallback); setOrigName(fallback);
        } else {
          setProfile(data as Profile);
          const n = data.full_name ?? "";
          setName(n); setOrigName(n);
          const p = data.phone_number ?? "";
          setPhone(p); setOrigPhone(p);
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

  // ── Save profile ───────────────────────────────────────────────────────────

  const handleSaveName = useCallback(async () => {
    if (!name.trim()) { toast.error(t("الاسم مطلوب", "Name is required")); return; }

    // Validate phone BEFORE setting saving state so button doesn't get stuck
    const rawPhone = phone.trim().replace(/\s+/g, "");
    const normPhone = rawPhone
      ? rawPhone.replace(/^\+/, "").replace(/^00/, "").replace(/^0/, "966")
      : "";
    if (normPhone && !/^966\d{9}$/.test(normPhone)) {
      toast.error(t("رقم الهاتف غير صحيح — أدخل رقم سعودي مثل 05xxxxxxxx", "Invalid phone — enter a Saudi number like 05xxxxxxxx"));
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim(), phone_number: normPhone || null, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;
      setOrigName(name.trim()); setOrigPhone(normPhone || ""); setPhone(normPhone || "");
      setProfile((p) => p ? { ...p, full_name: name.trim(), phone_number: normPhone || null } : null);
      toast.success(t("تم حفظ التغييرات", "Changes saved"));
    } catch (err) {
      console.error("[Settings] save:", err);
      toast.error(t("فشل الحفظ", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }, [name, phone, t]);

  // ── Google Calendar ─────────────────────────────────────────────────────────

  useEffect(() => {
    // Check if Google Calendar is connected
    fetch("/api/google-calendar/events")
      .then((r) => r.json())
      .then((d: { connected?: boolean }) => setCalendarConnected(d.connected === true))
      .catch(() => {})
    // Check for calendar connection result in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get("calendar") === "connected") {
      setCalendarConnected(true)
      toast.success(t("تم ربط Google Calendar بنجاح! 📅", "Google Calendar connected! 📅"))
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("calendar") === "error") {
      toast.error(t("فشل ربط Google Calendar", "Failed to connect Google Calendar"))
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [t]);

  const handleDisconnectCalendar = useCallback(async () => {
    setCalendarLoading(true)
    try {
      await fetch("/api/google-calendar/events", { method: "DELETE" })
      setCalendarConnected(false)
      toast.success(t("تم إلغاء ربط Google Calendar", "Google Calendar disconnected"))
    } catch {
      toast.error(t("حدث خطأ", "Something went wrong"))
    } finally {
      setCalendarLoading(false)
    }
  }, [t]);

  // ── Toggle notification ────────────────────────────────────────────────────

  const handleToggleNotif = useCallback(async (
    key: "notification_email" | "notification_push" | "notification_friday"
  ) => {
    const newVal = !notifs[key];
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
    } catch {
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
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success(t("تم تسجيل الخروج", "Signed out successfully"));
      router.push("/auth");
    } catch {
      router.push("/auth");
    } finally {
      setSigningOut(false); setSignOutOpen(false);
    }
  }, [router, t]);

  if (loading) return <SettingsSkeleton />;

  const isDirty = name.trim() !== origName || phone.trim() !== origPhone;
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  const planLabel = subscriptionType === "team"
    ? t("المستوى 12 حكيم", "Level 12 Sage")
    : subscriptionType === "individual"
    ? t("المستوى الفردي", "Individual")
    : t("المستوى المجاني", "Apprentice");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <VaultSidebar />

      {/* Top header */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex">
        <div>
          <h1 className="text-xl font-headline font-bold text-slate-900">
            {t("الإعدادات", "Settings")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="lg:ml-72 pt-24 lg:pt-28 px-6 lg:px-12 pb-20">

        {/* Page header */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-headline font-extrabold tracking-tight mb-4 text-slate-900">
            {t("الإعدادات", "Settings")}
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
            {t(
              "اضبط امتدادك الرقمي. قم بمعايرة مساحة عملك المعرفية لأقصى أداء وخصوصية كاملة.",
              "Tune your digital extension. Calibrate your cognitive workspace for peak performance and total privacy."
            )}
          </p>
        </section>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* ── Left column ── */}
          <div className="md:col-span-7 space-y-8">

            {/* Cognitive Profile */}
            <SettingsCard delay={0.05}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-headline font-bold text-slate-900">
                    {t("الملف المعرفي", "Cognitive Profile")}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#ffd8e9] text-[#3c0029] text-xs font-bold uppercase tracking-wider font-label">
                    {planLabel}
                  </span>
                </div>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl power-gradient flex items-center justify-center text-white text-3xl font-bold font-headline shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : initial}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-headline font-bold text-slate-900">{name || t("المستخدم", "User")}</h3>
                    <p className="text-slate-500" dir="ltr">{email}</p>
                    <button className="text-[#2552ca] font-bold text-sm hover:underline font-label">
                      {t("تعديل الهوية", "Edit Identity")}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-slate-700">{t("الاسم الكامل", "Full Name")}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("أدخل اسمك", "Enter your name")}
                      maxLength={60}
                      className="rounded-xl bg-white border-slate-200 focus-visible:ring-[#2552ca]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-slate-700">{t("البريد الإلكتروني", "Email")}</Label>
                    <Input type="email" value={email} disabled dir="ltr"
                      className="opacity-60 rounded-xl bg-white border-slate-200" />
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t("لا يمكن تغيير البريد الإلكتروني", "Email cannot be changed")}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-slate-700">
                      {t("رقم الجوال", "Phone Number")}
                      <span className="text-slate-400 text-xs ms-1">{t("(للواتساب)", "(WhatsApp)")}</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                        className="ps-10 rounded-xl bg-white border-slate-200 focus-visible:ring-[#2552ca]/40"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveName}
                    disabled={saving || !isDirty || !name.trim()}
                    className="w-full py-4 rounded-full power-gradient text-white font-bold font-label disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("جاري الحفظ...", "Saving...")}
                      </span>
                    ) : t("حفظ التغييرات", "Save Changes")}
                  </button>
                </div>
              </div>
              {/* Decorative blob */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#2552ca]/5 rounded-full blur-3xl" />
            </SettingsCard>

            {/* Aura Personalization */}
            <SettingsCard delay={0.1}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[#ad1d7f] text-xl">🎨</span>
                <h2 className="text-2xl font-headline font-bold text-slate-900">
                  {t("تخصيص الأورا", "Aura Personalization")}
                </h2>
              </div>
              <div className="space-y-4">
                <ToggleRow
                  label={t("الحركة الأثيرية", "Ethereal Motion") as string}
                  desc={t("تحولات سلسة وتأثيرات العمق", "Smooth transitions & depth effects") as string}
                  checked={notifs.notification_email}
                  onChange={() => {
                    const next = !notifs.notification_email
                    setNotifs((p) => ({ ...p, notification_email: next }))
                    localStorage.setItem("thakirni_motion", String(next))
                  }}
                />
                <ToggleRow
                  label={t("وضع التركيز العميق", "Deep Focus Mode") as string}
                  desc={t("إخماد جميع التنبيهات غير الضرورية", "Suppress all non-critical notifications") as string}
                  checked={notifs.notification_push}
                  onChange={() => {
                    const next = !notifs.notification_push
                    setNotifs((p) => ({ ...p, notification_push: next }))
                    localStorage.setItem("thakirni_deepfocus", String(next))
                  }}
                />
                <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                  <div>
                    <p className="font-label font-bold text-sm text-slate-800">{t("المظهر واللغة", "Theme & Language")}</p>
                    <p className="text-sm text-slate-500">{t("الوضع الليلي أو النهاري والعربي/الإنجليزي", "Dark/light mode & Arabic/English")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Privacy & Security */}
            <SettingsCard delay={0.15} className="border-l-4 border-[#ad1d7f]">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-[#ad1d7f]" />
                <h2 className="text-2xl font-headline font-bold text-slate-900">
                  {t("الخصوصية والأمان", "Privacy & Security")}
                </h2>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-xl flex items-center gap-6">
                  <Key className="w-8 h-8 text-[#2552ca] shrink-0" />
                  <div className="flex-1">
                    <p className="font-headline font-bold text-slate-900">
                      {t("تشفير شامل", "End-to-End Encryption")}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("خرائطك العصبية مشفرة بمفاتيح خاصة تتحكم فيها وحدك.", "Your neural maps are encrypted with private keys you alone control.")}
                    </p>
                    <button
                      onClick={() => router.push("/vault/settings/security/change-password")}
                      className="mt-3 text-[#2552ca] font-bold text-sm hover:underline font-label"
                    >
                      {t("تغيير كلمة المرور", "Change Password")}
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-xl flex items-center gap-6">
                  <Fingerprint className="w-8 h-8 text-[#2552ca] shrink-0" />
                  <div className="flex-1">
                    <p className="font-headline font-bold text-slate-900">
                      {t("خزنة بيومترية", "Biometric Vault")}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("طلب بصمة الوجه أو الإصبع لفتح مجموعات الذاكرة الحساسة.", "Require FaceID or Fingerprint to unlock sensitive memory clusters.")}
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-red-50/50 rounded-xl border border-red-200/30">
                  <h3 className="text-red-600 font-headline font-bold mb-2">
                    {t("منطقة الخطر", "Danger Zone")}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {t("هذه الإجراءات دائمة ولا يمكن التراجع عنها.", "These actions are permanent and cannot be reversed.")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSignOutOpen(true)}
                      className="px-5 py-2.5 rounded-full border border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors font-label flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("تسجيل الخروج من كل الأجهزة", "Sign Out All Devices")}
                    </button>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* ── Right column ── */}
          <div className="md:col-span-5 space-y-8">

            {/* Subscription */}
            <SettingsCard delay={0.08} className="relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-2xl font-headline font-bold mb-1 text-slate-900">
                  {t("الاشتراك", "Subscription")}
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  {t("حالياً:", "Currently:")}{" "}
                  <span className="text-[#2552ca] font-bold">{planLabel}</span>
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { ar: "مزامنة عصبية غير محدودة", en: "Unlimited Neural Sync" },
                    { ar: "استخراج المعرفة العالمية", en: "Global Knowledge Extraction" },
                    { ar: "أولوية الحوسبة المعرفية", en: "Priority Cognitive Compute" },
                  ].map(({ ar, en }) => (
                    <div key={en} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#ad1d7f] shrink-0 mt-0.5" />
                      <p className="text-sm">{t(ar, en)}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full py-4 rounded-full bg-white text-slate-800 font-headline font-bold shadow-sm hover:shadow-md transition-all"
                >
                  {t("إدارة الفواتير", "Manage Billing")}
                </button>
              </div>
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="w-40 h-40 text-[#ad1d7f]" />
              </div>
            </SettingsCard>

            {/* Connected Apps */}
            <SettingsCard delay={0.12}>
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="w-5 h-5 text-[#2552ca]" />
                <h2 className="text-2xl font-headline font-bold text-slate-900">
                  {t("التطبيقات المرتبطة", "Connected Apps")}
                </h2>
              </div>
              <div className="space-y-3">
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#2552ca]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm font-label text-slate-800">Google Calendar</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {calendarConnected
                          ? t("متصل — مزامنة الأحداث تلقائياً", "Connected — events synced")
                          : t("اربط التقويم لعرض أحداثك", "Connect to see your events")}
                      </p>
                    </div>
                  </div>
                  {calendarConnected ? (
                    <button
                      onClick={handleDisconnectCalendar}
                      disabled={calendarLoading}
                      className="flex items-center gap-1.5 text-xs text-red-500 font-bold font-label hover:text-red-700 transition-colors"
                    >
                      {calendarLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <X className="w-3 h-3" />}
                      {t("قطع الاتصال", "Disconnect")}
                    </button>
                  ) : (
                    <a
                      href="/api/google-calendar/connect"
                      className="text-xs text-[#2552ca] font-bold font-label hover:underline"
                    >
                      {t("ربط", "Connect")}
                    </a>
                  )}
                </div>

                {/* WhatsApp — shows status based on phone */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-lg shrink-0">
                      💬
                    </div>
                    <div>
                      <p className="font-bold text-sm font-label text-slate-800">WhatsApp</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {profile?.phone_number
                          ? t("متصل — تلقّى التذكيرات عبر واتساب", "Connected — receive reminders via WhatsApp")
                          : t("أضف رقمك في الملف الشخصي", "Add your phone number above")}
                      </p>
                    </div>
                  </div>
                  {profile?.phone_number ? (
                    <span className="text-xs text-green-600 font-bold px-2 py-1 bg-green-50 rounded-full">
                      {t("مفعّل", "Active")}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-full">
                      {t("غير مفعّل", "Inactive")}
                    </span>
                  )}
                </div>
              </div>
            </SettingsCard>

            {/* Notifications */}
            <SettingsCard delay={0.16}>
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-[#2552ca]" />
                <h2 className="text-2xl font-headline font-bold text-slate-900">
                  {t("الإشعارات", "Notifications")}
                </h2>
              </div>
              <div className="space-y-3">
                {([
                  { key: "notification_email", ar: "إشعارات البريد", en: "Email Notifications", descAr: "تذكيرات عبر البريد", descEn: "Reminders via email" },
                  { key: "notification_push", ar: "إشعارات الهاتف", en: "Push Notifications", descAr: "إشعارات فورية", descEn: "Instant notifications" },
                  { key: "notification_friday", ar: "تذكيرات الجمعة", en: "Friday Reminders", descAr: "جمعة مباركة أسبوعياً", descEn: "Weekly Jumma reminders" },
                ] as const).map(({ key, ar, en, descAr, descEn }) => (
                  <ToggleRow
                    key={key}
                    label={t(ar, en) as string}
                    desc={t(descAr, descEn) as string}
                    checked={notifs[key]}
                    onChange={() => handleToggleNotif(key)}
                    loading={savingNotif === key}
                  />
                ))}
              </div>
            </SettingsCard>

            {/* Experimental Labs */}
            <SettingsCard delay={0.2} className="bg-gradient-to-br from-[#2552ca] to-[#456ce4] text-white">
              <h3 className="text-xl font-headline font-bold mb-2">
                {t("مختبر التجريبي", "Experimental Labs")}
              </h3>
              <p className="text-white/80 text-sm mb-6">
                {t("كن أول من يختبر محرك المرآة المعرفية الجديد المدعوم بالذكاء الاصطناعي.", "Be the first to test our new AI-driven Cognitive Mirroring engine.")}
              </p>
              <button className="px-6 py-2.5 rounded-full bg-white text-[#2552ca] font-bold text-sm font-label hover:bg-slate-50 transition-colors">
                {t("انضم إلى النسخة التجريبية", "Join Beta")}
              </button>
            </SettingsCard>
          </div>
        </div>
      </main>

      {/* Sign out dialog */}
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("تسجيل الخروج من جميع الأجهزة", "Sign Out From All Devices")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "سيتم تسجيل خروجك من جميع الجلسات النشطة. هل أنت متأكد؟",
                "This will end all active sessions across all your devices. Are you sure?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>{t("إلغاء", "Cancel")}</AlertDialogCancel>
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
