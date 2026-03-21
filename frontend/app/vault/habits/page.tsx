"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Circle, Flame, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

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
      toast.success("تمت إضافة العادة! 🎉")
      setOpen(false)
      setForm({ name: "", icon: "✅", color: "#2552ca", frequency: "daily", category: "general" })
      mutate()
    } else {
      toast.error("حدث خطأ")
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
    if (!completedToday) toast.success("أحسنت! العادة مكتملة 🔥")
    mutate()
  }

  async function deleteHabit(id: string) {
    const session = await getSession()
    if (!session) return
    await fetch(`${API_URL}/api/habits/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
    toast.success("تم حذف العادة")
    mutate()
  }

  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const completedCount = habits.filter((h: Record<string, unknown>) => h.completed_today).length
  const total = habits.length

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:ml-72 p-4 md:p-6 transition-all duration-300">
      <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" /> عاداتي
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{today}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }} className="text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> عادة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>إضافة عادة جديدة</DialogTitle></DialogHeader>
            <form onSubmit={createHabit} className="space-y-4">
              <Input
                placeholder="اسم العادة (مثال: أشرب الماء)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">اختر أيقونة:</p>
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
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }}>
                إضافة العادة
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress ring */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-[#2552ca]/10 to-[#fd65c2]/10 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="relative w-16 h-16">
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
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {completedCount}/{total}
            </span>
          </div>
          <div>
            <p className="font-semibold">
              {completedCount === total && total > 0 ? "أنجزت كل عاداتك اليوم! 🔥" : `${total - completedCount} عادة متبقية اليوم`}
            </p>
            <p className="text-sm text-muted-foreground">استمر في الاتساق يبني النجاح</p>
          </div>
        </div>
      )}

      {/* Habits list */}
      {habits.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا يوجد عادات بعد</p>
            <p className="text-sm">أضف عادتك الأولى!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((h: Record<string, unknown>) => (
            <div
              key={h.id as string}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${h.completed_today ? "opacity-70 border-green-200 bg-green-50 dark:bg-green-950/20" : "border-border hover:border-[#2552ca]/40"}`}
              onClick={() => toggleHabit(h.id as string, h.completed_today as boolean)}
            >
              <span className="text-2xl">{h.icon as string}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${h.completed_today ? "line-through text-muted-foreground" : ""}`}>
                  {h.name as string}
                </p>
                {(h.current_streak as number) > 0 && (
                  <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3" /> {h.current_streak as number} يوم متتالي
                  </p>
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
          ))}
        </div>
      )}
    </div>
      </main>
    </div>
  )
}
