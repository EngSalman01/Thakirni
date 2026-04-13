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
        className="w-full max-w-md shell-panel rounded-2xl p-6 flex flex-col gap-4"
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

  const ReminderCard = ({ r }: { r: Reminder }) => {
    const isUpcoming = !r.is_sent && !isPast(new Date(r.remind_at))
    return (
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="shell-panel rounded-2xl p-4 flex items-start gap-4">
        <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.is_sent ? "bg-muted" : "bg-amber-100 dark:bg-amber-950/50"}`}>
          <Bell className={`w-4 h-4 ${r.is_sent ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${r.is_sent ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {r.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {format(new Date(r.remind_at), "PPp", { locale: isArabic ? arSA : enUS })}
            </span>
            {r.repeat_interval_minutes && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Repeat className="w-3 h-3" />
                {formatInterval(r.repeat_interval_minutes, isArabic)}
              </span>
            )}
            {r.channel === "whatsapp" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp</span>
            )}
          </div>
        </div>

        {isUpcoming && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditingReminder(r)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
              {deletingId === r.id
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-background hero-mesh">
      <main className="pt-16">
        <section className="pt-20 pb-10 px-4 sm:px-8 max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="eyebrow-badge mb-3 inline-flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                {t("التذكيرات", "Reminders")}
              </span>
              <h1 className="text-3xl font-headline font-bold text-foreground">
                {t("تذكيراتك", "Your Reminders")}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t("كل التذكيرات اللي ضفتها من واتساب أو الموقع", "All reminders added via WhatsApp or the web")}
              </p>
            </div>
            <button onClick={load}
              className="w-10 h-10 rounded-xl shell-panel flex items-center justify-center text-muted-foreground hover:text-amber-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="shell-panel rounded-2xl p-4 h-16 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="shell-panel rounded-2xl p-12 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">
                {t("ما عندك تذكيرات بعد — قول لذكرني على واتساب ويضيف لك", "No reminders yet — tell Thakirni on WhatsApp to add one")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
                    {t("قادمة", "Upcoming")} · {upcoming.length}
                  </p>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {upcoming.map(r => <ReminderCard key={r.id} r={r} />)}
                    </div>
                  </AnimatePresence>
                </div>
              )}

              {sent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("تم الإرسال", "Sent")} · {sent.length}
                  </p>
                  <div className="space-y-2 opacity-60">
                    {sent.slice(0, 10).map(r => <ReminderCard key={r.id} r={r} />)}
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
