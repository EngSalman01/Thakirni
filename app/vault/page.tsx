"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
  FileText,
  Cat,
  CheckSquare,
  ShoppingBag,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useMemories } from "@/hooks/use-memories";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { DailySummary } from "@/components/thakirni/daily-summary";

const AIChat = dynamic(
  () =>
    import("@/components/thakirni/ai-chat").then((mod) => ({
      default: mod.AIChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border flex items-center justify-center backdrop-blur-sm">
        <div className="text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse [animation-delay:0.2s]" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    ),
  },
);

export default function VaultPage() {
  const { memories, isLoading: memoriesLoading, addMemory } = useMemories();
  const { stats, isLoading: plansLoading, nextUp, addPlan } = usePlans();
  const isLoading = memoriesLoading || plansLoading;

  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    setCurrentHour(new Date().getHours());
  }, []);

  const getGreeting = () => {
    if (currentHour < 12) return t("صباح الخير", "Good morning");
    if (currentHour < 18) return t("مساء الخير", "Good afternoon");
    return t("مساء الخير", "Good evening");
  };

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

  const [fridayReminder, setFridayReminder] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("fridayNotification");
    if (saved !== null) {
      setFridayReminder(saved === "true");
    }
  }, []);

  const handleFridayToggle = (checked: boolean) => {
    setFridayReminder(checked);
    localStorage.setItem("fridayNotification", String(checked));
    if (checked) {
      toast.success(t("تم تفعيل تذكيرات الجمعة", "Friday reminders enabled"));
    } else {
      toast.info(t("تم تعطيل تذكيرات الجمعة", "Friday reminders disabled"));
    }
  };

  const handleAddNewMemory = () => {
    fileInputRef.current?.click();
  };

  const quickActions = [
    {
      title: t("مهمة جديدة", "New Task"),
      icon: CheckSquare,
      gradient: "from-indigo-500 to-indigo-600",
      action: "/vault/plans",
    },
    {
      title: t("اجتماع", "Meeting"),
      icon: Calendar,
      gradient: "from-sky-500 to-sky-600",
      action: "/vault/calendar",
    },
    {
      title: t("مقضى", "Grocery"),
      icon: ShoppingBag,
      gradient: "from-rose-500 to-rose-600",
      action: "/vault/plans",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,audio/*,.pdf,.doc,.docx"
      />

      <VaultSidebar />

      <main className="lg:me-64 p-4 md:p-8 transition-all duration-300">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MobileMenuButton />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                  {getGreeting()}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex">
                <LanguageToggle />
              </span>
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                className="relative border-indigo-200 dark:border-indigo-900"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-pulse" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayReminders}</p>
                <p className="text-xs text-muted-foreground">
                  {t("مهام اليوم", "Today's Tasks")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{memories.length}</p>
                <p className="text-xs text-muted-foreground">
                  {t("ذكريات", "Memories")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">
                  {t("معدل الإنجاز", "Completion")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-500/10 to-sky-600/10 rounded-2xl p-4 border border-sky-200 dark:border-sky-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">
                  {t("نشاط", "Streak")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            {t("إجراءات سريعة", "Quick Actions")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <motion.a
                key={i}
                href={action.action}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`group relative bg-gradient-to-br ${action.gradient} rounded-2xl p-6 text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all`}
              >
                <div className="relative z-10">
                  <action.icon className="w-8 h-8 mb-3" />
                  <p className="font-semibold text-sm">{action.title}</p>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Next Up */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                {t("القادم", "Next Up")}
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                {nextUp.length} {t("مهام", "tasks")}
              </span>
            </div>

            {nextUp.length > 0 ? (
              <div className="space-y-2">
                {nextUp.slice(0, 5).map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-500/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          plan.category === "meeting"
                            ? "bg-sky-500"
                            : plan.category === "grocery"
                              ? "bg-rose-500"
                              : "bg-indigo-500"
                        }`}
                      />
                      <p className="text-sm font-medium truncate">
                        {plan.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("لا توجد مهام قادمة", "No upcoming tasks")}
                </p>
              </div>
            )}
          </motion.div>

          {/* Daily Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <DailySummary />
          </motion.div>
        </div>

        {/* Recent Memories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500" />
              {t("ذكريات حديثة", "Recent Memories")}
            </h2>
            <Button
              size="sm"
              onClick={handleAddNewMemory}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("جديد", "New")}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="bg-card rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="font-semibold mb-1">
                {t("لا توجد ذكريات", "No memories yet")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("ابدأ بإضافة أول ذكرى", "Start by adding your first memory")}
              </p>
              <Button
                size="sm"
                onClick={handleAddNewMemory}
                className="bg-gradient-to-r from-rose-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("إضافة ذكرى", "Add Memory")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {memories.slice(0, 4).map((memory, i) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all"
                >
                  {memory.type === "photo" && memory.content_url && (
                    <img
                      src={memory.content_url}
                      alt={memory.title || ""}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {memory.type === "text" && (
                    <div className="absolute inset-0 p-4 flex items-center justify-center text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                      <p className="text-sm line-clamp-4 font-medium">
                        {memory.description || memory.title}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <p className="text-xs text-white font-medium truncate">
                      {memory.title}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {memory.hijri_date}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Chat */}
        <motion.div
          id="ai-chat"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <AIChat />
        </motion.div>
      </main>
    </div>
  );
}
