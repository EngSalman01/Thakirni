"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Trash2, RefreshCw, Clock, Repeat } from "lucide-react"
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

function formatInterval(minutes: number, isArabic: boolean): string {
  if (minutes >= 10080) return isArabic ? `كل ${minutes / 10080} أسبوع` : `Every ${minutes / 10080}w`
  if (minutes >= 1440)  return isArabic ? `كل ${minutes / 1440} يوم` : `Every ${minutes / 1440}d`
  if (minutes >= 60)    return isArabic ? `كل ${minutes / 60} ساعة` : `Every ${minutes / 60}h`
  return isArabic ? `كل ${minutes} دقيقة` : `Every ${minutes}min`
}

export default function RemindersPage() {
  const { t, isArabic } = useLanguage()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const upcoming = reminders.filter(r => !r.is_sent && !isPast(new Date(r.remind_at)))
  const sent     = reminders.filter(r => r.is_sent || isPast(new Date(r.remind_at)))

  const ReminderCard = ({ r }: { r: Reminder }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="shell-panel rounded-2xl p-4 flex items-start gap-4"
    >
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

      {!r.is_sent && (
        <button
          onClick={() => handleDelete(r.id)}
          disabled={deletingId === r.id}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
        >
          {deletingId === r.id
            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background hero-mesh">
      <main className="pt-16">
        <section className="pt-20 pb-10 px-4 sm:px-8 max-w-3xl mx-auto">

          {/* Header */}
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
            <button
              onClick={load}
              className="w-10 h-10 rounded-xl shell-panel flex items-center justify-center text-muted-foreground hover:text-amber-600 transition-colors"
            >
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
    </div>
  )
}
