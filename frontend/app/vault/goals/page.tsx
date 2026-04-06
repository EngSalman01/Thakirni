"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target, Plus, CheckCircle2, Trash2, Wand2, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"

const CATEGORIES = [
  { value: "career",        labelAr: "مسيرة مهنية",  labelEn: "Career",        icon: "💼" },
  { value: "health",        labelAr: "صحة ولياقة",   labelEn: "Health",        icon: "❤️" },
  { value: "finance",       labelAr: "مالي",         labelEn: "Finance",       icon: "💰" },
  { value: "education",     labelAr: "تعليم",        labelEn: "Education",     icon: "🎓" },
  { value: "personal",      labelAr: "شخصي",         labelEn: "Personal",      icon: "🌟" },
  { value: "relationships", labelAr: "علاقات",       labelEn: "Relationships", icon: "👥" },
  { value: "other",         labelAr: "أخرى",         labelEn: "Other",         icon: "📌" },
]

function ParticleLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ps: HTMLDivElement[] = [];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const s = Math.random()*6+3, d = Math.random()*20+10, dl = Math.random()*-20;
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(56,91,155,0.08);border-radius:50%;filter:blur(1px);--drift-x:${(Math.random()-0.5)*160}px;--drift-y:${(Math.random()-0.5)*160}px;animation:particle-drift ${d}s linear ${dl}s infinite;pointer-events:none;`;
      el.appendChild(p); ps.push(p);
    }
    return () => ps.forEach(p => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

async function fetchGoals() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const res = await fetch(`/api/goals`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error(`Failed to fetch goals: ${res.status}`)
  const d = await res.json() as { goals?: Record<string, unknown>[] }
  return d.goals ?? []
}

export default function GoalsPage() {
  const { data: goals = [], mutate, isLoading: goalsLoading, error: goalsError } = useSWR(`/api/goals`, fetchGoals)
  const { t, isArabic } = useLanguage()
  const [open, setOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", category: "personal", target_date: "" })
  const [suggestedMilestones, setSuggestedMilestones] = useState<{ title: string }[]>([])

  async function getSession() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault()
    const session = await getSession(); if (!session) return
    const res = await fetch(`/api/goals`, {
      method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, milestones: suggestedMilestones })
    })
    if (res.ok) { toast.success(t("تم إنشاء الهدف! 🎯", "Goal created! 🎯")); setOpen(false); setForm({ title: "", description: "", category: "personal", target_date: "" }); setSuggestedMilestones([]); mutate() }
    else toast.error(t("حدث خطأ", "An error occurred"))
  }

  async function suggestMilestones() {
    if (!form.title) { toast.error(t("اكتب عنوان الهدف أولاً", "Enter a goal title first")); return }
    setAiLoading(true)
    try {
      const session = await getSession(); if (!session) return
      const res = await fetch(`/api/goals/ai-suggest`, {
        method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language: isArabic ? "ar" : "en" })
      })
      if (!res.ok) throw new Error(await res.text())
      const d = await res.json() as { milestones?: { title: string }[] }
      setSuggestedMilestones(d.milestones ?? [])
      toast.success(t("اقترح الذكاء الاصطناعي خطواتك! ✨", "AI suggested your milestones! ✨"))
    } catch (err) {
      console.error("[Goals] suggestMilestones error:", err)
      toast.error(t("فشل اقتراح الخطوات", "Failed to suggest milestones"))
    } finally {
      setAiLoading(false)
    }
  }

  async function updateProgress(id: string, progress: number) {
    const session = await getSession(); if (!session) return
    try {
      const res = await fetch(`/api/goals/${id}/progress`, {
        method: "PATCH", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ progress })
      })
      if (!res.ok) throw new Error(await res.text())
      mutate()
    } catch (err) {
      console.error("[Goals] updateProgress error:", err)
      toast.error(t("فشل تحديث التقدم", "Failed to update progress"))
    }
  }

  async function completeMilestone(goalId: string, milestoneId: string) {
    const session = await getSession(); if (!session) return
    try {
      const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      toast.success(t("خطوة مكتملة! 🎉", "Milestone completed! 🎉")); mutate()
    } catch (err) {
      console.error("[Goals] completeMilestone error:", err)
      toast.error(t("فشل إكمال الخطوة", "Failed to complete milestone"))
    }
  }

  async function deleteGoal(id: string) {
    const session = await getSession(); if (!session) return
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      toast.success(t("تم حذف الهدف", "Goal deleted")); mutate()
    } catch (err) {
      console.error("[Goals] deleteGoal error:", err)
      toast.error(t("فشل حذف الهدف", "Failed to delete goal"))
    }
  }

  const categoryInfo = (c: string) => CATEGORIES.find(x => x.value === c) ?? CATEGORIES[4]
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + ((g as Record<string, unknown>).progress as number || 0), 0) / goals.length) : 0

  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden">
      <main className="pt-16">

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="absolute -top-20 right-0 w-80 h-80 bg-[#385b9b]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2,1,0.3,1] }} className="space-y-6">
                <div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    {t("أهدافي ", "My ")}<span className="gradient-text">{t("الكبيرة", "Goals")}</span>
                  </h1>
                  <p className="text-xl text-slate-500 mt-4 max-w-lg">
                    {t("حوّل أحلامك إلى خطط قابلة للتنفيذ خطوة بخطوة.", "Turn your dreams into actionable plans, step by step.")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: goals.length,                       label: t("أهداف نشطة", "Active goals"),  color: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" },
                    { value: `${avgProgress}%`,                  label: t("متوسط التقدم", "Avg. progress"), color: "bg-[#ffd8e9] text-violet-600 dark:text-violet-400" },
                    { value: goals.filter((g:any) => g.progress >= 100).length, label: t("مكتملة", "Completed"), color: "bg-emerald-50 text-emerald-700" },
                  ].map(({ value, label, color }) => (
                    <div key={label as string} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${color}`}>
                      <span className="text-xl font-headline font-extrabold">{value}</span>
                      <span className="opacity-80">{label as string}</span>
                    </div>
                  ))}
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-full power-gradient text-white font-bold text-sm btn-glow">
                      <Plus className="w-4 h-4" />{t("هدف جديد", "New Goal")}
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{t("إضافة هدف جديد", "Add New Goal")}</DialogTitle></DialogHeader>
                    <form onSubmit={createGoal} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          {t("عنوان الهدف", "Goal title")} <span className="text-red-500">*</span>
                        </label>
                        <Input placeholder={t("عنوان الهدف", "Goal title")} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          {t("وصف الهدف", "Description")} <span className="text-slate-400 text-xs font-normal">{t("(اختياري)", "(optional)")}</span>
                        </label>
                        <Textarea placeholder={t("وصف الهدف (اختياري)", "Goal description (optional)")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">
                            {t("الفئة", "Category")} <span className="text-red-500">*</span>
                          </label>
                          <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {isArabic ? c.labelAr : c.labelEn}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">
                            {t("تاريخ الهدف", "Target date")} <span className="text-slate-400 text-xs font-normal">{t("(اختياري)", "(optional)")}</span>
                          </label>
                          <Input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} />
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="w-full gap-2" onClick={suggestMilestones} disabled={aiLoading}>
                        <Wand2 className="w-4 h-4" />{aiLoading ? t("جاري الاقتراح...", "Suggesting...") : t("اقترح خطوات بالذكاء الاصطناعي", "AI Suggest Milestones")}
                      </Button>
                      {suggestedMilestones.length > 0 && (
                        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 space-y-1.5">
                          <p className="text-xs font-bold text-slate-600 mb-2">{t("خطوات مقترحة:", "Suggested milestones:")}</p>
                          {suggestedMilestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">{i+1}</span>
                              {m.title}
                            </div>
                          ))}
                        </div>
                      )}
                      <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg,#2552ca,#fd65c2)" }}>{t("إنشاء الهدف", "Create Goal")}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </motion.div>

              {/* Right: real goal progress */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2,1,0.3,1] }}
                className="hidden lg:block">
                <div className="bg-[#e4e2e1] rounded-2xl p-10 shadow-card hover-lift space-y-5">
                  <h3 className="text-xl font-headline font-bold text-slate-900 mb-6">{t("تقدم الأهداف", "Goal Progress")}</h3>
                  {goals.length === 0
                    ? <p className="text-sm text-slate-500 text-center py-4">{t("لا أهداف بعد — أنشئ هدفك الأول!", "No goals yet — create your first!")}</p>
                    : (goals as Array<{ id?: string; title: string; progress?: number }>).slice(0, 3).map((goal, i) => {
                        const barColors = ["bg-indigo-600", "bg-violet-600", "bg-indigo-400"];
                        const pct = Math.min(100, Math.round(goal.progress ?? 0));
                        return (
                          <div key={goal.id ?? i}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{goal.title}</span>
                              <span className="text-sm text-slate-500 shrink-0 ms-2">{pct}%</span>
                            </div>
                            <div className="h-3 w-full bg-white/60 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                                className={`h-full ${barColors[i % barColors.length]} rounded-full`} />
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── GOALS BENTO ── */}
        <section className="pb-24 px-8">
          <div className="max-w-7xl mx-auto">
            {goalsError ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
                <p className="text-red-600 font-semibold mb-3">{t("فشل تحميل الأهداف", "Failed to load goals")}</p>
                <button onClick={() => mutate()} className="px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm hover:bg-red-50">
                  {t("إعادة المحاولة", "Retry")}
                </button>
              </motion.div>
            ) : goalsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
                    <Skeleton className="h-2 w-full rounded-none" />
                    <div className="p-10 space-y-4">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-full" />
                      <Skeleton className="h-4 w-2/3 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : goals.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-24 text-center hover-lift">
                <Target className="w-16 h-16 mx-auto mb-4 text-[#385b9b]/30" />
                <h2 className="text-2xl font-headline font-bold text-slate-700 mb-2">{t("لا توجد أهداف بعد", "No goals yet")}</h2>
                <p className="text-slate-500 mb-8">{t("أنشئ هدفك الأول وابدأ رحلتك نحو النجاح!", "Create your first goal and start your journey to success!")}</p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full power-gradient text-white font-bold btn-glow">
                      <Plus className="w-4 h-4" />{t("هدف جديد", "New Goal")}
                    </motion.button>
                  </DialogTrigger>
                </Dialog>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {goals.map((goal: any, i) => {
                  const cat = categoryInfo(goal.category)
                  const progress = goal.progress || 0
                  const milestones = (goal.goal_milestones as unknown[]) || []
                  const completedMilestones = milestones.filter((m: any) => m.is_completed).length
                  return (
                    <motion.div key={goal.id}
                      custom={i} initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: [0.2,1,0.3,1] }}
                      className="relative bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden group hover-lift">
                      {/* Color stripe */}
                      <div className="h-2 w-full bg-gradient-to-r from-indigo-600 to-[#fd65c2]" />
                      <div className="p-10">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-4xl">{cat.icon}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-slate-600">
                              {isArabic ? cat.labelAr : cat.labelEn}
                            </span>
                            <Button variant="ghost" size="icon" aria-label="Delete goal" className="h-7 w-7 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                              onClick={() => deleteGoal(goal.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="text-xl font-headline font-bold text-slate-900 mb-2">{goal.title}</h3>
                        {goal.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{goal.description}</p>}

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                            <span>{t("التقدم", "Progress")}</span><span>{progress}%</span>
                          </div>
                          <div className="h-2.5 bg-white/80 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${progress}%` }} viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-[#fd65c2]" />
                          </div>
                        </div>

                        {/* Progress slider */}
                        <input type="range" min={0} max={100} value={progress} onChange={e => updateProgress(goal.id, parseInt(e.target.value))}
                          className="w-full h-1 mb-4 accent-[#2552ca]" />

                        {/* Milestones */}
                        {milestones.length > 0 && (
                          <div className="space-y-1.5 mt-4 border-t border-white/60 pt-4">
                            <p className="text-xs font-bold text-slate-500 mb-2">{t(`${completedMilestones}/${milestones.length} خطوة`, `${completedMilestones}/${milestones.length} steps`)}</p>
                            {milestones.slice(0,3).map((m: any) => (
                              <div key={m.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-800"
                                onClick={() => !m.is_completed && completeMilestone(goal.id, m.id)}>
                                {m.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                                <span className={m.is_completed ? "line-through opacity-50" : ""}>{m.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Target date */}
                        {goal.target_date && (
                          <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(goal.target_date).toLocaleDateString(isArabic ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                      {/* Decorative */}
                      <div className="absolute right-0 bottom-0 w-1/2 translate-y-6 translate-x-6 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-20 pointer-events-none">
                        <div className="w-full h-24 bg-gradient-to-tl from-indigo-600/30 to-[#fd65c2]/20 rounded-tl-2xl" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
