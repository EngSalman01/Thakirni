"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Trash2, RefreshCw, Clock, Repeat, Pencil, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, isPast } from "date-fns"
import { arSA, enUS } from "date-fns/locale"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"

interface Reminder {
  id: string
  title: string
  remind_at: string
  is_sent: boolean
  sent_at: string | null
  channel: string
  repeat_interval_minutes: number | null
  plan_id: string | null
}

const REPEAT_OPTIONS = [
  { minutes: null,  ar: "مرة واحدة",    en: "One time"     },
  { minutes: 30,    ar: "كل ٣٠ دقيقة",  en: "Every 30 min" },
  { minutes: 60,    ar: "كل ساعة",      en: "Every 1h"     },
  { minutes: 120,   ar: "كل ساعتين",    en: "Every 2h"     },
  { minutes: 240,   ar: "كل ٤ ساعات",   en: "Every 4h"     },
  { minutes: 480,   ar: "كل ٨ ساعات",   en: "Every 8h"     },
  { minutes: 720,   ar: "كل ١٢ ساعة",   en: "Every 12h"    },
  { minutes: 1440,  ar: "كل يوم",        en: "Every day"    },
  { minutes: 10080, ar: "كل أسبوع",      en: "Every week"   },
]

function formatInterval(minutes: number, isArabic: boolean): string {
  if (minutes >= 10080) return isArabic ? `كل ${minutes / 10080} أسبوع` : `Every ${minutes / 10080}w`
  if (minutes >= 1440)  return isArabic ? `كل ${minutes / 1440} يوم`   : `Every ${minutes / 1440}d`
  if (minutes >= 60)    return isArabic ? `كل ${minutes / 60} ساعة`    : `Every ${minutes / 60}h`
  return isArabic ? `كل ${minutes} دقيقة` : `Every ${minutes}min`
}

// Convert UTC ISO string → local datetime-local input value (Riyadh = UTC+3)
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const riyadh = new Date(d.getTime() + 3 * 60 * 60 * 1000)
  return riyadh.toISOString().slice(0, 16)
}

// Convert datetime-local input value (Riyadh) → UTC ISO
function fromDatetimeLocal(val: string): string {
  const local = new Date(val)
  const utc = new Date(local.getTime() - 3 * 60 * 60 * 1000)
  return utc.toISOString()
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ reminder, onSave, onClose }: {
  reminder: Reminder
  onSave: (id: string, patch: { title: string; remind_at: string; repeat_interval_minutes: number | null }) => Promise<void>
  onClose: () => void
}) {
  const { t, isArabic } = useLanguage()
  const [title, setTitle] = useState(reminder.title)
  const [datetimeLocal, setDatetimeLocal] = useState(toDatetimeLocal(reminder.remind_at))
  const [repeatMinutes, setRepeatMinutes] = useState<number | null>(reminder.repeat_interval_minutes)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) { toast.error(t("أدخل عنوان التذكير", "Enter a title")); return }
    setSaving(true)
    try {
      await onSave(reminder.id, {
        title: title.trim(),
        remind_at: fromDatetimeLocal(datetimeLocal),
        repeat_interval_minutes: repeatMinutes,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md card rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--s1)", color: "var(--tx)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-foreground text-lg">{t("تعديل التذكير", "Edit Reminder")}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("العنوان", "Title")}</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600"
            autoFocus />
        </div>

        {/* Date & time */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            {t("التاريخ والوقت (توقيت الرياض)", "Date & Time (Riyadh)")}
          </label>
          <input type="datetime-local" value={datetimeLocal} onChange={e => setDatetimeLocal(e.target.value)}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600" />
        </div>

        {/* Repeat */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("التكرار", "Repeat")}</label>
          <div className="flex flex-wrap gap-2">
            {REPEAT_OPTIONS.map(opt => (
              <button key={opt.minutes ?? "none"} onClick={() => setRepeatMinutes(opt.minutes)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  repeatMinutes === opt.minutes
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "border-border text-muted-foreground hover:border-amber-400/40"
                }`}>
                {isArabic ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-white power-gradient disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
          {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {t("حفظ التعديلات", "Save Changes")}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { t, isArabic } = useLanguage()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reminders")
      if (!res.ok) throw new Error("failed")
      const { reminders: data } = await res.json() as { reminders: Reminder[] }
      setReminders(data)
    } catch {
      toast.error(t("فشل تحميل التذكيرات", "Failed to load reminders"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch("/api/reminders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("failed")
      setReminders(prev => prev.filter(r => r.id !== id))
      toast.success(t("تم حذف التذكير", "Reminder deleted"))
    } catch {
      toast.error(t("فشل حذف التذكير", "Failed to delete reminder"))
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = async (id: string, patch: { title: string; remind_at: string; repeat_interval_minutes: number | null }) => {
    const res = await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || t("فشل التعديل", "Update failed")); return }
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...json.reminder } : r))
    setEditingReminder(null)
    toast.success(t("تم تعديل التذكير", "Reminder updated"))
  }

  const upcoming = reminders.filter(r => !r.is_sent && !isPast(new Date(r.remind_at)))
  const sent     = reminders.filter(r => r.is_sent || isPast(new Date(r.remind_at)))

  const ReminderCard = ({ r, last = false }: { r: Reminder; last?: boolean }) => {
    const isUpcoming = !r.is_sent && !isPast(new Date(r.remind_at))
    const dotColor = r.channel === "whatsapp" ? "#10B981" : r.repeat_interval_minutes ? "#3B82F6" : "#F59E0B"
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px",
          borderBottom: last ? "none" : "1px solid var(--bd)",
        }}
      >
        {/* Priority dot */}
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: ".9rem",
            color: r.is_sent ? "var(--tx3)" : "var(--tx)",
            textDecoration: r.is_sent ? "line-through" : "none",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {r.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".75rem", color: "var(--tx2)" }}>
              <Clock style={{ width: 11, height: 11 }} />
              {format(new Date(r.remind_at), "PPp", { locale: isArabic ? arSA : enUS })}
            </span>
            {r.repeat_interval_minutes && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".75rem", color: "var(--amb)", fontWeight: 600 }}>
                <Repeat style={{ width: 11, height: 11 }} />
                {formatInterval(r.repeat_interval_minutes, isArabic)}
              </span>
            )}
            {r.channel === "whatsapp" && (
              <span style={{ fontSize: ".72rem", color: "#10B981", fontWeight: 700 }}>WhatsApp</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isUpcoming && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setEditingReminder(r)}
              style={{ width: 30, height: 30, border: "none", background: "none", cursor: "pointer", color: "var(--tx3)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
            >
              <Pencil style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={deletingId === r.id}
              style={{ width: 30, height: 30, border: "none", background: "none", cursor: "pointer", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, opacity: deletingId === r.id ? .4 : 1 }}
            >
              {deletingId === r.id
                ? <span style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} className="animate-spin" />
                : <Trash2 style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  const allFiltered = reminders.filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const upcomingFiltered = allFiltered.filter(r => !r.is_sent && !isPast(new Date(r.remind_at)))
  const sentFiltered = allFiltered.filter(r => r.is_sent || isPast(new Date(r.remind_at)))

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
      <main>
        <section className="page-wrap" style={{ maxWidth: 900 }}>

          <div className="page-head fu">
            <div>
              <p className="eyebrow">{t("التذكيرات", "Reminders")}</p>
              <h1 className="page-h1">{t("تذكيراتك", "Your Reminders")}</h1>
              <p className="page-sub">{t("ما راح تنسى شيء مهم بعد اليوم", "Never miss anything important again")}</p>
            </div>
            <button
              onClick={load}
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: "1px solid var(--bd)", background: "var(--s2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--tx2)", flexShrink: 0,
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="fu1" style={{ position: "relative", marginBottom: 20 }}>
            <input
              className="inp"
              placeholder={t("ابحث في التذكيرات...", "Search reminders...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingInlineStart: 40 }}
            />
            <Bell style={{ width: 16, height: 16, color: "var(--tx3)", position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>

          {/* Filter tabs */}
          <div className="fu2" style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[
              { key: "all",      label: t("الكل", "All"),           count: reminders.length },
              { key: "upcoming", label: t("قادمة", "Upcoming"),     count: upcoming.length },
              { key: "sent",     label: t("تم الإرسال", "Sent"),    count: sent.length },
            ].map(tab => (
              <button
                key={tab.key}
                style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: ".8rem", fontWeight: 700,
                  border: "1px solid",
                  borderColor: tab.key === "all" ? "var(--amb)" : "var(--bd)",
                  background: tab.key === "all" ? "rgba(245,158,11,.12)" : "var(--s2)",
                  color: tab.key === "all" ? "var(--amb)" : "var(--tx2)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {tab.label}
                <span style={{
                  background: tab.key === "all" ? "var(--amb)" : "var(--s3)",
                  color: tab.key === "all" ? "#000" : "var(--tx2)",
                  borderRadius: 99, padding: "1px 6px", fontSize: ".68rem", fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card" style={{ overflow: "hidden" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid var(--bd)", display: "flex", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--s3)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: "var(--s3)", borderRadius: 4, marginBottom: 8, width: "60%" }} />
                    <div style={{ height: 11, background: "var(--s3)", borderRadius: 4, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : allFiltered.length === 0 ? (
            <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
              <Bell style={{ width: 48, height: 48, color: "var(--tx3)", margin: "0 auto 16px", opacity: .3 }} />
              <p style={{ color: "var(--tx2)", fontSize: ".9rem" }}>
                {t("ما عندك تذكيرات بعد", "No reminders yet")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {upcomingFiltered.length > 0 && (
                <div>
                  <p style={{ fontSize: ".72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--amb)", marginBottom: 10 }}>
                    {t("قادمة", "Upcoming")} · {upcomingFiltered.length}
                  </p>
                  <div className="card" style={{ overflow: "hidden" }}>
                    <AnimatePresence mode="popLayout">
                      {upcomingFiltered.map((r, i) => (
                        <ReminderCard key={r.id} r={r} last={i === upcomingFiltered.length - 1} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {sentFiltered.length > 0 && (
                <div style={{ opacity: .6 }}>
                  <p style={{ fontSize: ".72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--tx3)", marginBottom: 10 }}>
                    {t("تم الإرسال", "Sent")} · {sentFiltered.length}
                  </p>
                  <div className="card" style={{ overflow: "hidden" }}>
                    {sentFiltered.slice(0, 10).map((r, i) => (
                      <ReminderCard key={r.id} r={r} last={i === Math.min(sentFiltered.length - 1, 9)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {editingReminder && (
          <EditModal
            reminder={editingReminder}
            onSave={handleEdit}
            onClose={() => setEditingReminder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
