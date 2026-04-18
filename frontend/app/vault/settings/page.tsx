"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Sparkles, RefreshCw, Calendar, X, Camera, Download, Trash2, FileDown, User, Moon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { useSubscription, type PlanTier } from "@/hooks/use-subscription";
import { BillingModal } from "@/components/thakirni/billing-modal";
import { ReferralCard } from "@/components/thakirni/referral-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AffiliateCard } from "@/components/thakirni/affiliate-card";
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
  gcal_auto_sync: boolean;
  gcal_whatsapp_reminders: boolean;
  whatsapp_welcomed: boolean;
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
      className={`shell-panel rounded-2xl p-8 relative overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <main className="pt-32 px-8 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-10 w-56 rounded-2xl" />
              <Skeleton className="h-4 w-72 rounded-full" />
            </div>
            <Skeleton className="h-11 w-40 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 rounded-[2rem] bg-muted/50 dark:bg-white/[0.03] p-8 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-7 w-40 rounded-xl" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-card/80 dark:bg-white/[0.04] p-4 flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40 rounded-full" />
                      <Skeleton className="h-3 w-3/5 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 rounded-[2rem] bg-muted/50 dark:bg-white/[0.03] p-8 space-y-5">
              <Skeleton className="h-7 w-32 rounded-xl" />
              <Skeleton className="h-28 w-full rounded-[1.5rem]" />
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="h-11 w-2/3 rounded-2xl" />
            </div>

            <div className="md:col-span-7 rounded-[2rem] bg-muted/50 dark:bg-white/[0.03] p-8 space-y-5">
              <Skeleton className="h-7 w-44 rounded-xl" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>

            <div className="md:col-span-5 rounded-[2rem] bg-muted/50 dark:bg-white/[0.03] p-8 space-y-5">
              <Skeleton className="h-7 w-36 rounded-xl" />
              <Skeleton className="h-44 w-full rounded-[1.5rem]" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          </div>
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
    <div className="flex justify-between items-center p-4 bg-card rounded-xl">
      <div>
        <p className="font-label font-bold text-sm text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
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
  const searchParams = useSearchParams();
  const { tier, isPaid, subscription } = useSubscription();

  // Handle return from Paddle hosted checkout
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const plan = searchParams.get("plan");
    if (checkout === "success" && plan) {
      toast.success(t(
        `تم الاشتراك بنجاح! 🎉 خطتك الآن: ${plan}`,
        `Subscribed successfully! 🎉 Your plan: ${plan}`
      ));
      // Remove query params without re-render loop
      router.replace("/vault/settings?tab=subscription", { scroll: false });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps
  const [billingOpen, setBillingOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [currentTier, setCurrentTier] = useState<PlanTier | null>(null);

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [whatsappConnectOpen, setWhatsappConnectOpen] = useState(false);
  const [whatsappInstructionsOpen, setWhatsappInstructionsOpen] = useState(false);

  const [notifs, setNotifs] = useState({
    notification_email: true,
    notification_push: true,
    notification_friday: true,
  });
  const [gcalPrefs, setGcalPrefs] = useState({
    gcal_auto_sync: false,
    gcal_whatsapp_reminders: false,
  });
  const [savingGcalPref, setSavingGcalPref] = useState<string | null>(null);
  const [savingNotif, setSavingNotif] = useState<string | null>(null);
  const [motionEnabled, setMotionEnabled] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("thakirni_motion") !== "false" : true
  );
  const [deepFocusEnabled, setDeepFocusEnabled] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("thakirni_deepfocus") === "true" : false
  );

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [changeEmailSent, setChangeEmailSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [exportingPdf, setExportingPdf] = useState<string | null>(null);

  // ── Prayer subscription state ──────────────────────────────────────────────
  const [prayerEnabled, setPrayerEnabled] = useState(false);
  const [prayerCity, setPrayerCity] = useState("riyadh");
  const [prayerPrayers, setPrayerPrayers] = useState<string[]>(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
  const [prayerLoaded, setPrayerLoaded] = useState(false);
  const [prayerSaving, setPrayerSaving] = useState(false);
  const [planConfig, setPlanConfig] = useState<Array<{ plan_key: string; price_sar: number; features: string[] }> | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then(r => r.json())
      .then((d: Array<{ plan_key: string; price_sar: number; features: string[] }>) => setPlanConfig(d))
      .catch((e) => console.error("[settings] plan config fetch error:", e));
  }, []);

  // ── Fetch prayer subscription ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/prayer/subscription")
      .then(r => r.json())
      .then((d: { subscription?: { enabled: boolean; city: string; prayers: string[] } | null }) => {
        if (d.subscription) {
          setPrayerEnabled(d.subscription.enabled);
          setPrayerCity(d.subscription.city.toLowerCase());
          setPrayerPrayers(d.subscription.prayers);
        }
        setPrayerLoaded(true);
      })
      .catch(() => setPrayerLoaded(true));
  }, []);

  const handleSavePrayer = useCallback(async (
    overrides?: Partial<{ enabled: boolean; city: string; prayers: string[] }>
  ) => {
    setPrayerSaving(true);
    try {
      const body = {
        enabled:  overrides?.enabled  ?? prayerEnabled,
        city:     overrides?.city     ?? prayerCity,
        prayers:  overrides?.prayers  ?? prayerPrayers,
      };
      const res = await fetch("/api/prayer/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "no_phone") {
          toast.error(t("أضف رقم واتساب في الملف الشخصي أولاً", "Add a WhatsApp phone number in Profile first"));
        } else {
          toast.error(json.message ?? json.error ?? t("فشل الحفظ", "Failed to save"));
        }
        return;
      }
      toast.success(t("تم حفظ تذكيرات الصلاة ✅", "Prayer reminders saved ✅"));
    } catch {
      toast.error(t("فشل الاتصال", "Connection error"));
    } finally {
      setPrayerSaving(false);
    }
  }, [prayerEnabled, prayerCity, prayerPrayers, t]);

  const abortRef = useRef<AbortController | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
          .select("id, full_name, avatar_url, phone_number, notification_email, notification_push, notification_friday, gcal_auto_sync, gcal_whatsapp_reminders, whatsapp_welcomed")
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
          setGcalPrefs({
            gcal_auto_sync: data.gcal_auto_sync ?? false,
            gcal_whatsapp_reminders: data.gcal_whatsapp_reminders ?? false,
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
    const rawPhone = phone.trim().replace(/[\s\-()]/g, "");
    const normPhone = rawPhone
      ? rawPhone
          .replace(/^\+/, "")   // strip leading +
          .replace(/^00/, "")   // strip leading 00
          .replace(/^0(\d{9})$/, "966$1")  // Saudi local 05xxxxxxxx → 9665xxxxxxxx
      : "";
    if (normPhone && !/^\d{7,15}$/.test(normPhone)) {
      toast.error(t("رقم الهاتف غير صحيح — أدخل الرقم مع رمز الدولة مثل 05xxxxxxxx أو +1xxxxxxxxxx", "Invalid phone — enter with country code e.g. 05xxxxxxxx or +1xxxxxxxxxx"));
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

      const isNewPhone = normPhone && !origPhone;
      const notYetWelcomed = !profile?.whatsapp_welcomed;

      setOrigName(name.trim()); setOrigPhone(normPhone || ""); setPhone(normPhone || "");
      setProfile((p) => p ? { ...p, full_name: name.trim(), phone_number: normPhone || null } : null);
      toast.success(t("تم حفظ التغييرات", "Changes saved"));

      // Auto-welcome on first phone addition
      if (isNewPhone && notYetWelcomed) {
        toast.success(t("تم الربط 👌 شيك واتساب 👀", "Connected 👌 Check WhatsApp 👀"), { duration: 5000 });
        fetch("/api/whatsapp/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normPhone, name: name.trim() }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("[Settings] save:", err);
      toast.error(t("فشل الحفظ", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }, [name, phone, t]);

  // ── Avatar upload ──────────────────────────────────────────────────────────

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("حجم الصورة يجب ألا يتجاوز 5 ميغابايت", "Image must be under 5MB"));
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/avatar/upload", { method: "POST", body: formData });
      const json = await res.json() as { url?: string; error?: string };

      if (!res.ok || json.error) {
        console.error("[Avatar] upload API error:", json.error);
        throw new Error(json.error ?? "Upload failed");
      }

      setProfile((p) => p ? { ...p, avatar_url: json.url ?? null } : null);
      toast.success(t("تم تحديث صورة الملف الشخصي", "Profile photo updated"));
    } catch (err) {
      console.error("[Avatar] upload failed:", err);
      toast.error(t("فشل رفع الصورة", "Failed to upload photo"));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }, [t]);

  // ── Google Calendar ─────────────────────────────────────────────────────────

  useEffect(() => {
    // Check if Google Calendar is connected
    fetch("/api/google-calendar/events")
      .then((r) => r.json())
      .then((d: { connected?: boolean }) => setCalendarConnected(d.connected === true))
      .catch((e) => console.error("[settings] calendar connection check error:", e))
    // Check for calendar connection result in URL — read language directly from
    // localStorage so this fires correctly before React language state settles
    const params = new URLSearchParams(window.location.search)
    const isEn = (localStorage.getItem("language") || "ar") === "en"
    if (params.get("calendar") === "connected") {
      setCalendarConnected(true)
      toast.success(isEn ? "Google Calendar connected! 📅" : "تم ربط Google Calendar بنجاح! 📅")
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("calendar") === "error") {
      const reason = params.get("reason")
      const reasonMap: Record<string, string> = {
        no_session:    isEn ? "Session lost — please sign in again" : "انتهت الجلسة — سجّل الدخول مجدداً",
        state_mismatch: isEn ? "Security check failed — try again" : "فشل التحقق الأمني — حاول مجدداً",
        token_exchange: isEn ? `Google rejected the token${params.get("detail") ? `: ${params.get("detail")}` : " — check your OAuth credentials"}` : "رفض Google الرمز — تحقق من بيانات OAuth",
        missing_params: isEn ? "Google did not return the required code" : "لم يُرسل Google الكود المطلوب",
      }
      const msg = reason && reasonMap[reason]
        ? reasonMap[reason]
        : (isEn ? "Failed to connect Google Calendar" : "فشل ربط Google Calendar")
      toast.error(msg)
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, []);

  const handleDisconnectCalendar = useCallback(async () => {
    setCalendarLoading(true)
    try {
      await fetch("/api/google-calendar/events", { method: "DELETE" })
      setCalendarConnected(false)
      toast.success(t("تم إلغاء ربط Google Calendar", "Google Calendar disconnected"))
    } catch (err) {
      console.error("[Settings] disconnect calendar:", err)
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
    } catch (err) {
      console.error("[Settings] toggle notification:", err)
      setNotifs((prev) => ({ ...prev, [key]: !newVal }));
      toast.error(t("فشل تحديث الإشعارات", "Failed to update notifications"));
    } finally {
      setSavingNotif(null);
    }
  }, [notifs, t]);

  // ── Toggle Google Calendar preference ─────────────────────────────────────

  const handleToggleGcalPref = useCallback(async (
    key: "gcal_auto_sync" | "gcal_whatsapp_reminders"
  ) => {
    const newVal = !gcalPrefs[key];
    setGcalPrefs((prev) => ({ ...prev, [key]: newVal }));
    setSavingGcalPref(key);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: newVal, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(t("تم حفظ التفضيلات", "Preferences saved"));
    } catch (err) {
      console.error("[Settings] toggle gcal pref:", err);
      setGcalPrefs((prev) => ({ ...prev, [key]: !newVal }));
      toast.error(t("فشل الحفظ", "Failed to save"));
    } finally {
      setSavingGcalPref(null);
    }
  }, [gcalPrefs, t]);

  // ── Cancel subscription ────────────────────────────────────────────────────

  const handleCancelSubscription = useCallback(async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (!res.ok) throw new Error("Cancel failed");
      toast.success(t(
        "تم جدولة الإلغاء. ستظل الخطة نشطة حتى نهاية فترة الفوترة.",
        "Cancellation scheduled. Your plan stays active until end of billing period."
      ));
      setCancelOpen(false);
    } catch (err) {
      console.error("[Settings] cancel subscription:", err)
      toast.error(t("فشل الإلغاء، حاول مرة أخرى", "Cancellation failed, please try again"));
    } finally {
      setCancelling(false);
    }
  }, [t]);

  // ── Sign out ───────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success(t("تم تسجيل الخروج", "Signed out successfully"));
      router.push("/auth");
    } catch (err) {
      console.error("[Settings] sign out:", err)
      router.push("/auth");
    } finally {
      setSigningOut(false); setSignOutOpen(false);
    }
  }, [router, t]);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("تم حذف حسابك بنجاح", "Account deleted successfully"));
      router.push("/");
    } catch (err) {
      console.error("[Settings] delete account:", err)
      toast.error(t("فشل حذف الحساب", "Failed to delete account"));
      setDeleting(false);
    }
  };

  const handleChangeEmail = useCallback(async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t("أدخل بريداً إلكترونياً صحيحاً", "Enter a valid email address"));
      return;
    }
    setChangingEmail(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setChangeEmailSent(true);
    } catch (err) {
      console.error("[Settings] change email:", err);
      toast.error(t("فشل تغيير البريد. حاول مرة أخرى.", "Failed to change email. Please try again."));
    } finally {
      setChangingEmail(false);
    }
  }, [newEmail, t]);

  const handleSendInvite = useCallback(async () => {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed) return;
    setSendingInvite(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ email: trimmed, role: "member" }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(t(`تم إرسال الدعوة إلى ${trimmed}`, `Invite sent to ${trimmed}`));
      setInviteEmail("");
    } catch (err) {
      console.error("[Settings] send invite:", err);
      toast.error(t("فشل إرسال الدعوة", "Failed to send invite"));
    } finally {
      setSendingInvite(false);
    }
  }, [inviteEmail, t]);

  async function handleExportPDF(type: "memories" | "plans" | "habits" | "goals") {
    setExportingPdf(type);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let items: unknown[] = [];
      if (type === "memories") {
        const { data } = await supabase.from("memories").select("title, content, category, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
        items = data ?? [];
      } else if (type === "plans") {
        const { data } = await supabase.from("plans").select("title, plan_date, plan_time, status, category").eq("user_id", user.id).order("plan_date", { ascending: false });
        items = data ?? [];
      } else if (type === "habits") {
        const { data } = await supabase.from("habits").select("name, category, frequency, current_streak").eq("user_id", user.id);
        items = data ?? [];
      } else if (type === "goals") {
        const { data } = await supabase.from("goals").select("title, status, target_date, progress").eq("user_id", user.id);
        items = data ?? [];
      }

      const { exportToPDF } = await import("@/lib/export-pdf");
      exportToPDF({ type, items: items as never, userName: name || undefined });
      toast.success(t("تم تصدير PDF", "PDF exported"));
    } catch (err) {
      toast.error(t("فشل تصدير PDF", "PDF export failed"));
      console.error(err);
    } finally {
      setExportingPdf(null);
    }
  }

  if (loading) return <SettingsSkeleton />;

  const isDirty = name.trim() !== origName || phone.trim() !== origPhone;

  // Use resolved tier (falls back to "free" until hook resolves)
  const resolvedTier: PlanTier = currentTier ?? tier;

  const planBadge =
    resolvedTier === "teams"
      ? { label: "TEAMS",  bg: "#eff6ff", color: "#1d4ed8" }
      : resolvedTier === "pro"
      ? { label: "PRO",    bg: "#f5f3ff", color: "#7c3aed" }
      : { label: "FREE",   bg: "#f1f5f9", color: "#64748b" };

  const configForTier = planConfig?.find(p => p.plan_key === resolvedTier);
  const planFeatures: Array<{ ar: string; en: string }> = configForTier
    ? configForTier.features.map(f => ({ ar: f, en: f }))
    : resolvedTier === "teams"
    ? [
        { ar: "كل شيء غير محدود", en: "Everything unlimited" },
        { ar: "ذكريات وملاحظات مشتركة", en: "Shared memories & notes" },
        { ar: "دعم فني ذو أولوية", en: "Priority support" },
      ]
    : resolvedTier === "pro"
    ? [
        { ar: "١٠٠ خطة يومياً", en: "100 plans per day" },
        { ar: "١٠٠٠ ذاكرة", en: "1,000 memories" },
        { ar: "١٠ مشاريع", en: "10 projects" },
        { ar: "تحليلات وتقارير", en: "Analytics & reports" },
      ]
    : [
        { ar: "١٠ خطط يومياً", en: "10 plans per day" },
        { ar: "٢٥ ذاكرة", en: "25 memories" },
        { ar: "١ مشروع", en: "1 project" },
        { ar: "محادثة AI أساسية", en: "Basic AI chat" },
      ];

  const proPrice = planConfig?.find(p => p.plan_key === "pro")?.price_sar ?? 30;
  const teamsPrice = planConfig?.find(p => p.plan_key === "teams")?.price_sar ?? 60;
  const initial = name?.charAt(0)?.toUpperCase() || "U";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <main className="pt-14 lg:pt-16 transition-all duration-300">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-32 pb-16 px-8 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%',
                width: `${4 + Math.random() * 6}px`, height: `${4 + Math.random() * 6}px`,
                left: `${(i / 12) * 100}%`, top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? '#D97706' : '#F59E0B', opacity: 0.08,
              }} />
            ))}
          </div>

          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-amber-600/20 rounded-full px-4 py-2 mb-8 shadow-sm">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-label font-medium text-muted-foreground" style={{ background: planBadge.bg, color: planBadge.color, padding: '2px 10px', borderRadius: '999px', fontWeight: 700 }}>{planBadge.label}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-none mb-8">
                <span className="text-foreground">{t("إعدادات", "Your")}</span>{" "}
                <span className="gradient-text">{t("حسابك", "Account")}</span>
              </h1>

              <p className="text-xl text-muted-foreground font-body mb-10 leading-relaxed max-w-lg">
                {t("أدر ملفك الشخصي واشتراكك وتفضيلاتك وأمان حسابك من مكان واحد.", "Manage your profile, subscription, preferences, and account security all in one place.")}
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: '👤', label: t('الملف الشخصي', 'Profile'), color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' },
                  { icon: '🔔', label: t('الإشعارات', 'Notifications'), color: 'bg-amber-50 text-amber-600 dark:text-amber-400' },
                  { icon: '🔒', label: t('الأمان', 'Security'), color: 'bg-emerald-50 text-emerald-700' },
                  { icon: '📊', label: t('الاشتراك', 'Subscription'), color: 'bg-amber-50 text-amber-700' },
                ].map(({ icon, label, color }) => (
                  <div key={label as string} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${color}`}>
                    <span>{icon}</span> <span>{label as string}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — profile preview card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
              className="shell-panel-strong rounded-3xl p-8 relative">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-2xl power-gradient flex items-center justify-center text-white text-3xl font-bold font-headline overflow-hidden shrink-0">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" /> : initial}
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-bold text-foreground">{name || t('المستخدم', 'User')}</h3>
                  <p className="text-muted-foreground text-sm" dir="ltr">{email}</p>
                  <span className="mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: planBadge.bg, color: planBadge.color }}>{planBadge.label}</span>
                </div>
              </div>
              <div className="space-y-2">
                {planFeatures.slice(0, 3).map(({ ar, en }) => (
                  <div key={en} className="flex items-center gap-3 p-3 bg-muted dark:bg-white/[0.03] rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-sm font-label text-muted-foreground">{t(ar, en)}</p>
                  </div>
                ))}
              </div>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg border border-border px-3 py-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-foreground">{t('محمي', 'Secured')}</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto">

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-8 bg-muted dark:bg-white/[0.03] p-1 rounded-2xl h-auto grid grid-cols-4 gap-1">
            <TabsTrigger value="profile" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5">
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t("الملف الشخصي", "Profile")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t("الإشعارات", "Notifications")}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t("الأمان", "Security")}</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5">
              <Crown className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t("الاشتراك", "Subscription")}</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Profile ── */}
          <TabsContent value="profile" className="space-y-8">

            {/* Cognitive Profile */}
            <SettingsCard delay={0.05}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="eyebrow-badge inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t("الملف الشخصي", "Profile")}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-label"
                    style={{ background: planBadge.bg, color: planBadge.color }}
                  >
                    {planBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl power-gradient flex items-center justify-center text-white text-3xl font-bold font-headline overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                      ) : initial}
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md hover:bg-[#1a3fa0] transition-colors disabled:opacity-50"
                      aria-label={t("تغيير الصورة", "Change photo")}
                    >
                      {avatarUploading
                        ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-headline font-bold text-foreground">{name || t("المستخدم", "User")}</h3>
                    <p className="text-muted-foreground" dir="ltr">{email}</p>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="text-amber-600 dark:text-amber-400 font-bold text-sm hover:underline font-label disabled:opacity-50 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {avatarUploading
                        ? t("جاري الرفع...", "Uploading...")
                        : t("تغيير الصورة", "Change Photo")}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-muted-foreground">{t("الاسم الكامل", "Full Name")} <span className="text-red-500">*</span></Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("أدخل اسمك", "Enter your name")}
                      maxLength={60}
                      className="rounded-xl bg-card border-border focus-visible:ring-amber-600/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-muted-foreground">{t("البريد الإلكتروني", "Email")}</Label>
                    <div className="flex gap-2">
                      <Input type="email" value={email} disabled dir="ltr"
                        className="opacity-60 rounded-xl bg-card border-border flex-1" />
                      <button
                        onClick={() => { setChangeEmailOpen(true); setNewEmail(""); setChangeEmailSent(false); }}
                        className="px-3 py-2 rounded-xl border border-amber-600/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:bg-amber-950/60 transition-colors shrink-0"
                      >
                        {t("تغيير", "Change")}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-label font-semibold text-muted-foreground">
                      {t("رقم الجوال", "Phone Number")}
                      <span className="text-slate-400 text-xs ms-1">{t("(للواتساب)", "(WhatsApp)")}</span>
                    </Label>
                    <div className="relative" id="phone-field">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t("05xxxxxxxx أو +966xxxxxxxxx", "05xxxxxxxx or +1xxxxxxxxxx")}
                        className="ps-10 rounded-xl bg-card border-border focus-visible:ring-amber-600/40"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveName}
                    disabled={saving || !isDirty || !name.trim()}
                    className="w-full py-4 rounded-full power-gradient btn-glow text-white font-bold font-label disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.98]"
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
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-600/5 rounded-full blur-3xl" />
            </SettingsCard>

            {/* Aura Personalization */}
            <SettingsCard delay={0.1}>
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <span>🎨</span>
                {t("التخصيص", "Personalization")}
              </span>
              <div className="space-y-4">
                <ToggleRow
                  label={t("الحركة الأثيرية", "Ethereal Motion") as string}
                  desc={t("تحولات سلسة وتأثيرات العمق", "Smooth transitions & depth effects") as string}
                  checked={motionEnabled}
                  onChange={() => {
                    const next = !motionEnabled
                    setMotionEnabled(next)
                    localStorage.setItem("thakirni_motion", String(next))
                  }}
                />
                <ToggleRow
                  label={t("وضع التركيز العميق", "Deep Focus Mode") as string}
                  desc={t("إخماد جميع التنبيهات غير الضرورية", "Suppress all non-critical notifications") as string}
                  checked={deepFocusEnabled}
                  onChange={() => {
                    const next = !deepFocusEnabled
                    setDeepFocusEnabled(next)
                    localStorage.setItem("thakirni_deepfocus", String(next))
                  }}
                />
                <div className="flex justify-between items-center p-4 bg-card rounded-xl">
                  <div>
                    <p className="font-label font-bold text-sm text-foreground">{t("المظهر واللغة", "Theme & Language")}</p>
                    <p className="text-sm text-muted-foreground">{t("الوضع الليلي أو النهاري والعربي/الإنجليزي", "Dark/light mode & Arabic/English")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SettingsCard>

          </TabsContent>

          {/* ── Tab: Notifications ── */}
          <TabsContent value="notifications" className="space-y-8">

            {/* Connected Apps */}
            <SettingsCard delay={0.08}>
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {t("التطبيقات المرتبطة", "Connected Apps")}
              </span>
              <div className="space-y-3">
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 bg-card rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4285F4" strokeWidth="1.5"/>
                        <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5"/>
                        <path d="M8 2v3M16 2v3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="12" cy="15" r="2" fill="#34A853"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm font-label text-foreground">Google Calendar</p>
                        {calendarConnected && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {t("مرتبط", "Connected")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {calendarConnected
                          ? t("أحداث Google Calendar تظهر في تقويمك", "Google Calendar events appear in your calendar")
                          : t("اربط تقويم Google لتظهر مواعيدك تلقائياً", "Connect to see your Google events automatically")}
                      </p>
                    </div>
                  </div>
                  {calendarConnected ? (
                    <button
                      onClick={handleDisconnectCalendar}
                      disabled={calendarLoading}
                      className="px-3 py-1.5 rounded-full border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                      {t("إلغاء الربط", "Disconnect")}
                    </button>
                  ) : (
                    <a
                      href="/api/google-calendar/connect"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground text-xs font-bold hover:shadow-md transition-shadow"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t("ربط", "Connect")}
                    </a>
                  )}
                </div>

                {calendarConnected && (
                  <div className="bg-card rounded-xl divide-y divide-border overflow-hidden">
                    {([
                      { key: "gcal_auto_sync" as const, ar: "مزامنة تلقائية مع Google Calendar", en: "Auto-sync to Google Calendar", descAr: "أضف كل خطة جديدة تلقائياً إلى تقويم Google", descEn: "Automatically add every new plan to Google Calendar" },
                      { key: "gcal_whatsapp_reminders" as const, ar: "تذكيرات WhatsApp للأحداث", en: "WhatsApp reminders for events", descAr: "أرسل لي رسالة WhatsApp قبل 30 دقيقة من كل حدث", descEn: "Send me a WhatsApp message 30 min before each event" },
                    ]).map(({ key, ar, en, descAr, descEn }) => (
                      <div key={key} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{t(ar, en)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t(descAr, descEn)}</p>
                        </div>
                        <button
                          onClick={() => handleToggleGcalPref(key)}
                          disabled={savingGcalPref === key}
                          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${gcalPrefs[key] ? "bg-amber-600" : "bg-muted"} disabled:opacity-50`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${gcalPrefs[key] ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* WhatsApp */}
                <div className="flex items-center justify-between p-4 bg-card rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm font-label text-foreground">WhatsApp</p>
                        {profile?.phone_number && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {t("نشط", "Active")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("تحدث مع مساعدك الذكي وتلقّى تذكيرات عبر واتساب", "Chat with your AI assistant and get reminders via WhatsApp")}
                      </p>
                    </div>
                  </div>
                  {profile?.phone_number ? (
                    <button
                      onClick={() => setWhatsappInstructionsOpen(true)}
                      className="px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      {t("كيف أستخدمه؟", "How to use")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setWhatsappConnectOpen(true)}
                      className="px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      {t("ربط", "Connect")}
                    </button>
                  )}
                </div>
              </div>
            </SettingsCard>

            {/* Notifications */}
            <SettingsCard delay={0.16}>
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                {t("الإشعارات", "Notifications")}
              </span>
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

            {/* ── Prayer Reminders ── */}
            <SettingsCard delay={0.22}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-2xl font-headline font-bold text-foreground">
                    {t("تذكيرات الصلاة", "Prayer Reminders")}
                  </h2>
                </div>
                {prayerLoaded && (
                  <div dir="ltr">
                    <Switch
                      checked={prayerEnabled}
                      onCheckedChange={(v) => {
                        setPrayerEnabled(v);
                        handleSavePrayer({ enabled: v });
                      }}
                      disabled={prayerSaving}
                    />
                  </div>
                )}
              </div>

              {!profile?.phone_number ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="font-bold mb-1">{t("رقم واتساب مطلوب", "WhatsApp number required")}</p>
                    <p className="text-xs opacity-80">{t("أضف رقمك في تبويب الملف الشخصي لتفعيل تذكيرات الصلاة عبر واتساب.", "Add your number in the Profile tab to receive prayer reminders on WhatsApp.")}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "سيرسل لك واتساب تنبيهاً قبل 5 دقائق من كل صلاة وعند حلول الوقت.",
                      "You'll get a WhatsApp message 5 min before each prayer and at prayer time."
                    )}
                  </p>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-label font-semibold text-foreground">
                      {t("المدينة", "City")}
                    </label>
                    <Select value={prayerCity} onValueChange={setPrayerCity}>
                      <SelectTrigger className="w-full rounded-xl border-border bg-card text-foreground text-sm h-11 focus:ring-amber-600/40 focus:ring-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="shell-panel border-border rounded-xl max-h-64">
                        {[
                          { key: "riyadh",         ar: "الرياض",           en: "Riyadh" },
                          { key: "jeddah",         ar: "جدة",              en: "Jeddah" },
                          { key: "makkah",         ar: "مكة المكرمة",     en: "Makkah" },
                          { key: "madinah",        ar: "المدينة المنورة",  en: "Madinah" },
                          { key: "dammam",         ar: "الدمام",           en: "Dammam" },
                          { key: "khobar",         ar: "الخبر",            en: "Al Khobar" },
                          { key: "ahsa",           ar: "الأحساء",          en: "Al-Ahsa" },
                          { key: "jubail",         ar: "الجبيل",           en: "Jubail" },
                          { key: "tabuk",          ar: "تبوك",             en: "Tabuk" },
                          { key: "buraidah",       ar: "بريدة",            en: "Buraidah" },
                          { key: "hail",           ar: "حائل",             en: "Hail" },
                          { key: "abha",           ar: "أبها",             en: "Abha" },
                          { key: "khamis mushait", ar: "خميس مشيط",       en: "Khamis Mushait" },
                          { key: "taif",           ar: "الطائف",           en: "Taif" },
                          { key: "yanbu",          ar: "ينبع",             en: "Yanbu" },
                          { key: "najran",         ar: "نجران",            en: "Najran" },
                          { key: "jizan",          ar: "جازان",            en: "Jazan" },
                          { key: "baha",           ar: "الباحة",           en: "Al Baha" },
                          { key: "arar",           ar: "عرعر",             en: "Arar" },
                          { key: "sakaka",         ar: "سكاكا",            en: "Sakaka" },
                          { key: "hafr al batin",  ar: "حفر الباطن",       en: "Hafr Al-Batin" },
                        ].map(({ key, ar, en }) => (
                          <SelectItem key={key} value={key} className="text-sm cursor-pointer">
                            {t(ar, en)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prayers */}
                  <div className="space-y-2">
                    <p className="text-sm font-label font-semibold text-foreground">{t("الصلوات", "Prayers")}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { key: "fajr",    ar: "الفجر",   en: "Fajr",    icon: "🌄" },
                        { key: "dhuhr",   ar: "الظهر",   en: "Dhuhr",   icon: "☀️" },
                        { key: "asr",     ar: "العصر",   en: "Asr",     icon: "🌤" },
                        { key: "maghrib", ar: "المغرب",  en: "Maghrib", icon: "🌇" },
                        { key: "isha",    ar: "العشاء",  en: "Isha",    icon: "🌙" },
                      ].map(({ key, ar, en, icon }) => {
                        const active = prayerPrayers.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPrayerPrayers(p =>
                              active ? p.filter(x => x !== key) : [...p, key]
                            )}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-bold font-label transition-all ${
                              active
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                : "border-border bg-card text-muted-foreground hover:border-amber-300"
                            }`}
                          >
                            <span className="text-base">{icon}</span>
                            <span>{t(ar, en)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSavePrayer()}
                    disabled={prayerSaving}
                    className="w-full py-3 rounded-full power-gradient btn-glow text-white font-bold font-label disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {prayerSaving
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جاري الحفظ...", "Saving...")}</>
                      : t("حفظ تذكيرات الصلاة", "Save Prayer Reminders")}
                  </button>
                </div>
              )}
            </SettingsCard>

          </TabsContent>

          {/* ── Tab: Security ── */}
          <TabsContent value="security" className="space-y-8">

            {/* Privacy & Security */}
            <SettingsCard delay={0.05} className="border-l-4 border-amber-500">
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {t("الخصوصية والأمان", "Privacy & Security")}
              </span>
              <div className="space-y-4">
                <div className="p-5 bg-muted dark:bg-white/[0.03] rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground text-sm">{t("كلمة المرور", "Password")}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{t("غيّر كلمة مرور حسابك", "Change your account password")}</p>
                  </div>
                  <Link href="/vault/settings/security/change-password"
                    className="px-4 py-2 rounded-full border border-amber-500 text-amber-600 dark:text-amber-400 font-bold text-sm hover:bg-amber-50 transition-colors font-label">
                    {t("تغيير", "Change")}
                  </Link>
                </div>
                <div className="p-6 bg-red-50/50 rounded-xl border border-red-200/30">
                  <h3 className="text-red-600 font-headline font-bold mb-2">
                    {t("منطقة الخطر", "Danger Zone")}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
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
                    <button
                      onClick={() => { setDeleteOpen(true); setDeleteConfirm(""); }}
                      className="px-5 py-2.5 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors font-label flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("حذف الحساب", "Delete Account")}
                    </button>
                  </div>
                </div>
              </div>
            </SettingsCard>


            {/* Export Data */}
            <SettingsCard delay={0.2}>
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {t("تصدير البيانات", "Export Data")}
              </span>
              <p className="text-sm text-muted-foreground mb-5">
                {t(
                  "حمّل بياناتك الشخصية في أي وقت بصيغة CSV أو PDF.",
                  "Download your personal data at any time in CSV or PDF format."
                )}
              </p>
              <div className="space-y-3">
                {/* Plans & Tasks */}
                <div className="flex items-center gap-2 p-4 bg-card rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-label text-foreground">
                      {t("الخطط والمهام", "Plans & Tasks")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("جميع خططك ومهامك", "All your plans and tasks")}
                    </p>
                  </div>
                  <a
                    href="/api/export/plans"
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-muted hover:bg-muted transition-colors shrink-0"
                    title={t("تحميل CSV", "Download CSV")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </a>
                  <button
                    onClick={() => handleExportPDF("plans")}
                    disabled={exportingPdf === "plans"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-[#1e42a8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
                    title={t("تحميل PDF", "Download PDF")}
                  >
                    {exportingPdf === "plans" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                </div>

                {/* Memories */}
                <div className="flex items-center gap-2 p-4 bg-card rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-label text-foreground">
                      {t("الذكريات", "Memories")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("جميع ذكرياتك المحفوظة", "All your saved memories")}
                    </p>
                  </div>
                  <a
                    href="/api/export/memories"
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-muted hover:bg-muted transition-colors shrink-0"
                    title={t("تحميل CSV", "Download CSV")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </a>
                  <button
                    onClick={() => handleExportPDF("memories")}
                    disabled={exportingPdf === "memories"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-[#1e42a8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
                    title={t("تحميل PDF", "Download PDF")}
                  >
                    {exportingPdf === "memories" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                </div>

                {/* Habits */}
                <div className="flex items-center gap-2 p-4 bg-card rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-label text-foreground">
                      {t("العادات", "Habits")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("جميع عاداتك وسلاسلك", "All your habits and streaks")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportPDF("habits")}
                    disabled={exportingPdf === "habits"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-[#1e42a8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
                    title={t("تحميل PDF", "Download PDF")}
                  >
                    {exportingPdf === "habits" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                </div>

                {/* Goals */}
                <div className="flex items-center gap-2 p-4 bg-card rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-label text-foreground">
                      {t("الأهداف", "Goals")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("جميع أهدافك وتقدمها", "All your goals and progress")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportPDF("goals")}
                    disabled={exportingPdf === "goals"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-[#1e42a8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
                    title={t("تحميل PDF", "Download PDF")}
                  >
                    {exportingPdf === "goals" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                </div>
              </div>
            </SettingsCard>

            {/* Data & Privacy (PDPL) */}
            <SettingsCard delay={0.24} className="border-l-4 border-amber-600">
              <span className="eyebrow-badge mb-6 inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {t("البيانات والخصوصية", "Data & Privacy")}
              </span>
              <p className="text-sm text-muted-foreground mb-5">
                {t(
                  "بموجب نظام PDPL يمكنك تصدير جميع بياناتك أو حذف حسابك نهائياً.",
                  "Under PDPL you can export all your data or permanently delete your account."
                )}
              </p>
              <div className="space-y-3">
                {/* Export full data */}
                <div className="flex items-center justify-between p-4 bg-card rounded-xl">
                  <div>
                    <p className="font-label font-bold text-sm text-foreground">
                      {t("تصدير جميع بياناتي", "Export All My Data")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("ملف JSON يحتوي على كل بياناتك", "A JSON file with all your data")}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/user/export")
                        if (!res.ok) throw new Error("Export failed")
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = "thakirni-data-export.json"
                        a.click()
                        URL.revokeObjectURL(url)
                        toast.success(t("تم تصدير بياناتك بنجاح", "Data exported successfully"))
                      } catch {
                        toast.error(t("فشل التصدير", "Export failed"))
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-600 text-amber-600 dark:text-amber-400 font-bold text-sm hover:bg-amber-100 dark:bg-amber-950/60 transition-colors font-label shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    {t("تصدير", "Export")}
                  </button>
                </div>

                {/* Delete account via compliance route */}
                <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <div>
                    <p className="font-label font-bold text-sm text-red-700">
                      {t("حذف حسابي نهائياً", "Delete My Account")}
                    </p>
                    <p className="text-xs text-red-400 mt-0.5">
                      {t("يحذف كل بياناتك ولا يمكن التراجع عنه", "Deletes all your data — irreversible")}
                    </p>
                  </div>
                  <button
                    onClick={() => { setDeleteOpen(true); setDeleteConfirm(""); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors font-label shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("حذف", "Delete")}
                  </button>
                </div>

                {/* Privacy policy link */}
                <div className="text-center pt-1">
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-label"
                  >
                    {t("قراءة سياسة الخصوصية", "Read Privacy Policy")}
                  </a>
                  {" · "}
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-label"
                  >
                    {t("شروط الخدمة", "Terms of Service")}
                  </a>
                </div>
              </div>
            </SettingsCard>

          </TabsContent>

          {/* ── Tab: Subscription ── */}
          <TabsContent value="subscription" className="space-y-8">

            <SettingsCard delay={0.08} className="relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="eyebrow-badge inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    {t("الاشتراك", "Subscription")}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-label"
                    style={{ background: planBadge.bg, color: planBadge.color }}
                  >
                    {planBadge.label}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  {resolvedTier === "free"
                    ? t("أنت على الخطة المجانية", "You're on the Free plan")
                    : resolvedTier === "pro"
                    ? t(`أنت على خطة برو — ${proPrice} ر.س / شهر`, `You're on Pro — ${proPrice} SAR/mo`)
                    : t(`أنت على خطة الفرق — ${teamsPrice} ر.س / شهر / مستخدم`, `You're on Teams — ${teamsPrice} SAR/mo per user`)}
                </p>
                <div className="space-y-3 mb-8">
                  {planFeatures.map(({ ar, en }) => (
                    <div key={en} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm">{t(ar, en)}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setBillingOpen(true)}
                  className="w-full py-4 rounded-full bg-card text-foreground font-headline font-bold shadow-sm hover:shadow-md transition-all"
                >
                  {t("إدارة الفواتير", "Manage Billing")}
                </button>
                {isPaid && !subscription?.cancel_at_period_end && (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="w-full mt-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center"
                  >
                    {t("إلغاء الاشتراك", "Cancel subscription")}
                  </button>
                )}
                {subscription?.cancel_at_period_end && (
                  <p className="w-full mt-3 text-xs text-slate-400 text-center">
                    {t("تم جدولة الإلغاء — نشط حتى نهاية فترة الفوترة", "Cancellation scheduled — active until end of billing period")}
                  </p>
                )}
              </div>
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="w-40 h-40 text-amber-600 dark:text-amber-400" />
              </div>
            </SettingsCard>

            {(resolvedTier === "teams") && (
              <SettingsCard delay={0.12} className="border-l-4 border-amber-600">
                <div className="mb-6">
                  <span className="eyebrow-badge inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {t("دعوة أعضاء", "Invite Members")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("ادعُ زملاءك لينضموا إلى فريقك.", "Invite teammates to join your team.")}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("البريد الإلكتروني", "Email address") as string}
                    dir="ltr"
                    className="rounded-xl bg-card border-border flex-1"
                  />
                  <button
                    onClick={handleSendInvite}
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className="px-5 py-2 rounded-full power-gradient btn-glow text-white font-bold text-sm disabled:opacity-50 transition-all hover:opacity-90"
                  >
                    {sendingInvite
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      : t("إرسال", "Send")}
                  </button>
                </div>
              </SettingsCard>
            )}

            <ReferralCard />
            <AffiliateCard />

          </TabsContent>

        </Tabs>
        </div>
        </div>{/* end px-4 sm:px-8 pb-20 */}
      </main>

      {/* Change email dialog */}
      <AlertDialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("تغيير البريد الإلكتروني", "Change Email Address")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {changeEmailSent
                ? t("تم إرسال رابط التأكيد إلى بريدك الجديد. افتح رسالة التأكيد لإتمام التغيير.", "A confirmation link was sent to your new email. Open the email to confirm the change.")
                : t("أدخل بريدك الإلكتروني الجديد. سنرسل رابط تأكيد.", "Enter your new email address. We'll send a confirmation link.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!changeEmailSent && (
            <div className="py-2">
              <Label className="text-sm text-muted-foreground">{t("البريد الجديد", "New email")}</Label>
              <Input
                type="email"
                className="mt-2"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                onKeyDown={(e) => { if (e.key === "Enter") handleChangeEmail(); }}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingEmail}>{t("إلغاء", "Cancel")}</AlertDialogCancel>
            {!changeEmailSent && (
              <AlertDialogAction onClick={handleChangeEmail} disabled={changingEmail || !newEmail.trim()}>
                {changingEmail
                  ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t("جاري الإرسال...", "Sending...")}</span>
                  : t("إرسال رابط التأكيد", "Send Confirmation Link")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Delete account dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t("حذف الحساب نهائياً؟", "Delete Account Permanently?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "سيتم حذف جميع بياناتك نهائياً: الذكريات، الخطط، العادات، الأهداف، والتسجيلات. هذا الإجراء لا يمكن التراجع عنه.",
                "All your data will be permanently deleted: memories, plans, habits, goals, and recordings. This cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
              {t('اكتب "DELETE" للتأكيد', 'Type "DELETE" to confirm')}
            </Label>
            <Input
              id="delete-confirm"
              className="mt-2"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("إلغاء", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t("حذف حسابي نهائياً", "Delete My Account")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel subscription confirmation dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("إلغاء الاشتراك", "Cancel Subscription")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "هل أنت متأكد؟ ستفقد الوصول إلى الميزات المدفوعة في نهاية فترة الفوترة الحالية.",
                "Are you sure? You'll lose access to paid features at the end of your current billing period."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t("إبقاء الاشتراك", "Keep Subscription")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("جاري الإلغاء...", "Cancelling...")}
                </span>
              ) : t("نعم، إلغاء الاشتراك", "Yes, Cancel Subscription")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Billing / upgrade modal */}
      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        currentTier={resolvedTier}
        userEmail={email}
        onUpgradeComplete={(newTier) => setCurrentTier(newTier)}
      />

      {/* WhatsApp Connect dialog */}
      <AlertDialog open={whatsappConnectOpen} onOpenChange={setWhatsappConnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("ربط واتساب", "Connect WhatsApp")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {t(
                    "بربط واتساب ستتمكن من التحدث مع مساعدك الذكي وتلقّي التذكيرات مباشرةً عبر تطبيق واتساب.",
                    "By connecting WhatsApp you can chat with your AI assistant and receive reminders directly in WhatsApp."
                  )}
                </p>
                <p>
                  {t(
                    "لربط واتساب، أضف رقم هاتفك في حقل الجوال في ملفك الشخصي ثم أرسل رسالة إلى الرقم المخصص.",
                    "To connect, add your phone number in the profile section below, then send a message to the dedicated number."
                  )}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("لاحقاً", "Later")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setWhatsappConnectOpen(false);
                // Scroll to phone field
                setTimeout(() => {
                  document.getElementById("phone-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }}
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            >
              {t("أضف رقم الجوال", "Add Phone Number")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Instructions dialog */}
      <AlertDialog open={whatsappInstructionsOpen} onOpenChange={setWhatsappInstructionsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("كيف تستخدم واتساب", "How to Use WhatsApp")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {t("ابدأ محادثتك مع المساعد الذكي عبر واتساب:", "Start chatting with your AI assistant on WhatsApp:")}
                </p>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <img
                    src="/whatsapp-qr.png"
                    alt="WhatsApp QR Code"
                    className="w-44 h-44 rounded-xl border border-border"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {t("امسح الكود بكاميرا هاتفك للانتقال مباشرة", "Scan with your phone camera to open directly")}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex-1 h-px bg-muted" />
                  {t("أو", "or")}
                  <div className="flex-1 h-px bg-muted" />
                </div>

                <ol className="space-y-3 list-none">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>
                      {t(
                        "احفظ رقم ذاكرني في هاتفك:",
                        "Save the Thakirni number in your contacts:"
                      )}
                      {" "}
                      <span className="font-bold text-foreground font-mono" dir="ltr">+966 55 475 1681</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>
                      {t(
                        'أرسل رسالة "مرحبا" أو "hi" لبدء المحادثة.',
                        'Send "hi" or "مرحبا" to start the conversation.'
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>
                      {t(
                        "يمكنك إضافة ذكريات، إنشاء خطط يومية، وتلقّي التذكيرات مباشرةً في واتساب.",
                        "You can add memories, create daily plans, and receive reminders directly in WhatsApp."
                      )}
                    </span>
                  </li>
                </ol>
                <div className="p-3 bg-[#25D366]/10 rounded-xl text-[#1a9e4e] text-xs font-medium">
                  {t(
                    "تأكد من أن رقمك المسجل في ملفك الشخصي هو نفسه رقم واتساب.",
                    "Make sure the phone number in your profile matches your WhatsApp number."
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setWhatsappInstructionsOpen(false)}
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            >
              {t("فهمت", "Got it")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
