"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RefreshCw, Trash2, RotateCcw, Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

interface Job {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_retries: number;
  error: string | null;
  run_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-950/40 text-yellow-400",
  running: "bg-blue-950/40 text-blue-400",
  done:    "bg-green-950/40 text-green-400",
  failed:  "bg-red-950/40 text-red-400",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  running: Zap,
  done:    CheckCircle2,
  failed:  XCircle,
};

function formatDate(str: string | null) {
  if (!str) return "—";
  return new Date(str).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs?status=${status}&page=${page}`);
      if (res.ok) {
        const d = await res.json();
        setJobs(d.jobs ?? []);
        setTotal(d.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function retryJob(id: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { toast.success("Job queued for retry"); fetchJobs(); }
      else toast.error("Failed to retry job");
    } finally {
      setActionId(null);
    }
  }

  async function deleteJob(id: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { toast.success("Job deleted"); fetchJobs(); }
      else toast.error("Failed to delete job");
    } finally {
      setActionId(null);
    }
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-white">Job Queue</h1>
          <p className="text-sm text-slate-500 font-label mt-1">{total.toLocaleString()} jobs</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="running">Running</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white/[0.04] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-label">No {status} jobs</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Type", "Status", "Attempts", "Error", "Run At", "Created", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const Icon = STATUS_ICONS[job.status] ?? Clock;
                  return (
                    <tr key={job.id} className="border-b border-white/[0.08] last:border-0 hover:bg-white/[0.06] transition-colors">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-white/[0.08] text-slate-300 px-2 py-1 rounded font-mono">{job.type}</code>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-label font-semibold ${STATUS_COLORS[job.status] ?? "bg-white/[0.08] text-slate-300"}`}>
                          <Icon className="w-3 h-3" />
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-label">
                        {job.attempts}/{job.max_retries}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {job.error ? (
                          <span className="text-red-400 text-xs truncate block" title={job.error}>
                            {job.error.slice(0, 80)}{job.error.length > 80 ? "…" : ""}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{formatDate(job.run_at)}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{formatDate(job.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {(job.status === "failed" || job.status === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => retryJob(job.id)}
                              disabled={actionId === job.id}
                            >
                              {actionId === job.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <RotateCcw className="w-3 h-3" />}
                              Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 text-red-400 hover:text-red-400"
                            onClick={() => deleteJob(job.id)}
                            disabled={actionId === job.id}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm font-label text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
