"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, Zap, Activity, Hash } from "lucide-react";

interface LogEntry {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  duration_ms: number | null;
  tokens_used: number | null;
  model: string | null;
  error: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  errors: number;
  errorRate: number;
  avgDuration: number;
  totalTokens: number;
  topEndpoints: { endpoint: string; count: number }[];
  slowestEndpoints: { endpoint: string; avgMs: number }[];
}

function StatCard({ icon: Icon, label, value, color = "#2552ca" }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 font-headline">{value}</p>
      <p className="text-xs text-slate-500 font-label">{label}</p>
    </div>
  );
}

function formatDate(str: string) {
  return new Date(str).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [endpoint, setEndpoint] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (endpoint) params.set("endpoint", endpoint);
      if (errorsOnly) params.set("errors", "true");
      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setStats(d.stats ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [page, endpoint, errorsOnly]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Request Logs</h1>
          <p className="text-sm text-slate-500 font-label mt-1">Last 24h analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Requests (24h)" value={stats.total.toLocaleString()} color="#2552ca" />
          <StatCard icon={AlertTriangle} label="Error Rate" value={`${stats.errorRate}%`} color={stats.errorRate > 5 ? "#ef4444" : "#16a34a"} />
          <StatCard icon={Zap} label="Avg Duration" value={`${stats.avgDuration}ms`} color="#f59e0b" />
          <StatCard icon={Hash} label="Total Tokens (24h)" value={stats.totalTokens.toLocaleString()} color="#ad1d7f" />
        </div>
      )}

      {/* Top / Slowest endpoints */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-5">
            <h3 className="text-sm font-label font-semibold text-slate-700 mb-3">Top Endpoints (24h)</h3>
            {stats.topEndpoints.map(e => (
              <div key={e.endpoint} className="flex items-center justify-between py-1.5 border-b border-[#e4e2e1]/50 last:border-0">
                <code className="text-xs text-slate-600 truncate max-w-[220px]">{e.endpoint}</code>
                <span className="text-xs font-semibold text-slate-700 ml-2 shrink-0">{e.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-5">
            <h3 className="text-sm font-label font-semibold text-slate-700 mb-3">Slowest Endpoints (24h)</h3>
            {stats.slowestEndpoints.map(e => (
              <div key={e.endpoint} className="flex items-center justify-between py-1.5 border-b border-[#e4e2e1]/50 last:border-0">
                <code className="text-xs text-slate-600 truncate max-w-[220px]">{e.endpoint}</code>
                <span className={`text-xs font-semibold ml-2 shrink-0 ${e.avgMs > 5000 ? "text-red-600" : e.avgMs > 2000 ? "text-yellow-600" : "text-green-600"}`}>{e.avgMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by endpoint..."
          value={endpoint}
          onChange={e => { setEndpoint(e.target.value); setPage(1); }}
          className="max-w-xs text-sm"
        />
        <Button
          variant={errorsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => { setErrorsOnly(v => !v); setPage(1); }}
          className="gap-2"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Errors only
        </Button>
      </div>

      {/* Log Table */}
      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-label">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e2e1]">
                  {["Time", "Method", "Endpoint", "Status", "Duration", "Tokens", "Model", "Error"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className={`border-b border-[#e4e2e1]/50 last:border-0 transition-colors ${log.error ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-white/50"}`}>
                    <td className="py-2.5 px-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs font-mono font-semibold text-slate-600">{log.method}</span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <code className="text-xs text-slate-700 truncate block">{log.endpoint}</code>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold ${
                        !log.status_code ? "text-slate-400"
                        : log.status_code < 300 ? "text-green-600"
                        : log.status_code < 500 ? "text-yellow-600"
                        : "text-red-600"
                      }`}>{log.status_code ?? "—"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                      {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">
                      {log.tokens_used != null ? log.tokens_used.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.model ? <code className="text-xs text-slate-500">{log.model.replace("gemini-", "")}</code> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 max-w-[180px]">
                      {log.error
                        ? <span className="text-red-600 text-xs truncate block" title={log.error}>{log.error.slice(0, 60)}{log.error.length > 60 ? "…" : ""}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm font-label text-slate-500">
          <span>Page {page} of {totalPages} · {total.toLocaleString()} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
