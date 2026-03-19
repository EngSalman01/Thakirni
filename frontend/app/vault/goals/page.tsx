"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target, Plus, CheckCircle2, Trash2, Wand2, Calendar } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

const CATEGORIES = [
  { value: "career", label: "مسيرة مهنية", icon: "💼" },
  { value: "health", label: "صحة ولياقة", icon: "❤️" },
  { value: "finance", label: "مالي", icon: "💰" },
  { value: "education", label: "تعليم", icon: "🎓" },
  { value: "personal", label: "شخصي", icon: "🌟" },
  { value: "relationships", label: "علاقات", icon: "👥" },
  { value: "other", label: "أخرى", icon: "📌" },
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
      toast.success("تم إنشاء الهدف! 🎯")
      setOpen(false)
      setForm({ title: "", description: "", category: "personal", target_date: "" })
      setSuggestedMilestones([])
      mutate()
    } else {
      toast.error("حدث خطأ")
    }
  }

  async function suggestMilestones() {
    if (!form.title) { toast.error("اكتب عنوان الهدف أولاً"); return }
    setAiLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setAiLoading(false); return }

    const res = await fetch(`${API_URL}/api/goals/ai-suggest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language: "ar" }),
    })
    const d = await res.json() as { milestones?: { title: string }[] }
    setSuggestedMilestones(d.milestones ?? [])
    setAiLoading(false)
    toast.success("اقترح الذكاء الاصطناعي خطواتك! ✨")
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
    toast.success("خطوة مكتملة! 🎉")
    mutate()
  }

  async function deleteGoal(id: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`${API_URL}/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
    toast.success("تم حذف الهدف")
    mutate()
  }

  const categoryInfo = (c: string) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[4]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-[#2552ca]" /> أهدافي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع أهدافك الكبيرة خطوة بخطوة</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }} className="text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> هدف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء هدف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={createGoal} className="space-y-4">
              <Input
                placeholder="ما هو هدفك؟"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="وصف الهدف (اختياري)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                  placeholder="التاريخ المستهدف"
                />
              </div>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={suggestMilestones} disabled={aiLoading}>
                <Wand2 className="w-4 h-4" />
                {aiLoading ? "جاري الاقتراح..." : "اقترح خطوات بالذكاء الاصطناعي ✨"}
              </Button>

              {suggestedMilestones.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <p className="text-sm font-medium">الخطوات المقترحة:</p>
                  {suggestedMilestones.map((m, i) => (
                    <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-[#2552ca]">{i + 1}.</span> {m.title}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }}>
                إنشاء الهدف 🎯
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center text-muted-foreground">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">لا يوجد أهداف بعد</p>
            <p className="text-sm">ابدأ بإضافة هدفك الأول</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g: Record<string, unknown>) => {
            const cat = categoryInfo(g.category as string)
            const milestones = (g.goal_milestones as Record<string, unknown>[] | undefined) ?? []
            const progress = g.progress as number ?? 0

            return (
              <Card key={g.id as string} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <CardTitle className="text-sm font-semibold">{g.title as string}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-0.5">{cat.label}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteGoal(g.id as string)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>التقدم</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {!!g.target_date && (() => {
                    const dateStr = new Date(String(g.target_date)).toLocaleDateString("ar-SA")
                    return (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{"الهدف: " + dateStr}</span>
                      </div>
                    )
                  })()}

                  {/* Milestones */}
                  {milestones.length > 0 && (
                    <div className="space-y-1.5">
                      {milestones.map((m: Record<string, unknown>) => (
                        <div
                          key={m.id as string}
                          className={`flex items-center gap-2 text-xs p-2 rounded-md cursor-pointer transition-colors ${m.is_completed ? "opacity-50 line-through" : "hover:bg-muted"}`}
                          onClick={() => !m.is_completed && completeMilestone(g.id as string, m.id as string)}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${m.is_completed ? "text-green-500" : "text-muted-foreground"}`} />
                          {m.title as string}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick progress update */}
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => updateProgress(g.id as string, p)}
                        disabled={progress >= p}
                      >
                        {p}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
