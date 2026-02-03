"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CreditCard,
  Puzzle,
  Brain,
  ShieldAlert,
  Save,
  LogOut,
  Upload,
  Smartphone,
  Calendar as CalendarIcon,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";

export default function SettingsPage() {
  const { t, isArabic } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    bio: "",
    email: "",
    avatar_url: "",
  });

  // Load Profile
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(
          data
            ? {
                ...data,
                email: user.email,
              }
            : { email: user.email },
        );
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile.full_name,
        updated_at: new Date().toISOString(),
        // Bio field might need to be added to DB if not exists, skipping for now or assumed valid
      });

      if (error) throw error;
      toast.success(t("تم حفظ التغييرات", "Changes saved successfully"));
    } catch (e) {
      toast.error(t("فشل الحفظ", "Failed to save"));
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "general", labelAr: "عام", labelEn: "General", icon: User },
    {
      id: "subscription",
      labelAr: "الاشتراك",
      labelEn: "Subscription",
      icon: CreditCard,
    },
    {
      id: "integrations",
      labelAr: "التكاملات",
      labelEn: "Integrations",
      icon: Puzzle,
    },
    { id: "brain", labelAr: "عقلي الثاني", labelEn: "My Brain", icon: Brain },
    {
      id: "legacy",
      labelAr: "الأمان والتركة",
      labelEn: "Legacy & Security",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <VaultSidebar />

      <main className="flex-1 lg:me-64 p-4 lg:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">
            {t("الإعدادات", "Settings")}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-start",
                    activeTab === item.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{isArabic ? item.labelAr : item.labelEn}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* GENERAL TAB */}
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>
                            {t("الملف الشخصي", "Profile Info")}
                          </CardTitle>
                          <CardDescription>
                            {t(
                              "معلوماتك الشخصية وتفضيلاتك",
                              "Your personal information and preferences",
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center relative group cursor-pointer overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                              {profile.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium">
                                {t("صورة الملف الشخصي", "Profile Picture")}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {t(
                                  "انقر لرفع صورة جديدة",
                                  "Click to upload new picture",
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>{t("الاسم الكامل", "Full Name")}</Label>
                              <Input
                                value={profile.full_name || ""}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    full_name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("البريد الإلكتروني", "Email")}</Label>
                              <Input
                                value={profile.email || ""}
                                disabled
                                className="bg-muted/50"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>{t("نبذة عنك", "Bio")}</Label>
                              <Input
                                value={profile.bio || ""}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    bio: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "أخبرنا قليلاً عن نفسك...",
                                  "Tell us a little about yourself...",
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-border pt-6">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="gap-2"
                          >
                            {loading ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {t("حفظ التغييرات", "Save Changes")}
                          </Button>
                        </CardFooter>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>{t("التفضيلات", "Preferences")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-md shadow-sm border border-border">
                                <ThemeToggle />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {t("المظهر", "Appearance")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t(
                                    "اختر المظهر الفاتح أو الداكن",
                                    "Choose light or dark mode",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-md shadow-sm border border-border">
                                <LanguageToggle />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {t("اللغة", "Language")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t(
                                    "العربية أو الإنجليزية",
                                    "Arabic or English",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* SUBSCRIPTION TAB */}
                  {activeTab === "subscription" && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-card border-border border-primary/30 shadow-lg shadow-primary/5 relative overflow-hidden">
                          <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-xl font-bold">
                            Active
                          </div>
                          <CardHeader>
                            <CardTitle className="lg:text-2xl">
                              {t("الباقة المجانية", "Free Plan")}
                            </CardTitle>
                            <CardDescription>
                              {t(
                                "مثالية للاستخدام الشخصي البسيط",
                                "Perfect for personal use",
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm mb-6">
                              <li className="flex gap-2 items-center">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                                {t(
                                  "ذاكرة غير محدودة (نصية)",
                                  "Unlimited text memories",
                                )}
                              </li>
                              <li className="flex gap-2 items-center">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                                {t("٥٠٠ ميجابايت تخزين", "500MB Storage")}
                              </li>
                              <li className="flex gap-2 items-center">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                                {t("مساعد ذكي أساسي", "Basic AI Assistant")}
                              </li>
                            </ul>
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              disabled={loading}
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  const response = await fetch(
                                    "/api/stripe/checkout",
                                    { method: "POST" },
                                  );
                                  if (!response.ok)
                                    throw new Error(
                                      "Network response was not ok",
                                    );
                                  const data = await response.json();
                                  window.location.href = data.url;
                                } catch (error) {
                                  console.error(error);
                                  toast.error(
                                    t("حدث خطأ ما", "Something went wrong"),
                                  );
                                  setLoading(false);
                                }
                              }}
                            >
                              {loading ? (
                                <span className="animate-spin mr-2">⏳</span>
                              ) : null}
                              {t("الترقية إلى برو", "Upgrade to Pro")}
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle>
                              {t("الاستهلاك", "Usage Metrics")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {t("تخزين الذكريات", "Memory Storage")}
                                </span>
                                <span className="text-muted-foreground">
                                  45%
                                </span>
                              </div>
                              <Progress
                                value={45}
                                className="bg-muted"
                                indicatorClassName="bg-green-500"
                              />
                              <p className="text-xs text-muted-foreground">
                                225MB / 500MB
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {t("رسائل الذكاء الاصطناعي", "AI Messages")}
                                </span>
                                <span className="text-amber-500 font-medium">
                                  80%
                                </span>
                              </div>
                              <Progress
                                value={80}
                                className="bg-muted"
                                indicatorClassName="bg-amber-500"
                              />
                              <p className="text-xs text-muted-foreground">
                                80 / 100 {t("رسالة يومياً", "messages/day")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>
                            {t("سجل الفواتير", "Billing History")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-sm text-start">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="p-3 text-start">
                                    {t("التاريخ", "Date")}
                                  </th>
                                  <th className="p-3 text-start">
                                    {t("المبلغ", "Amount")}
                                  </th>
                                  <th className="p-3 text-start">
                                    {t("الحالة", "Status")}
                                  </th>
                                  <th className="p-3 text-start"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                <tr className="hover:bg-muted/30">
                                  <td className="p-3">Oct 01, 2025</td>
                                  <td className="p-3">$0.00</td>
                                  <td className="p-3">
                                    <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-xs">
                                      Paid
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* INTEGRATIONS TAB */}
                  {activeTab === "integrations" && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-1 gap-4">
                        <IntegrationCard
                          icon={Smartphone}
                          color="text-green-500"
                          title="WhatsApp"
                          description={t(
                            "تلقي التذكيرات والمحادثة عبر واتساب",
                            "Receive reminders and chat via WhatsApp",
                          )}
                          status="connected"
                          t={t}
                        />
                        <IntegrationCard
                          icon={CalendarIcon}
                          color="text-blue-500"
                          title="Google Calendar"
                          description={t(
                            "مزامنة الاجتماعات والمواعيد تلقائياً",
                            "Sync meetings and appointments automatically",
                          )}
                          status="disconnected"
                          t={t}
                        />
                        <IntegrationCard
                          icon={HardDrive}
                          color="text-orange-500"
                          title="Google Drive / Notion"
                          description={t(
                            "استيراد الملفات والمستندات",
                            "Import files and documents",
                          )}
                          status="coming_soon"
                          t={t}
                        />
                      </div>
                    </div>
                  )}

                  {/* MY BRAIN TAB */}
                  {activeTab === "brain" && (
                    <div className="space-y-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>
                            {t("شخصية المساعد", "AI Personality")}
                          </CardTitle>
                          <CardDescription>
                            {t(
                              "كيف تريد أن يتحدث معك ذكرني؟",
                              "How do you want Thakirni to talk to you?",
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                          {["professional", "friendly", "strict"].map(
                            (style) => (
                              <div
                                key={style}
                                className={`cursor-pointer border-2 rounded-xl p-4 text-center hover:border-primary transition-colors ${style === "friendly" ? "border-primary bg-primary/5" : "border-border"}`}
                              >
                                <div className="mb-2 text-2xl">
                                  {style === "professional"
                                    ? "👔"
                                    : style === "friendly"
                                      ? "😊"
                                      : "🧐"}
                                </div>
                                <div className="font-semibold capitalize">
                                  {style}
                                </div>
                              </div>
                            ),
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>
                            {t("قواعد الذاكرة", "Memory Scope")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">
                                {t(
                                  "حفظ المعلومات الطبية",
                                  "Remember Medical Info",
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {t(
                                  "الأدوية، المواعيد، النتائج",
                                  "Meds, Appointments, Results",
                                )}
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">
                                {t(
                                  "تجاهل المعلومات المالية",
                                  "Ignore Financial Data",
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {t(
                                  "أرقام البطاقات، الأرصدة البنكية",
                                  "Card numbers, Bank balances",
                                )}
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex justify-end">
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          {t(
                            "محو الذاكرة قصيرة المدى",
                            "Clear Short-term Memory",
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* LEGACY TAB */}
                  {activeTab === "legacy" && (
                    <div className="space-y-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>
                            {t("تصدير البيانات", "Export Data")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            variant="outline"
                            className="gap-2 w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4" />
                            {t("تنزيل نسخة (JSON)", "Download Backup (JSON)")}
                          </Button>
                        </CardContent>
                      </Card>

                      <div className="border border-destructive/50 rounded-xl p-6 bg-destructive/10 mt-8">
                        <h3 className="text-destructive font-bold text-lg mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          {t("منطقة الخطر", "Danger Zone")}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {t(
                            "حذف الحساب نهائي ولا يمكن التراجع عنه. سيتم حذف جميع الذكريات.",
                            "Deleting account is permanent. All memories will be lost.",
                          )}
                        </p>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                        >
                          {t(
                            "حذف الحساب نهائياً",
                            "Delete Account Permanently",
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  color,
  title,
  description,
  status,
  t,
}: any) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-full bg-muted",
            color.replace("text-", "bg-").replace("500", "500/10"),
          )}
        >
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div>
        {status === "connected" && (
          <Button
            variant="outline"
            className="text-green-500 border-green-500/20 hover:bg-green-500/10 gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t("متصل", "Connected")}
          </Button>
        )}
        {status === "disconnected" && <Switch />}
        {status === "coming_soon" && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {t("قريباً", "Coming Soon")}
          </span>
        )}
      </div>
    </div>
  );
}
