"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users, Zap, TrendingUp, MessageCircle,
  Brain, Target, DollarSign, BarChart2, Activity,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    activatedUsers: number
    activationRate: number
  }
  retention: {
    day1: { cohortSize: number; active: number; rate: number | null }
    day7: { cohortSize: number; active: number; rate: number | null }
  }
  featureUsage: {
    aiChats: number
    memoriesCreated: number
    plansCreated: number
    voiceNotes: number
    documentsUploaded: number
    calendarConnects: number
  }
  monetization: {
    upgrades: number
  }
  intelligence: {
    memoryItemsStored: number
    predictiveNudgesSent: number
  }
  topEvents: Array<{ name: string; count: number }>
  generatedAt: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "#2552ca",
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string | number
  subtitle?: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 ${highlight ? "bg-[#2552ca]/5 border border-[#2552ca]/20" : "bg-[#f6f3f2]"}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-headline">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-slate-600 font-label mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function RetentionBar({
  label,
  rate,
  cohortSize,
}: {
  label: string
  rate: number | null
  cohortSize: number
}) {
  const pct = rate ?? 0
  const color = pct >= 40 ? "#16a34a" : pct >= 20 ? "#f59e0b" : "#ef4444"
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-label text-slate-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-[#e4e2e1] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-label font-semibold text-slate-700 w-12 text-right">
        {rate !== null ? `${rate}%` : "—"}
      </span>
      <span className="text-xs text-slate-400 w-20 text-right">({cohortSize} users)</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featureRows = data
    ? [
        { label: "AI Chats",          value: data.featureUsage.aiChats,          icon: "💬" },
        { label: "Plans Created",     value: data.featureUsage.plansCreated,     icon: "📋" },
        { label: "Memories Stored",   value: data.featureUsage.memoriesCreated,  icon: "🧠" },
        { label: "Voice Notes",       value: data.featureUsage.voiceNotes,       icon: "🎙️" },
        { label: "Docs Uploaded",     value: data.featureUsage.documentsUploaded, icon: "📄" },
        { label: "Calendar Connects", value: data.featureUsage.calendarConnects, icon: "📅" },
      ]
    : []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-headline font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 font-label mt-1">Last 30 days · Activation, retention, revenue</p>
      </div>

      {/* Overview stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}        label="Total Users"       value={data?.overview.totalUsers ?? 0} />
          <StatCard icon={Zap}          label="Activated Users"   value={data?.overview.activatedUsers ?? 0}
            subtitle={`${data?.overview.activationRate ?? 0}% activation rate`} color="#16a34a" highlight />
          <StatCard icon={DollarSign}   label="Upgrades (30d)"   value={data?.monetization.upgrades ?? 0} color="#f59e0b" />
          <StatCard icon={Brain}        label="Memory Items"      value={data?.intelligence.memoryItemsStored ?? 0} color="#8b5cf6" />
          <StatCard icon={Target}       label="Predictive Nudges" value={data?.intelligence.predictiveNudgesSent ?? 0} color="#ec4899" />
          <StatCard icon={TrendingUp}   label="AI Chats (30d)"   value={data?.featureUsage.aiChats ?? 0} color="#2552ca" />
        </div>
      )}

      {/* Retention */}
      <div className="bg-[#f6f3f2] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-[#2552ca]" />
          <h2 className="text-base font-headline font-semibold text-slate-900">Retention</h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 rounded-lg" />
            <Skeleton className="h-6 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <RetentionBar
              label="Day 1"
              rate={data?.retention.day1.rate ?? null}
              cohortSize={data?.retention.day1.cohortSize ?? 0}
            />
            <RetentionBar
              label="Day 7"
              rate={data?.retention.day7.rate ?? null}
              cohortSize={data?.retention.day7.cohortSize ?? 0}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature usage */}
        <div className="bg-[#f6f3f2] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-[#2552ca]" />
            <h2 className="text-base font-headline font-semibold text-slate-900">Feature Usage (30d)</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {featureRows.map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[#e4e2e1]/60 last:border-0">
                  <span className="text-sm font-label text-slate-600">{row.icon} {row.label}</span>
                  <span className="text-sm font-label font-semibold text-slate-800">{row.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top events */}
        <div className="bg-[#f6f3f2] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageCircle className="w-5 h-5 text-[#2552ca]" />
            <h2 className="text-base font-headline font-semibold text-slate-900">Top Events (30d)</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-7 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(data?.topEvents ?? []).map((e, idx) => (
                <div key={e.name} className="flex items-center justify-between py-1 border-b border-[#e4e2e1]/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4 font-label">{idx + 1}</span>
                    <span className="text-sm font-label text-slate-600 font-mono text-xs">{e.name}</span>
                  </div>
                  <span className="text-sm font-label font-semibold text-slate-800">{e.count.toLocaleString()}</span>
                </div>
              ))}
              {(data?.topEvents ?? []).length === 0 && (
                <p className="text-sm text-slate-400 font-label text-center py-4">No events yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {data && (
        <p className="text-xs text-slate-400 font-label text-right">
          Generated at {new Date(data.generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })} (Riyadh)
        </p>
      )}
    </div>
  )
}
