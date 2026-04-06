"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Circle, Flame, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmationPop } from "@/components/thakirni/motion-primitives"

const HABIT_ICONS = ["✅","🏃","💧","📚","🧘","🍎","💪","☀️","🧠","🎯","💤","🙏"]

function ParticleLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ps: HTMLDivElement[] = [];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const s = Math.random()*6+3, d = Math.random()*20+10, dl = Math.random()*-20;
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(173,29,127,0.08);border-radius:50%;filter:blur(1px);--drift-x:${(Math.random()-0.5)*160}px;--drift-y:${(Math.random()-0.5)*160}px;animation:particle-drift ${d}s linear ${dl}s infinite;pointer-events:none;`;
      el.appendChild(p); ps.push(p);
    }
    return () => ps.forEach(p => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

async function fetchHabits() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const res = await fetch(`/api/habits`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error(`Failed to fetch habits: ${res.status}`)
  const d = await res.json() as { habits?: Record<string, unknown>[] }
  return d.habits ?? []
}

export default function HabitsPage() {
  const { data: habits = [], mutate, isLoading: habitsLoading, error: habitsError } = useSWR(`/api/habits`, fetchHabits, { refreshInterval: 60000 })
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", icon: "✅", color: "#2552ca", frequency: "daily", category: "general" })

  async function getSession() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault()
    const session = await getSession(); if (!session) return
    const res = await fetch(`/api/habits`, {
      method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(form)
    })
    if (res.ok) { toast.success(t("تمت إضافة العادة! 🎉", "Habit added! 🎉")); setOpen(false); setForm({ name: "", icon: "✅", color: "#2552ca", frequency: "daily", category: "general" }); mutate() }
    else toast.error(t("حدث خطأ", "An error occurred"))
  }

  async function toggleHabit(id: string, completedToday: boolean) {
    const session = await getSession(); if (!session) return
    const url = completedToday ? `/api/habits/${id}/uncomplete` : `/api/habits/${id}/complete`
    try {
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      mutate()
    } catch (err) {
      console.error("[Habits] toggle error:", err)
      toast.error(t("فشل تحديث العادة", "Failed to update habit"))
    }
  }

  async function deleteHabit(id: string) {
    const session = await getSession(); if (!session) return
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(await res.text())
      toast.success(t("تم حذف العادة", "Habit deleted"))
      mutate()
    } catch (err) {
      console.error("[Habits] delete error:", err)
      toast.error(t("فشل حذف العادة", "Failed to delete habit"))
    }
  }

  const completedCount = habits.filter((h: Record<string, unknown>) => h.completed_today).length
  const total = habits.length

  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden">
      <main className="pt-16">

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="absolute -top-20 right-0 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2,1,0.3,1] }} className="space-y-6">
                <div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    {t("عاداتي ", "My ")}<span className="gradient-text">{t("اليومية", "Habits")}</span>
                  </h1>
                  <p className="text-xl text-slate-500 mt-4 max-w-lg">
                    {t("الاتساق هو سر النجاح. تتبع عاداتك اليومية وابنِ حياتك.", "Consistency is the secret to success. Track your habits and build your life.")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: completedCount, label: t("مكتملة اليوم", "Done today"),  color: "bg-emerald-50 text-emerald-700" },
                    { value: total - completedCount, label: t("متبقية", "Remaining"), color: "bg-amber-50 text-amber-700" },
                    { value: total, label: t("مجموع العادات", "Total habits"),          color: "bg-[#ffd8e9] text-violet-600 dark:text-violet-400" },
                  ].map(({ value, label, color }) => (
                    <div key={label as string} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${color}`}>
                      <span className="text-xl font-headline font-extrabold">{value}</span>
                      <span className="opacity-80">{label as string}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full power-gradient text-white font-bold text-sm btn-glow">
                  <Plus className="w-4 h-4" />{t("عادة جديدة", "New Habit")}
                </motion.button>
              </motion.div>

              {/* Right: progress ring */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2,1,0.3,1] }}
                className="hidden lg:flex justify-center">
                <div className="relative bg-white rounded-2xl p-12 shadow-card hover-lift flex flex-col items-center">
                  <div className="relative w-48 h-48 mb-6">
                    <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                      <circle cx="96" cy="96" r="80" fill="none" stroke="#f0eded" strokeWidth="12" />
                      <circle cx="96" cy="96" r="80" fill="none" stroke="url(#ring-grad)" strokeWidth="12"
                        strokeDasharray={`${total > 0 ? (completedCount / total) * 502.7 : 0} 502.7`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#2552ca" /><stop offset="100%" stopColor="#fd65c2" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-headline font-extrabold gradient-text">{total > 0 ? Math.round((completedCount/total)*100) : 0}%</span>
                      <span className="text-sm text-slate-500">{t("مكتمل", "complete")}</span>
                    </div>
                  </div>
                  <p className="font-headline font-bold text-slate-900 text-center">
                    {completedCount === total && total > 0 ? t("أنجزت كل عاداتك! 🔥", "All habits done! 🔥") : t(`${completedCount} من ${total}`, `${completedCount} of ${total}`)}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── HABITS BENTO ── */}
        <section className="pb-24 px-8">
          <div className="max-w-7xl mx-auto">
            {habitsError ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
                <p className="text-red-600 font-semibold mb-3">{t("فشل تحميل العادات", "Failed to load habits")}</p>
                <button onClick={() => mutate()} className="px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm hover:bg-red-50">
                  {t("إعادة المحاولة", "Retry")}
                </button>
              </motion.div>
            ) : habitsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
                    <Skeleton className="h-2 w-full rounded-none" />
                    <div className="p-10 space-y-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <Skeleton className="h-6 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-1/2 rounded-lg" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : habits.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-24 text-center hover-lift">
                <Flame className="w-16 h-16 mx-auto mb-4 text-violet-600 dark:text-violet-400/30" />
                <h2 className="text-2xl font-headline font-bold text-slate-700 mb-2">{t("لا يوجد عادات بعد", "No habits yet")}</h2>
                <p className="text-slate-500 mb-8">{t("أضف عادتك الأولى وابدأ رحلتك!", "Add your first habit and start your journey!")}</p>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full power-gradient text-white font-bold btn-glow">
                  <Plus className="w-4 h-4" />{t("عادة جديدة", "New Habit")}
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {habits.map((h: Record<string, unknown>, i) => (
                  <motion.div key={h.id as string}
                    custom={i} initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-32px" }}
                    transition={{ duration: 0.28, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden group hover-lift cursor-pointer ${h.completed_today ? "opacity-70" : ""}`}
                    onClick={() => toggleHabit(h.id as string, h.completed_today as boolean)}>
                    {/* Color stripe */}
                    <div className="h-2 w-full" style={{ background: (h.color as string) || "#2552ca" }} />
                    <div className="p-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-5xl">{h.icon as string}</span>
                        <div className="flex items-center gap-2">
                          <ConfirmationPop triggerKey={h.completed_today as boolean}>
                            {h.completed_today
                              ? <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                              : <Circle className="w-7 h-7 text-slate-300" />}
                          </ConfirmationPop>
                          <Button variant="ghost" size="icon" aria-label="Delete habit" className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            onClick={e => { e.stopPropagation(); deleteHabit(h.id as string) }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className={`text-xl font-headline font-bold mb-3 ${h.completed_today ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {h.name as string}
                      </h3>
                      {(h.current_streak as number) > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 power-gradient text-white rounded-full text-sm font-bold">
                          <Flame className="w-3.5 h-3.5" />
                          {t(`${h.current_streak} يوم 🔥`, `${h.current_streak} day streak 🔥`)}
                        </span>
                      )}
                    </div>
                    {/* Decorative blob */}
                    <div className="absolute right-0 bottom-0 w-1/2 translate-y-6 translate-x-6 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-20 pointer-events-none">
                      <div className="w-full h-24 rounded-tl-2xl" style={{ background: `linear-gradient(135deg, ${(h.color as string)||"#2552ca"}40, transparent)` }} />
                    </div>
                  </motion.div>
                ))}

                {/* Add new habit card */}
                <motion.div custom={habits.length} initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: habits.length * 0.08, ease: [0.2,1,0.3,1] }}>
                  <button onClick={() => setOpen(true)}
                    className="w-full h-full min-h-[200px] bg-white border-2 border-dashed border-[#e4e2e1] rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-600/50 hover:bg-slate-50 dark:bg-white/[0.03] transition-all group">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#dce1ff] to-[#ffd8e9] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-headline font-bold text-slate-600">{t("أضف عادة", "Add habit")}</span>
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* Single dialog instance — stable in the tree, never remounted */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{t("إضافة عادة جديدة", "Add New Habit")}</DialogTitle></DialogHeader>
            <form onSubmit={createHabit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {t("اسم العادة", "Habit name")} <span className="text-red-500">*</span>
                </label>
                <Input placeholder={t("اسم العادة", "Habit name")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("اختر أيقونة:", "Choose icon:")}</p>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({...form, icon})}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === icon ? "border-indigo-600 bg-indigo-600/10" : "border-transparent hover:border-muted"}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <Select value={form.frequency} onValueChange={v => setForm({...form, frequency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("يومي", "Daily")}</SelectItem>
                  <SelectItem value="weekly">{t("أسبوعي", "Weekly")}</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg,#2552ca,#fd65c2)" }}>{t("إضافة العادة", "Add Habit")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
