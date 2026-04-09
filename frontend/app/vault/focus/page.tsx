"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Play, Pause, Square, Timer, BarChart2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"

const SESSION_TYPES = [
  { value: "pomodoro",      label: "بومودورو 🍅",       labelEn: "Pomodoro 🍅",      minutes: 25, color: "#e53e3e" },
  { value: "short_break",   label: "راحة قصيرة ☕",     labelEn: "Short Break ☕",   minutes: 5,  color: "#38a169" },
  { value: "long_break",    label: "راحة طويلة 🌿",     labelEn: "Long Break 🌿",    minutes: 30, color: "#3182ce" },
  { value: "deep_work",     label: "عمل عميق 🔱",       labelEn: "Deep Work 🔱",     minutes: 50, color: "#805ad5" },
]

async function fetchStats() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const res = await fetch(`/api/focus/stats?days=7`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return null
    const d = await res.json() as { stats?: Record<string, unknown> }
    return d.stats ?? null
  } catch (err) {
    console.error("[Focus] failed to fetch stats:", err)
    return null
  }
}

export default function FocusPage() {
  const { data: stats, mutate: mutateStats } = useSWR(`/api/focus/stats`, fetchStats)
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
  const isStartingRef = useRef(false)

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
      await fetch(`/api/focus/${sid}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ actual_minutes: actualMinutes }),
      })
    } catch (err) { console.error("[Focus] complete sync failed:", err) }
  }, [selectedType.minutes, mutateStats, t])

  // Keep ref in sync
  useEffect(() => { completeSessionRef.current = handleComplete }, [handleComplete])

  async function startSession() {
    if (isStartingRef.current || isRunning) return
    isStartingRef.current = true
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
      const res = await fetch(`/api/focus/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session_type: sessionType, duration_minutes: mins, goal: goal || undefined }),
      })
      if (res.ok) {
        const d = await res.json() as { session?: { id: string } }
        if (d.session?.id) sessionIdRef.current = d.session.id
      }
    } catch (err) { console.error("[Focus] start sync failed:", err) }
    finally { isStartingRef.current = false }
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
    mutateStats()
    if (!sid) return
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await fetch(`/api/focus/${sid}/abandon`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } catch (err) { console.error("[Focus] abandon sync failed:", err) }
  }

  function togglePause() {
    setIsPaused((p) => !p)
  }

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0
  const circumference = 2 * Math.PI * 100

  const timeDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`


  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden">
      <main className="pt-16">

        {/* ── HERO: Timer as centerpiece ── */}
        <section className="relative pt-32 pb-20 px-8 overflow-hidden">
          <div className="absolute -top-20 right-0 w-80 h-80 bg-amber-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/6 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Copy */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2,1,0.3,1] }} className="space-y-6">
                <div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-foreground leading-[1.1]">
                    {t("وضع ", "Focus")}{" "}<span className="gradient-text">{t("التركيز", "Mode")}</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mt-4 max-w-lg">
                    {t("استخدم تقنية بومودورو لتحقيق إنتاجية أعمق وتركيز أكبر.", "Use the Pomodoro technique for deeper productivity and greater focus.")}
                  </p>
                </div>

                {/* Session type selector */}
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map(st => (
                    <button key={st.value} disabled={isRunning} onClick={() => { setSessionType(st.value); setTimeLeft(st.minutes * 60); setTotalTime(st.minutes * 60) }}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${sessionType === st.value ? "power-gradient text-white border-transparent shadow-lg" : "bg-card border-border text-muted-foreground hover:border-amber-600/40"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {isArabic ? st.label : st.labelEn}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: (stats as any).totalSessions ?? 0,  label: t("جلسة هذا الأسبوع", "Sessions"), color: "text-amber-600 dark:text-amber-400" },
                      { value: (stats as any).totalMinutes ?? 0,    label: t("دقيقة", "Minutes"),            color: "text-amber-600 dark:text-amber-400" },
                      { value: (stats as any).avgMinutes ?? 0,      label: t("متوسط/جلسة", "Avg/session"),  color: "text-emerald-600" },
                    ].map(({ value, label, color }) => (
                      <div key={label as string} className="bg-card rounded-2xl border border-border p-4 text-center shadow-ambient hover-lift">
                        <p className={`text-2xl font-headline font-extrabold ${color}`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label as string}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Right: Timer */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2,1,0.3,1] }}
                className="flex justify-center">
                <div className="relative bg-gradient-to-br from-[#0a1628] via-[#1a2040] to-amber-600/40 rounded-2xl p-12 shadow-card w-full max-w-sm">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-600/20 rounded-full blur-xl pointer-events-none" />

                  {/* Timer ring */}
                  <div className="relative w-56 h-56 mx-auto mb-8">
                    <svg className="w-56 h-56 -rotate-90" viewBox="0 0 220 220">
                      <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                      <circle cx="110" cy="110" r="100" fill="none" stroke={selectedType.color} strokeWidth="8"
                        strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s linear" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-headline font-extrabold gradient-text">{timeDisplay}</span>
                      <span className="text-sm text-white/50 mt-1">{isArabic ? selectedType.label : selectedType.labelEn}</span>
                      {isPaused && <span className="mt-2 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs">{t("متوقف مؤقتاً", "Paused")}</span>}
                    </div>
                  </div>

                  {!isRunning ? (
                    <div className="space-y-3">
                      <Input placeholder={t("هدف الجلسة؟ (اختياري)", "Session goal? (optional)")} value={goal} onChange={e => setGoal(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40" />
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startSession}
                        className="w-full h-12 rounded-xl power-gradient text-white font-bold text-base flex items-center justify-center gap-2 btn-glow">
                        <Play className="w-5 h-5" /> {t("ابدأ الجلسة", "Start Session")}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={togglePause}>
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {isPaused ? t("استمرار", "Resume") : t("إيقاف مؤقت", "Pause")}
                      </Button>
                      <Button variant="destructive" className="flex-1 gap-2" onClick={abandonSession}>
                        <Square className="w-4 h-4" /> {t("إنهاء", "Stop")}
                      </Button>
                      <Button className="flex-1 gap-2 text-white" style={{ background: "#38a169" }} onClick={handleComplete}>
                        <CheckCircle2 className="w-4 h-4" /> {t("مكتمل", "Done")}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Info cards ── */}
        <section className="pb-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { emoji: "🍅", title: t("بومودورو", "Pomodoro"), desc: t("25 دقيقة تركيز مكثف ثم استراحة قصيرة", "25 minutes of focused work, then a short break"), color: "bg-muted dark:bg-white/[0.03]", textColor: "text-foreground" },
                { emoji: "☕", title: t("استراحة", "Short Break"), desc: t("5 دقائق للراحة وإعادة الشحن قبل الجلسة التالية", "5 minutes to rest and recharge before the next session"), color: "bg-amber-600", textColor: "text-white" },
                { emoji: "🔱", title: t("عمل عميق", "Deep Work"), desc: t("50 دقيقة للمهام المعقدة التي تحتاج تركيزاً عالياً", "50 minutes for complex tasks requiring deep concentration"), color: "bg-muted dark:bg-white/[0.03]", textColor: "text-foreground" },
              ].map(({ emoji, title, desc, color, textColor }, i) => (
                <motion.div key={title as string}
                  custom={i} initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.2,1,0.3,1] }}
                  className={`${color} rounded-2xl p-12 relative overflow-hidden hover-lift cursor-default`}>
                  <span className="text-4xl mb-6 block">{emoji}</span>
                  <h3 className={`text-2xl font-headline font-bold mb-3 ${textColor}`}>{title as string}</h3>
                  <p className={`${textColor === "text-white" ? "text-white/80" : "text-muted-foreground"} text-base`}>{desc as string}</p>
                  {i === 1 && <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
