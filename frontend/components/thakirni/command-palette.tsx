"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Brain, ListTodo, Flame, Target, Timer, FileText,
  Mic, Upload, Calendar, Users, Settings, Plus,
  LayoutDashboard, ChevronRight
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CommandItem {
  id: string
  label: string
  labelAr: string
  icon: React.ElementType
  color: string
  action: () => void
  group: string
  groupAr: string
  keywords: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t, isArabic } = useLanguage()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const nav = useCallback((path: string) => {
    router.push(path)
    setOpen(false)
  }, [router])

  const commands: CommandItem[] = [
    // Navigate
    { id: "nav-dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard, color: "#2552ca", action: () => nav("/vault"), group: "Navigate", groupAr: "تصفح", keywords: "home dashboard vault" },
    { id: "nav-memories", label: "Memories", labelAr: "الذكريات", icon: Brain, color: "#2552ca", action: () => nav("/vault"), group: "Navigate", groupAr: "تصفح", keywords: "memories brain notes" },
    { id: "nav-plans", label: "Plans", labelAr: "الخطط", icon: ListTodo, color: "#ad1d7f", action: () => nav("/vault/plans"), group: "Navigate", groupAr: "تصفح", keywords: "plans tasks todo" },
    { id: "nav-habits", label: "Habits", labelAr: "العادات", icon: Flame, color: "#f59e0b", action: () => nav("/vault/habits"), group: "Navigate", groupAr: "تصفح", keywords: "habits streak daily" },
    { id: "nav-goals", label: "Goals", labelAr: "الأهداف", icon: Target, color: "#10b981", action: () => nav("/vault/goals"), group: "Navigate", groupAr: "تصفح", keywords: "goals targets milestones" },
    { id: "nav-calendar", label: "Calendar", labelAr: "التقويم", icon: Calendar, color: "#6366f1", action: () => nav("/vault/calendar"), group: "Navigate", groupAr: "تصفح", keywords: "calendar schedule events" },
    { id: "nav-focus", label: "Focus Timer", labelAr: "مؤقت التركيز", icon: Timer, color: "#ef4444", action: () => nav("/vault/focus"), group: "Navigate", groupAr: "تصفح", keywords: "focus pomodoro timer" },
    { id: "nav-meetings", label: "Meetings", labelAr: "الاجتماعات", icon: Mic, color: "#8b5cf6", action: () => nav("/vault/meetings"), group: "Navigate", groupAr: "تصفح", keywords: "meetings voice summary" },
    { id: "nav-documents", label: "Documents", labelAr: "المستندات", icon: FileText, color: "#0ea5e9", action: () => nav("/vault/documents"), group: "Navigate", groupAr: "تصفح", keywords: "documents files pdf" },
    { id: "nav-teams", label: "Teams", labelAr: "الفرق", icon: Users, color: "#ad1d7f", action: () => nav("/vault/teams"), group: "Navigate", groupAr: "تصفح", keywords: "teams members workspace" },
    { id: "nav-settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, color: "#64748b", action: () => nav("/vault/settings"), group: "Navigate", groupAr: "تصفح", keywords: "settings profile account" },
    // Create
    { id: "create-memory", label: "New Memory", labelAr: "ذاكرة جديدة", icon: Plus, color: "#2552ca", action: () => nav("/vault/new-memory"), group: "Create", groupAr: "إنشاء", keywords: "new create memory add" },
    { id: "create-voice", label: "Voice Note", labelAr: "ملاحظة صوتية", icon: Mic, color: "#8b5cf6", action: () => nav("/vault/voice-note"), group: "Create", groupAr: "إنشاء", keywords: "voice record note" },
    { id: "create-upload", label: "Upload Document", labelAr: "رفع مستند", icon: Upload, color: "#0ea5e9", action: () => nav("/vault/upload"), group: "Create", groupAr: "إنشاء", keywords: "upload document file" },
  ]

  // Group commands
  const groups = [...new Set(commands.map(c => c.group))]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden rounded-2xl" dir={isArabic ? "rtl" : "ltr"}>
        <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <span className="text-slate-400 text-xs font-mono">⌘K</span>
            <Command.Input
              placeholder={t("اكتب أمراً أو ابحث...", "Type a command or search...")}
              className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-label"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-slate-400 font-label">
              {t("لا توجد نتائج", "No results found")}
            </Command.Empty>

            {groups.map(group => {
              const items = commands.filter(c => c.group === group)
              const groupLabel = isArabic ? items[0].groupAr : group
              return (
                <Command.Group key={group} heading={groupLabel}>
                  {items.map(cmd => {
                    const Icon = cmd.icon
                    return (
                      <Command.Item
                        key={cmd.id}
                        value={`${cmd.label} ${cmd.labelAr} ${cmd.keywords}`}
                        onSelect={cmd.action}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f6f3f2] aria-selected:bg-[#f6f3f2] transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cmd.color}18` }}>
                          <Icon className="w-4 h-4" style={{ color: cmd.color }} />
                        </div>
                        <span className="flex-1 text-sm font-label font-medium text-slate-800">
                          {isArabic ? cmd.labelAr : cmd.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-aria-selected:text-slate-500 transition-colors" />
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )
            })}
          </Command.List>

          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>↑↓ {t("للتنقل", "navigate")}</span>
            <span>↵ {t("للتحديد", "select")}</span>
            <span>esc {t("للإغلاق", "close")}</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
