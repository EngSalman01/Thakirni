"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sun, Loader2, Calendar } from "lucide-react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function DailySummary() {
  const { plans, isLoading } = usePlans();
  const { t, isArabic } = useLanguage();
  const [summary, setSummary] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isLoading || plans.length === 0) return;

    // Filter for today's plans
    const today = new Date().toISOString().split("T")[0];
    const todaysPlans = plans.filter(
      (p) => p.reminder_date && p.reminder_date.startsWith(today),
    );

    if (todaysPlans.length === 0) {
      setSummary(t("ليس لديك أي شيء اليوم.", "You have nothing today."));
      return;
    }

    const generateSummary = async () => {
      setGenerating(true);
      try {
        // Simple heuristic summary for speed/safety as requested first
        // "Good morning! You have 3 meetings today..."
        const tasks = todaysPlans.filter((p) => p.category === "task").length;
        const meetings = todaysPlans.filter(
          (p) => p.category === "meeting",
        ).length;
        const groceries = todaysPlans.filter(
          (p) => p.category === "grocery",
        ).length;

        const time = new Date().getHours();
        let greeting = t("صباح الخير", "Good morning");
        if (time >= 12 && time < 17)
          greeting = t("مساؤك سعيد", "Good afternoon");
        if (time >= 17) greeting = t("مساء الخير", "Good evening");

        let text = `${greeting}! ${t("لديك اليوم", "You have today")}: `;
        const parts = [];
        if (meetings > 0)
          parts.push(`${meetings} ${t("اجتماعات", "meetings")}`);
        if (tasks > 0) parts.push(`${tasks} ${t("مهام", "tasks")}`);
        if (groceries > 0)
          parts.push(`${groceries} ${t("أغراض للشراء", "grocery items")}`);

        text += parts.join(" " + t("و", "and") + " ");

        // Find first event time
        const firstEvent = todaysPlans.sort((a, b) =>
          (a.reminder_date || "").localeCompare(b.reminder_date || ""),
        )[0];
        if (firstEvent && firstEvent.reminder_date) {
          const timeStr = new Date(firstEvent.reminder_date).toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" },
          );
          text += `. ${t("أول موعد لك في الساعة", "Your first event is at")} ${timeStr}`;
        }

        setSummary(text + ".");
      } catch (e) {
        console.error("Summary generation failed", e);
        setSummary(t("نتمنى لك يوماً سعيداً!", "Have a great day!"));
      } finally {
        setGenerating(false);
      }
    };

    generateSummary();
  }, [plans, isLoading, t]);

  if (isLoading || generating) {
    return (
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Sun className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-primary/10 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-primary/10 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sun className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            {t("ملخص اليوم", "Morning Briefing")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
