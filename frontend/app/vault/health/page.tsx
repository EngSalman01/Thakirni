"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Pill, Clock, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"

const ease = [0.22, 1, 0.36, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthLog {
  water_cups: number
  steps: number
  sleep_hours: number
}

interface Medication {
  id: string
  name: string
  dosage: string | null
  frequency_hours: number
  first_dose_time: string
  notes: string | null
  active: boolean
  created_at: string
}

// ─── Health Score Ring ────────────────────────────────────────────────────────

function healthScore(log: HealthLog): number {
  const w = Math.min(log.water_cups / 8, 1) * 0.4
  const s = Math.min(log.steps / 8000, 1) * 0.4
  const sl = Math.min(log.sleep_hours / 8, 1) * 0.2
  return Math.round((w + s + sl) * 100)
}

const R = 40, CX = 48, CY = 48, CIRC = 2 * Math.PI * R

function ScoreRing({ score, nudgeEnabled }: { score: number; nudgeEnabled: boolean }) {
  const { t } = useLanguage()
  const offset = CIRC * (1 - score / 100)
  const color = score >= 70 ? "#d97706" : score >= 40 ? "#f59e0b" : "#92400e"
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(217,119,6,0.1)" strokeWidth={8} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="currentColor" fontSize={16} fontWeight={800}>{score}%</text>
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

// ─── Log Modal (water / steps / sleep) ───────────────────────────────────────

type MetricKey = "water_cups" | "steps" | "sleep_hours"

function LogModal({ metricKey, current, onSave, onClose }: {
  metricKey: MetricKey; current: number; onSave: (v: number) => void; onClose: () => void
}) {
  const { t } = useLanguage()
  const [val, setVal] = useState(String(current))
  const labels: Record<MetricKey, { ar: string; en: string; max: number; step: number }> = {
    water_cups:  { ar: "أكواب الماء",  en: "Water cups",  max: 20,    step: 1   },
    steps:       { ar: "عدد الخطوات", en: "Steps",       max: 30000, step: 100 },
    sleep_hours: { ar: "ساعات النوم",  en: "Sleep hours", max: 12,    step: 0.5 },
  }
  const { ar, en, max, step } = labels[metricKey]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28, ease }}
        className="w-full max-w-sm shell-panel rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-headline font-bold text-foreground mb-4">{t(ar, en)}</h3>
        <input type="number" value={val} min={0} max={max} step={step}
          onChange={e => setVal(e.target.value)}
          className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-3 text-foreground text-lg font-bold text-center mb-4 outline-none focus:border-amber-600"
          autoFocus />
        <button onClick={() => onSave(Number(val))}
          className="w-full py-3 rounded-xl font-bold text-sm text-white power-gradient">
          {t("حفظ", "Save")}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Add Medication Modal ─────────────────────────────────────────────────────

const FREQ_OPTIONS = [
  { hours: 4,  ar: "كل ٤ ساعات",  en: "Every 4 hours"  },
  { hours: 6,  ar: "كل ٦ ساعات",  en: "Every 6 hours"  },
  { hours: 8,  ar: "كل ٨ ساعات",  en: "Every 8 hours"  },
  { hours: 12, ar: "كل ١٢ ساعة",  en: "Every 12 hours" },
  { hours: 24, ar: "مرة يومياً",   en: "Once daily"     },
]

function MedModal({ onSave, onClose }: {
  onSave: (data: { name: string; dosage: string; frequency_hours: number; first_dose_time: string; notes: string }) => Promise<void>
  onClose: () => void
}) {
  const { t, isArabic } = useLanguage()
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")
  const [freqHours, setFreqHours] = useState(8)
  const [firstDose, setFirstDose] = useState("08:00")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t("أدخل اسم الدواء", "Enter medication name")); return }
    setSaving(true)
    try {
      await onSave({ name, dosage, frequency_hours: freqHours, first_dose_time: firstDose, notes })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28, ease }}
        className="w-full max-w-md shell-panel rounded-2xl p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-foreground text-lg">{t("إضافة دواء", "Add Medication")}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("اسم الدواء *", "Medication name *")}</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={t("مثال: باراسيتامول", "e.g. Paracetamol")}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600 placeholder:text-muted-foreground/50" />
        </div>

        {/* Dosage */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("الجرعة", "Dosage")}</label>
          <input value={dosage} onChange={e => setDosage(e.target.value)}
            placeholder={t("مثال: ٥٠٠ مجم، قرص واحد", "e.g. 500mg, 1 tablet")}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600 placeholder:text-muted-foreground/50" />
        </div>

        {/* Frequency */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("التكرار", "Frequency")}</label>
          <div className="flex flex-wrap gap-2">
            {FREQ_OPTIONS.map(opt => (
              <button key={opt.hours} onClick={() => setFreqHours(opt.hours)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  freqHours === opt.hours
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "border-border text-muted-foreground hover:border-amber-400/40"
                }`}>
                {isArabic ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </div>

        {/* First dose time */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("وقت أول جرعة", "First dose time")}</label>
          <input type="time" value={firstDose} onChange={e => setFirstDose(e.target.value)}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600" />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("ملاحظات", "Notes")}</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t("مثال: بعد الأكل", "e.g. After meals")}
            className="w-full bg-white/[0.05] border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-amber-600 placeholder:text-muted-foreground/50" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-white power-gradient disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {t("حفظ الدواء", "Save Medication")}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Medication Card ──────────────────────────────────────────────────────────

function MedCard({ med, onToggle, onDelete }: {
  med: Medication
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  const { t, isArabic } = useLanguage()
  const freqLabel = FREQ_OPTIONS.find(o => o.hours === med.frequency_hours)
  const freqText = freqLabel
    ? (isArabic ? freqLabel.ar : freqLabel.en)
    : (isArabic ? `كل ${med.frequency_hours} ساعة` : `Every ${med.frequency_hours}h`)

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className={`shell-panel rounded-2xl p-4 flex items-start gap-4 transition-opacity ${med.active ? "" : "opacity-50"}`}>
      <div className="mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
        <Pill className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{med.name}</p>
        {med.dosage && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">{med.dosage}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {freqText} · {t("أول جرعة", "First dose")} {med.first_dose_time}
          </span>
        </div>
        {med.notes && <p className="text-xs text-muted-foreground mt-1 italic">{med.notes}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Active toggle */}
        <button onClick={() => onToggle(med.id, !med.active)}
          className={`relative w-10 h-5 rounded-full transition-colors ${med.active ? "power-gradient" : "bg-slate-200 dark:bg-slate-700"}`}>
          <motion.div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow"
            animate={{ x: med.active ? "calc(2.5rem - 1.25rem - 0.125rem)" : "0px" }}
            transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }} />
        </button>
        {/* Delete */}
        <button onClick={() => onDelete(med.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HealthPage() {
  const { t, isArabic } = useLanguage()
  const [log, setLog] = useState<HealthLog>({ water_cups: 0, steps: 0, sleep_hours: 0 })
  const [nudgeEnabled, setNudgeEnabled] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [editingMetric, setEditingMetric] = useState<MetricKey | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showMedModal, setShowMedModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [logRes, nudgeRes, profileRes, medsRes] = await Promise.all([
        supabase.from("health_logs").select("water_cups, steps, sleep_hours").eq("user_id", user.id).eq("date", todayDate).single(),
        supabase.from("health_nudge_subscriptions").select("enabled").eq("user_id", user.id).single(),
        supabase.from("profiles").select("phone_number").eq("id", user.id).single(),
        fetch("/api/health/medications").then(r => r.json()),
      ])

      if (logRes.data) setLog(logRes.data)
      setNudgeEnabled(nudgeRes.data?.enabled ?? false)
      setPhone(profileRes.data?.phone_number ?? null)
      setMedications(medsRes.medications ?? [])
    } finally {
      setLoading(false)
    }
  }, [supabase, todayDate])

  useEffect(() => { load() }, [load])

  const saveMetric = async (key: MetricKey, val: number) => {
    if (!userId) return
    await supabase.from("health_logs").upsert(
      { user_id: userId, date: todayDate, ...log, [key]: val },
      { onConflict: "user_id,date" }
    )
    setLog(prev => ({ ...prev, [key]: val }))
    setEditingMetric(null)
  }

  const toggleNudge = async () => {
    if (!userId || !phone) { toast.error(t("أضف رقم واتساب في الإعدادات أولاً", "Add a WhatsApp number in settings first")); return }
    const next = !nudgeEnabled
    await supabase.from("health_nudge_subscriptions").upsert({ user_id: userId, phone, enabled: next }, { onConflict: "user_id" })
    setNudgeEnabled(next)
  }

  const addMedication = async (data: { name: string; dosage: string; frequency_hours: number; first_dose_time: string; notes: string }) => {
    const res = await fetch("/api/health/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || t("فشل الحفظ", "Failed to save")); return }
    setMedications(prev => [...prev, json.medication])
    setShowMedModal(false)
    toast.success(t("تم إضافة الدواء وتفعيل التذكيرات", "Medication added with reminders"))
  }

  const toggleMed = async (id: string, active: boolean) => {
    const res = await fetch("/api/health/medications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    })
    if (!res.ok) { toast.error(t("فشل التحديث", "Update failed")); return }
    setMedications(prev => prev.map(m => m.id === id ? { ...m, active } : m))
  }

  const deleteMed = async (id: string) => {
    const res = await fetch("/api/health/medications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error(t("فشل الحذف", "Delete failed")); return }
    setMedications(prev => prev.filter(m => m.id !== id))
    toast.success(t("تم حذف الدواء", "Medication deleted"))
  }

  const score = healthScore(log)

  const metrics: Array<{ key: MetricKey; emoji: string; ar: string; en: string; value: string; goal: string }> = [
    { key: "water_cups",  emoji: "💧", ar: "الماء",   en: "Water", value: String(log.water_cups),      goal: t("٨ أكواب", "8 cups")     },
    { key: "steps",       emoji: "👟", ar: "الخطوات", en: "Steps", value: log.steps.toLocaleString(),   goal: t("٨,٠٠٠ خطوة", "8,000 steps") },
    { key: "sleep_hours", emoji: "😴", ar: "النوم",   en: "Sleep", value: String(log.sleep_hours),      goal: t("٨ ساعات", "8 hours")    },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }} dir={isArabic ? "rtl" : "ltr"}>
      <main className="pt-16">
        <section className="pt-20 pb-16 px-4 sm:px-8 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="eyebrow-badge mb-3 inline-flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />
                {t("الصحة", "Health")}
              </span>
              <h1 className="text-3xl font-headline font-bold text-foreground">{t("صحتي", "My Health")}</h1>
              <p className="text-muted-foreground text-sm mt-1">{t("تتبع صحتك وأدويتك يومياً", "Track your health and medications daily")}</p>
            </div>
            <button onClick={load}
              className="w-10 h-10 rounded-xl shell-panel flex items-center justify-center text-muted-foreground hover:text-amber-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <ScoreRing score={score} nudgeEnabled={nudgeEnabled} />

          {/* Daily metrics */}
          <div className="flex flex-col gap-3 mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300 px-1">
              {t("مؤشرات اليوم", "Today's Metrics")}
            </p>
            {metrics.map((m, i) => (
              <motion.button key={m.key}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07, ease }}
                onClick={() => setEditingMetric(m.key)}
                className="w-full flex items-center gap-4 shell-panel rounded-2xl p-5 text-start hover:border-amber-700/50 transition-colors">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{isArabic ? m.ar : m.en}</div>
                  <div className="text-xs text-muted-foreground">{t("الهدف", "Goal")}: {m.goal}</div>
                </div>
                <div className="text-lg font-extrabold text-amber-500 font-headline">{m.value}</div>
              </motion.button>
            ))}
          </div>

          {/* Medications section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-1 mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                {t("أدويتي", "My Medications")} {medications.length > 0 && `· ${medications.length}`}
              </p>
              <button onClick={() => setShowMedModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {t("إضافة دواء", "Add medication")}
              </button>
            </div>

            {medications.length === 0 ? (
              <div className="shell-panel rounded-2xl p-10 text-center">
                <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">
                  {t("ما عندك أدوية مضافة — اضغط «إضافة دواء» وتذكرني يرسل لك على واتساب",
                     "No medications yet — tap «Add medication» and we'll remind you via WhatsApp")}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {medications.map(med => (
                    <MedCard key={med.id} med={med} onToggle={toggleMed} onDelete={deleteMed} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* WhatsApp nudge toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-between shell-panel rounded-2xl p-5">
            <div>
              <div className="text-sm font-semibold text-foreground">{t("تذكيرات واتساب", "WhatsApp nudges")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("تذكيرات يومية للماء والنوم والخطوات", "Daily reminders for water, sleep & steps")}
              </div>
              {!phone && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t("أضف رقم واتساب في الإعدادات أولاً", "Add WhatsApp number in settings first")}
                </div>
              )}
            </div>
            <button onClick={toggleNudge}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${nudgeEnabled ? "power-gradient" : "bg-slate-200 dark:bg-slate-700"}`}>
              <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: nudgeEnabled ? "calc(3rem - 1.375rem - 0.125rem)" : "0px" }}
                transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }} />
            </button>
          </motion.div>

        </section>
      </main>

      <AnimatePresence>
        {editingMetric && (
          <LogModal metricKey={editingMetric} current={log[editingMetric]}
            onSave={val => saveMetric(editingMetric, val)} onClose={() => setEditingMetric(null)} />
        )}
        {showMedModal && (
          <MedModal onSave={addMedication} onClose={() => setShowMedModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
