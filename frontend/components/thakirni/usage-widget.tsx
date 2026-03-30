"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

interface FeatureUsage {
  used: number;
  limit: number;
}

interface UsageData {
  ai_chat?: FeatureUsage;
  meeting_summary?: FeatureUsage;
  document_ai?: FeatureUsage;
}

export function UsageWidget() {
  const { t } = useLanguage();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage/me")
      .then((r) => r.json())
      .then((d) => setUsage(d?.current ?? null))
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const features = [
    { key: "ai_chat", ar: "محادثات الذكاء", en: "AI Chat", ...(usage.ai_chat ?? { used: 0, limit: 0 }) },
    { key: "meeting_summary", ar: "ملخص الاجتماعات", en: "Meetings", ...(usage.meeting_summary ?? { used: 0, limit: 0 }) },
    { key: "document_ai", ar: "تحليل الوثائق", en: "Document AI", ...(usage.document_ai ?? { used: 0, limit: 0 }) },
  ].filter((f) => f.limit > 0);

  if (features.length === 0) return null;

  const isNearLimit = features.some((f) => f.used / f.limit >= 0.8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={`rounded-2xl p-5 border transition-colors ${
        isNearLimit
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
          : "bg-surface-container-lowest border-outline-variant/30"
      } shadow-ambient`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isNearLimit ? "text-amber-500" : "text-primary"}`} />
          <span
            className={`text-sm font-bold ${
              isNearLimit ? "text-amber-700 dark:text-amber-400" : "text-on-surface"
            }`}
          >
            {isNearLimit
              ? t("قربت تخلص استخدامك", "Approaching your limit")
              : t("استخدام هذا الشهر", "This month's usage")}
          </span>
        </div>
        {isNearLimit && (
          <Link href="/vault/settings/billing">
            <motion.span
              whileHover={{ scale: 1.04 }}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 underline cursor-pointer"
            >
              {t("طوّر اشتراكك 🔥", "Upgrade now 🔥")}
            </motion.span>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {features.map((f) => {
          const pct = Math.min(100, Math.round((f.used / f.limit) * 100));
          const warn = pct >= 80;
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-on-surface-variant">{t(f.ar, f.en)}</span>
                <span
                  className={`text-xs font-bold tabular ${
                    warn ? "text-amber-600" : "text-on-surface-variant"
                  }`}
                >
                  {f.used} / {f.limit}
                </span>
              </div>
              <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${warn ? "bg-amber-500" : "power-gradient"}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
