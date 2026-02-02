"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Smartphone, Globe } from "lucide-react";

export default function SettingsPage() {
  const { t, isArabic } = useLanguage();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {t("الإعدادات", "Settings")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "إدارة ملفك الشخصي وتفضيلات التطبيق.",
            "Manage your profile and app preferences.",
          )}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">
            {t("الملف الشخصي", "Profile")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t("الإشعارات", "Notifications")}
          </TabsTrigger>
          <TabsTrigger value="general">{t("عام", "General")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" />
                <CardTitle>
                  {t("المعلومات الشخصية", "Personal Information")}
                </CardTitle>
              </div>
              <CardDescription>
                {t("تحديث معلومات حسابك", "Update your account details")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("الاسم الكامل", "Full Name")}</Label>
                <Input id="name" defaultValue="محمد أحمد" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
                <Input
                  id="email"
                  defaultValue="user@example.com"
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("رقم الهاتف", "Phone Number")}</Label>
                <Input id="phone" defaultValue="+966 50 000 0000" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>{t("حفظ التغييرات", "Save Changes")}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-500" />
                <CardTitle>
                  {t("تفضيلات الإشعارات", "Notification Preferences")}
                </CardTitle>
              </div>
              <CardDescription>
                {t(
                  "اختر كيف تريد أن نصل إليك",
                  "Choose how you want us to reach you",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    {t("إشعارات البريد الإلكتروني", "Email Notifications")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "استلام تحديثات ورسائل إخبارية",
                      "Receive updates and newsletters",
                    )}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("إشعارات الجوال", "Mobile Notifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "إشعارات فورية على هاتفك",
                      "Instant notifications on your phone",
                    )}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("تذكيرات الجمعة", "Friday Reminders")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "تذكير أسبوعي بقراءة سورة الكهف",
                      "Weekly reminder to read Surat Al-Kahf",
                    )}
                  </p>
                </div>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                <CardTitle>
                  {t("اللغة والمظهر", "Language & Appearance")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {t(
                    "يمكنك تغيير اللغة من الشريط الجانبي أو أسفل الصفحة.",
                    "You can change language from the sidebar or footer.",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
