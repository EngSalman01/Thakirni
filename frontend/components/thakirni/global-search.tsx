"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search, Brain, ListTodo, Flame, Target, X, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface SearchResult {
  id: string
  title: string
  type: "memory" | "plan" | "habit" | "goal"
  content?: string
  plan_date?: string
  status?: string
  category?: string
}

const typeConfig = {
  memory: { icon: Brain, color: "#2552ca", label: "ذاكرة", labelEn: "Memory", href: (id: string) => `/vault?memory=${id}` },
  plan: { icon: ListTodo, color: "#ad1d7f", label: "خطة", labelEn: "Plan", href: () => `/vault/plans` },
  habit: { icon: Flame, color: "#f59e0b", label: "عادة", labelEn: "Habit", href: () => `/vault/habits` },
  goal: { icon: Target, color: "#10b981", label: "هدف", labelEn: "Goal", href: () => `/vault/goals` },
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t, isArabic } = useLanguage()

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback((result: SearchResult) => {
    const config = typeConfig[result.type]
    router.push(config.href(result.id))
    setOpen(false)
    setQuery("")
    setResults([])
  }, [router])

  const grouped = {
    memory: results.filter(r => r.type === "memory"),
    plan: results.filter(r => r.type === "plan"),
    habit: results.filter(r => r.type === "habit"),
    goal: results.filter(r => r.type === "goal"),
  }

  return (
    <>
      {/* Trigger button — shown in sidebar/header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/60 hover:bg-white text-slate-400 hover:text-slate-600 transition-all text-sm font-label border border-slate-200/50"
        dir="ltr"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-start">{t("بحث...", "Search...")}</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400 font-mono">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden rounded-2xl" dir={isArabic ? "rtl" : "ltr"}>
          <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              {loading ? <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder={t("ابحث في الذكريات، الخطط، العادات...", "Search memories, plans, habits...")}
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-label"
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]) }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Command.List className="max-h-[380px] overflow-y-auto p-2">
              {!query && (
                <Command.Empty className="py-10 text-center text-sm text-slate-400 font-label">
                  {t("اكتب للبحث...", "Start typing to search...")}
                </Command.Empty>
              )}
              {query && results.length === 0 && !loading && (
                <Command.Empty className="py-10 text-center text-sm text-slate-400 font-label">
                  {t("لا توجد نتائج", "No results found")}
                </Command.Empty>
              )}

              {(["memory", "plan", "habit", "goal"] as const).map(type => {
                const items = grouped[type]
                if (items.length === 0) return null
                const config = typeConfig[type]
                const Icon = config.icon
                const groupLabel = isArabic ? config.label + "ات" : config.labelEn + "s"
                return (
                  <Command.Group key={type} heading={groupLabel}>
                    {items.map(result => (
                      <Command.Item
                        key={result.id}
                        value={`${type}-${result.id}-${result.title}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-white/[0.03] aria-selected:bg-slate-50 dark:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.color}18` }}>
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-label font-medium text-slate-800 truncate">{result.title}</p>
                          {result.content && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{result.content.slice(0, 60)}</p>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )
              })}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
