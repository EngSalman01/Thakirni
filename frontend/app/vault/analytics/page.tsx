"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { APP_TIMEZONE } from "@/lib/constants"
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
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

  const totalPlansInPeriod = days.reduce((s, d) => s + d.plans, 0)
  const completionRate = totalPlansInPeriod > 0 ? Math.round((stats.completedPlans / totalPlansInPeriod) * 100) : 0
  const habitCompletionRate = stats.activeHabits > 0
    ? Math.round((habits.reduce((s, h) => s + h.completed, 0) / (stats.activeHabits * period)) * 100)
    : 0
  const totalStreak = habits.reduce((s, h) => s + h.streak, 0)
  const circumference = 2 * Math.PI * 52 // r=52

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div className="page-wrap">
          {[1,2,3].map(i => <div key={i} style={{ height: 120, background: "var(--s2)", borderRadius: 14, marginBottom: 16 }} />)}
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</p>
          <p style={{ color: "var(--tx2)", fontWeight: 600, marginBottom: 16 }}>{t("فشل تحميل التحليلات", "Failed to load analytics")}</p>
          <button className="btn btn-primary" onClick={() => { setFetchError(false); setRetryKey(k => k + 1) }}>
            {t("إعادة المحاولة", "Retry")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-head fu">
          <div>
            <p className="eyebrow">{t("الإحصائيات", "Statistics")}</p>
            <h1 className="page-h1">{t("التحليلات", "Analytics")}</h1>
            <p className="page-sub">{t("نظرة شاملة على أدائك وتقدمك", "A complete overview of your performance")}</p>
          </div>
          {/* Period picker */}
          <div style={{ display: "flex", gap: 4, background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 99, padding: 4 }}>
            {([7, 14, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "5px 14px", borderRadius: 99, fontSize: ".8rem", fontWeight: 700,
                  background: period === p ? "var(--amb)" : "transparent",
                  color: period === p ? "#000" : "var(--tx2)",
                  border: "none", cursor: "pointer",
                }}
              >
                {p}{t("ي", "d")}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { icon: <TrendingUp style={{ width: 18, height: 18 }} />, value: `${completionRate}%`, label: t("إنجاز الخطط", "Plan rate"), color: "#10B981" },
            { icon: <Flame style={{ width: 18, height: 18 }} />,     value: totalStreak,             label: t("مجموع الاستريكات", "Total streaks"), color: "#F59E0B" },
            { icon: <ListTodo style={{ width: 18, height: 18 }} />,   value: stats.completedPlans,    label: t("خطط منجزة", "Done plans"), color: "#F59E0B" },
            { icon: <Target style={{ width: 18, height: 18 }} />,     value: stats.activeHabits,      label: t("عادات نشطة", "Active habits"), color: "#10B981" },
          ].map(({ icon, value, label, color }, i) => (
            <div key={i} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--tx)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: ".7rem", color: "var(--tx2)", marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Charts Row ── */}
        <div className="fu2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Donut chart */}
          <div className="card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--tx2)", marginBottom: 16, textAlign: "center" }}>
              {t("معدل إنجاز الخطط", "Plan Completion Rate")}
            </p>
            <div style={{ position: "relative", width: 120, height: 120, marginBottom: 12 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--s3)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="#F59E0B" strokeWidth="10"
                  strokeDasharray={`${(completionRate / 100) * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--tx)" }}>{completionRate}%</span>
              </div>
            </div>
            {weekOverWeek !== null && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 99, fontSize: ".75rem", fontWeight: 700,
                background: weekOverWeek >= 0 ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)",
                color: weekOverWeek >= 0 ? "#10B981" : "var(--red)",
              }}>
                <TrendingUp style={{ width: 12, height: 12, transform: weekOverWeek < 0 ? "rotate(180deg)" : "none" }} />
                {weekOverWeek >= 0 ? "+" : ""}{weekOverWeek}% {t("مقارنة السابق", "vs prior")}
              </div>
            )}
          </div>

          {/* Bar chart */}
          <div className="card" style={{ padding: "24px 20px" }}>
            <p style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--tx2)", marginBottom: 16 }}>
              {t("إنجاز الخطط اليومي", "Daily Plan Completion")}
            </p>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days.slice(-14)} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--tx3)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 10, fontSize: 11, color: "var(--tx)" }}
                  />
                  <Bar dataKey="plans" name={t("إجمالي", "Total")} fill="var(--s4)" radius={[3,3,0,0]} />
                  <Bar dataKey="completed" name={t("مكتملة", "Done")} fill="#F59E0B" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Habits + Goals ── */}
        <div className="fu3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Habits performance */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 8 }}>
              <Flame style={{ width: 16, height: 16, color: "var(--amb)" }} />
              <span style={{ fontWeight: 800, fontSize: ".9rem" }}>{t("أداء العادات", "Habit Performance")}</span>
            </div>
            {habits.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--tx2)", fontSize: ".85rem" }}>
                {t("لا توجد عادات بعد", "No habits yet")}
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {habits.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: i < habits.length - 1 ? "1px solid var(--bd)" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND_COLORS[i % BRAND_COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--tx)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                      <div style={{ fontSize: ".7rem", color: "var(--tx2)", marginTop: 2 }}>
                        🔥 {h.streak} {t("يوم", "d")} · {h.completed} {t("مرة", "times")}
                      </div>
                    </div>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--amb)" }}>{h.completed}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 8 }}>
              <Target style={{ width: 16, height: 16, color: "var(--amb)" }} />
              <span style={{ fontWeight: 800, fontSize: ".9rem" }}>{t("تقدم الأهداف", "Goals Progress")}</span>
            </div>
            {goals.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--tx2)", fontSize: ".85rem" }}>
                {t("لا توجد أهداف بعد", "No goals yet")}
              </div>
            ) : (
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {goals.map((g, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: ".82rem", color: "var(--tx)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginInlineEnd: 8 }}>{g.title}</span>
                      <span style={{ fontSize: ".82rem", fontWeight: 800, color: "var(--amb)", flexShrink: 0 }}>{g.progress}%</span>
                    </div>
                    <div style={{ height: 6, background: "var(--s3)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${g.progress}%` }}
                        transition={{ delay: i * 0.08, duration: 0.7 }}
                        style={{ height: "100%", background: "linear-gradient(90deg,#D97706,#F59E0B)", borderRadius: 99 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── AI Usage ── */}
        {usage && (
          <div className="fu4 card" style={{ overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Brain style={{ width: 16, height: 16, color: "var(--amb)" }} />
                <span style={{ fontWeight: 800, fontSize: ".9rem" }}>{t("استخدام الذكاء الاصطناعي", "AI Usage")}</span>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: ".68rem", fontWeight: 800, background: "rgba(245,158,11,.12)", color: "var(--amb)" }}>
                  {usage.tier}
                </span>
              </div>
              <span style={{ fontSize: ".75rem", color: "var(--tx2)" }}>{t("هذا الشهر", "This month")}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
              {[
                { label: t("محادثات AI", "AI Chats"), used: usage.usage.aiChatRequests, limit: usage.limits.aiChatRequests, pct: usage.pct.aiChat, icon: "🤖" },
                { label: t("مستندات", "Documents"),   used: usage.usage.documentUploads, limit: usage.limits.documentUploads, pct: usage.pct.documents, icon: "📄" },
                { label: t("اجتماعات", "Meetings"),   used: usage.usage.meetingSummaries, limit: usage.limits.meetingSummaries, pct: usage.pct.meetings, icon: "🎙️" },
                { label: t("دقائق صوتية", "Voice"),   used: usage.usage.voiceNoteMinutes, limit: usage.limits.voiceNoteMinutes, pct: usage.pct.voice, icon: "🎤" },
              ].map(({ label, used, limit, pct, icon }, i, arr) => (
                <div key={i} style={{ padding: "16px 20px", borderInlineEnd: i < arr.length - 1 ? "1px solid var(--bd)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: "1rem" }}>{icon}</span>
                    <span style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--tx2)" }}>{label as string}</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--tx)", marginBottom: 8 }}>{used}<span style={{ fontSize: ".75rem", color: "var(--tx3)", fontWeight: 400 }}>/{limit === 0 ? "∞" : limit}</span></div>
                  {limit > 0 && (
                    <div style={{ height: 5, background: "var(--s3)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "var(--red)" : "linear-gradient(90deg,#D97706,#F59E0B)", borderRadius: 99 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </div>
  )
}
