"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Building2, Mail, Phone, Users, Clock, ChevronDown,
  RefreshCw, StickyNote, Loader2, Trash2, CheckCircle2,
} from "lucide-react"

const STATUSES = [
  { value: "",              label: "All",            color: "bg-white/[0.08] text-slate-400" },
  { value: "new",           label: "New",            color: "bg-blue-950/40 text-blue-400" },
  { value: "contacted",     label: "Contacted",      color: "bg-yellow-950/40 text-yellow-400" },
  { value: "qualified",     label: "Qualified",      color: "bg-orange-950/40 text-orange-400" },
  { value: "demo_scheduled",label: "Demo Scheduled", color: "bg-amber-950/40 text-amber-400" },
  { value: "closed_won",    label: "Won ✓",          color: "bg-green-950/40 text-green-400" },
  { value: "closed_lost",   label: "Lost",           color: "bg-red-950/40 text-red-400" },
]

function statusColor(status: string) {
  return STATUSES.find(s => s.value === status)?.color ?? "bg-white/[0.08] text-slate-400"
}

interface Lead {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  team_size: string | null
  use_case: string | null
  message: string | null
  status: string
  notes: string | null
  source: string
  created_at: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads]     = useState<Lead[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage]       = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving]   = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/leads?${params}`)
      const data = await res.json()
      setLeads(data.leads ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    setSaving(id)
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setSaving(null)
    load()
  }

  async function saveNotes(id: string) {
    setSaving(id)
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes: editNotes[id] }),
    })
    setSaving(null)
    load()
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return
    await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" })
    load()
  }

  const PAGE_SIZE = 25

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            Enterprise Leads
          </h1>
          <p className="text-slate-500 text-sm mt-1">{total} total leads in pipeline</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.10] text-sm text-slate-400 hover:bg-white/[0.06] transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STATUSES.filter(s => s.value).map(s => {
          const count = leads.filter(l => l.status === s.value).length
          return (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(statusFilter === s.value ? "" : s.value); setPage(0) }}
              className={`p-3 rounded-xl text-center transition-all border-2 ${
                statusFilter === s.value ? "border-amber-600 bg-amber-600/5" : "border-transparent bg-white/[0.08]"
              }`}
            >
              <div className="text-lg font-bold text-slate-200">{count}</div>
              <div className={`text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block mt-1 ${s.color}`}>
                {s.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Leads table */}
      <div className="bg-white/[0.08] rounded-2xl border border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600 dark:text-amber-400" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No leads yet. Share your /enterprise page!
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {leads.map(lead => (
              <div key={lead.id}>
                {/* Lead row */}
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.06] transition-colors">
                  <button
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    className="flex-1 min-w-0 flex items-center gap-4 text-start"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 text-sm truncate">{lead.name}</div>
                      <div className="text-xs text-slate-500 truncate">{lead.email}</div>
                    </div>
                    <div className="hidden sm:block text-sm text-slate-400 min-w-0 flex-1">
                      <span className="font-medium">{lead.company || "—"}</span>
                      {lead.team_size && <span className="text-slate-400 ml-2">· {lead.team_size}</span>}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded === lead.id ? "rotate-180" : ""}`} />
                  </button>

                  {/* Status selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-amber-600/30 cursor-pointer ${statusColor(lead.status)}`}
                    >
                      {STATUSES.filter(s => s.value).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {saving === lead.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />}
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === lead.id && (
                  <div className="px-6 pb-5 bg-white/[0.06] border-t border-white/[0.08] space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                      {lead.phone && (
                        <a href={`https://wa.me/966${lead.phone}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#25d366] transition-colors">
                          <Phone className="w-4 h-4" />
                          +966{lead.phone}
                        </a>
                      )}
                      <a href={`mailto:${lead.email}`}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-600 dark:text-amber-400 transition-colors">
                        <Mail className="w-4 h-4" />
                        {lead.email}
                      </a>
                      {lead.team_size && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Users className="w-4 h-4" />
                          {lead.team_size}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {lead.use_case && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-300">Use case: </span>
                        <span className="text-slate-400">{lead.use_case}</span>
                      </div>
                    )}

                    {lead.message && (
                      <div className="text-sm bg-white/[0.08] rounded-xl p-3 text-slate-400 border border-white/[0.08]">
                        {lead.message}
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <StickyNote className="w-3.5 h-3.5" />
                        Internal Notes
                      </label>
                      <textarea
                        rows={2}
                        defaultValue={lead.notes ?? ""}
                        onChange={e => setEditNotes(n => ({ ...n, [lead.id]: e.target.value }))}
                        placeholder="Add notes about this lead..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.10] bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-amber-600/30 resize-none"
                      />
                      <button
                        onClick={() => saveNotes(lead.id)}
                        disabled={saving === lead.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {saving === lead.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />
                        }
                        Save Notes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-white/[0.10] hover:bg-white/[0.06] disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-white/[0.10] hover:bg-white/[0.06] disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
