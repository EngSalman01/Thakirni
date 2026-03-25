"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Circle, Flame, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"

const API_URL = ""

const HABIT_ICONS = ["✅", "🏃", "💧", "📚", "🧘", "🍎", "💪", "☀️", "🧠", "🎯", "💤", "🙏"]

async function fetchHabits() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const res = await fetch(`${API_URL}/api/habits`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) return []
  const d = await res.json() as { habits?: Record<string, unknown>[] }
  return d.habits ?? []
}

export default function HabitsPage() {
  const { data: habits = [], mutate } = useSWR(`${API_URL}/api/habits`, fetchHabits, { refreshInterval: 60000 })
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
    const session = await getSession()
    if (!session) return
    const res = await fetch(`${API_URL}/api/habits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success(t("تمت إضافة العادة! 🎉", "Habit added! 🎉"))
      setOpen(false)
      setForm({ name: "", icon: "✅", color: "#2552ca", frequency: "daily", category: "general" })
      mutate()
    } else {
      toast.error(t("حدث خطأ", "An error occurred"))
    }
  }

  async function toggleHabit(id: string, completedToday: boolean) {
    const session = await getSession()
    if (!session) return
    const endpoint = completedToday ? "uncomplete" : "complete"
    await fetch(`${API_URL}/api/habits/${id}/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!completedToday) toast.success(t("أحسنت! العادة مكتملة 🔥", "Great job! Habit completed 🔥"))
    mutate()
  }

  async function deleteHabit(id: string) {
    const session = await getSession()
    if (!session) return
    await fetch(`${API_URL}/api/habits/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
    toast.success(t("تم حذف العادة", "Habit deleted"))
    mutate()
  }

  const completedCount = habits.filter((h: Record<string, unknown>) => h.completed_today).length
  const total = habits.length

  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed glassmorphism header — desktop */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ad1d7f] to-[#fd65c2] flex items-center justify-center shadow-lg shadow-[#ad1d7f]/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-headline font-extrabold gradient-text">{t("عاداتي", "My Habits")}</span>
            <p className="text-xs text-slate-500">{t("تتبع عاداتك اليومية", "Track your daily habits")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full power-gradient text-white text-sm font-bold btn-glow"
              >
                <Plus className="w-4 h-4" />{t("عادة جديدة", "New Habit")}
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>{t("إضافة عادة جديدة", "Add New Habit")}</DialogTitle></DialogHeader>
              <form onSubmit={createHabit} className="space-y-4">
                <Input
                  placeholder={t("اسم العادة (مثال: أشرب الماء)", "Habit name (e.g. Drink water)")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("اختر أيقونة:", "Choose icon:")}</p>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map((icon) => (
                      <button
                        key={icon} type="button"
                        className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === icon ? "border-[#2552ca] bg-[#2552ca]/10" : "border-transparent hover:border-muted"}`}
                        onClick={() => setForm({ ...form, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("يومي", "Daily")}</SelectItem>
                    <SelectItem value="weekly">{t("أسبوعي", "Weekly")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }}>
                  {t("إضافة العادة", "Add Habit")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <ThemeToggle /><LanguageToggle />
        </div>
      </header>

      <main className="lg:ml-72 pt-4 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-16 transition-all duration-300">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ad1d7f] to-[#fd65c2] flex items-center justify-center shadow-lg shadow-[#ad1d7f]/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-headline font-extrabold gradient-text">{t("عاداتي", "My Habits")}</span>
                <p className="text-xs text-slate-500">{t("تتبع عاداتك اليومية", "Track your daily habits")}</p>
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full power-gradient text-white text-xs font-bold btn-glow"
              >
                <Plus className="w-3.5 h-3.5" />{t("جديدة", "New")}
              </motion.button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div className="max-w-2xl mx-auto">

          {/* Progress ring card */}
          {total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-white/40 shadow-ambient p-5 mb-6 flex items-center gap-4"
            >
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" stroke="url(#grad)" strokeWidth="6"
                    strokeDasharray={`${(completedCount / total) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2552ca" />
                      <stop offset="100%" stopColor="#fd65c2" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
                  {completedCount}/{total}
                </span>
              </div>
              <div>
                <p className="font-headline font-bold text-slate-900">
                  {completedCount === total && total > 0
                    ? t("أنجزت كل عاداتك اليوم! 🔥", "All habits done today! 🔥")
                    : t(`${total - completedCount} عادة متبقية اليوم`, `${total - completedCount} habit${total - completedCount !== 1 ? "s" : ""} remaining today`)}
                </p>
                <p className="text-sm text-slate-500">{t("استمر في الاتساق يبني النجاح", "Consistency builds success")}</p>
              </div>
            </motion.div>
          )}

          {/* Habits list */}
          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-white/40 shadow-ambient p-16 text-center"
            >
              <Flame className="w-12 h-12 mx-auto mb-3 text-[#ad1d7f]/30" />
              <p className="font-headline font-bold text-slate-700">{t("لا يوجد عادات بعد", "No habits yet")}</p>
              <p className="text-sm text-slate-500">{t("أضف عادتك الأولى!", "Add your first habit!")}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {habits.map((h: Record<string, unknown>, i) => (
                <motion.div
                  key={h.id as string}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative bg-white rounded-2xl border border-[#e4e2e1] shadow-ambient hover-lift overflow-hidden group cursor-pointer ${h.completed_today ? "opacity-70" : ""}`}
                  onClick={() => toggleHabit(h.id as string, h.completed_today as boolean)}
                >
                  {/* Decorative color stripe at top */}
                  <div className="h-1 w-full" style={{ background: (h.color as string) || '#2552ca' }} />
                  <div className="flex items-center gap-4 p-4">
                    <span className="text-2xl shrink-0">{h.icon as string}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-headline font-bold text-slate-800 ${h.completed_today ? "line-through text-slate-400" : ""}`}>
                        {h.name as string}
                      </p>
                      {(h.current_streak as number) > 0 && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 power-gradient text-white rounded-full text-xs font-bold">
                          <Flame className="w-3 h-3" />
                          {t(`${h.current_streak as number} يوم متتالي`, `${h.current_streak as number} day streak`)}
                        </span>
                      )}
                    </div>
                    {h.completed_today
                      ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                      : <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                    }
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); deleteHabit(h.id as string) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
