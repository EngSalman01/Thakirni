"use client"

import { useState } from "react"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target, Plus, CheckCircle2, Trash2, Wand2, Calendar } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { motion } from "framer-motion"

const API_URL = ""

const CATEGORIES = [
  { value: "career", label: "مسيرة مهنية", labelEn: "Career", icon: "💼" },
  { value: "health", label: "صحة ولياقة", labelEn: "Health & Fitness", icon: "❤️" },
  { value: "finance", label: "مالي", labelEn: "Finance", icon: "💰" },
  { value: "education", label: "تعليم", labelEn: "Education", icon: "🎓" },
  { value: "personal", label: "شخصي", labelEn: "Personal", icon: "🌟" },
  { value: "relationships", label: "علاقات", labelEn: "Relationships", icon: "👥" },
  { value: "other", label: "أخرى", labelEn: "Other", icon: "📌" },
]

async function fetchGoals() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const res = await fetch(`${API_URL}/api/goals`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) return []
  const d = await res.json() as { goals?: Record<string, unknown>[] }
  return d.goals ?? []
}

export default function GoalsPage() {
  const { data: goals = [], mutate } = useSWR(`${API_URL}/api/goals`, fetchGoals)
  const { t, isArabic } = useLanguage()
  const [open, setOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", category: "personal", target_date: "" })
  const [suggestedMilestones, setSuggestedMilestones] = useState<{ title: string }[]>([])

  async function createGoal(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const body = {
      ...form,
      milestones: suggestedMilestones,
    }

    const res = await fetch(`${API_URL}/api/goals`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.success(t("تم إنشاء الهدف! 🎯", "Goal created! 🎯"))
      setOpen(false)
      setForm({ title: "", description: "", category: "personal", target_date: "" })
      setSuggestedMilestones([])
      mutate()
    } else {
      toast.error(t("حدث خطأ", "An error occurred"))
    }
  }

  async function suggestMilestones() {
    if (!form.title) { toast.error(t("اكتب عنوان الهدف أولاً", "Enter a goal title first")); return }
    setAiLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setAiLoading(false); return }

    const res = await fetch(`${API_URL}/api/goals/ai-suggest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language: isArabic ? "ar" : "en" }),
    })
    const d = await res.json() as { milestones?: { title: string }[] }
    setSuggestedMilestones(d.milestones ?? [])
    setAiLoading(false)
    toast.success(t("اقترح الذكاء الاصطناعي خطواتك! ✨", "AI suggested your milestones! ✨"))
  }

  async function updateProgress(id: string, progress: number) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`${API_URL}/api/goals/${id}/progress`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    })
    mutate()
  }

  async function completeMilestone(goalId: string, milestoneId: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`${API_URL}/api/goals/${goalId}/milestones/${milestoneId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    toast.success(t("خطوة مكتملة! 🎉", "Milestone completed! 🎉"))
    mutate()
  }

  async function deleteGoal(id: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`${API_URL}/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
    toast.success(t("تم حذف الهدف", "Goal deleted"))
    mutate()
  }

  const categoryInfo = (c: string) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[4]

  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed glassmorphism header — desktop */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-headline font-extrabold gradient-text">{t("أهدافي", "My Goals")}</span>
            <p className="text-xs text-slate-500">{t("تتبع أهدافك الكبيرة خطوة بخطوة", "Track your big goals step by step")}</p>
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
                <Plus className="w-4 h-4" />{t("هدف جديد", "New Goal")}
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("إنشاء هدف جديد", "Create New Goal")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={createGoal} className="space-y-4">
                <Input
                  placeholder={t("ما هو هدفك؟", "What is your goal?")}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <Textarea
                  placeholder={t("وصف الهدف (اختياري)", "Goal description (optional)")}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.icon} {isArabic ? c.label : c.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                    placeholder={t("التاريخ المستهدف", "Target date")}
                  />
                </div>

                <Button type="button" variant="outline" className="w-full gap-2" onClick={suggestMilestones} disabled={aiLoading}>
                  <Wand2 className="w-4 h-4" />
                  {aiLoading ? t("جاري الاقتراح...", "Suggesting...") : t("اقترح خطوات بالذكاء الاصطناعي ✨", "Suggest milestones with AI ✨")}
                </Button>

                {suggestedMilestones.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                    <p className="text-sm font-medium">{t("الخطوات المقترحة:", "Suggested milestones:")}</p>
                    {suggestedMilestones.map((m, i) => (
                      <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-[#2552ca]">{i + 1}.</span> {m.title}
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }}>
                  {t("إنشاء الهدف 🎯", "Create Goal 🎯")}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-headline font-extrabold gradient-text">{t("أهدافي", "My Goals")}</span>
                <p className="text-xs text-slate-500">{t("تتبع أهدافك الكبيرة", "Track your big goals")}</p>
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
                <Plus className="w-3.5 h-3.5" />{t("جديد", "New")}
              </motion.button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div className="max-w-4xl mx-auto">

          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-white/40 shadow-ambient p-16 text-center"
            >
              <Target className="w-16 h-16 mx-auto mb-4 text-[#2552ca]/30" />
              <p className="text-lg font-headline font-bold text-slate-700">{t("لا يوجد أهداف بعد", "No goals yet")}</p>
              <p className="text-sm text-slate-500">{t("ابدأ بإضافة هدفك الأول", "Start by adding your first goal")}</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((g: Record<string, unknown>, idx) => {
                const cat = categoryInfo(g.category as string)
                const milestones = (g.goal_milestones as Record<string, unknown>[] | undefined) ?? []
                const progress = g.progress as number ?? 0

                return (
                  <motion.div
                    key={g.id as string}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="bg-white rounded-2xl border border-[#e4e2e1] shadow-ambient hover-lift overflow-hidden"
                  >
                    {/* Top gradient strip */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#2552ca] to-[#fd65c2]" />
                    <div className="p-5 space-y-3">

                      {/* Header row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <p className="font-headline font-bold text-slate-900 text-sm leading-tight">{g.title as string}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eded] text-slate-500 border border-[#e4e2e1]">
                              {isArabic ? cat.label : cat.labelEn}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteGoal(g.id as string)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                          <span>{t("التقدم", "Progress")}</span>
                          <span className="font-bold text-[#2552ca]">{progress}%</span>
                        </div>
                        <div className="h-2 bg-[#f0eded] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2552ca] to-[#fd65c2] transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Target date */}
                      {!!g.target_date && (() => {
                        const dateStr = new Date(String(g.target_date)).toLocaleDateString(isArabic ? "ar-SA" : "en-US")
                        return (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{t("الهدف: ", "Target: ") + dateStr}</span>
                          </div>
                        )
                      })()}

                      {/* Milestones */}
                      {milestones.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {milestones.map((m: Record<string, unknown>) => (
                            <div
                              key={m.id as string}
                              className={`flex items-center gap-2 text-xs p-2 rounded-xl cursor-pointer transition-colors ${m.is_completed ? "opacity-50 line-through text-slate-400" : "hover:bg-[#f6f3f2] text-slate-700"}`}
                              onClick={() => !m.is_completed && completeMilestone(g.id as string, m.id as string)}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${m.is_completed ? "text-green-500" : "text-slate-300"}`} />
                              {m.title as string}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick progress update */}
                      <div className="flex gap-1 pt-1">
                        {[25, 50, 75, 100].map((p) => (
                          <button
                            key={p}
                            className={`flex-1 h-7 text-xs rounded-lg border transition-all font-bold ${progress >= p ? "bg-[#2552ca]/10 border-[#2552ca]/30 text-[#2552ca]" : "border-[#e4e2e1] text-slate-400 hover:border-[#2552ca]/40 hover:text-[#2552ca]"}`}
                            onClick={() => updateProgress(g.id as string, p)}
                            disabled={progress >= p}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
