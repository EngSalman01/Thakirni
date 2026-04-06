"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2, Plus, Trash2, ShoppingBag, Briefcase, ListTodo, CalendarPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/thakirni/bulk-action-bar";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

function ParticleLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ps: HTMLDivElement[] = [];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const s = Math.random() * 6 + 3, d = Math.random() * 20 + 10, dl = Math.random() * -20;
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(79,70,229,0.10);border-radius:50%;filter:blur(1px);--drift-x:${(Math.random()-0.5)*160}px;--drift-y:${(Math.random()-0.5)*160}px;animation:particle-drift ${d}s linear ${dl}s infinite;pointer-events:none;`;
      el.appendChild(p); ps.push(p);
    }
    return () => ps.forEach(p => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

export default function PlansPage() {
  const { plans, isLoading, addPlan, updatePlanStatus, deletePlan, refetch, error } = usePlans();
  const { t, isArabic } = useLanguage();
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      await fetch("/api/plans/bulk-delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
      await refetch(); setSelectedIds(new Set());
    } catch (err) {
      console.error("[Plans] bulk delete error:", err);
      toast.error(t("فشل حذف الخطط", "Failed to delete plans"));
    } finally { setBulkDeleting(false); }
  };

  const pushToCalendar = async (plan: typeof plans[number]) => {
    setPushingId(plan.id);
    try {
      const res = await fetch("/api/google-calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: plan.title, date: plan.plan_date ?? undefined }),
      });
      if (res.status === 403) {
        toast.error(t("اربط Google Calendar أولاً من الإعدادات", "Connect Google Calendar first in Settings"), {
          action: { label: t("الإعدادات", "Settings"), onClick: () => window.location.href = "/vault/settings" },
        });
        return;
      }
      if (!res.ok) throw new Error("failed");
      const { event } = await res.json() as { event: { htmlLink: string } };
      setPushedIds(prev => new Set(prev).add(plan.id));
      toast.success(t("تمت الإضافة إلى Google Calendar", "Added to Google Calendar"), {
        action: event?.htmlLink ? { label: t("عرض", "View"), onClick: () => window.open(event.htmlLink, "_blank") } : undefined,
      });
    } catch {
      toast.error(t("فشل الإضافة إلى Google Calendar", "Failed to add to Google Calendar"));
    } finally {
      setPushingId(null);
    }
  };

  const filteredPlans = plans.filter(p => activeTab === "all" || p.category === activeTab);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;
    setIsAdding(true);
    try {
      await addPlan({ title: newPlanTitle, category: activeTab === "all" ? "task" : (activeTab as "task"|"grocery"|"meeting"), status: "pending", priority: "medium", plan_date: new Date().toISOString().split("T")[0] });
      setNewPlanTitle("");
    } catch (err) {
      console.error("[Plans] add plan error:", err);
      toast.error(t("فشل إضافة الخطة", "Failed to add plan"));
    } finally { setIsAdding(false); }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "grocery") return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    if (cat === "meeting") return <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    return <ListTodo className="w-4 h-4 text-amber-500" />;
  };

  const formatDate = (d: string | null | undefined) => d ? format(new Date(d), "PPP", { locale: isArabic ? arSA : enUS }) : "";

  const completedCount = plans.filter(p => p.status === "done").length;
  const pendingCount = plans.filter(p => p.status === "pending").length;

  const COMPLETION_TOASTS_AR = ["خلصناها 👍🔥", "أبدعت اليوم 👏", "ممتاز! كملت واحدة ✅", "برافو! مشينا 💪"];
  const COMPLETION_TOASTS_EN = ["Done! 👍🔥", "Nailed it! 👏", "Great work! ✅", "Keep going! 💪"];

  const handleToggleStatus = async (id: string, checked: boolean) => {
    await updatePlanStatus(id, checked ? "done" : "pending");
    if (checked) {
      const pool = isArabic ? COMPLETION_TOASTS_AR : COMPLETION_TOASTS_EN;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      toast.success(msg, { duration: 2000 });
    }
  };

  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden">
      <main className="pt-16">

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="absolute -top-20 right-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/6 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Copy */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
                <div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    {t("خططي ", "My ")}<span className="gradient-text">{t("ومهامي", "Plans")}</span>
                  </h1>
                  <p className="text-xl text-slate-500 mt-4 max-w-lg">
                    {t("نظّم يومك، تابع مهامك، ولا تنسى مقاضيك.", "Organise your day, track your tasks, and never forget your groceries.")}
                  </p>
                </div>
                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: pendingCount,   label: t("معلّق", "Pending"),   color: "bg-amber-50 text-amber-700" },
                    { value: completedCount, label: t("مكتمل", "Completed"), color: "bg-emerald-50 text-emerald-700" },
                    { value: plans.length,   label: t("الكل", "Total"),      color: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300" },
                  ].map(({ value, label, color }) => (
                    <div key={label as string} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${color}`}>
                      <span className="text-xl font-headline font-extrabold">{value}</span>
                      <span className="opacity-80">{label as string}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: real plans preview */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:block relative">
                <div className="bg-white rounded-2xl p-8 shadow-card hover-lift space-y-3">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center">
                      <ListTodo className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-headline font-bold text-slate-900">{t("قائمة اليوم", "Today's List")}</span>
                  </div>
                  {isLoading
                    ? [1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)
                    : plans.length === 0
                    ? <p className="text-sm text-slate-400 text-center py-4">{t("لا خطط بعد — أضف مهمتك الأولى!", "No plans yet — add your first task!")}</p>
                    : plans.slice(0, 3).map((plan, i) => {
                        const catColor = plan.category === "grocery" ? "bg-emerald-500" : plan.category === "meeting" ? "bg-violet-600" : "bg-indigo-600";
                        const done = plan.status === "done";
                        return (
                          <motion.div key={plan.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                            className={`flex items-center gap-3 p-3 rounded-xl ${done ? "opacity-50" : "bg-slate-50 dark:bg-white/[0.03]"}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                              {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-medium flex-1 truncate ${done ? "line-through text-slate-400" : "text-slate-700"}`}>{plan.title}</span>
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${catColor}`} />
                          </motion.div>
                        );
                      })
                  }
                </div>
                {/* Floating badge — real completion % */}
                {!isLoading && plans.length > 0 && (
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-4 -right-4 bg-gradient-to-br from-indigo-600 to-[#fd65c2] text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
                    {Math.round((completedCount / plans.length) * 100)}% {t("منجز", "done")} ✓
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT ── */}
        <section className="pb-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Add form — feature card */}
              <motion.div custom={0} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="bg-indigo-600 text-white rounded-2xl p-10 relative overflow-hidden hover-lift">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fd65c2]/20 rounded-full blur-2xl pointer-events-none" />
                <span className="text-4xl mb-6 block">✦</span>
                <h2 className="text-2xl font-headline font-bold mb-2">{t("أضف مهمة جديدة", "Add New Task")}</h2>
                <p className="text-white/70 mb-8">{t("سجّل مهمتك بسرعة", "Quickly log your next task")}</p>
                <form onSubmit={handleAddPlan} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/90">
                      {t("عنوان المهمة", "Task title")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)}
                      placeholder={t(activeTab === "grocery" ? "أضف سلعة..." : activeTab === "meeting" ? "أضف اجتماعاً..." : "أضف مهمة...",
                                     activeTab === "grocery" ? "Add item..." : activeTab === "meeting" ? "Add meeting..." : "Add task...")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                      disabled={isAdding}
                    />
                  </div>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={!newPlanTitle.trim() || isAdding}
                    className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40">
                    {isAdding ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t("إضافة", "Add")}
                  </motion.button>
                </form>
              </motion.div>

              {/* Plans list — wide feature card */}
              <motion.div custom={1} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-2 bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-10 relative overflow-hidden hover-lift group">
                <div className="absolute right-0 bottom-0 w-1/3 translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-30 pointer-events-none">
                  <div className="w-full h-48 bg-gradient-to-tl from-indigo-600/20 to-[#fd65c2]/20 rounded-tl-2xl" />
                </div>
                <span className="text-4xl text-indigo-600 dark:text-indigo-400 mb-6 block">📋</span>
                <h2 className="text-2xl font-headline font-bold mb-8 text-slate-900">{t("قائمة المهام", "Task List")}</h2>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/70 backdrop-blur-sm">
                    <TabsTrigger value="all">{t("الكل", "All")}</TabsTrigger>
                    <TabsTrigger value="task">{t("مهام", "Tasks")}</TabsTrigger>
                    <TabsTrigger value="grocery">{t("مقاضي", "Groceries")}</TabsTrigger>
                    <TabsTrigger value="meeting">{t("اجتماعات", "Meetings")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-3">
                    {isLoading ? (
                      [1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
                    ) : filteredPlans.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#dce1ff] to-[#ffd8e9] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400/40" />
                        </div>
                        <h3 className="text-xl font-headline font-bold text-slate-700">
                          {t("ما عندك مهام للحين 👀", "No tasks yet 👀")}
                        </h3>
                        <p className="text-slate-500 mt-2">
                          {t("خلني أرتب لك أول وحدة 👌", "Let me help you add your first one 👌")}
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {filteredPlans.map(plan => (
                          <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} layout
                            className={cn("group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200",
                              selectedIds.has(plan.id) ? "bg-indigo-600/5 border-indigo-600/30 ring-1 ring-indigo-600/20"
                              : plan.status === "done" ? "bg-white/40 border-white/60 opacity-50"
                              : "bg-white border-[#e4e2e1] shadow-ambient hover:shadow-card hover:-translate-y-0.5")}>
                            <div className={cn("absolute top-3 right-3 transition-opacity", selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                              <input type="checkbox" checked={selectedIds.has(plan.id)} onChange={() => toggleSelect(plan.id)} onClick={e => e.stopPropagation()}
                                className="w-4 h-4 rounded accent-[#2552ca] cursor-pointer" />
                            </div>
                            <Checkbox checked={plan.status === "done"} onCheckedChange={c => handleToggleStatus(plan.id, !!c)} className="mt-1" />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-semibold truncate", plan.status === "done" ? "line-through text-slate-400" : "text-slate-800")}>
                                  {plan.title}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0eded] text-[10px] font-bold text-slate-600">
                                  {getCategoryIcon(plan.category || "task")}
                                  {t(plan.category || "task", (plan.category || "task").toUpperCase())}
                                </span>
                              </div>
                              {plan.plan_date && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <Calendar className="w-3 h-3" /><span>{formatDate(plan.plan_date)}</span>
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" disabled={pushingId === plan.id}
                              title={t("إضافة إلى Google Calendar", "Add to Google Calendar")}
                              className="opacity-0 group-hover:opacity-100 text-[#4285F4] hover:text-[#4285F4] hover:bg-blue-50"
                              onClick={() => pushToCalendar(plan)}>
                              {pushingId === plan.id
                                ? <span className="w-4 h-4 border-2 border-blue-300 border-t-[#4285F4] rounded-full animate-spin" />
                                : pushedIds.has(plan.id)
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  : <CalendarPlus className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" disabled={deletingId === plan.id}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 -me-2"
                              onClick={async () => { setDeletingId(plan.id); try { await deletePlan(plan.id); } finally { setDeletingId(null); } }}>
                              {deletingId === plan.id ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </section>

        <BulkActionBar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onClear={() => setSelectedIds(new Set())} deleting={bulkDeleting} />
      </main>
    </div>
  );
}
