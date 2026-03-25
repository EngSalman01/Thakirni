"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
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
        background:${Math.random()>0.5?"#2552ca":"#ad1d7f"};
        --drift-x:${(Math.random()-0.5)*120}px;--drift-y:${(Math.random()-0.5)*120}px;
        animation:particle-drift ${8+Math.random()*12}s ease-in-out infinite;
        animation-delay:${-Math.random()*15}s;pointer-events:none;
      `
      container.appendChild(p)
    }
  }, [])
  return <div id="analytics-particles" className="absolute inset-0 overflow-hidden pointer-events-none" />
}

function MiniBarChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 65, 80, 100]
  return (
    <div className="flex items-end gap-1.5 h-24">
      {bars.map((h, i) => (
        <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.4 + i * 0.04, duration: 0.4, ease: [0.2, 1, 0.3, 1] }}
          className="flex-1 rounded-t-sm origin-bottom"
          style={{ height: `${h}%`, background: i === bars.length - 1 ? "linear-gradient(135deg,#2552ca,#ad1d7f)" : i % 2 === 0 ? "#e4e2e1" : "#d0cece" }}
        />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { t, isArabic } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<DayData[]>([])
  const [habits, setHabits] = useState<HabitData[]>([])
  const [goals, setGoals] = useState<GoalData[]>([])
  const [stats, setStats] = useState({ totalMemories: 0, completedPlans: 0, activeHabits: 0, activeGoals: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      const dayArray: DayData[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
        const label = d.toLocaleDateString(isArabic ? "ar-SA" : "en-US", { weekday: "short", timeZone: "Asia/Riyadh" })
        dayArray.push({ date: dateStr, label, plans: 0, completed: 0, memories: 0 })
      }

      const startDate = dayArray[0].date

      const [plansRes, memoriesRes, habitsRes, habitLogsRes, goalsRes] = await Promise.all([
        supabase.from("plans").select("plan_date, status").eq("user_id", user.id).gte("plan_date", startDate),
        supabase.from("memories").select("created_at").eq("user_id", user.id).gte("created_at", `${startDate}T00:00:00`),
        supabase.from("habits").select("id, title, current_streak, is_active").eq("user_id", user.id).eq("is_active", true).limit(5),
        supabase.from("habit_logs").select("habit_id, logged_at").eq("user_id", user.id).gte("logged_at", `${startDate}T00:00:00`),
        supabase.from("goals").select("title, status, progress_pct").eq("user_id", user.id).limit(6),
      ])

      for (const plan of plansRes.data ?? []) {
        const day = dayArray.find(d => d.date === plan.plan_date)
        if (day) { day.plans++; if (plan.status === "done") day.completed++ }
      }
      for (const mem of memoriesRes.data ?? []) {
        const dateStr = new Date(mem.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
        const day = dayArray.find(d => d.date === dateStr)
        if (day) day.memories++
      }

      const habitLogCounts: Record<string, number> = {}
      for (const log of habitLogsRes.data ?? []) {
        habitLogCounts[log.habit_id] = (habitLogCounts[log.habit_id] ?? 0) + 1
      }

      const habitData: HabitData[] = (habitsRes.data ?? []).map(h => ({
        name: h.title.slice(0, 20),
        streak: h.current_streak ?? 0,
        completed: habitLogCounts[h.id] ?? 0,
      })).sort((a, b) => b.completed - a.completed)

      const goalData: GoalData[] = (goalsRes.data ?? []).map(g => ({
        title: g.title.slice(0, 25),
        progress: g.progress_pct ?? 0,
        status: g.status,
      }))

      setDays(dayArray)
      setHabits(habitData)
      setGoals(goalData)
      setStats({
        totalMemories: memoriesRes.data?.length ?? 0,
        completedPlans: (plansRes.data ?? []).filter(p => p.status === "done").length,
        activeHabits: habitsRes.data?.length ?? 0,
        activeGoals: (goalsRes.data ?? []).filter(g => g.status === "in_progress").length,
      })
      setLoading(false)
    }
    load()
  }, [isArabic])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
        <VaultSidebar />
        <main className="lg:ml-72 pt-24 px-6 lg:px-12 pb-20">
          <div className="max-w-5xl mx-auto space-y-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed header */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl power-gradient flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-headline font-extrabold gradient-text">{t("التحليلات", "Analytics")}</span>
        </div>
        <div className="flex items-center gap-2"><MobileMenuButton /><ThemeToggle /><LanguageToggle /></div>
      </header>

      <main className="lg:ml-72 transition-all duration-300">
        {/* Mobile header */}
        <div className="flex items-center gap-3 p-4 lg:hidden">
          <MobileMenuButton />
          <span className="text-lg font-headline font-extrabold gradient-text">{t("التحليلات", "Analytics")}</span>
          <div className="ms-auto flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>
        </div>

        {/* ═══ HERO ═══ */}
        <section className="relative pt-32 pb-24 px-8 hero-mesh overflow-hidden">
          <ParticleLayer />
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#2552ca]/20 rounded-full px-4 py-2 mb-8 shadow-sm">
                <TrendingUp className="w-4 h-4 text-[#2552ca]" />
                <span className="text-sm font-label font-medium text-slate-700">{t("آخر ١٤ يوم", "Last 14 days")}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-none mb-8">
                <span className="text-slate-900">{t("رؤية", "See Your")}</span>{" "}
                <span className="gradient-text">{t("شاملة", "Progress")}</span>
                <br />
                <span className="text-slate-900">{t("على تقدمك", "Clearly")}</span>
              </h1>

              <p className="text-xl text-slate-600 font-body mb-10 leading-relaxed max-w-lg">
                {t(
                  "تابع أداءك عبر الذكريات والخطط والعادات والأهداف في لوحة تحليلية متكاملة.",
                  "Track your performance across memories, plans, habits, and goals in one comprehensive dashboard."
                )}
              </p>

              {/* Stat pills */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Brain, label: t("ذكريات", "Memories"), value: stats.totalMemories, color: "#2552ca" },
                  { icon: ListTodo, label: t("خطط مكتملة", "Plans done"), value: stats.completedPlans, color: "#ad1d7f" },
                  { icon: Flame, label: t("عادات نشطة", "Active habits"), value: stats.activeHabits, color: "#f59e0b" },
                  { icon: Target, label: t("أهداف جارية", "Goals active"), value: stats.activeGoals, color: "#10b981" },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                    className="bg-white rounded-2xl p-4 border border-[#e4e2e1] shadow-card flex items-center gap-3 hover-lift">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-2xl font-headline font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right visual — mini chart preview */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
              className="bg-[#e4e2e1] rounded-2xl p-8 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#2552ca]/10 to-transparent rounded-full -translate-y-8 translate-x-8" />

              <p className="text-sm font-label font-bold text-slate-500 mb-1">{t("إنجاز الخطط", "Plan Completion")}</p>
              <p className="text-3xl font-headline font-extrabold text-slate-900 mb-6">
                {stats.completedPlans} <span className="text-lg font-normal text-slate-500">{t("مكتملة", "completed")}</span>
              </p>
              <MiniBarChart />

              {/* Floating badge */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-4 bg-white rounded-xl shadow-card px-3 py-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold text-green-600">+12%</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ CHARTS ═══ */}
        <section className="px-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Plans chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
              className="bg-[#f6f3f2] rounded-2xl p-10 relative overflow-hidden group hover-lift">
              <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#2552ca]/8 to-transparent rounded-tl-3xl pointer-events-none transition-transform duration-500 group-hover:translate-y-0 translate-y-4 translate-x-4" />
              <h2 className="text-2xl font-headline font-bold text-slate-900 mb-8">
                📊 {t("إنجاز الخطط اليومي", "Daily Plan Completion")}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={days} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                  <Bar dataKey="plans" name={t("إجمالي", "Total")} fill="#e4e2e1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name={t("مكتملة", "Completed")} fill="#ad1d7f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Memories chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.05 }}
              className="bg-[#456ce4] rounded-2xl p-10 relative overflow-hidden group hover-lift">
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
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="bg-[#f6f3f2] rounded-2xl p-10 hover-lift">
                <h2 className="text-2xl font-headline font-bold text-slate-900 mb-8">
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
                        {habits.map((_, i) => <Cell key={i} fill={`hsl(${30 + i * 20}, 90%, 55%)`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Goals */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.05 }}
                className="bg-[#f6f3f2] rounded-2xl p-10 hover-lift">
                <h2 className="text-2xl font-headline font-bold text-slate-900 mb-8">
                  🎯 {t("تقدم الأهداف", "Goals Progress")}
                </h2>
                {goals.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-12">{t("لا توجد أهداف بعد", "No goals yet")}</p>
                ) : (
                  <div className="space-y-5 mt-2">
                    {goals.map((g, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-label font-medium text-slate-700 truncate flex-1 me-3">{g.title}</span>
                          <span className="text-sm font-bold gradient-text shrink-0">{g.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-[#e4e2e1] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${g.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-[#2552ca] to-[#fd65c2]"
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
