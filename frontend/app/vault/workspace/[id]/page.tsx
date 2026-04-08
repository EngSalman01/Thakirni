"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import {
  Users, Crown, Shield, User, Trash2, Loader2,
  Building2, Settings, UserPlus,
} from "lucide-react"
import { toast } from "sonner"

interface Member {
  id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface WorkspaceData {
  id: string
  name: string
  type: "personal" | "team"
  owner_id: string
  created_at: string
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
}

function roleColor(role: string) {
  if (role === "owner")  return "bg-amber-100 text-amber-700"
  if (role === "admin")  return "bg-orange-100 text-orange-700"
  return "bg-slate-100 text-slate-600"
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, isArabic } = useLanguage()
  const [workspace, setWorkspace]   = useState<WorkspaceData | null>(null)
  const [members, setMembers]       = useState<Member[]>([])
  const [myRole, setMyRole]         = useState<string>("")
  const [loading, setLoading]       = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole]   = useState("member")
  const [inviting, setInviting]       = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setWorkspace(data.workspace)
      setMembers(data.members ?? [])
      setMyRole(data.my_role ?? "member")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleRemove(userId: string) {
    if (!confirm(t("هل أنت متأكد من إزالة هذا العضو؟", "Are you sure you want to remove this member?"))) return
    const res = await fetch(`/api/workspaces/${id}/members?user_id=${userId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(t("تم إزالة العضو", "Member removed"))
      load()
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const res = await fetch(`/api/workspaces/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(t("تمت الدعوة بنجاح", "Invitation sent"))
      setInviteEmail("")
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("حدث خطأ", "Something went wrong"))
    } finally {
      setInviting(false)
    }
  }

  const canManage = ["owner", "admin"].includes(myRole)

  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden" dir={isArabic ? "rtl" : "ltr"}>
      <main className="pt-20 px-4 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto space-y-6">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600 dark:text-amber-400" />
            </div>
          ) : !workspace ? (
            <div className="text-center py-20 text-slate-400">
              {t("لم يتم العثور على مساحة العمل", "Workspace not found")}
            </div>
          ) : (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl power-gradient flex items-center justify-center text-white font-bold text-lg">
                  {workspace.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                    {workspace.type === "team"
                      ? <><Building2 className="w-3.5 h-3.5" /> {t("مساحة فريق", "Team Workspace")}</>
                      : <><User className="w-3.5 h-3.5" /> {t("مساحة شخصية", "Personal Workspace")}</>
                    }
                    <span>·</span>
                    <span>{members.length} {t("أعضاء", "members")}</span>
                  </div>
                </div>
              </motion.div>

              {/* Members */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-bold text-slate-800">
                    {t("الأعضاء", "Members")}
                  </h2>
                </div>

                <div className="space-y-2">
                  {members.map(member => {
                    const RoleIcon = ROLE_ICONS[member.role] ?? User
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 bg-white rounded-xl px-4 py-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0 overflow-hidden">
                          {member.profile?.avatar_url
                            ? <img src={member.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                            : (member.profile?.full_name?.[0] ?? "U").toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 text-sm truncate">
                            {member.profile?.full_name ?? t("مستخدم", "User")}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor(member.role)}`}>
                          <RoleIcon className="w-3 h-3" />
                          {member.role === "owner"
                            ? t("المالك", "Owner")
                            : member.role === "admin"
                              ? t("مشرف", "Admin")
                              : t("عضو", "Member")
                          }
                        </span>
                        {canManage && member.role !== "owner" && (
                          <button
                            onClick={() => handleRemove(member.profile.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Invite member (owner/admin only + team workspace) */}
              {canManage && workspace.type === "team" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="font-bold text-slate-800">
                      {t("دعوة عضو", "Invite Member")}
                    </h2>
                  </div>
                  <form onSubmit={handleInvite} className="flex gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder={t("البريد الإلكتروني", "Email address")}
                      required
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                    />
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none"
                    >
                      <option value="member">{t("عضو", "Member")}</option>
                      <option value="admin">{t("مشرف", "Admin")}</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-4 py-2.5 rounded-xl power-gradient text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {inviting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <UserPlus className="w-4 h-4" />
                      }
                      {t("دعوة", "Invite")}
                    </button>
                  </form>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
