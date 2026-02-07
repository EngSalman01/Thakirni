"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  VaultSidebar,
  MobileMenuButton,
} from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Upload,
  ImageIcon,
  Mic,
  FileText,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useMemories } from "@/hooks/use-memories";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";

// Dynamic import to prevent SSR issues with AI SDK
const AIChat = dynamic(
  () =>
    import("@/components/thakirni/ai-chat").then((mod) => ({
      default: mod.AIChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    ),
  },
);

export default function VaultPage() {
  const { memories, isLoading: memoriesLoading, addMemory } = useMemories();
  const { stats, isLoading: plansLoading, nextUp, addPlan } = usePlans();
  const isLoading = memoriesLoading || plansLoading;

  const [fridayReminder, setFridayReminder] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useLanguage();
  const handleFridayToggle = (checked: boolean) => {
    setFridayReminder(checked);
    if (checked) {
      toast.success(t("تم تفعيل تذكيرات الجمعة", "Friday reminders enabled"));
    } else {
      toast.info(t("تم تعطيل تذكيرات الجمعة", "Friday reminders disabled"));
    }
  };

  const handleAddNewMemory = () => {
    // Ideally this would open a dialog to add a text note
    // For now we just show a toast as per prior instruction, or we can make a simple prompt
    const note = prompt(t("أدخل ملاحظتك:", "Enter your note:"));
    if (note) {
      addMemory({ content: note, tags: ["quick-note"] });
      toast.success(t("تم حفظ الملاحظة", "Note saved"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <VaultSidebar />

      {/* Main content - responsive margin */}
      <main className="lg:me-64 p-4 md:p-6 lg:p-8 transition-all duration-300">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {t("مرحباً بك في ذكرني", "Welcome to Thakirni")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {t(
                  "ذاكرتك الثانية لحفظ كل اللحظات",
                  "Your second brain to preserve every moment",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="hidden sm:inline-flex">
              <LanguageToggle />
            </span>
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -end-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </motion.div>

        {/* Quick Add Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem(
                "planTitle",
              ) as HTMLInputElement;
              if (!input || !input.value.trim()) return;

              const val = input.value.toLowerCase();
              let category: "task" | "meeting" | "grocery" = "task";
              if (
                val.includes("meeting") ||
                val.includes("mo3ad") ||
                val.includes("موع") ||
                val.includes("قاب")
              )
                category = "meeting";
              if (
                val.includes("buy") ||
                val.includes("shary") ||
                val.includes("شرا") ||
                val.includes("جب")
              )
                category = "grocery";

              addPlan({
                title: input.value,
                category,
                start_datetime: new Date().toISOString(),
                is_all_day: false,
              });
              input.value = "";
              toast.success(t("تمت الإضافة", "Added"));
            }}
            className="flex gap-2 p-1.5 bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 ring-primary/20 transition-all"
          >
            <input
              name="planTitle"
              className="flex-1 bg-transparent px-3 md:px-4 border-none outline-none text-foreground placeholder-muted-foreground text-sm md:text-base min-w-0"
              placeholder={t(
                "ما الذي تريد تذكره؟",
                "What do you want to remember?",
              )}
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl px-4 md:px-6 shrink-0"
            >
              {t("إضافة", "Add")}
            </Button>
          </form>
        </motion.div>

        {/* Stats & Agenda */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Stat Cards */}
          <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">
                  {memories.length}
                </p>
                <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                  {t("ذكرياتي", "Memories")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">
                  {stats.todayReminders}
                </p>
                <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                  {t("تذكيرات اليوم", "Today")}
                </p>
              </div>
            </div>
          </div>

          {/* Agenda Card */}
          <div className="col-span-2 bg-card rounded-xl p-3 md:p-4 border border-border relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <Calendar className="w-4 h-4 text-green-500" />
                {t("القادم", "Next Up")}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {nextUp.length}
              </span>
            </div>

            {nextUp.length > 0 ? (
              <div className="space-y-1.5 md:space-y-2">
                {nextUp.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-1.5 md:p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${plan.category === "meeting" ? "bg-blue-500" : "bg-amber-500"}`}
                      />
                      <span className="truncate text-xs md:text-sm">
                        {plan.title}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-70 whitespace-nowrap ms-2">
                      {plan.start_datetime
                        ? new Date(plan.start_datetime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Today"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 md:h-20 text-xs text-muted-foreground">
                {t("لا توجد مواعيد قادمة", "No upcoming plans")}
              </div>
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Main Content - Memory Stream */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                {t("ذكرياتي الأخيرة", "Recent Memories")}
              </h2>
              <Button
                size="sm"
                className="gap-1.5 md:gap-2"
                onClick={handleAddNewMemory}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("ذكرى جديدة", "New Memory")}
                </span>
                <span className="sm:hidden">{t("جديد", "New")}</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {t("لا توجد ذكريات بعد", "No memories yet")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(
                    "ابدأ بإضافة أول ملاحظة لك",
                    "Start by adding your first note",
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNewMemory}
                  className="bg-transparent"
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t("أضف ذكرى", "Add Memory")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {memories.slice(0, 6).map((memory, i) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group aspect-square rounded-lg bg-muted/50 overflow-hidden flex flex-col border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 p-3 md:p-4 overflow-hidden relative">
                      <p className="text-xs md:text-sm text-foreground/80 line-clamp-6 whitespace-pre-wrap">
                        {memory.content}
                      </p>
                      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-muted to-transparent" />
                    </div>

                    <div className="p-2 border-t border-border/50 bg-background/50 text-[10px] text-muted-foreground flex justify-between items-center">
                      <span>
                        {new Date(memory.created_at).toLocaleDateString()}
                      </span>
                      {memory.is_favorite && (
                        <span className="text-yellow-500">★</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Side Cards */}
          <div className="space-y-4 md:space-y-6">
            {/* Friday Reminders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6"
            >
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {t("تذكيرات الجمعة", "Friday Reminders")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t("رسالة جمعة مباركة", "Jumma Mubarak Message")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "إرسال تلقائي لمجموعة العائلة",
                        "Auto-send to family group",
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={fridayReminder}
                    onCheckedChange={handleFridayToggle}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'سيتم إرسال رسالة "جمعة مباركة" تلقائياً كل يوم جمعة الساعة ١٠ صباحاً',
                    "A 'Jumma Mubarak' message will be sent automatically every Friday at 10 AM",
                  )}
                </p>
              </div>
            </motion.div>

            {/* Quick Note (Replaces Quick Upload) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6"
            >
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-primary/50" />
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {t("تدوين سريع", "Quick Note")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("سجّل أفكارك وملاحظاتك", "Record your thoughts")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={handleAddNewMemory}
                >
                  {t("تدوين جديد", "New Note")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Chat */}
        <motion.div
          id="ai-chat"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AIChat />
        </motion.div>
      </main>
    </div>
  );
}
