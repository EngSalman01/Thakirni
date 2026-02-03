"use client";

import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertCircle,
  ShoppingBag,
  Briefcase,
  ListTodo,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export default function PlansPage() {
  const { plans, isLoading, addPlan, updatePlanStatus, deletePlan, error } =
    usePlans();
  const { t, isArabic } = useLanguage();
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAdding, setIsAdding] = useState(false);

  // Filter plans based on active tab
  const filteredPlans = plans.filter((plan) => {
    if (activeTab === "all") return true;
    return plan.category === activeTab;
  });

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    setIsAdding(true);
    try {
      // Determine category based on active tab, default to 'task' if 'all'
      const category =
        activeTab === "all"
          ? "task"
          : (activeTab as "task" | "grocery" | "meeting");

      await addPlan({
        title: newPlanTitle,
        category: category,
        status: "pending",
        is_recurring: false,
        priority: "medium",
        reminder_date: new Date().toISOString(), // Default to today for sorting
      });
      setNewPlanTitle("");
    } catch (err) {
      console.error("Failed to add plan", err);
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "grocery":
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case "meeting":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:
        return <ListTodo className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "PPP", { locale: isArabic ? arSA : enUS });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VaultSidebar />

      <main className="lg:me-64 p-4 lg:p-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              {t("خططي ومكالماتي", "My Plans & Tasks")}
            </h1>
            <p className="text-muted-foreground">
              {t(
                "نظم يومك، وتابع مهامك، ولا تنسى مقاضيك",
                "Organize your day, track tasks, and never forget groceries",
              )}
            </p>
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleAddPlan}
            className="flex gap-4 p-4 bg-muted/30 border border-border rounded-xl backdrop-blur-sm"
          >
            <Input
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder={t(
                activeTab === "grocery"
                  ? "أضف سلعة جديدة..."
                  : activeTab === "meeting"
                    ? "أضف اجتماعاً جديداً..."
                    : "أضف مهمة جديدة...",
                activeTab === "grocery"
                  ? "Add new item..."
                  : activeTab === "meeting"
                    ? "Add new meeting..."
                    : "Add new task...",
              )}
              className="flex-1 bg-background border-muted-foreground/20"
              disabled={isAdding}
            />
            <Button disabled={!newPlanTitle.trim() || isAdding}>
              {isAdding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span className="hidden sm:inline ms-2">{t("إضافة", "Add")}</span>
            </Button>
          </form>

          {/* Tabs & List */}
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
              <TabsTrigger value="all">{t("الكل", "All")}</TabsTrigger>
              <TabsTrigger value="task">{t("مهام", "Tasks")}</TabsTrigger>
              <TabsTrigger value="grocery">
                {t("مقاضي", "Groceries")}
              </TabsTrigger>
              <TabsTrigger value="meeting">
                {t("اجتماعات", "Meetings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-4">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                  >
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : filteredPlans.length === 0 ? (
                // Empty State
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    {t("لا توجد خطط هنا", "No plans here yet")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(
                      "أضف مهامك الجديدة لتبدأ يومك بإنتاجية",
                      "Add your new tasks to start your day productively",
                    )}
                  </p>
                </div>
              ) : (
                // Plans List
                <AnimatePresence mode="popLayout">
                  {filteredPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className={cn(
                        "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                        plan.status === "completed"
                          ? "bg-muted/50 border-transparent opacity-60"
                          : "bg-card border-border hover:border-primary/50 hover:shadow-sm",
                      )}
                    >
                      <Checkbox
                        checked={plan.status === "completed"}
                        onCheckedChange={(checked) =>
                          updatePlanStatus(
                            plan.id,
                            checked ? "completed" : "pending",
                          )
                        }
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0 grid gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium truncate transition-all",
                              plan.status === "completed"
                                ? "line-through text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {plan.title}
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-muted text-[10px] items-center gap-1">
                            {getCategoryIcon(plan.category || "task")}
                            <span className="uppercase opacity-70">
                              {t(
                                plan.category || "task",
                                (plan.category || "task").toUpperCase(),
                              )}
                            </span>
                          </span>
                        </div>
                        {plan.reminder_date && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(plan.reminder_date)}</span>
                          </div>
                        )}
                        {plan.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 -me-2"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
