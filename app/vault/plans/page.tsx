"use client";

import React from "react";
import { useLanguage } from "@/components/language-provider";

export default function PlansPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">{t("خططي", "My Plans")}</h1>
      <p className="text-muted-foreground">
        {t(
          "هنا يمكنك عرض وإدارة خططك.",
          "Here you can view and manage your plans.",
        )}
      </p>
    </div>
  );
}
