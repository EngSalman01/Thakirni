"use client";

import React from "react";
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
import { Badge } from "../../../components/ui/badge";
import { Check, Sparkles, CreditCard } from "lucide-react";
import Link from "next/link";

export default function PlansPage() {
  const { t, isArabic } = useLanguage();

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("خططي", "My Plans")}</h1>
        <p className="text-muted-foreground">
          {t(
            "إدارة خطتك الحالية والترقيات.",
            "Manage your current plan and upgrades.",
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="border-emerald-500/50 bg-emerald-500/5 items-start relative overflow-hidden">
          <div className="absolute top-0 end-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-emerald-500" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="default"
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {t("نشط حالياً", "Active Now")}
              </Badge>
            </div>
            <CardTitle className="text-2xl">
              {t("باقة الأفراد", "Individual Plan")}
            </CardTitle>
            <CardDescription>
              {t("الخطة المثالية للاستخدام الشخصي", "Perfect for personal use")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">29</span>
              <span className="text-xl font-medium text-emerald-600 dark:text-emerald-500">
                {t("ر.س", "SAR")}
              </span>
              <span className="text-muted-foreground">/ {t("شهر", "mo")}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t("ذاكرة غير محدودة", "Unlimited Memory")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>
                  {t("المساعد الذكي المتقدم", "Advanced AI Assistant")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t("نسخ احتياطي سحابي", "Cloud Backup")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              {t("إدارة الاشتراك", "Manage Subscription")}
            </Button>
          </CardFooter>
        </Card>

        {/* Upgrade / Payment Method */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("طريقة الدفع", "Payment Method")}
              </CardTitle>
              <CardDescription>
                {t("إدارة طرق الدفع المحفوظة", "Manage saved payment methods")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-3 border rounded-lg bg-card/50">
                <div className="w-10 h-8 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 opacity-50" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">
                    {t("تنتهي في 12/28", "Expires 12/28")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("تعديل", "Edit")}
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                {t("إضافة طريقة دفع", "Add Payment Method")}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("هل تحتاج للمزيد؟", "Need more?")}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {t(
                  "ترقية للباقة العائلية أو الشركات",
                  "Upgrade to Family or Company plans",
                )}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-white text-black hover:bg-zinc-200"
              >
                <Link href="/pricing">{t("عرض الباقات", "View Pricing")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
