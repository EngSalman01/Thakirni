"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
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
      <div className="h-[600px] bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-muted-foreground">جاري تحميل المحادثة...</div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      toast.info(
        t(
          `جاري رفع ${files.length} ملفات...`,
          `Uploading ${files.length} files...`,
        ),
      );

      for (const file of files) {
        try {
          const hijriDate = new Intl.DateTimeFormat("en-u-ca-islamic", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date());

          let contentUrl = "";
          let type: "photo" | "text" = "text";

          if (file.type.startsWith("image/")) {
            type = "photo";
            if (file.size < 1024 * 1024) {
              contentUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
            } else {
              contentUrl = "https://placehold.co/600x400?text=Large+Image";
            }
          } else {
            contentUrl = "";
          }

          await addMemory({
            title: file.name,
            description: t(
              "تم الرفع عبر الرفع السريع",
              "Uploaded via Quick Upload",
            ),
            type: type,
            hijri_date: hijriDate,
            gregorian_date: new Date().toISOString().split("T")[0],
            content_url: contentUrl,
            tags: ["quick-upload", "dashboard"],
          });
        } catch (err) {
          console.error(err);
        }
      }
      toast.success(t("تم الرفع بنجاح", "Upload successful"));
    },
    [t, addMemory],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        await processFiles(files);
      }
    },
    [processFiles],
  );

  const handleFridayToggle = (checked: boolean) => {
    setFridayReminder(checked);
    if (checked) {
      toast.success(t("تم تفعيل تذكيرات الجمعة", "Friday reminders enabled"));
    } else {
      toast.info(t("تم تعطيل تذكيرات الجمعة", "Friday reminders disabled"));
    }
  };

  const handleAddNewMemory = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,audio/*,.pdf,.doc,.docx"
      />

      {/* Sidebar */}
      <VaultSidebar />

      {/* Main content */}
      <main className="me-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("مرحباً بك في ذكرني", "Welcome to Thakirni")}
            </h1>
            <p className="text-muted-foreground">
              {t(
                "ذاكرتك الثانية لحفظ كل اللحظات",
                "Your second brain to preserve every moment",
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
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
          className="mb-8"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem(
                "planTitle",
              ) as HTMLInputElement;
              if (!input || !input.value.trim()) return;

              // Basic smart categorization
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
                status: "pending",
                is_recurring: false,
                priority: "medium",
                reminder_date: new Date().toISOString(),
              });
              input.value = "";
              toast.success(t("تمت الإضافة", "Added"));
            }}
            className="flex gap-2 p-1 bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 ring-primary/20 transition-all"
          >
            <input
              name="planTitle"
              className="flex-1 bg-transparent px-4 border-none outline-none text-foreground placeholder-muted-foreground"
              placeholder={t(
                "ما الذي تريد تذكره؟ (مثلاً: اجتماع غداً، شراء حليب...)",
                "What do you want to remember? (e.g. Meeting tomorrow, Buy milk...)",
              )}
            />
            <Button type="submit" size="sm" className="rounded-xl px-6">
              {t("إضافة", "Add")}
            </Button>
          </form>
        </motion.div>

        {/* Stats & Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Stat Cards */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{memories.length}</p>
                <p className="text-xs text-muted-foreground">
                  {t("ذكرياتي", "Memories")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayReminders}</p>
                <p className="text-xs text-muted-foreground">
                  {t("تذكيرات اليوم", "Today's Reminders")}
                </p>
              </div>
            </div>
          </div>

          {/* Agenda Card */}
          <div className="md:col-span-2 bg-card rounded-xl p-4 border border-border relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500" />
                {t("القادم", "Next Up")}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {nextUp.length}
              </span>
            </div>

            {nextUp.length > 0 ? (
              <div className="space-y-2">
                {nextUp.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${plan.category === "meeting" ? "bg-blue-500" : "bg-amber-500"}`}
                      />
                      <span className="truncate">{plan.title}</span>
                    </div>
                    <span className="text-[10px] opacity-70 whitespace-nowrap">
                      {plan.reminder_date
                        ? new Date(plan.reminder_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Today"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                {t("لا توجد مواعيد قادمة", "No upcoming plans")}
              </div>
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content - Memory Stream */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                {t("ذكرياتي الأخيرة", "Recent Memories")}
              </h2>
              <Button size="sm" className="gap-2" onClick={handleAddNewMemory}>
                <Plus className="w-4 h-4" />
                {t("ذكرى جديدة", "New Memory")}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {memories.slice(0, 6).map((memory, i) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group aspect-square rounded-lg bg-muted overflow-hidden flex flex-col"
                  >
                    {/* Media Content */}
                    <div className="flex-1 relative">
                      {memory.type === "photo" && (
                        <img
                          src={memory.content_url}
                          alt={memory.title || ""}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {memory.type === "voice" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/20 p-2">
                          <Mic className="w-8 h-8 text-white mb-2" />
                          <audio
                            controls
                            src={memory.content_url}
                            className="w-full h-8 max-w-[140px] opacity-70 hover:opacity-100 transition-opacity"
                          />
                        </div>
                      )}
                      {memory.type === "text" && (
                        <div className="absolute inset-0 p-4 flex items-center justify-center text-center bg-primary/5">
                          <p className="text-xs line-clamp-4 font-medium">
                            {memory.description || memory.title}
                          </p>
                        </div>
                      )}

                      {!memory.content_url && memory.type !== "text" && (
                        <div className="flex items-center justify-center w-full h-full">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                        <p className="text-xs text-white truncate font-medium">
                          {memory.title}
                        </p>
                        <p className="text-[10px] text-white/70">
                          {memory.hijri_date}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Side Cards */}
          <div className="space-y-6">
            {/* Friday Reminders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {t("تذكيرات الجمعة", "Friday Reminders")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-4">
                  <div className="flex-1">
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

            {/* Quick Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-card rounded-xl border-2 border-dashed p-6 transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
                />
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {t("رفع سريع", "Quick Upload")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t(
                    "اسحب الملفات هنا أو اضغط للاختيار",
                    "Drag files here or click to select",
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={handleAddNewMemory}
                >
                  {t("اختر ملفات", "Select Files")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Chat */}
        <motion.div
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
