"use client";

import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  ShoppingCart,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  VaultSidebar,
  MobileMenuButton,
} from "@/components/thakirni/vault-sidebar";

export default function CalendarPage() {
  const { plans, isLoading } = usePlans();
  const { t, isArabic } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Get plans for selected date
  const selectedDateStr = date ? date.toISOString().split("T")[0] : "";
  const selectedPlans = plans.filter((p) => {
    if (!p.reminder_date) return false;
    return p.reminder_date.startsWith(selectedDateStr);
  });

  // Get dates that have plans for highlighting
  const datesWithPlans = new Set(
    plans
      .filter((p) => p.reminder_date)
      .map((p) => p.reminder_date!.split("T")[0]),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VaultSidebar />

      <main className="lg:me-64 p-4 md:p-6 lg:p-8 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <h1 className="text-2xl font-bold">{t("التقويم", "Calendar")}</h1>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 me-2" />
            {t("خطة جديدة", "New Plan")}
          </Button>
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
                  hasPlan: (date) =>
                    datesWithPlans.has(format(date, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasPlan: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "var(--primary)",
                  },
                }}
                components={{
                  DayContent: (props) => {
                    const dayStr = format(props.date, "yyyy-MM-dd");
                    const hasPlan = datesWithPlans.has(dayStr);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {props.date.getDate()}
                        {hasPlan && (
                          <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                        )}
                      </div>
                    );
                  },
                }}
              />
            </Card>
          </div>

          {/* Selected Date Plans */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {date
                  ? format(date, "EEEE, d MMMM yyyy", {
                      locale: isArabic ? arSA : enUS,
                    })
                  : t("اختر يوماً", "Select a day")}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedPlans.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {selectedPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-primary/50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          plan.category === "meeting"
                            ? "bg-blue-500/10 text-blue-500"
                            : plan.category === "grocery"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-purple-500/10 text-purple-500"
                        }`}
                      >
                        {plan.category === "meeting" ? (
                          <CalendarIcon className="w-5 h-5" />
                        ) : plan.category === "grocery" ? (
                          <ShoppingCart className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${plan.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                        >
                          {plan.title}
                        </h3>
                        {plan.reminder_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(plan.reminder_date), "p", {
                              locale: isArabic ? arSA : enUS,
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Actions can go here */}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t("لا توجد خطط لهذا اليوم", "No plans for this day")}
                </p>
                <Button variant="link" className="mt-2 text-primary">
                  {t("أضف خطة جديدة", "Add new plan")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
