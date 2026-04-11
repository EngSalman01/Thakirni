"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"

const ease = [0.22, 1, 0.36, 1] as const

interface HealthLog {
  water_cups: number
  steps: number
  sleep_hours: number
}

function healthScore(log: HealthLog): number {
  const w = Math.min(log.water_cups / 8, 1) * 0.4
  const s = Math.min(log.steps / 8000, 1) * 0.4
  const sl = Math.min(log.sleep_hours / 8, 1) * 0.2
  return Math.round((w + s + sl) * 100)
}

// SVG ring: r=40, cx=cy=48, circumference ≈ 251
const R = 40
const CX = 48
const CY = 48
const CIRC = 2 * Math.PI * R

function ScoreRing({ score, nudgeEnabled }: { score: number; nudgeEnabled: boolean }) {
  const { t } = useLanguage()
  const offset = CIRC * (1 - score / 100)
  const color = score >= 70 ? "#d97706" : score >= 40 ? "#f59e0b" : "#92400e"

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <svg width={96} height={96} viewBox="0 0 96 96">
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(217,119,6,0.1)" strokeWidth={8} />
        {/* Progress */}
        <circle
          cx={CX} cy={CY} r={R} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#f0e8d8" fontSize={16} fontWeight={800}>{score}%</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#a39890" fontSize={9}>{t("اليوم", "Today")}</text>
      </svg>
      {nudgeEnabled && (
        <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-400">
          {t("واتساب مُفعّل ✓", "WhatsApp nudges on ✓")}
        </span>
      )}
    </div>
  )
}

type MetricKey = "water_cups" | "steps" | "sleep_hours"

interface LogModalProps {
  metricKey: MetricKey
  current: number
  onSave: (val: number) => void
  onClose: () => void
}

function LogModal({ metricKey, current, onSave, onClose }: LogModalProps) {
  const { t } = useLanguage()
  const [val, setVal] = useState(String(current))

  const labels: Record<MetricKey, { ar: string; en: string; max: number; step: number }> = {
    water_cups: { ar: "أكواب الماء", en: "Water cups", max: 20, step: 1 },
    steps:      { ar: "عدد الخطوات", en: "Steps",      max: 30000, step: 100 },
    sleep_hours:{ ar: "ساعات النوم",  en: "Sleep hours", max: 12, step: 0.5 },
  }
  const { ar, en, max, step } = labels[metricKey]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.28, ease }}
        className="w-full max-w-sm bg-[#1a1410] border border-amber-900/40 rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-headline font-bold text-foreground mb-4">{t(ar, en)}</h3>
        <input
          type="number"
          value={val}
          min={0}
          max={max}
          step={step}
          onChange={e => setVal(e.target.value)}
          className="w-full bg-white/[0.05] border border-amber-900/40 rounded-xl px-4 py-3 text-foreground text-lg font-bold text-center mb-4 outline-none focus:border-amber-600"
          autoFocus
        />
        <button
          onClick={() => onSave(Number(val))}
          className="w-full py-3 rounded-xl font-bold text-sm text-white power-gradient"
        >
          {t("حفظ", "Save")}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function HealthPage() {
  const { t, isArabic } = useLanguage()
  const [log, setLog] = useState<HealthLog>({ water_cups: 0, steps: 0, sleep_hours: 0 })
  const [nudgeEnabled, setNudgeEnabled] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [editingMetric, setEditingMetric] = useState<MetricKey | null>(null)
  const supabase = createClient()

  const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [logRes, nudgeRes, profileRes] = await Promise.all([
      supabase.from("health_logs").select("water_cups, steps, sleep_hours").eq("user_id", user.id).eq("date", todayDate).single(),
      supabase.from("health_nudge_subscriptions").select("enabled").eq("user_id", user.id).single(),
      supabase.from("profiles").select("phone_number").eq("id", user.id).single(),
    ])

    if (logRes.data) setLog(logRes.data)
    setNudgeEnabled(nudgeRes.data?.enabled ?? false)
    setPhone(profileRes.data?.phone_number ?? null)
  }, [supabase, todayDate])

  useEffect(() => { load() }, [load])

  const saveMetric = async (key: MetricKey, val: number) => {
    if (!userId) return
    const update = { [key]: val }
    await supabase.from("health_logs").upsert({ user_id: userId, date: todayDate, ...log, ...update }, { onConflict: "user_id,date" })
    setLog(prev => ({ ...prev, [key]: val }))
    setEditingMetric(null)
  }

  const toggleNudge = async () => {
    if (!userId || !phone) return
    const next = !nudgeEnabled
    await supabase.from("health_nudge_subscriptions").upsert({ user_id: userId, phone, enabled: next }, { onConflict: "user_id" })
    setNudgeEnabled(next)
  }

  const score = healthScore(log)

  const metrics: Array<{ key: MetricKey; emoji: string; ar: string; en: string; value: string; goal: string }> = [
    { key: "water_cups",  emoji: "💧", ar: "الماء",    en: "Water",  value: String(log.water_cups),  goal: t("٨ أكواب", "8 cups") },
    { key: "steps",       emoji: "👟", ar: "الخطوات",  en: "Steps",  value: log.steps.toLocaleString(), goal: t("٨,٠٠٠ خطوة", "8,000 steps") },
    { key: "sleep_hours", emoji: "😴", ar: "النوم",    en: "Sleep",  value: String(log.sleep_hours), goal: t("٨ ساعات", "8 hours") },
  ]

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <main className="max-w-lg mx-auto px-4 pt-10 pb-16">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
            {t("الصحة والعافية", "Health & Wellness")}
          </p>
          <h1 className="font-headline text-3xl font-extrabold text-foreground mb-8">
            {t("صحتي اليوم", "Today's Health")}
          </h1>
        </motion.div>

        <ScoreRing score={score} nudgeEnabled={nudgeEnabled} />

        {/* Metric rows */}
        <div className="flex flex-col gap-3 mb-6">
          {metrics.map((m, i) => (
            <motion.button
              key={m.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07, ease }}
              onClick={() => setEditingMetric(m.key)}
              className="w-full flex items-center gap-4 bg-white/[0.03] border border-amber-900/30 rounded-2xl p-5 text-start hover:border-amber-700/50 transition-colors"
            >
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{isArabic ? m.ar : m.en}</div>
                <div className="text-xs text-muted-foreground">{t("الهدف", "Goal")}: {m.goal}</div>
              </div>
              <div className="text-lg font-extrabold text-amber-500 font-headline">{m.value}</div>
            </motion.button>
          ))}
        </div>

        {/* WhatsApp nudge toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between bg-white/[0.03] border border-amber-900/30 rounded-2xl p-5"
        >
          <div>
            <div className="text-sm font-semibold text-foreground">{t("تذكيرات واتساب", "WhatsApp nudges")}</div>
            <div className="text-xs text-muted-foreground">{t("تذكيرات يومية لتتبع صحتك", "Daily health tracking reminders")}</div>
          </div>
          <button
            onClick={toggleNudge}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${nudgeEnabled ? "power-gradient" : "bg-slate-200 dark:bg-slate-700"}`}
            aria-label="Toggle WhatsApp nudges"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
              animate={{ x: nudgeEnabled ? "calc(3rem - 1.375rem - 0.125rem)" : "0px" }}
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
            />
          </button>
        </motion.div>

      </main>

      <AnimatePresence>
        {editingMetric && (
          <LogModal
            metricKey={editingMetric}
            current={log[editingMetric]}
            onSave={(val) => saveMetric(editingMetric, val)}
            onClose={() => setEditingMetric(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
