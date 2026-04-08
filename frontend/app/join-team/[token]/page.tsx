"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface InviteInfo {
  teamName: string
  role: string
  status: string
  expiresAt: string
  email: string | null
}

const roleLabels: Record<string, { ar: string; en: string }> = {
  admin: { ar: "مدير", en: "Admin" },
  member: { ar: "عضو", en: "Member" },
  viewer: { ar: "مراقب", en: "Viewer" },
}

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      const res = await fetch(`/api/teams/invite-info?token=${token}`)
      if (res.ok) {
        setInvite(await res.json())
      } else {
        const d = await res.json()
        setError(d.error ?? "Invitation not found")
      }
      setLoading(false)
    }
    init()
  }, [token])

  async function handleAccept() {
    if (!isLoggedIn) {
      router.push(`/auth?redirect=/join-team/${token}`)
      return
    }
    setJoining(true)
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to join")
      setJoined(true)
      setTimeout(() => router.push("/vault"), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join team")
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="ltr">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-headline font-bold text-2xl">
            <span>Thakirni</span>
            <span className="text-slate-400 font-normal text-xl">ذكرني</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {loading ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-spin" />
              <p className="text-slate-500 text-sm">Loading invitation...</p>
            </div>
          ) : joined ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-headline font-bold text-slate-900">Joined successfully!</h2>
              <p className="text-slate-500 text-sm">Redirecting to your vault...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-headline font-bold text-slate-900">Invalid invitation</h2>
              <p className="text-slate-500 text-sm">{error}</p>
              <Button onClick={() => router.push("/")} variant="outline" className="mt-2">
                Go to Home
              </Button>
            </div>
          ) : invite ? (
            <div className="space-y-6">
              {/* Team info */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold text-slate-900">
                    You&apos;re invited to join
                  </h2>
                  <p className="text-2xl font-headline font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {invite.teamName}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {roleLabels[invite.role]?.en ?? invite.role}
                  </span>
                </div>
                {invite.email && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Invited email</span>
                    <span className="font-mono text-slate-700 text-xs">{invite.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Expires
                  </span>
                  <span className="text-slate-700">
                    {new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Status badge if not pending */}
              {invite.status !== "pending" && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">
                    This invitation is <strong>{invite.status}</strong>.
                  </p>
                </div>
              )}

              {/* Actions */}
              {invite.status === "pending" && (
                <div className="space-y-3">
                  <Button
                    onClick={handleAccept}
                    disabled={joining}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-6 font-headline font-bold text-base"
                  >
                    {joining ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isLoggedIn ? (
                      "Accept Invitation"
                    ) : (
                      "Sign in to Accept"
                    )}
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    variant="ghost"
                    className="w-full text-slate-500"
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
