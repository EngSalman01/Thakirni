"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Moon,
  Smartphone,
  Mail,
  Lock,
  LogOut,
  Crown,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { WhatsAppConnect } from "@/components/thakirni/whatsapp-connect";
import { toast } from "sonner";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    friday: true,
  });
  const [whatsappNumber, setWhatsappNumber] = useState<string | undefined>();
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  const handleWhatsAppConnect = async (phoneNumber: string) => {
    const res = await fetch("/api/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) throw new Error("Failed to connect");
    setWhatsappNumber(phoneNumber);
  };

  const handleWhatsAppVerify = async (code: string) => {
    const res = await fetch("/api/whatsapp/connect", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setWhatsappVerified(true);
      return true;
    }
    return false;
  };

  const handleWhatsAppDisconnect = async () => {
    await fetch("/api/whatsapp/connect", { method: "DELETE" });
    setWhatsappNumber(undefined);
    setWhatsappVerified(false);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("تم تحديث الإعدادات");
  };

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="me-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  الملف الشخصي
                </h2>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-2xl font-bold">م</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">محمد أحمد</p>
                  <p className="text-sm text-muted-foreground">
                    mohammed@example.com
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input id="name" defaultValue="محمد أحمد" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="mohammed@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    defaultValue="+966 50 123 4567"
                    className="mt-1"
                  />
                </div>
                <Button className="w-full">حفظ التغييرات</Button>
              </div>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  الإشعارات
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        إشعارات البريد
                      </p>
                      <p className="text-xs text-muted-foreground">
                        استلام التذكيرات عبر البريد
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange("email")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        إشعارات الهاتف
                      </p>
                      <p className="text-xs text-muted-foreground">
                        إشعارات فورية على الهاتف
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange("push")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        تذكيرات الجمعة
                      </p>
                      <p className="text-xs text-muted-foreground">
                        رسائل جمعة مباركة أسبوعية
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
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  الاشتراك
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Plan */}
                <Card className="p-4 border-2 border-border">
                  <h3 className="text-lg font-bold text-foreground text-center">
                    الباقة المجانية
                  </h3>
                  <p className="text-center text-2xl font-bold text-primary my-2">
                    مجاني
                  </p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    للاستخدام الشخصي
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      ذاكرة محدودة
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      مساعد ذكي أساسي
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    disabled
                  >
                    الخطة الحالية
                  </Button>
                </Card>

                {/* Pro Plan */}
                <Card className="p-4 border-2 border-primary relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-xl font-bold">
                    الأكثر شيوعاً
                  </div>
                  <h3 className="text-lg font-bold text-foreground text-center">
                    برو
                  </h3>
                  <p className="text-center text-2xl font-bold text-primary my-2">
                    ٣٠ ريال
                    <span className="text-sm text-muted-foreground">/شهر</span>
                  </p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    للمستخدمين النشطين
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      ذاكرة غير محدودة
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      أولوية في الدعم
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      تحليل متقدم
                    </li>
                  </ul>
                  <Button className="w-full" variant="default" disabled>
                    قريباً
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
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  الأمان
                </h2>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent"
                >
                  <Lock className="w-4 h-4" />
                  تغيير كلمة المرور
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج من جميع الأجهزة
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* WhatsApp Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <WhatsAppConnect
              currentNumber={whatsappNumber}
              isVerified={whatsappVerified}
              onConnect={handleWhatsAppConnect}
              onVerify={handleWhatsAppVerify}
              onDisconnect={handleWhatsAppDisconnect}
            />
          </motion.div>

          {/* Language & Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  اللغة والمظهر
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">اللغة</p>
                    <p className="text-xs text-muted-foreground">
                      اختر لغة التطبيق
                    </p>
                  </div>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">المظهر</p>
                    <p className="text-xs text-muted-foreground">
                      الوضع الليلي أو النهاري
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
