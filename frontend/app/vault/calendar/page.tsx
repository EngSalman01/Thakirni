"use client";

import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Loader2, Calendar as CalendarIcon,
  ShoppingCart, CheckCircle2, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { useRouter } from "next/navigation";
import useSWR from "swr";

interface GoogleEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
  colorId?: string
}

async function fetchGoogleEvents(): Promise<{ connected: boolean; events: GoogleEvent[] }> {
  try {
    const res = await fetch("/api/google-calendar/events")
    if (!res.ok) return { connected: false, events: [] }
    return res.json()
  } catch {
    return { connected: false, events: [] }
  }
}

export default function CalendarPage() {
  const { plans, isLoading } = usePlans();
  const { t, isArabic } = useLanguage();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: gcal } = useSWR("google-calendar-events", fetchGoogleEvents, {
    revalidateOnFocus: false,
  })

  // Plans for selected date
  const selectedDateStr = date ? date.toISOString().split("T")[0] : "";
  const selectedPlans = plans.filter((p) => {
    if (!p.reminder_date) return false;
    return p.reminder_date.startsWith(selectedDateStr);
  });

  // Google Calendar events for selected date
  const selectedGoogleEvents = (gcal?.events ?? []).filter((e) => {
    const start = e.start?.dateTime ?? e.start?.date ?? ""
    return start.startsWith(selectedDateStr)
  })

  // Dates that have plans (for calendar dots)
  const datesWithPlans = new Set(
    plans
      .filter((p) => p.reminder_date)
      .map((p) => p.reminder_date!.split("T")[0]),
  );

  // Dates that have Google events
  const datesWithGoogleEvents = new Set(
    (gcal?.events ?? []).map((e) => {
      const start = e.start?.dateTime ?? e.start?.date ?? ""
      return start.split("T")[0]
    }).filter(Boolean)
  )

  function formatEventTime(e: GoogleEvent) {
    const raw = e.start?.dateTime ?? e.start?.date
    if (!raw) return ""
    try {
      return format(new Date(raw), "p", { locale: isArabic ? arSA : enUS })
    } catch { return "" }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VaultSidebar />

      <main className="lg:ms-72 p-4 md:p-6 lg:p-8 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <h1 className="text-2xl font-bold">{t("التقويم", "Calendar")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!gcal?.connected && (
              <Button variant="outline" size="sm" asChild>
                <a href="/api/google-calendar/connect">
                  <CalendarIcon className="w-4 h-4 me-2" />
                  {t("ربط Google Calendar", "Connect Google")}
                </a>
              </Button>
            )}
            <Button size="sm" onClick={() => router.push("/vault/plans")}>
              <Plus className="w-4 h-4 me-2" />
              {t("خطة جديدة", "New Plan")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Calendar Widget */}
          <div className="md:col-span-5 lg:col-span-4">
            <Card className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
                locale={isArabic ? arSA : enUS}
                modifiers={{
                  hasPlan: (d) => datesWithPlans.has(format(d, "yyyy-MM-dd")),
                  hasGoogleEvent: (d) => datesWithGoogleEvents.has(format(d, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasPlan: { fontWeight: "bold" },
                  hasGoogleEvent: { textDecoration: "underline", textDecorationColor: "#4285F4" },
                }}
                components={{
                  // @ts-ignore
                  DayContent: ({ date: d, ...props }: any) => {
                    const dayStr = format(d, "yyyy-MM-dd");
                    const hasPlan = datesWithPlans.has(dayStr);
                    const hasGCal = datesWithGoogleEvents.has(dayStr);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {d.getDate()}
                        <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                          {hasPlan && <div className="w-1 h-1 bg-primary rounded-full" />}
                          {hasGCal && <div className="w-1 h-1 bg-[#4285F4] rounded-full" />}
                        </div>
                      </div>
                    );
                  },
                }}
              />
            </Card>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 px-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {t("خططي", "My plans")}
              </div>
              {gcal?.connected && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
                  Google Calendar
                </div>
              )}
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {date
                  ? format(date, "EEEE, d MMMM yyyy", { locale: isArabic ? arSA : enUS })
                  : t("اختر يوماً", "Select a day")}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Google Calendar Events */}
                <AnimatePresence mode="popLayout">
                  {selectedGoogleEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="bg-card border border-[#4285F4]/30 rounded-xl p-4 flex items-center gap-4 group hover:border-[#4285F4]/60 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#4285F4]/10 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-5 h-5 text-[#4285F4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{event.summary ?? t("بدون عنوان", "Untitled")}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] inline-block" />
                          Google · {formatEventTime(event)}
                        </p>
                      </div>
                      {event.htmlLink && (
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* My Plans */}
                <AnimatePresence mode="popLayout">
                  {selectedPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-primary/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        plan.category === "meeting"
                          ? "bg-blue-500/10 text-blue-500"
                          : plan.category === "grocery"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-purple-500/10 text-purple-500"
                      }`}>
                        {plan.category === "meeting" ? (
                          <CalendarIcon className="w-5 h-5" />
                        ) : plan.category === "grocery" ? (
                          <ShoppingCart className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${plan.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {plan.title}
                        </h3>
                        {plan.reminder_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(plan.reminder_date), "p", { locale: isArabic ? arSA : enUS })}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {selectedPlans.length === 0 && selectedGoogleEvents.length === 0 && (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {t("لا توجد أحداث لهذا اليوم", "No events for this day")}
                    </p>
                    <Button variant="link" className="mt-2 text-primary" onClick={() => router.push("/vault/plans")}>
                      {t("أضف خطة جديدة", "Add new plan")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
