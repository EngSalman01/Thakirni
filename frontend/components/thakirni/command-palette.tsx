"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Brain,
  ListTodo,
  Flame,
  Target,
  Timer,
  FileText,
  Mic,
  Upload,
  Calendar,
  Users,
  Settings,
  Plus,
  LayoutDashboard,
  ChevronRight,
  Search,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/* ─────────────────────────────────────────────────────────────────
   CommandPalette — atelier rewrite
   ⌘K opens the overlay; editorial typography, ember accents,
   hairline dividers. Icons replace the rainbow legacy palette.
───────────────────────────────────────────────────────────────── */

interface CommandEntry {
  id: string
  label: string
  labelAr: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  group: "Navigate" | "Create"
  groupAr: "تصفح" | "إنشاء"
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
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const nav = useCallback(
    (path: string) => {
      router.push(path)
      setOpen(false)
    },
    [router],
  )

  const commands: CommandEntry[] = [
    { id: "nav-dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard, action: () => nav("/vault"), group: "Navigate", groupAr: "تصفح", keywords: "home dashboard vault" },
    { id: "nav-memories", label: "Memories", labelAr: "الذكريات", icon: Brain, action: () => nav("/vault"), group: "Navigate", groupAr: "تصفح", keywords: "memories brain notes" },
    { id: "nav-plans", label: "Plans", labelAr: "الخطط", icon: ListTodo, action: () => nav("/vault/plans"), group: "Navigate", groupAr: "تصفح", keywords: "plans tasks todo" },
    { id: "nav-habits", label: "Habits", labelAr: "العادات", icon: Flame, action: () => nav("/vault/habits"), group: "Navigate", groupAr: "تصفح", keywords: "habits streak daily" },
    { id: "nav-goals", label: "Goals", labelAr: "الأهداف", icon: Target, action: () => nav("/vault/goals"), group: "Navigate", groupAr: "تصفح", keywords: "goals targets milestones" },
    { id: "nav-calendar", label: "Calendar", labelAr: "التقويم", icon: Calendar, action: () => nav("/vault/calendar"), group: "Navigate", groupAr: "تصفح", keywords: "calendar schedule events" },
    { id: "nav-focus", label: "Focus", labelAr: "مؤقت التركيز", icon: Timer, action: () => nav("/vault/focus"), group: "Navigate", groupAr: "تصفح", keywords: "focus pomodoro timer" },
    { id: "nav-meetings", label: "Meetings", labelAr: "الاجتماعات", icon: Mic, action: () => nav("/vault/meetings"), group: "Navigate", groupAr: "تصفح", keywords: "meetings voice summary" },
    { id: "nav-documents", label: "Documents", labelAr: "المستندات", icon: FileText, action: () => nav("/vault/upload"), group: "Navigate", groupAr: "تصفح", keywords: "documents files pdf" },
    { id: "nav-teams", label: "Teams", labelAr: "الفرق", icon: Users, action: () => nav("/vault/teams"), group: "Navigate", groupAr: "تصفح", keywords: "teams members workspace" },
    { id: "nav-settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, action: () => nav("/vault/settings"), group: "Navigate", groupAr: "تصفح", keywords: "settings profile account" },
    { id: "create-memory", label: "New Memory", labelAr: "ذاكرة جديدة", icon: Plus, action: () => nav("/vault/new-memory"), group: "Create", groupAr: "إنشاء", keywords: "new create memory add" },
    { id: "create-voice", label: "Voice Note", labelAr: "ملاحظة صوتية", icon: Mic, action: () => nav("/vault/voice-note"), group: "Create", groupAr: "إنشاء", keywords: "voice record note" },
    { id: "create-upload", label: "Upload Document", labelAr: "رفع مستند", icon: Upload, action: () => nav("/vault/upload"), group: "Create", groupAr: "إنشاء", keywords: "upload document file" },
  ]

  const groups: Array<CommandEntry["group"]> = ["Navigate", "Create"]
  const groupNumerals: Record<CommandEntry["group"], string> = {
    Navigate: "01",
    Create: "02",
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="atelier-root p-0 gap-0 max-w-xl overflow-hidden border-0 rounded-none"
        dir={isArabic ? "rtl" : "ltr"}
        style={{
          background: "var(--atelier-bg-elevated)",
          color: "var(--atelier-text)",
          border: "1px solid var(--atelier-border-strong)",
          boxShadow: "var(--atelier-shadow-vignette)",
          fontFamily: "var(--atelier-font-body)",
        }}
      >
        <Command
          className="[&_[cmdk-group-heading]]:px-5 [&_[cmdk-group-heading]]:pt-5 [&_[cmdk-group-heading]]:pb-2"
          // cmdk exposes data-selected; we restyle via the aria-selected attribute on items
        >
          {/* Input row */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid var(--atelier-border)" }}
          >
            <Search
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--atelier-text-subtle)" }}
            />
            <Command.Input
              placeholder={t("اكتب أمراً أو ابحث...", "Type a command or search...")}
              className="flex-1 bg-transparent outline-none border-0 text-base"
              style={{
                color: "var(--atelier-text)",
                fontFamily: "var(--atelier-font-body)",
                letterSpacing: "0.005em",
              }}
            />
            <span
              className="shrink-0 px-2 py-1"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--atelier-text-subtle)",
                border: "1px solid var(--atelier-border-strong)",
                fontFamily: "var(--atelier-font-mono)",
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Results */}
          <Command.List
            className="max-h-[420px] overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            <Command.Empty
              className="py-14 text-center"
              style={{
                color: "var(--atelier-text-subtle)",
                fontFamily: "var(--atelier-font-body)",
                fontSize: 13,
              }}
            >
              {t("لا توجد نتائج", "No results")}
            </Command.Empty>

            {groups.map((group) => {
              const items = commands.filter((c) => c.group === group)
              if (items.length === 0) return null
              const heading = isArabic ? items[0].groupAr : group
              return (
                <Command.Group
                  key={group}
                  heading={
                    <span
                      className="flex items-baseline gap-2"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--atelier-text-subtle)",
                        fontFamily: "var(--atelier-font-body)",
                      }}
                    >
                      <span
                        style={{ color: "var(--c-ember)" }}
                        className="tabular-nums"
                      >
                        {groupNumerals[group]}
                      </span>
                      <span>{heading}</span>
                    </span>
                  }
                >
                  <div
                    style={{
                      borderBottom: "1px solid var(--atelier-border)",
                      marginInline: 20,
                    }}
                  />
                  {items.map((cmd) => {
                    const Icon = cmd.icon
                    return (
                      <Command.Item
                        key={cmd.id}
                        value={`${cmd.label} ${cmd.labelAr} ${cmd.keywords}`}
                        onSelect={cmd.action}
                        className="group flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors"
                        style={{
                          color: "var(--atelier-text-muted)",
                          fontFamily: "var(--atelier-font-body)",
                        }}
                      >
                        <span
                          aria-hidden
                          className="inline-flex items-center justify-center w-8 h-8 shrink-0 transition-colors"
                          style={{
                            border: "1px solid var(--atelier-border-strong)",
                            background: "transparent",
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span
                          className="flex-1 truncate"
                          style={{ fontSize: 14 }}
                        >
                          {isArabic ? cmd.labelAr : cmd.label}
                        </span>
                        <ChevronRight
                          className="w-3.5 h-3.5 rtl:rotate-180 shrink-0 opacity-0 group-aria-selected:opacity-100 transition-opacity"
                          style={{ color: "var(--c-ember)" }}
                        />
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )
            })}
          </Command.List>

          {/* Footer hints */}
          <div
            className="flex items-center gap-5 px-5 py-3"
            style={{
              borderTop: "1px solid var(--atelier-border)",
              color: "var(--atelier-text-subtle)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "var(--atelier-font-mono)",
            }}
          >
            <span>↑↓ {t("تنقل", "navigate")}</span>
            <span>↵ {t("تحديد", "select")}</span>
            <span>esc {t("إغلاق", "close")}</span>
          </div>
        </Command>

        <style jsx>{`
          :global(.atelier-root [cmdk-item][aria-selected="true"]) {
            background: color-mix(
              in oklab,
              var(--c-ember) 8%,
              transparent
            ) !important;
            color: var(--atelier-text) !important;
          }
          :global(.atelier-root [cmdk-item][aria-selected="true"] [aria-hidden]) {
            border-color: var(--c-ember) !important;
            color: var(--c-ember) !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
