"use client";

import React from "react";
import { useLanguage } from "@/components/language-provider";

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">{t("الإعدادات", "Settings")}</h1>
      <p className="text-muted-foreground">
        {t("إعدادات الحساب والتطبيق.", "Account and application settings.")}
      </p>
    </div>
  );
}
