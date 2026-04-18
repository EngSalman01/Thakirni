"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flame, Plus, Trash2, Trophy, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const HABIT_ICONS = ["✅","🏃","💧","📚","🧘","🍎","💪","☀️","🧠","🎯","💤","🙏","🔥","⚡","🎵","✍️"]

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  frequency: string
  current_streak: number
  longest_streak: number
  completed_today: boolean
  week_done: boolean[]
}

async function fetchHabits(): Promise<Habit[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const res = await fetch(`/api/habits`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const d = await res.json() as { habits?: Habit[] }
  return d.habits ?? []
}

async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export default function HabitsPage() {
  const { data: habits = [], mutate, isLoading, error } = useSWR(`/api/habits`, fetchHabits, { refreshInterval: 60000 })
  const { t, isArabic } = useLanguage()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", icon: "✅", color: "#D97706", frequency: "daily", category: "general" })
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const completedCount = habits.filter(h => h.completed_today).length
  const total = habits.length
  const totalStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0)
  const maxStreak = habits.reduce((s, h) => Math.max(s, h.longest_streak || 0), 0)

  async function createHabit(e: React.FormEvent) {
    e.preventDefault()
    const session = await getSession(); if (!session) return
    setSaving(true)
    try {
      const res = await fetch(`/api/habits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(t("تمت إضافة العادة! 🎉", "Habit added! 🎉"))
        setOpen(false)
        setForm({ name: "", icon: "✅", color: "#D97706", frequency: "daily", category: "general" })
        mutate()
      } else {
        toast.error(t("حدث خطأ", "An error occurred"))
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleHabit(id: string, completedToday: boolean) {
    const session = await getSession(); if (!session) return
    setTogglingId(id)
    try {
      const url = completedToday ? `/api/habits/${id}/uncomplete` : `/api/habits/${id}/complete`
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      mutate()
    } catch {
      toast.error(t("فشل تحديث العادة", "Failed to update habit"))
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteHabit(id: string) {
    const session = await getSession(); if (!session) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      toast.success(t("تم حذف العادة", "Habit deleted"))
      mutate()
    } catch {
      toast.error(t("فشل حذف العادة", "Failed to delete habit"))
    } finally {
      setDeletingId(null)
    }
  }

  const weekDayLabels = isArabic
    ? ["ح","ن","ث","ر","خ","ج","س"]
    : ["M","T","W","T","F","S","S"]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-head fu">
          <div>
            <p className="eyebrow">{t("التتبع اليومي", "Daily Tracking")}</p>
            <h1 className="page-h1">{t("عاداتي", "My Habits")}</h1>
            <p className="page-sub">{t("الاتساق هو سر النجاح", "Consistency is the secret to success")}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            {t("عادة جديدة", "New Habit")}
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            {
              icon: <Flame style={{ width: 20, height: 20, color: "#F59E0B" }} />,
              value: `${completedCount}/${total}`,
              label: t("مكتملة اليوم", "Done today"),
            },
            {
              icon: <Zap style={{ width: 20, height: 20, color: "#F59E0B" }} />,
              value: totalStreak,
              label: t("مجموع الاستريكات", "Total streaks"),
            },
            {
              icon: <Trophy style={{ width: 20, height: 20, color: "#F59E0B" }} />,
              value: maxStreak,
              label: t("أطول استريك", "Best streak"),
            },
          ].map(({ icon, value, label }, i) => (
            <div key={i} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--tx)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: ".75rem", color: "var(--tx2)", marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Habits List ── */}
        <div className="fu2 card" style={{ overflow: "hidden" }}>
          {/* Week header */}
          <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--bd)", gap: 12 }}>
            <div style={{ flex: 1, fontSize: ".75rem", fontWeight: 700, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".1em" }}>
              {t("العادة", "Habit")}
            </div>
            <div style={{ display: "flex", gap: 6, marginInlineEnd: 8 }}>
              {weekDayLabels.map((d, i) => (
                <div key={i} style={{ width: 22, textAlign: "center", fontSize: ".65rem", fontWeight: 700, color: "var(--tx3)" }}>{d}</div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Loader2 style={{ width: 28, height: 28, color: "var(--amb)" }} className="animate-spin" />
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--tx2)" }}>
              <p style={{ marginBottom: 12 }}>{t("فشل تحميل العادات", "Failed to load habits")}</p>
              <button className="btn btn-sec" onClick={() => mutate()}>{t("إعادة المحاولة", "Retry")}</button>
            </div>
          ) : habits.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Flame style={{ width: 48, height: 48, color: "var(--amb)", opacity: .3, margin: "0 auto 16px" }} />
              <p style={{ color: "var(--tx2)", marginBottom: 16 }}>{t("لا توجد عادات بعد — أضف أولى عاداتك!", "No habits yet — add your first one!")}</p>
              <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Plus style={{ width: 16, height: 16 }} />
                {t("عادة جديدة", "New Habit")}
              </button>
            </div>
          ) : (
            habits.map((h, i) => {
              const weekDone = h.week_done ?? Array(7).fill(false)
              const isToggling = togglingId === h.id
              const isDeleting = deletingId === h.id
              return (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 20px",
                    borderBottom: i < habits.length - 1 ? "1px solid var(--bd)" : "none",
                    transition: "background .15s",
                    cursor: "pointer",
                  }}
                  onClick={() => !isToggling && toggleHabit(h.id, h.completed_today)}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: `${h.color || "#D97706"}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem",
                  }}>
                    {h.icon}
                  </div>

                  {/* Name + streak */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: ".92rem",
                      color: h.completed_today ? "var(--tx3)" : "var(--tx)",
                      textDecoration: h.completed_today ? "line-through" : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {h.name}
                    </div>
                    {(h.current_streak > 0) && (
                      <div style={{ fontSize: ".72rem", color: "var(--amb)", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                        <Flame style={{ width: 11, height: 11 }} />
                        {h.current_streak} {t("يوم", "days")}
                      </div>
                    )}
                  </div>

                  {/* Week dots */}
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {weekDone.map((done: boolean, di: number) => (
                      <div
                        key={di}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          background: done
                            ? h.color || "#F59E0B"
                            : "var(--s3)",
                          border: di === 6 ? `1px solid ${done ? (h.color || "#F59E0B") : "var(--amb)"}` : "none",
                          flexShrink: 0,
                          transition: "background .2s",
                        }}
                      />
                    ))}
                  </div>

                  {/* Spinner / Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginInlineStart: 4 }} onClick={e => e.stopPropagation()}>
                    {isToggling ? (
                      <Loader2 style={{ width: 16, height: 16, color: "var(--amb)" }} className="animate-spin" />
                    ) : null}
                    <button
                      disabled={isDeleting}
                      onClick={e => { e.stopPropagation(); deleteHabit(h.id) }}
                      style={{
                        width: 28, height: 28, border: "none", background: "none", cursor: "pointer",
                        color: "var(--tx3)", display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 6, opacity: isDeleting ? .4 : 1,
                      }}
                    >
                      {isDeleting
                        ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                        : <Trash2 style={{ width: 14, height: 14 }} />}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Add habit floating button (mobile) */}
        <div style={{ height: 80 }} />
      </div>

      {/* ── Add Habit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" style={{ background: "var(--s1)", border: "1px solid var(--bd)", color: "var(--tx)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--tx)" }}>{t("إضافة عادة جديدة", "Add New Habit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createHabit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--tx2)", display: "block", marginBottom: 6 }}>
                {t("اسم العادة", "Habit name")} *
              </label>
              <input
                className="inp"
                placeholder={t("مثال: شرب الماء", "e.g. Drink water")}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--tx2)", display: "block", marginBottom: 8 }}>
                {t("الأيقونة", "Icon")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {HABIT_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    style={{
                      fontSize: "1.25rem",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: `2px solid ${form.icon === icon ? "var(--amb)" : "var(--bd)"}`,
                      background: form.icon === icon ? "rgba(245,158,11,.1)" : "var(--s2)",
                      cursor: "pointer",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--tx2)", display: "block", marginBottom: 6 }}>
                {t("اللون", "Color")}
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["#D97706","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EF4444","#EC4899"].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: `3px solid ${form.color === c ? "var(--tx)" : "transparent"}`,
                      background: c, cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
              <SelectTrigger style={{ background: "var(--s2)", border: "1px solid var(--bd)", color: "var(--tx)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("يومي", "Daily")}</SelectItem>
                <SelectItem value="weekly">{t("أسبوعي", "Weekly")}</SelectItem>
              </SelectContent>
            </Select>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!form.name.trim() || saving}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {saving && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
              {t("إضافة العادة", "Add Habit")}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
