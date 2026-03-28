"use client";

import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Loader2, Calendar as CalendarIcon,
  ShoppingCart, CheckCircle2, ExternalLink, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { useRouter } from "next/navigation";
import useSWR from "swr";

interface GoogleEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
  colorId?: string
  _calendarName?: string
  _calendarColor?: string
}

async function fetchGoogleEvents(): Promise<{ connected: boolean; events: GoogleEvent[]; error?: boolean }> {
  try {
    const res = await fetch("/api/google-calendar/events")
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return { connected: false, events: [] }
      return { connected: false, events: [], error: true }
    }
    return res.json()
  } catch (err) {
    console.error("[GoogleCalendar] fetch failed:", err)
    return { connected: false, events: [], error: true }
  }
}

export default function CalendarPage() {
  const { plans, isLoading } = usePlans();
  const { t, isArabic } = useLanguage();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: gcal, error: gcalSWRError, mutate: refetchGcal } = useSWR("google-calendar-events", fetchGoogleEvents, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
  })
  const gcalError = gcalSWRError || gcal?.error

  // Plans for selected date — use local YYYY-MM-DD to avoid UTC shift
  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : "";
  const selectedPlans = plans.filter((p) => {
    if (!p.plan_date) return false;
    return p.plan_date.startsWith(selectedDateStr);
  });

  // Google Calendar events for selected date
  // GCal dateTime can be "2026-03-26T10:00:00+03:00" — extract just the date part before the T
  const selectedGoogleEvents = (gcal?.events ?? []).filter((e) => {
    const raw = e.start?.dateTime ?? e.start?.date ?? ""
    const eventDate = raw.split("T")[0]
    return eventDate === selectedDateStr
  })

  // Dates that have plans (for calendar dots)
  const datesWithPlans = new Set(
    plans
      .filter((p) => p.plan_date)
      .map((p) => p.plan_date!.split("T")[0]),
  );

  // Dates that have Google events — extract just YYYY-MM-DD before the T
  const datesWithGoogleEvents = new Set(
    (gcal?.events ?? []).map((e) => {
      const raw = e.start?.dateTime ?? e.start?.date ?? ""
      return raw.split("T")[0]
    }).filter(Boolean)
  )

  function formatEventTime(e: GoogleEvent) {
    const raw = e.start?.dateTime ?? e.start?.date
    if (!raw) return ""
    try {
      return format(new Date(raw), "p", { locale: isArabic ? arSA : enUS })
    } catch (err) { console.error("[Calendar] formatEventTime error:", err); return "" }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VaultSidebar />

      <main className="lg:ml-72 pt-16 p-4 md:p-6 lg:p-8 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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

            {/* Google Calendar error banner */}
            {gcalError && (
              <div className="mb-4 flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">{t("تعذّر تحميل أحداث Google Calendar", "Failed to load Google Calendar events")}</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 shrink-0"
                  onClick={() => refetchGcal()}>
                  <RefreshCw className="w-3.5 h-3.5 me-1.5" />
                  {t("إعادة المحاولة", "Retry")}
                </Button>
              </div>
            )}

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
                      className="bg-card border rounded-xl p-4 flex items-center gap-4 group transition-colors hover:shadow-sm"
                      style={{ borderColor: `${event._calendarColor ?? "#4285F4"}40` }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${event._calendarColor ?? "#4285F4"}18` }}>
                        <CalendarIcon className="w-5 h-5" style={{ color: event._calendarColor ?? "#4285F4" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{event.summary ?? t("بدون عنوان", "Untitled")}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: event._calendarColor ?? "#4285F4" }} />
                          {event._calendarName ?? "Google"}{formatEventTime(event) ? ` · ${formatEventTime(event)}` : ""}
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
                        <h3 className={`font-medium truncate ${plan.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {plan.title}
                        </h3>
                        {plan.plan_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(plan.plan_date), "p", { locale: isArabic ? arSA : enUS })}
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
