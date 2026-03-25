"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, Brain, ListTodo, Flame, Target } from "lucide-react"

interface DayData {
  date: string
  label: string
  plans: number
  completed: number
  memories: number
}

interface HabitData {
  name: string
  streak: number
  completed: number
}

interface GoalData {
  title: string
  progress: number
  status: string
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 1, 0.3, 1] }}
      className="bg-[#f6f3f2] rounded-2xl p-6 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-headline font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 font-label">{label}</p>
      </div>
    </motion.div>
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

      // Build last 14 days array
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

      // Fill day data
      for (const plan of plansRes.data ?? []) {
        const day = dayArray.find(d => d.date === plan.plan_date)
        if (day) {
          day.plans++
          if (plan.status === "done") day.completed++
        }
      }
      for (const mem of memoriesRes.data ?? []) {
        const dateStr = new Date(mem.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
        const day = dayArray.find(d => d.date === dateStr)
        if (day) day.memories++
      }

      // Habit completion count over period
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
      <div className="min-h-screen bg-[#fbf9f8]">
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
    <div className="min-h-screen bg-[#fbf9f8]">
      <VaultSidebar />
      <main className="lg:ml-72 pt-24 px-6 lg:px-12 pb-20">
        <MobileMenuButton />
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-[#2552ca]" />
              <h1 className="text-3xl font-headline font-bold text-slate-900">
                {t("التحليلات", "Analytics")}
              </h1>
            </div>
            <p className="text-slate-500 font-label text-sm">
              {t("آخر 14 يوم", "Last 14 days")}
            </p>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Brain} label={t("ذكريات مضافة", "Memories added")} value={stats.totalMemories} color="#2552ca" delay={0} />
            <StatCard icon={ListTodo} label={t("خطط مكتملة", "Plans completed")} value={stats.completedPlans} color="#ad1d7f" delay={0.05} />
            <StatCard icon={Flame} label={t("عادات نشطة", "Active habits")} value={stats.activeHabits} color="#f59e0b" delay={0.1} />
            <StatCard icon={Target} label={t("أهداف جارية", "Goals in progress")} value={stats.activeGoals} color="#10b981" delay={0.15} />
          </div>

          {/* Plans chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#f6f3f2] rounded-2xl p-6">
            <h2 className="text-lg font-headline font-bold text-slate-900 mb-6">
              {t("إنجاز الخطط اليومي", "Daily Plan Completion")}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                <Bar dataKey="plans" name={t("إجمالي", "Total")} fill="#e4e2e1" radius={[4,4,0,0]} />
                <Bar dataKey="completed" name={t("مكتملة", "Completed")} fill="#ad1d7f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Memories chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f6f3f2] rounded-2xl p-6">
            <h2 className="text-lg font-headline font-bold text-slate-900 mb-6">
              {t("إضافة الذكريات", "Memory Activity")}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2552ca" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2552ca" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                <Area type="monotone" dataKey="memories" name={t("ذكريات", "Memories")} stroke="#2552ca" strokeWidth={2} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Habits + Goals row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Habits */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f6f3f2] rounded-2xl p-6">
              <h2 className="text-lg font-headline font-bold text-slate-900 mb-6">
                {t("أداء العادات", "Habit Performance")}
              </h2>
              {habits.length === 0 ? (
                <p className="text-slate-400 text-sm font-label text-center py-8">{t("لا توجد عادات بعد", "No habits yet")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={habits} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }} />
                    <Bar dataKey="completed" name={t("مرات الإنجاز", "Completions")} radius={[0,4,4,0]}>
                      {habits.map((_, i) => (
                        <Cell key={i} fill={`hsl(${30 + i * 20}, 90%, 55%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Goals */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-[#f6f3f2] rounded-2xl p-6">
              <h2 className="text-lg font-headline font-bold text-slate-900 mb-4">
                {t("تقدم الأهداف", "Goals Progress")}
              </h2>
              {goals.length === 0 ? (
                <p className="text-slate-400 text-sm font-label text-center py-8">{t("لا توجد أهداف بعد", "No goals yet")}</p>
              ) : (
                <div className="space-y-3 mt-2">
                  {goals.map((g, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-label text-slate-700 truncate flex-1 me-2">{g.title}</span>
                        <span className="text-xs font-bold text-slate-500 shrink-0">{g.progress}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${g.progress}%`, backgroundColor: g.status === "completed" ? "#10b981" : "#2552ca" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  )
}
