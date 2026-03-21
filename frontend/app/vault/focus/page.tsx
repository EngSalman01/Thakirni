"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Play, Pause, Square, Timer, BarChart2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const API_URL = ""

const SESSION_TYPES = [
  { value: "pomodoro",    label: "بومودورو 🍅",      minutes: 25, color: "#e53e3e" },
  { value: "short_break", label: "استراحة قصيرة ☕", minutes: 5,  color: "#38a169" },
  { value: "long_break",  label: "استراحة طويلة 🌿", minutes: 15, color: "#3182ce" },
  { value: "deep_work",   label: "عمل عميق 🔱",      minutes: 50, color: "#805ad5" },
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
    toast.success(`أحسنت! أنجزت ${actualMinutes} دقيقة من التركيز! 🎉`)
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
  }, [selectedType.minutes, mutateStats])

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
    toast.success(`بدأت جلسة ${selectedType.label}! 🚀`)

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
    toast.info("تم إيقاف الجلسة")
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

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:ml-72 p-4 md:p-6 transition-all duration-300">
      <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Timer className="w-6 h-6 text-[#2552ca]" /> وضع التركيز
        </h1>
        <p className="text-muted-foreground text-sm mt-1">استخدم تقنية بومودورو لزيادة إنتاجيتك</p>
      </div>

      {/* Timer circle */}
      <Card className="mb-6">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative w-56 h-56 mb-6">
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="100" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
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
              <span className="text-5xl font-mono font-bold">{
                `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`
              }</span>
              <span className="text-sm text-muted-foreground mt-1">{selectedType.label}</span>
              {isPaused && <Badge variant="outline" className="mt-2 text-xs">متوقف مؤقتاً</Badge>}
            </div>
          </div>

          {!isRunning ? (
            <div className="w-full space-y-3">
              <Select value={sessionType} onValueChange={(v) => {
                setSessionType(v)
                const t = SESSION_TYPES.find((x) => x.value === v)!
                setTimeLeft(t.minutes * 60)
                setTotalTime(t.minutes * 60)
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label} — {t.minutes} دقيقة</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="ما هو هدفك في هذه الجلسة؟ (اختياري)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />

              <Button
                className="w-full h-12 text-base gap-2 text-white"
                style={{ background: selectedType.color }}
                onClick={startSession}
              >
                <Play className="w-5 h-5" /> ابدأ الجلسة
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 gap-2" onClick={togglePause}>
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "استمرار" : "إيقاف مؤقت"}
              </Button>
              <Button variant="destructive" className="flex-1 gap-2" onClick={abandonSession}>
                <Square className="w-4 h-4" /> إنهاء
              </Button>
              <Button className="flex-1 gap-2 text-white" onClick={handleComplete} style={{ background: "#38a169" }}>
                <CheckCircle2 className="w-4 h-4" /> مكتمل ✅
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly stats */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> إحصائيات الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#2552ca]">{stats.totalSessions as number ?? 0}</p>
                <p className="text-xs text-muted-foreground">جلسة</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#ad1d7f]">{stats.totalMinutes as number ?? 0}</p>
                <p className="text-xs text-muted-foreground">دقيقة</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#fd65c2]">{stats.avgMinutes as number ?? 0}</p>
                <p className="text-xs text-muted-foreground">متوسط/جلسة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
      </main>
    </div>
  )
}
