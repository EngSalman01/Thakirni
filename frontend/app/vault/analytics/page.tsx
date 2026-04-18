"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { APP_TIMEZONE } from "@/lib/constants"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, Brain, ListTodo, Flame, Target } from "lucide-react"

interface DayData { date: string; label: string; plans: number; completed: number; memories: number }
interface HabitData { name: string; streak: number; completed: number }
interface GoalData { title: string; progress: number; status: string }

function ParticleLayer() {
  useEffect(() => {
    const container = document.getElementById("analytics-particles")
    if (!container || container.childElementCount > 0) return
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div")
      p.style.cssText = `
        position:absolute;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;
        border-radius:50%;opacity:${0.06+Math.random()*0.12};
        left:${Math.random()*100}%;top:${Math.random()*100}%;
        background:${Math.random()>0.5?"#D97706":"#F59E0B"};
        --drift-x:${(Math.random()-0.5)*120}px;--drift-y:${(Math.random()-0.5)*120}px;
        animation:particle-drift ${8+Math.random()*12}s ease-in-out infinite;
        animation-delay:${-Math.random()*15}s;pointer-events:none;
      `
      container.appendChild(p)
    }
  }, [])
  return <div id="analytics-particles" className="absolute inset-0 overflow-hidden pointer-events-none" />
}

function MiniBarChart({ days }: { days?: DayData[] }) {
  const hasData = days && days.length > 0
  const bars = hasData
    ? days.map(d => d.plans > 0 ? Math.round((d.completed / d.plans) * 100) : 0)
    : Array(14).fill(0)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {bars.map((h, i) => (
        <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.4 + i * 0.04, duration: 0.4, ease: [0.2, 1, 0.3, 1] }}
          className="flex-1 rounded-t-sm origin-bottom"
          style={{ height: `${Math.max(h, 4)}%`, background: (hasData && i === bars.length - 1) ? "linear-gradient(135deg,#D97706,#F59E0B)" : i % 2 === 0 ? "#e4e2e1" : "#d0cece" }}
        />
      ))}
    </div>
  )
}

const BRAND_COLORS = ["#D97706", "#F59E0B", "#FBBF24", "#D97706", "#F59E0B"]

export default function AnalyticsPage() {
  const { t, isArabic } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<DayData[]>([])
  const [habits, setHabits] = useState<HabitData[]>([])
  const [goals, setGoals] = useState<GoalData[]>([])
  const [stats, setStats] = useState({ totalMemories: 0, completedPlans: 0, activeHabits: 0, activeGoals: 0 })
  const [period, setPeriod] = useState<7 | 14 | 30>(14)
  const [fetchError, setFetchError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const [usage, setUsage] = useState<{
    tier: string
    credits: number
    usage: { aiChatRequests: number; documentUploads: number; meetingSummaries: number; voiceNoteMinutes: number }
    limits: { aiChatRequests: number; documentUploads: number; meetingSummaries: number; voiceNoteMinutes: number }
    pct: { aiChat: number; documents: number; meetings: number; voice: number }
  } | null>(null)

  const weekOverWeek = useMemo(() => {
    if (days.length < 2) return null
    const half = Math.floor(days.length / 2)
    const prev = days.slice(0, half)
    const curr = days.slice(half)
    const avg = (slice: DayData[]) => {
      const totalPlans = slice.reduce((s, d) => s + d.plans, 0)
      if (totalPlans === 0) return 0
      return slice.reduce((s, d) => s + d.completed, 0) / totalPlans
    }
    const prevAvg = avg(prev)
    const currAvg = avg(curr)
    if (prevAvg === 0) return currAvg > 0 ? 100 : null
    return Math.round(((currAvg - prevAvg) / prevAvg) * 100)
  }, [days])

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    async function load() {
      try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = new Date()
      const dayArray: DayData[] = []
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE })
        const label = d.toLocaleDateString(isArabic ? "ar-SA" : "en-US", { weekday: "short", timeZone: APP_TIMEZONE })
        dayArray.push({ date: dateStr, label, plans: 0, completed: 0, memories: 0 })
      }

      const startDate = dayArray[0].date

      const [plansRes, memoriesRes, habitsRes, habitLogsRes, goalsRes] = await Promise.all([
        supabase.from("plans").select("plan_date, status").eq("user_id", user.id).gte("plan_date", startDate),
        supabase.from("memories").select("created_at").eq("user_id", user.id).gte("created_at", `${startDate}T00:00:00`),
        supabase.from("habits").select("id, name, current_streak, is_active").eq("user_id", user.id).eq("is_active", true).limit(5),
        supabase.from("habit_logs").select("habit_id, logged_at").eq("user_id", user.id).gte("logged_at", `${startDate}T00:00:00`),
        supabase.from("goals").select("title, status, progress").eq("user_id", user.id).limit(6),
      ])

      for (const plan of plansRes.data ?? []) {
        const day = dayArray.find(d => d.date === plan.plan_date)
        if (day) { day.plans++; if (plan.status === "done") day.completed++ }
      }
      for (const mem of memoriesRes.data ?? []) {
        const dateStr = new Date(mem.created_at).toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE })
        const day = dayArray.find(d => d.date === dateStr)
        if (day) day.memories++
      }

      const habitLogCounts: Record<string, number> = {}
      for (const log of habitLogsRes.data ?? []) {
        habitLogCounts[log.habit_id] = (habitLogCounts[log.habit_id] ?? 0) + 1
      }

      const habitData: HabitData[] = (habitsRes.data ?? []).map(h => ({
        name: h.name.slice(0, 20),
        streak: h.current_streak ?? 0,
        completed: habitLogCounts[h.id] ?? 0,
      })).sort((a, b) => b.completed - a.completed)

      const goalData: GoalData[] = (goalsRes.data ?? []).map(g => ({
        title: g.title.slice(0, 25),
        progress: g.progress ?? 0,
        status: g.status,
      }))

      setDays(dayArray)
      setHabits(habitData)
      setGoals(goalData)
      setStats({
        totalMemories: memoriesRes.data?.length ?? 0,
        completedPlans: (plansRes.data ?? []).filter(p => p.status === "done").length,
        activeHabits: habitsRes.data?.length ?? 0,
        activeGoals: (goalsRes.data ?? []).filter(g => g.status === "active" || g.status === "in_progress").length,
      })
      setLoading(false)

        // Fetch usage data
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const usageRes = await fetch("/api/usage/me", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (usageRes.ok) {
            const usageData = await usageRes.json()
            setUsage(usageData)
          }
        }
      } catch (err) {
        console.error("[Analytics] load error:", err)
        setFetchError(true)
        setLoading(false)
      }
    }
    load()
  }, [isArabic, period, retryKey])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <main className="pt-24 px-6 lg:px-12 pb-20">
          <div className="max-w-5xl mx-auto space-y-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </main>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <main className="pt-24 px-6 lg:px-12 pb-20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-2xl">⚠️</p>
            <p className="text-muted-foreground font-semibold">{t("فشل تحميل التحليلات", "Failed to load analytics")}</p>
            <button onClick={() => { setFetchError(false); setRetryKey(k => k + 1); }}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors">
              {t("إعادة المحاولة", "Retry")}
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Period picker */}
      <div className="fixed top-14 inset-x-0 z-30 px-6 py-2 hidden lg:flex items-center justify-end gap-2 pointer-events-none">
        <div className="flex items-center gap-1 nav-shell rounded-full p-1 pointer-events-auto">
          {([7, 14, 30] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${period === p ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      <main className="pt-14 lg:pt-16 transition-all duration-300">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-amber-600/20 rounded-full px-4 py-2 mb-8 shadow-sm">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-label font-medium text-muted-foreground">{t(`آخر ${period} أيام`, `Last ${period} days`)}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-none mb-8">
                <span className="text-foreground">{t("رؤية", "See Your")}</span>{" "}
                <span className="gradient-text">{t("شاملة", "Progress")}</span>
                <br />
                <span className="text-foreground">{t("على تقدمك", "Clearly")}</span>
              </h1>

              <p className="text-xl text-muted-foreground font-body mb-10 leading-relaxed max-w-lg">
                {t(
                  "تابع أداءك عبر الذكريات والخطط والعادات والأهداف في لوحة تحليلية متكاملة.",
                  "Track your performance across memories, plans, habits, and goals in one comprehensive dashboard."
                )}
              </p>

              {/* Stat pills */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Brain, label: t("ذكريات", "Memories"), value: stats.totalMemories, color: "#D97706" },
                  { icon: ListTodo, label: t("خطط مكتملة", "Plans done"), value: stats.completedPlans, color: "#F59E0B" },
                  { icon: Flame, label: t("عادات نشطة", "Active habits"), value: stats.activeHabits, color: "#f59e0b" },
                  { icon: Target, label: t("أهداف جارية", "Goals active"), value: stats.activeGoals, color: "#10b981" },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                    className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 hover-lift">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-2xl font-headline font-bold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right visual — mini chart preview */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
              className="bg-[#e4e2e1] rounded-2xl p-8 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-600/10 to-transparent rounded-full -translate-y-8 translate-x-8" />

              <p className="text-sm font-label font-bold text-muted-foreground mb-1">{t("إنجاز الخطط", "Plan Completion")}</p>
              <p className="text-3xl font-headline font-extrabold text-foreground mb-3">
                {stats.completedPlans} <span className="text-lg font-normal text-muted-foreground">{t("مكتملة", "completed")}</span>
              </p>
              {weekOverWeek !== null && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-label font-bold px-3 py-1 rounded-full mb-4 ${
                  weekOverWeek >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  <TrendingUp className={`w-3 h-3 ${weekOverWeek < 0 ? "rotate-180" : ""}`} />
                  {weekOverWeek >= 0 ? "+" : ""}{weekOverWeek}% {t("مقارنة بالفترة السابقة", "vs prior period")}
                </div>
              )}
              <MiniBarChart days={days} />
            </motion.div>
          </div>
        </section>

        {/* ═══ AI USAGE ═══ */}
        {usage && (
        <section className="px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-muted dark:bg-white/[0.03] rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-2xl font-headline font-bold text-foreground">
                    {t("استخدام الذكاء الاصطناعي", "AI Usage")}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    {usage.tier}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t("هذا الشهر", "This month")}</span>
                  {usage.credits > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      {usage.credits} {t("رصيد", "credits")}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: t("محادثات AI", "AI Chats"),
                    used: usage.usage.aiChatRequests,
                    limit: usage.limits.aiChatRequests,
                    pct: usage.pct.aiChat,
                    icon: "🤖",
                    limitZero: usage.limits.aiChatRequests === 0,
                  },
                  {
                    label: t("مستندات", "Documents"),
                    used: usage.usage.documentUploads,
                    limit: usage.limits.documentUploads,
                    pct: usage.pct.documents,
                    icon: "📄",
                    limitZero: usage.limits.documentUploads === 0,
                  },
                  {
                    label: t("ملخصات اجتماعات", "Meetings"),
                    used: usage.usage.meetingSummaries,
                    limit: usage.limits.meetingSummaries,
                    pct: usage.pct.meetings,
                    icon: "🎙️",
                    limitZero: usage.limits.meetingSummaries === 0,
                  },
                  {
                    label: t("دقائق صوتية", "Voice mins"),
                    used: usage.usage.voiceNoteMinutes,
                    limit: usage.limits.voiceNoteMinutes,
                    pct: usage.pct.voice,
                    icon: "🎤",
                    limitZero: usage.limits.voiceNoteMinutes === 0,
                  },
                ].map(({ label, used, limit, pct, icon, limitZero }) => (
                  <div key={label as string} className="bg-card rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-sm font-label font-semibold text-muted-foreground">{label as string}</span>
                      </div>
                      {pct >= 100 && !limitZero && (
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          {t("مكتمل", "Full")}
                        </span>
                      )}
                      {pct >= 80 && pct < 100 && !limitZero && (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                          {t("قريب", "80%")}
                        </span>
                      )}
                    </div>

                    {limitZero ? (
                      <p className="text-xs text-slate-400">{t("يتطلب ترقية", "Requires upgrade")}</p>
                    ) : (
                      <>
                        <div className="h-2 bg-[#e4e2e1] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{
                              background: pct >= 100
                                ? "#ef4444"
                                : pct >= 80
                                ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                                : "linear-gradient(90deg,#D97706,#F59E0B)",
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {used} / {limit}
                          </span>
                          <span className={`text-xs font-bold ${pct >= 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-slate-400"}`}>
                            {pct}%
                          </span>
                        </div>
                      </>
                    )}

                    {pct >= 100 && !limitZero && (
                      <button
                        onClick={() => window.location.href = "/vault/settings"}
                        className="w-full text-xs font-bold py-1.5 rounded-lg power-gradient text-white hover:opacity-90 transition-opacity"
                      >
                        {t("ترقية الخطة", "Upgrade Plan")}
                      </button>
                    )}
                    {pct >= 80 && pct < 100 && !limitZero && (
                      <p className="text-[11px] text-amber-600 font-medium">
                        {t(`تبقى ${limit - used} فقط`, `${limit - used} remaining`)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
        )}

        {/* ═══ CHARTS ═══ */}
        <section className="px-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Plans chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.6 }}
              className="bg-muted dark:bg-white/[0.03] rounded-2xl p-10 relative overflow-hidden group hover-lift">
              <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tl from-amber-600/8 to-transparent rounded-tl-3xl pointer-events-none transition-transform duration-500 group-hover:translate-y-0 translate-y-4 translate-x-4" />
              <h2 className="text-2xl font-headline font-bold text-foreground mb-8">
                📊 {t("إنجاز الخطط اليومي", "Daily Plan Completion")}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={days} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                  <Bar dataKey="plans" name={t("إجمالي", "Total")} fill="#e4e2e1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name={t("مكتملة", "Completed")} fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Memories chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
              className="bg-amber-400 rounded-2xl p-10 relative overflow-hidden group hover-lift">
              <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-white/10 rounded-tl-3xl pointer-events-none" />
              <h2 className="text-2xl font-headline font-bold text-white mb-8">
                🧠 {t("نشاط الذكريات", "Memory Activity")}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={days}>
                  <defs>
                    <linearGradient id="memGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="memories" name={t("ذكريات", "Memories")} stroke="#ffffff" strokeWidth={2.5} fill="url(#memGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Habits + Goals side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Habits */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.6 }}
                className="bg-muted dark:bg-white/[0.03] rounded-2xl p-10 hover-lift">
                <h2 className="text-2xl font-headline font-bold text-foreground mb-8">
                  🔥 {t("أداء العادات", "Habit Performance")}
                </h2>
                {habits.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-12">{t("لا توجد عادات بعد", "No habits yet")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={habits} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={{ borderRadius: "16px", border: "none", fontSize: 12 }} />
                      <Bar dataKey="completed" name={t("مرات الإنجاز", "Completions")} radius={[0, 6, 6, 0]}>
                        {habits.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Goals */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                className="bg-muted dark:bg-white/[0.03] rounded-2xl p-10 hover-lift">
                <h2 className="text-2xl font-headline font-bold text-foreground mb-8">
                  🎯 {t("تقدم الأهداف", "Goals Progress")}
                </h2>
                {goals.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-12">{t("لا توجد أهداف بعد", "No goals yet")}</p>
                ) : (
                  <div className="space-y-5 mt-2">
                    {goals.map((g, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-label font-medium text-muted-foreground truncate flex-1 me-3">{g.title}</span>
                          <span className="text-sm font-bold gradient-text shrink-0">{g.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-[#e4e2e1] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${g.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}
