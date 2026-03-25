"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Play, Pause, Square, Timer, BarChart2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"

const API_URL = ""

const SESSION_TYPES = [
  { value: "pomodoro",    label: "بومودورو 🍅",      labelEn: "Pomodoro 🍅",      minutes: 25, color: "#e53e3e" },
  { value: "short_break", label: "استراحة قصيرة ☕", labelEn: "Short Break ☕",   minutes: 5,  color: "#38a169" },
  { value: "long_break",  label: "استراحة طويلة 🌿", labelEn: "Long Break 🌿",    minutes: 15, color: "#3182ce" },
  { value: "deep_work",   label: "عمل عميق 🔱",      labelEn: "Deep Work 🔱",     minutes: 50, color: "#805ad5" },
]

async function fetchStats() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const res = await fetch(`${API_URL}/api/focus/stats?days=7`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return null
    const d = await res.json() as { stats?: Record<string, unknown> }
    return d.stats ?? null
  } catch {
    return null
  }
}

export default function FocusPage() {
  const { data: stats, mutate: mutateStats } = useSWR(`${API_URL}/api/focus/stats`, fetchStats)
  const { t, isArabic } = useLanguage()
  const [sessionType, setSessionType] = useState("pomodoro")
  const [isRunning, setIsRunning]     = useState(false)
  const [isPaused, setIsPaused]       = useState(false)
  const [timeLeft, setTimeLeft]       = useState(25 * 60)
  const [totalTime, setTotalTime]     = useState(25 * 60)
  const [goal, setGoal]               = useState("")
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<Date | null>(null)

  const selectedType = SESSION_TYPES.find((t) => t.value === sessionType) ?? SESSION_TYPES[0]

  // Timer tick
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          completeSessionRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isPaused])

  // Use a ref for complete so the interval never has a stale closure
  const completeSessionRef = useRef<() => void>(() => {})

  const handleComplete = useCallback(async () => {
    setIsRunning(false)
    setIsPaused(false)
    clearInterval(intervalRef.current!)
    const sid = sessionIdRef.current
    const sat = startedAtRef.current
    const actualMinutes = sat ? Math.round((Date.now() - sat.getTime()) / 60000) : selectedType.minutes
    toast.success(t(`أحسنت! أنجزت ${actualMinutes} دقيقة من التركيز! 🎉`, `Well done! Completed ${actualMinutes} minutes of focus! 🎉`))
    sessionIdRef.current = null
    startedAtRef.current = null
    mutateStats()
    if (!sid) return
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await fetch(`${API_URL}/api/focus/${sid}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ actual_minutes: actualMinutes }),
      })
    } catch { /* backend unavailable — timer still completed locally */ }
  }, [selectedType.minutes, mutateStats, t])

  // Keep ref in sync
  useEffect(() => { completeSessionRef.current = handleComplete }, [handleComplete])

  async function startSession() {
    const mins = selectedType.minutes
    // Start the timer immediately — no waiting for backend
    setTimeLeft(mins * 60)
    setTotalTime(mins * 60)
    startedAtRef.current = new Date()
    setIsRunning(true)
    setIsPaused(false)
    toast.success(t(`بدأت جلسة ${isArabic ? selectedType.label : selectedType.labelEn}! 🚀`, `Started ${selectedType.labelEn} session! 🚀`))

    // Save to backend in background
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`${API_URL}/api/focus/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session_type: sessionType, duration_minutes: mins, goal: goal || undefined }),
      })
      if (res.ok) {
        const d = await res.json() as { session?: { id: string } }
        if (d.session?.id) sessionIdRef.current = d.session.id
      }
    } catch { /* backend unavailable — session runs locally only */ }
  }

  async function abandonSession() {
    setIsRunning(false)
    setIsPaused(false)
    clearInterval(intervalRef.current!)
    const sid = sessionIdRef.current
    sessionIdRef.current = null
    startedAtRef.current = null
    setTimeLeft(selectedType.minutes * 60)
    setTotalTime(selectedType.minutes * 60)
    toast.info(t("تم إيقاف الجلسة", "Session stopped"))
    if (!sid) return
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await fetch(`${API_URL}/api/focus/${sid}/abandon`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } catch { /* ignore */ }
  }

  function togglePause() {
    setIsPaused((p) => !p)
  }

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0
  const circumference = 2 * Math.PI * 100

  const timeDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`

  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed glassmorphism header — desktop */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2552ca] to-[#385b9b] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-headline font-extrabold gradient-text">{t("وضع التركيز", "Focus Mode")}</span>
            <p className="text-xs text-slate-500">{t("استخدم تقنية بومودورو", "Use the Pomodoro technique")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle /><LanguageToggle />
        </div>
      </header>

      <main className="lg:ml-72 pt-4 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-16 transition-all duration-300">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-6 lg:hidden">
          <MobileMenuButton />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2552ca] to-[#385b9b] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-headline font-extrabold gradient-text">{t("وضع التركيز", "Focus Mode")}</span>
              <p className="text-xs text-slate-500">{t("استخدم تقنية بومودورو", "Use the Pomodoro technique")}</p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto space-y-6">

          {/* Session type pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SESSION_TYPES.map((st) => (
              <button
                key={st.value}
                disabled={isRunning}
                onClick={() => {
                  setSessionType(st.value)
                  setTimeLeft(st.minutes * 60)
                  setTotalTime(st.minutes * 60)
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  sessionType === st.value
                    ? "power-gradient text-white border-transparent shadow-lg"
                    : "bg-white border-[#e4e2e1] text-slate-600 hover:border-[#2552ca]/40"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isArabic ? st.label : st.labelEn}
              </button>
            ))}
          </div>

          {/* Timer circle — dark rich background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl border border-white/40 shadow-card overflow-hidden"
          >
            <div className="bg-gradient-to-br from-[#0a1628] via-[#1a2040] to-[#2552ca]/30 p-8 flex flex-col items-center">
              {/* Timer SVG ring */}
              <div className="relative w-56 h-56 mb-6">
                <svg className="w-56 h-56 -rotate-90" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="110" cy="110" r="100" fill="none"
                    stroke={selectedType.color}
                    strokeWidth="8"
                    strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-headline font-extrabold gradient-text">{timeDisplay}</span>
                  <span className="text-sm text-white/60 mt-1">{isArabic ? selectedType.label : selectedType.labelEn}</span>
                  {isPaused && (
                    <Badge variant="outline" className="mt-2 text-xs border-white/30 text-white/80 bg-white/10">
                      {t("متوقف مؤقتاً", "Paused")}
                    </Badge>
                  )}
                </div>
              </div>

              {!isRunning ? (
                <div className="w-full space-y-3">
                  <Input
                    placeholder={t("ما هو هدفك في هذه الجلسة؟ (اختياري)", "What's your session goal? (optional)")}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startSession}
                    className="w-full h-12 rounded-xl power-gradient text-white font-bold text-base flex items-center justify-center gap-2 btn-glow"
                  >
                    <Play className="w-5 h-5" /> {t("ابدأ الجلسة", "Start Session")}
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-3 w-full">
                  <Button variant="outline" className="flex-1 gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={togglePause}>
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? t("استمرار", "Resume") : t("إيقاف مؤقت", "Pause")}
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={abandonSession}>
                    <Square className="w-4 h-4" /> {t("إنهاء", "Stop")}
                  </Button>
                  <Button className="flex-1 gap-2 text-white" onClick={handleComplete} style={{ background: "#38a169" }}>
                    <CheckCircle2 className="w-4 h-4" /> {t("مكتمل", "Done")}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Weekly stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-[#2552ca]" />
                <h2 className="font-headline font-bold text-slate-900">{t("إحصائيات الأسبوع", "Weekly Stats")}</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: stats.totalSessions as number ?? 0, label: t("جلسة", "Sessions"), color: "text-[#2552ca]" },
                  { value: stats.totalMinutes as number ?? 0, label: t("دقيقة", "Minutes"), color: "text-[#ad1d7f]" },
                  { value: stats.avgMinutes as number ?? 0, label: t("متوسط/جلسة", "Avg/session"), color: "text-[#fd65c2]" },
                ].map(({ value, label, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    className="bg-white rounded-2xl border border-[#e4e2e1] shadow-ambient hover-lift p-4 text-center"
                  >
                    <p className={`text-2xl font-headline font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
