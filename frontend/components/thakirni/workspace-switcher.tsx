"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { useWorkspace, type Workspace } from "@/hooks/use-workspace"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronDown, User, Users, Check, Plus, Loader2, Building2,
} from "lucide-react"

function WorkspaceAvatar({ ws, size = "sm" }: { ws: Workspace; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
  if (ws.avatar_url) {
    return (
      <img
        src={ws.avatar_url}
        alt={ws.name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  const isPersonal = ws.type === "personal"
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 ${
      isPersonal
        ? "bg-amber-600/10 text-amber-600 dark:text-amber-400"
        : "power-gradient text-white"
    }`}>
      {isPersonal
        ? <User className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        : <span className="font-bold">{ws.name[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

export function WorkspaceSwitcher() {
  const { t, isArabic } = useLanguage()
  const { workspaces, active, setActive, loading } = useWorkspace()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <Skeleton className="mx-4 mb-3 h-11 rounded-2xl" />
    )
  }

  if (!active) return null

  return (
    <div className="relative mx-4 mb-3" dir={isArabic ? "rtl" : "ltr"}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-amber-600/40 hover:bg-amber-600/5 transition-all text-start"
      >
        <WorkspaceAvatar ws={active} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">
            {active.name}
          </div>
          <div className="text-[10px] text-slate-400 capitalize">
            {active.type === "personal" ? t("شخصي", "Personal") : t("فريق", "Team")}
            {" · "}
            {active.member_role === "owner"
              ? t("المالك", "Owner")
              : active.member_role === "admin"
                ? t("مشرف", "Admin")
                : t("عضو", "Member")
            }
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              {/* Personal workspaces */}
              {workspaces.filter(w => w.type === "personal").length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-muted">
                    {t("شخصي", "Personal")}
                  </div>
                  {workspaces
                    .filter(w => w.type === "personal")
                    .map(ws => (
                      <WorkspaceOption
                        key={ws.id}
                        ws={ws}
                        isActive={active.id === ws.id}
                        onSelect={() => { setActive(ws); setOpen(false) }}
                      />
                    ))
                  }
                </div>
              )}

              {/* Team workspaces */}
              {workspaces.filter(w => w.type === "team").length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-muted border-t border-border">
                    {t("مساحات الفريق", "Team Workspaces")}
                  </div>
                  {workspaces
                    .filter(w => w.type === "team")
                    .map(ws => (
                      <WorkspaceOption
                        key={ws.id}
                        ws={ws}
                        isActive={active.id === ws.id}
                        onSelect={() => { setActive(ws); setOpen(false) }}
                      />
                    ))
                  }
                </div>
              )}

              {/* Create team workspace */}
              <div className="border-t border-border">
                <Link
                  href="/vault/settings/teams/new"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium">
                    {t("إنشاء مساحة فريق", "New team workspace")}
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkspaceOption({
  ws, isActive, onSelect,
}: {
  ws: Workspace
  isActive: boolean
  onSelect: () => void
}) {
  const { t } = useLanguage()
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-muted transition-colors ${
        isActive ? "bg-amber-600/5" : ""
      }`}
    >
      <WorkspaceAvatar ws={ws} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{ws.name}</div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          {ws.type === "team" ? <Building2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
          {ws.type === "personal" ? t("شخصي", "Personal") : t("فريق", "Team")}
        </div>
      </div>
      {isActive && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
    </button>
  )
}
