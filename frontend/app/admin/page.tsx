"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanBadge } from "./_components/plan-badge";
import {
  Users,
  UserCheck,
  Building2,
  UserMinus,
  CalendarPlus,
  TrendingUp,
  MessageCircle,
  DollarSign,
} from "lucide-react";

interface Stats {
  total: number;
  free: number;
  pro: number;
  teams: number;
  newToday: number;
  newThisWeek: number;
  whatsappActive: number;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
  plan_tier: string | null;
  created_at: string;
  avatar_url: string | null;
  phone_number: string | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "#2552ca",
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-[#f6f3f2] rounded-2xl p-6 flex flex-col gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-headline">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-slate-500 font-label mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function UserInitials({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ""}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#2552ca] flex items-center justify-center text-white text-xs font-bold">
      {initials}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users?sort=newest&limit=20"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) {
          const d = await usersRes.json();
          setUsers(d.users ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 font-label mt-1">{today}</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.total ?? 0} color="#2552ca" />
          <StatCard icon={UserCheck} label="Pro Users" value={stats?.pro ?? 0} color="#2552ca" />
          <StatCard icon={Building2} label="Teams Users" value={stats?.teams ?? 0} color="#ad1d7f" />
          <StatCard icon={UserMinus} label="Free Users" value={stats?.free ?? 0} color="#64748b" />
          <StatCard icon={CalendarPlus} label="New Today" value={stats?.newToday ?? 0} color="#16a34a" />
          <StatCard icon={TrendingUp} label="New This Week" value={stats?.newThisWeek ?? 0} color="#16a34a" />
          <StatCard icon={MessageCircle} label="WhatsApp Active" value={stats?.whatsappActive ?? 0} color="#16a34a" />
          <StatCard icon={DollarSign} label="Revenue" value="—" color="#f59e0b" />
        </div>
      )}

      {/* Recent Signups */}
      <div className="bg-[#f6f3f2] rounded-2xl p-6">
        <h2 className="text-lg font-headline font-semibold text-slate-900 mb-4">
          Recent Signups
        </h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e2e1]">
                  <th className="text-left py-2 px-3 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide">
                    Plan
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#e4e2e1]/50 last:border-0 hover:bg-white/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <UserInitials name={u.full_name} avatarUrl={u.avatar_url} />
                        <span className="font-label font-medium text-slate-800">
                          {u.full_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.email || "—"}</td>
                    <td className="py-3 px-3">
                      <PlanBadge plan={u.plan_tier ?? "free"} />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {formatRelativeTime(u.created_at)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-label">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
