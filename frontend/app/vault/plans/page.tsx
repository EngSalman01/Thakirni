"use client";

import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";
import { Plus, Trash2, Loader2, CheckCircle2, Circle, CalendarPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/thakirni/bulk-action-bar";

const CATEGORY_COLORS: Record<string, string> = {
  task: "#F59E0B",
  grocery: "#10B981",
  meeting: "#3B82F6",
};

const CATEGORY_LABELS_AR: Record<string, string> = {
  task: "مهمة",
  grocery: "مقاضي",
  meeting: "اجتماع",
};

export default function PlansPage() {
  const { plans, isLoading, addPlan, updatePlanStatus, deletePlan, refetch } = usePlans();
  const { t, isArabic } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "done" | "late">("all");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const filteredPlans = plans.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return p.status === "pending";
    if (activeTab === "done") return p.status === "done";
    if (activeTab === "late") return p.status === "pending" && p.plan_date && p.plan_date < today;
    return true;
  });

  const pendingCount = plans.filter(p => p.status === "pending").length;
  const doneCount    = plans.filter(p => p.status === "done").length;
  const lateCount    = plans.filter(p => p.status === "pending" && p.plan_date && p.plan_date < today).length;

  const COMPLETION_TOASTS = isArabic
    ? ["خلصناها 👍🔥", "أبدعت اليوم 👏", "ممتاز! ✅", "برافو! 💪"]
    : ["Done! 👍🔥", "Nailed it! 👏", "Great! ✅", "Keep going! 💪"];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await addPlan({
        title: newTitle,
        category: "task",
        status: "pending",
        priority: "medium",
        plan_date: today,
      });
      setNewTitle("");
    } catch {
      toast.error(t("فشل إضافة الخطة", "Failed to add plan"));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    await updatePlanStatus(id, checked ? "done" : "pending");
    if (checked) {
      toast.success(COMPLETION_TOASTS[Math.floor(Math.random() * COMPLETION_TOASTS.length)], { duration: 2000 });
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deletePlan(id); } finally { setDeletingId(null); }
  }

  async function pushToCalendar(plan: typeof plans[number]) {
    setPushingId(plan.id);
    try {
      const res = await fetch("/api/google-calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: plan.title, date: plan.plan_date ?? undefined }),
      });
      if (res.status === 403) {
        toast.error(t("اربط Google Calendar أولاً من الإعدادات", "Connect Google Calendar first in Settings"));
        return;
      }
      if (!res.ok) throw new Error("failed");
      const { event } = await res.json() as { event: { htmlLink: string } };
      setPushedIds(prev => new Set(prev).add(plan.id));
      toast.success(t("تمت الإضافة إلى Google Calendar", "Added to Google Calendar"), {
        action: event?.htmlLink ? { label: t("عرض", "View"), onClick: () => window.open(event.htmlLink, "_blank") } : undefined,
      });
    } catch {
      toast.error(t("فشل الإضافة", "Failed to add"));
    } finally {
      setPushingId(null);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      await fetch("/api/plans/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      await refetch();
      setSelectedIds(new Set());
    } catch {
      toast.error(t("فشل حذف الخطط", "Failed to delete plans"));
    } finally {
      setBulkDeleting(false);
    }
  }

  const tabs = [
    { key: "all",     label: t("الكل", "All"),           count: plans.length },
    { key: "pending", label: t("قيد التنفيذ", "Active"), count: pendingCount },
    { key: "done",    label: t("منجز", "Done"),           count: doneCount },
    { key: "late",    label: t("متأخر", "Late"),          count: lateCount },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-head fu">
          <div>
            <p className="eyebrow">{t("التخطيط", "Planning")}</p>
            <h1 className="page-h1">{t("خططتك", "Your Plans")}</h1>
            <p className="page-sub">{t("نظّم يومك وتابع مهامك", "Organise your day, track your tasks")}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap", marginTop: 6 }}>
            {[
              { value: pendingCount, label: t("معلّق", "Pending"), color: "var(--amb)" },
              { value: doneCount,    label: t("منجز", "Done"),     color: "#10B981" },
              { value: lateCount,    label: t("متأخر", "Late"),    color: "var(--red)" },
            ].map(({ value, label, color }) => (
              <div key={label as string} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 99,
                background: "var(--s2)", border: "1px solid var(--bd)",
                fontSize: ".82rem", fontWeight: 700,
              }}>
                <span style={{ fontWeight: 900, color }}>{value}</span>
                <span style={{ color: "var(--tx2)" }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Add ── */}
        <form onSubmit={handleAdd} className="fu1" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <input
            className="inp"
            style={{ flex: 1 }}
            placeholder={t("أضف مهمة جديدة...", "Add new task...")}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            disabled={isAdding}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newTitle.trim() || isAdding}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            {isAdding ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Plus style={{ width: 16, height: 16 }} />}
            {t("إضافة", "Add")}
          </button>
        </form>

        {/* ── Filter Tabs ── */}
        <div className="fu2" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "7px 16px", borderRadius: 99, fontSize: ".82rem", fontWeight: 700,
                border: "1px solid",
                borderColor: activeTab === tab.key ? "var(--amb)" : "var(--bd)",
                background: activeTab === tab.key ? "rgba(245,158,11,.12)" : "var(--s2)",
                color: activeTab === tab.key ? "var(--amb)" : "var(--tx2)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.key ? "var(--amb)" : "var(--s3)",
                  color: activeTab === tab.key ? "#000" : "var(--tx2)",
                  borderRadius: 99, padding: "1px 7px", fontSize: ".72rem", fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Plans List ── */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 style={{ width: 32, height: 32, color: "var(--amb)" }} className="animate-spin" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: "var(--tx3)", margin: "0 auto 16px", opacity: .4 }} />
            <p style={{ color: "var(--tx2)", marginBottom: 16 }}>
              {t("لا توجد مهام في هذا القسم", "No tasks in this section")}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filteredPlans.map((plan, i) => {
                const catColor = CATEGORY_COLORS[plan.category || "task"] || "#F59E0B";
                const catLabel = isArabic
                  ? CATEGORY_LABELS_AR[plan.category || "task"]
                  : (plan.category || "task");
                const isLate = plan.status === "pending" && plan.plan_date && plan.plan_date < today;

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: .95 }}
                    transition={{ duration: .22, delay: i * .04 }}
                    className="card"
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      opacity: plan.status === "done" ? .55 : 1,
                      borderColor: selectedIds.has(plan.id) ? "var(--amb)" : undefined,
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <button
                        onClick={() => handleToggle(plan.id, plan.status !== "done")}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2, flexShrink: 0 }}
                      >
                        {plan.status === "done"
                          ? <CheckCircle2 style={{ width: 18, height: 18, color: "#10B981" }} />
                          : <Circle style={{ width: 18, height: 18, color: "var(--tx3)" }} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: ".92rem", color: plan.status === "done" ? "var(--tx3)" : "var(--tx)",
                          textDecoration: plan.status === "done" ? "line-through" : "none",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {plan.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
                          <span style={{ fontSize: ".72rem", color: "var(--tx2)", fontWeight: 600 }}>{catLabel}</span>
                          {plan.plan_date && (
                            <span style={{ fontSize: ".72rem", color: isLate ? "var(--red)" : "var(--tx3)" }}>
                              · {plan.plan_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(plan.id)}
                        onChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(plan.id) ? n.delete(plan.id) : n.add(plan.id); return n; })}
                        style={{ width: 14, height: 14, accentColor: "var(--amb)", cursor: "pointer" }}
                      />
                      <div style={{ flex: 1 }} />
                      <button
                        disabled={pushingId === plan.id}
                        onClick={() => pushToCalendar(plan)}
                        style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "var(--tx3)" }}
                        title={t("إضافة إلى Google Calendar", "Add to Google Calendar")}
                      >
                        {pushingId === plan.id
                          ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                          : pushedIds.has(plan.id)
                            ? <CheckCircle2 style={{ width: 13, height: 13, color: "#10B981" }} />
                            : <CalendarPlus style={{ width: 13, height: 13 }} />}
                      </button>
                      <button
                        disabled={deletingId === plan.id}
                        onClick={() => handleDelete(plan.id)}
                        style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "var(--red)", opacity: deletingId === plan.id ? .4 : 1 }}
                      >
                        {deletingId === plan.id
                          ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                          : <Trash2 style={{ width: 13, height: 13 }} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        <div style={{ height: 80 }} />
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onClear={() => setSelectedIds(new Set())} deleting={bulkDeleting} />
    </div>
  );
}
