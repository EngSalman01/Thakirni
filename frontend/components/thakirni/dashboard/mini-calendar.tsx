"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GCalEvent {
  id?: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
  _calendarName: string
  _calendarColor: string
}

interface ThakirniPlan {
  id: string
  title: string
  plan_date: string
  plan_time?: string | null
  category: string
  status: string
}

interface DayEvent {
  id: string
  title: string
  time?: string
  color: string
  source: "gcal" | "thakirni"
  link?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  meeting:  "#f59e0b",
  task:     "#6366f1",
  health:   "#10b981",
  work:     "#3b82f6",
  personal: "#ec4899",
  grocery:  "#84cc16",
  finance:  "#f97316",
  other:    "#94a3b8",
}

function formatTimeStr(isoOrHhmm: string): string {
  if (isoOrHhmm.includes("T")) {
    return new Date(isoOrHhmm).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  }
  if (/^\d{2}:\d{2}/.test(isoOrHhmm)) {
    const [h, m] = isoOrHhmm.split(":").map(Number)
    const suffix = h >= 12 ? "PM" : "AM"
    const display = h > 12 ? h - 12 : h || 12
    return `${display}:${String(m).padStart(2, "0")} ${suffix}`
  }
  return isoOrHhmm
}

function toDateKey(dateStr: string): string {
  // Returns YYYY-MM-DD
  if (dateStr.includes("T")) return dateStr.split("T")[0]
  return dateStr.slice(0, 10)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MiniCalendar() {
  const { t, isArabic } = useLanguage()

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-based
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  )

  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([])
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
  const [plans, setPlans] = useState<ThakirniPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Google Calendar events
  useEffect(() => {
    fetch("/api/google-calendar/events")
      .then(r => r.ok ? r.json() as Promise<{ connected: boolean; events: GCalEvent[] }> : null)
      .then(data => {
        if (data) {
          setGcalConnected(data.connected)
          setGcalEvents(data.events ?? [])
        } else {
          setGcalConnected(false)
        }
      })
      .catch(() => setGcalConnected(false))
  }, [])

  // Fetch Thakirni plans for visible month (and adjacent months)
  useEffect(() => {
    const supabase = createClient()
    const start = new Date(viewYear, viewMonth - 1, 1).toISOString().split("T")[0]
    const end = new Date(viewYear, viewMonth + 2, 0).toISOString().split("T")[0]

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from("plans")
        .select("id, title, plan_date, plan_time, category, status")
        .eq("user_id", user.id)
        .gte("plan_date", start)
        .lte("plan_date", end)
        .neq("status", "cancelled")
        .order("plan_time", { ascending: true, nullsFirst: false })
        .limit(200)
        .then(({ data }) => {
          setPlans((data ?? []) as ThakirniPlan[])
          setLoading(false)
        })
    })
  }, [viewYear, viewMonth])

  // Build event map: date key → DayEvent[]
  const eventMap = useMemo(() => {
    const map = new Map<string, DayEvent[]>()

    for (const ev of gcalEvents) {
      const dateKey = toDateKey(ev.start?.dateTime ?? ev.start?.date ?? "")
      if (!dateKey) continue
      const time = ev.start?.dateTime ? formatTimeStr(ev.start.dateTime) : undefined
      const list = map.get(dateKey) ?? []
      list.push({
        id: ev.id ?? dateKey + ev.summary,
        title: ev.summary ?? "Event",
        time,
        color: ev._calendarColor ?? "#4285F4",
        source: "gcal",
        link: ev.htmlLink,
      })
      map.set(dateKey, list)
    }

    for (const plan of plans) {
      const dateKey = plan.plan_date
      const time = plan.plan_time ? formatTimeStr(plan.plan_time) : undefined
      const list = map.get(dateKey) ?? []
      list.push({
        id: plan.id,
        title: plan.title,
        time,
        color: CATEGORY_COLORS[plan.category] ?? CATEGORY_COLORS.other,
        source: "thakirni",
      })
      map.set(dateKey, list)
    }

    return map
  }, [gcalEvents, plans])

  // Build calendar grid for viewYear/viewMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const startDow = firstDay.getDay() // 0=Sun
    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    // Pad to full rows
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  const selectedEvents = eventMap.get(selectedDate) ?? []
  const todayKey = today.toISOString().split("T")[0]

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    isArabic ? "ar-SA" : "en-US",
    { month: "long", year: "numeric" }
  )

  const DOW_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const DOW_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
  const DOW = isArabic ? DOW_AR : DOW_EN

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-card dark:bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">{t("التقويم", "Calendar")}</span>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* ── Month nav ── */}
      <div className="flex items-center justify-between px-4 pb-2">
        <button
          onClick={isArabic ? nextMonth : prevMonth}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-foreground">{monthName}</span>
        <button
          onClick={isArabic ? prevMonth : nextMonth}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/60 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDate
          const dayEvents = eventMap.get(dateKey) ?? []
          const hasThakirni = dayEvents.some(e => e.source === "thakirni")
          const hasGcal = dayEvents.some(e => e.source === "gcal")

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={cn(
                "relative flex flex-col items-center justify-start pt-1 pb-1.5 rounded-lg text-xs font-medium transition-all",
                isSelected
                  ? "bg-amber-500 text-white"
                  : isToday
                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-400 font-bold"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{day}</span>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasThakirni && (
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      isSelected ? "bg-white/80" : "bg-amber-500"
                    )} />
                  )}
                  {hasGcal && (
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      isSelected ? "bg-white/80" : "bg-blue-500"
                    )} />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/60 mx-4" />

      {/* ── Selected day events ── */}
      <div className="px-4 py-3 min-h-[80px]">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString(
            isArabic ? "ar-SA" : "en-US",
            { weekday: "short", month: "short", day: "numeric" }
          )}
        </p>

        <AnimatePresence mode="wait">
          {selectedEvents.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground/60 py-1"
            >
              {t("لا يوجد شيء مجدول", "Nothing scheduled")}
            </motion.p>
          ) : (
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5 max-h-[140px] overflow-y-auto"
            >
              {selectedEvents
                .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
                .map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 bg-muted/50 dark:bg-white/[0.03]"
                  >
                    <span
                      className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{ev.title}</p>
                      {ev.time && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {ev.time}
                        </p>
                      )}
                    </div>
                    {ev.link && (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect prompt */}
        {gcalConnected === false && (
          <p className="text-[10px] text-muted-foreground/50 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            <a
              href="/vault/settings"
              className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              {t("اربط Google Calendar لمزيد من الأحداث", "Connect Google Calendar for more events")}
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
