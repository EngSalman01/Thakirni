"use client"

import { useEffect, useState } from "react"
import { Shield, Download, Trash2, AlertTriangle, Users, CheckCircle2, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AuditLogEntry {
  id: string
  user_id: string | null
  event_type: string
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface ComplianceData {
  consent: {
    totalUsers: number
    consentedCount: number
    withoutConsent: number
    coveragePct: number
  }
  recentAuditLogs: AuditLogEntry[]
  eventCountsLast30Days: Record<string, number>
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  data_export:      { label: "Data Export",        color: "bg-blue-100 text-blue-700" },
  account_deletion: { label: "Account Deletion",   color: "bg-red-100 text-red-700" },
  consent_given:    { label: "Consent Given",       color: "bg-green-100 text-green-700" },
  login:            { label: "Login",               color: "bg-slate-100 text-slate-600" },
  logout:           { label: "Logout",              color: "bg-slate-100 text-slate-600" },
  password_change:  { label: "Password Change",     color: "bg-amber-100 text-amber-700" },
  email_change:     { label: "Email Change",        color: "bg-amber-100 text-amber-700" },
  billing_action:   { label: "Billing Action",      color: "bg-orange-100 text-orange-700" },
  admin_action:     { label: "Admin Action",        color: "bg-amber-100 text-amber-700" },
  security_incident:{ label: "Security Incident",   color: "bg-red-100 text-red-700" },
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-slate-200",
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) {
  return (
    <div className="bg-white/[0.04] rounded-2xl p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-headline font-bold text-white">{value}</p>
        <p className="text-sm font-label text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function CompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/compliance")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ComplianceData>
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-label font-semibold">Failed to load compliance data</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    )
  }

  const { consent, recentAuditLogs, eventCountsLast30Days } = data

  const dataExports   = recentAuditLogs.filter((l) => l.event_type === "data_export").slice(0, 5)
  const deletions     = recentAuditLogs.filter((l) => l.event_type === "account_deletion").slice(0, 5)
  const incidents     = recentAuditLogs.filter((l) => l.event_type === "security_incident").slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold text-white">Compliance Dashboard</h1>
          <p className="text-sm font-label text-slate-500">PDPL · ZATCA · Audit Logs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={consent.totalUsers} icon={Users} />
        <StatCard
          label="Consented Users"
          value={consent.consentedCount}
          icon={CheckCircle2}
          color="text-green-600"
        />
        <StatCard
          label="Without Consent"
          value={consent.withoutConsent}
          icon={AlertTriangle}
          color="text-amber-500"
        />
        <StatCard
          label="Data Exports (recent)"
          value={eventCountsLast30Days.data_export ?? 0}
          icon={Download}
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Consent coverage */}
      <div className="bg-white/[0.04] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline font-bold text-white">Consent Coverage</h2>
          <span className="text-2xl font-headline font-extrabold text-amber-600 dark:text-amber-400">
            {consent.coveragePct}%
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-4 overflow-hidden border border-[#e4e2e1]">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-700"
            style={{ width: `${consent.coveragePct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2 font-label">
          {consent.consentedCount} of {consent.totalUsers} users have given PDPL consent (v1.0)
        </p>
      </div>

      {/* Event counts last 30 days */}
      <div className="bg-white/[0.04] rounded-2xl p-6">
        <h2 className="font-headline font-bold text-slate-900 mb-4">Events — Last 30 Days</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(eventCountsLast30Days).map(([type, count]) => {
            const meta = EVENT_LABELS[type] ?? { label: type, color: "bg-slate-100 text-slate-600" }
            return (
              <div key={type} className="bg-white rounded-xl p-4 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold font-label px-2 py-0.5 rounded-full ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-lg font-headline font-bold text-white">{count}</span>
              </div>
            )
          })}
          {Object.keys(eventCountsLast30Days).length === 0 && (
            <p className="text-sm text-slate-400 col-span-4">No audit events in the last 30 days.</p>
          )}
        </div>
      </div>

      {/* Quick panels: exports, deletions, incidents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Data Exports */}
        <div className="bg-white/[0.04] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-headline font-bold text-slate-900 text-sm">Recent Data Exports</h2>
          </div>
          {dataExports.length === 0 ? (
            <p className="text-sm text-slate-400">None recently.</p>
          ) : (
            <ul className="space-y-2">
              {dataExports.map((log) => (
                <li key={log.id} className="bg-white rounded-xl px-3 py-2 text-xs">
                  <p className="font-label font-semibold text-slate-700 truncate">
                    {log.user_id?.slice(0, 8) ?? "—"}
                  </p>
                  <p className="text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Account Deletions */}
        <div className="bg-white/[0.04] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h2 className="font-headline font-bold text-slate-900 text-sm">Recent Deletions</h2>
          </div>
          {deletions.length === 0 ? (
            <p className="text-sm text-slate-400">None recently.</p>
          ) : (
            <ul className="space-y-2">
              {deletions.map((log) => (
                <li key={log.id} className="bg-white rounded-xl px-3 py-2 text-xs">
                  <p className="font-label font-semibold text-slate-700 truncate">
                    {(log.metadata as { email?: string }).email ?? log.user_id?.slice(0, 8) ?? "—"}
                  </p>
                  <p className="text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Security Incidents */}
        <div className="bg-white/[0.04] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-headline font-bold text-slate-900 text-sm">Security Incidents</h2>
          </div>
          {incidents.length === 0 ? (
            <p className="text-sm text-slate-400">No incidents recorded.</p>
          ) : (
            <ul className="space-y-2">
              {incidents.map((log) => (
                <li key={log.id} className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs">
                  <p className="font-label font-semibold text-red-700 truncate">
                    {log.description ?? log.event_type}
                  </p>
                  <p className="text-red-400">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Full recent audit log table */}
      <div className="bg-white/[0.04] rounded-2xl p-6">
        <h2 className="font-headline font-bold text-slate-900 mb-4">Recent Audit Log (last 50)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-label font-semibold text-slate-500 border-b border-[#e4e2e1]">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Event</th>
                <th className="pb-3 pr-4">User ID</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditLogs.map((log) => {
                const meta = EVENT_LABELS[log.event_type] ?? {
                  label: log.event_type,
                  color: "bg-slate-100 text-slate-600",
                }
                return (
                  <tr key={log.id} className="border-b border-[#e4e2e1] last:border-0">
                    <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap font-label">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-label ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500 font-mono">
                      {log.user_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="py-3 text-xs text-slate-600 truncate max-w-xs">
                      {log.description ?? "—"}
                    </td>
                  </tr>
                )
              })}
              {recentAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                    No audit log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
