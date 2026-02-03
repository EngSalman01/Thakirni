"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Calendar, Plus, Search, Clock, Bell, 
  Repeat, ChevronLeft, CheckCircle2, Edit2, Trash2
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { toast } from "sonner"

interface Plan {
  id: string
  title: string
  description?: string
  plan_date: string
  plan_time?: string
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly"
  category: "anniversary" | "appointment" | "memory" | "other"
  completed: boolean
}

const mockPlans: Plan[] = [
  { id: "1", title: "عيد ميلاد أمي", description: "لا تنسى الهدية", plan_date: "2026-03-15", recurrence: "yearly", category: "anniversary", completed: false },
  { id: "2", title: "موعد طبيب الأسنان", plan_date: "2026-02-10", plan_time: "14:30", recurrence: "none", category: "appointment", completed: false },
  { id: "3", title: "ذكرى زواجي", description: "10 سنوات!", plan_date: "2026-05-20", recurrence: "yearly", category: "anniversary", completed: false },
  { id: "4", title: "اجتماع العمل", plan_date: "2026-02-05", plan_time: "10:00", recurrence: "weekly", category: "appointment", completed: true },
]

const categoryColors: Record<string, string> = {
  anniversary: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  appointment: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  memory: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const categoryLabels: Record<string, string> = {
  anniversary: "ذكرى سنوية",
  appointment: "موعد",
  memory: "ذكرى",
  other: "أخرى",
}

const recurrenceLabels: Record<string, string> = {
  none: "مرة واحدة",
  daily: "يومياً",
  weekly: "أسبوعياً",
  monthly: "شهرياً",
  yearly: "سنوياً",
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all")

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || 
      (filter === "upcoming" && !plan.completed) ||
      (filter === "completed" && plan.completed)
    return matchesSearch && matchesFilter
  })

  const toggleComplete = (id: string) => {
    setPlans(plans.map(p => p.id === id ? { ...p, completed: !p.completed } : p))
    toast.success("تم تحديث الخطة")
  }

  const deletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id))
    toast.success("تم حذف الخطة")
  }

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      
      <main className="me-64 p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">خططي</h1>
            <p className="text-muted-foreground">إدارة جميع خططك وتذكيراتك</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              خطة جديدة
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن خطة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "upcoming", "completed"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter !== f ? "bg-transparent" : ""}
              >
                {f === "all" ? "الكل" : f === "upcoming" ? "القادمة" : "المكتملة"}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className={`p-4 border ${plan.completed ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${categoryColors[plan.category]}`}>
                    {categoryLabels[plan.category]}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => toggleComplete(plan.id)}>
                      <CheckCircle2 className={`w-4 h-4 ${plan.completed ? "text-green-500" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <h3 className={`font-semibold text-foreground mb-1 ${plan.completed ? "line-through" : ""}`}>
                  {plan.title}
                </h3>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.plan_date}
                  </div>
                  {plan.plan_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {plan.plan_time}
                    </div>
                  )}
                  {plan.recurrence !== "none" && (
                    <div className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {recurrenceLabels[plan.recurrence]}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد خطط</p>
          </div>
        )}
      </main>
    </div>
  )
}
