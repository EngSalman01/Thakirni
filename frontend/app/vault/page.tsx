"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { Plus, Brain, Mic, Upload, FileText } from "lucide-react";
import { BulkActionBar } from "@/components/thakirni/bulk-action-bar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string | null;
}

// ── Dynamic imports ───────────────────────────────────────────────────────────

const AIChat = dynamic(
  () => import("@/components/thakirni/ai-chat").then((m) => ({ default: m.AIChat })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-[#f6f3f2] rounded-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Brain className="w-8 h-8 animate-pulse text-[#2552ca]" />
          <span className="text-sm font-label">Loading assistant...</span>
        </div>
      </div>
    ),
  }
);

const TeamDashboard = dynamic(
  () => import("@/components/dashboards/team-dashboard").then((m) => ({ default: m.TeamDashboard })),
  { ssr: false }
);

// ── Page shell ────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf9f8] overflow-x-hidden">
      <VaultSidebar />
      <main className="lg:ml-72 transition-all duration-300 min-w-0 max-w-full">
        {children}
      </main>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <PageShell>
      <div className="pt-28 px-8 pb-12 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </PageShell>
  );
}

// ── Mind Metrics card ─────────────────────────────────────────────────────────

function MindMetrics() {
  const { t } = useLanguage();
  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("مقاييس العقل", "Mind Metrics")}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: t("الاحتفاظ", "Retention"), value: "94%", color: "text-[#2552ca]" },
          { label: t("الوضوح", "Clarity"), value: "82%", color: "text-[#ad1d7f]" },
        ].map(({ label, value, color }) => (
          <div key={value} className="glass-card p-4 rounded-xl text-center border border-white/40">
            <p className="text-xs text-slate-500 mb-1 font-label">{label as string}</p>
            <p className={`text-xl font-headline font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
        <div className="glass-card p-4 rounded-xl col-span-2 flex items-center justify-between border border-white/40">
          <span className="text-xs font-bold text-slate-700 font-label">
            {t("الحمل الإدراكي", "Cognitive Load")}
          </span>
          <div className="flex gap-1">
            <span className="w-4 h-1.5 bg-[#2552ca] rounded-full" />
            <span className="w-4 h-1.5 bg-[#2552ca] rounded-full" />
            <span className="w-4 h-1.5 bg-[#2552ca]/20 rounded-full" />
            <span className="w-4 h-1.5 bg-[#2552ca]/20 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Recent captures ───────────────────────────────────────────────────────────

function RecentCaptures() {
  const { t, isArabic } = useLanguage();
  const [memories, setMemories] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchMemories = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("memories")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setMemories(data ?? []);
    } catch (err) {
      console.error("[RecentCaptures]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/memories/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      setSelectedIds(new Set());
      await fetchMemories();
    } catch (err) {
      console.error("[RecentCaptures] bulk delete error:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (isArabic) {
      if (mins < 1) return "للتو";
      if (mins < 60) return `منذ ${mins} دقيقة`;
      if (hours < 24) return `منذ ${hours} ساعة`;
      return `منذ ${days} يوم`;
    } else {
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  }

  const iconColors = [
    "bg-[#2552ca]/10 text-[#2552ca] group-hover:bg-[#2552ca] group-hover:text-white",
    "bg-[#ad1d7f]/10 text-[#ad1d7f] group-hover:bg-[#ad1d7f] group-hover:text-white",
    "bg-[#385b9b]/10 text-[#385b9b] group-hover:bg-[#385b9b] group-hover:text-white",
  ];

  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("التقاطات الأخيرة", "Recent Captures")}
      </h2>
      <div className="glass-card p-4 sm:p-6 rounded-2xl shadow-ambient space-y-3 border border-white/40 w-full">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{t("لا توجد ذكريات بعد — ابدأ محادثة مع الذكاء الاصطناعي", "No memories yet — start a conversation with the AI")}</p>
          </div>
        ) : (
          memories.map(({ id, title, created_at }, i) => (
            <div
              key={id}
              className={`relative flex items-center gap-4 p-3 rounded-xl group transition-all cursor-pointer ${
                selectedIds.has(id)
                  ? "bg-[#2552ca]/10 ring-1 ring-[#2552ca]/30"
                  : "bg-[#f6f3f2] hover:bg-white"
              }`}
            >
              {/* Bulk-select checkbox */}
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(id)}
                  onChange={() => toggleSelect(id)}
                  className="w-4 h-4 rounded accent-[#2552ca] cursor-pointer"
                  aria-label={t("تحديد", "Select")}
                />
              </div>

              <Link href="/vault/new-memory" className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2 ${iconColors[i % 3]} rounded-full transition-colors shrink-0`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-bold truncate font-label">{title}</p>
                  <p className="text-xs text-slate-500">{relativeTime(created_at)}</p>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
        deleting={bulkDeleting}
      />
    </section>
  );
}

// ── AI Insight card ───────────────────────────────────────────────────────────

interface InsightData {
  ar: string;
  en: string;
  type: "overdue" | "memory" | "habit" | "plan" | "empty";
}

const INSIGHT_BUTTON: Record<
  InsightData["type"],
  { ar: string; en: string; href: string }
> = {
  overdue: { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  plan:    { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  memory:  { ar: "عرض الذكريات", en: "View Memories", href: "/vault/new-memory" },
  habit:   { ar: "عرض العادات", en: "View Habits", href: "/vault/habits" },
  empty:   { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
};

function AIInsight() {
  const { t } = useLanguage();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/vault/insights");
        if (!res.ok) throw new Error("Failed to fetch insights");
        const json = (await res.json()) as InsightData;
        setData(json);
      } catch (err) {
        console.error("[AIInsight]", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const btn = data ? INSIGHT_BUTTON[data.type] : INSIGHT_BUTTON.empty;
  const insightText = data
    ? t(data.ar, data.en)
    : t("ابدأ يومك بتسجيل ذكرى أو إنشاء خطة", "Start your day by capturing a memory or creating a plan");

  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("رؤى الذكاء الاصطناعي", "AI Insights")}
      </h2>
      <div className="bg-[#2552ca] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <span className="text-xl mb-4 block">✦</span>
        {loading ? (
          <div className="space-y-3 mb-4">
            <Skeleton className="h-4 w-full bg-white/20 rounded" />
            <Skeleton className="h-4 w-3/4 bg-white/20 rounded" />
          </div>
        ) : (
          <p className="text-sm font-medium leading-relaxed mb-4">{insightText}</p>
        )}
        <Link href={btn.href}>
          <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all">
            {t(btn.ar, btn.en)}
          </button>
        </Link>
      </div>
    </section>
  );
}

// ── Focus Stream ──────────────────────────────────────────────────────────────

function FocusStream() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Array<{ id: string; title: string; plan_time?: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("plans")
          .select("id, title, plan_time")
          .eq("user_id", user.id)
          .eq("plan_date", today)
          .eq("status", "pending")
          .order("plan_time", { ascending: true })
          .limit(3);
        setPlans(data ?? []);
      } catch (err) {
        console.error("[FocusStream]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("تيار التركيز", "Focus Stream")}
      </h2>
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : plans.length === 0 ? (
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-white/40 text-center text-slate-400 text-sm w-full">
            {t("لا توجد خطط اليوم — استمتع بيومك 😊", "No plans today — enjoy your day 😊")}
          </div>
        ) : (
          plans.map((plan, i) => (
            <div
              key={plan.id}
              className={i === 0 ? "glass-card p-5 rounded-2xl border border-white/40" : "p-5 bg-[#f6f3f2] rounded-2xl opacity-60"}
            >
              {i === 0 && (
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-[#ffd8e9] text-[#3c0029] text-[10px] font-bold rounded-full uppercase tracking-widest font-label">
                    {t("التالي", "Up Next")}
                  </span>
                  {plan.plan_time && <span className="text-xs text-slate-400">{plan.plan_time}</span>}
                </div>
              )}
              <h4 className="font-headline font-bold text-sm">{plan.title}</h4>
              {i > 0 && plan.plan_time && (
                <p className="text-xs text-slate-500 mt-1">{plan.plan_time}</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ── Central Aura visualization ────────────────────────────────────────────────

const AURA_NODE_POSITIONS = [
  "top-10 left-10",
  "top-1/4 right-0",
  "bottom-10 left-1/4",
  "bottom-1/4 right-4",
  "top-1/2 left-2 -translate-y-1/2",
];
const AURA_NODE_DOTS = ["bg-[#ad1d7f]", "bg-[#2552ca]", "bg-[#385b9b]", "bg-green-500", "bg-amber-500"];

function AuraVisualization() {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("memories")
          .select("id, title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setMemories(data ?? []);
      } catch (err) {
        console.error("[AuraVisualization]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden max-h-[200px] sm:max-h-[300px] lg:max-h-[340px] min-h-0 sm:min-h-[240px] lg:min-h-[240px]">
      {/* Aura sphere */}
      <div className="relative w-full max-w-[160px] sm:max-w-[280px] lg:max-w-[340px] aspect-square flex items-center justify-center aura-gradient rounded-full mb-2 sm:mb-4 lg:mb-4 overflow-hidden">
        {/* Core */}
        <div className="relative z-10 w-20 h-20 sm:w-36 sm:h-36 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] shadow-[0_0_80px_rgba(37,82,202,0.4)] flex items-center justify-center">
          <span className="text-white text-xl sm:text-3xl lg:text-3xl font-headline font-bold">ذ</span>
        </div>

        {/* Orbiting nodes from real memories — hidden on mobile to prevent overflow */}
        {memories.map(({ id, title }, i) => (
          <div
            key={id}
            className={`hidden sm:block absolute ${AURA_NODE_POSITIONS[i]} p-3 glass-card rounded-xl shadow-lg border border-white/40 hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${AURA_NODE_DOTS[i]}`} />
              <span className="text-xs font-bold font-label whitespace-nowrap">
                {title.length > 25 ? title.slice(0, 25) + "…" : title}
              </span>
            </div>
          </div>
        ))}

        {/* SVG connection lines — hidden on mobile */}
        <svg className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 440 440">
          <path d="M88 88 Q 220 220 280 160" fill="none" stroke="rgba(37,82,202,0.2)" strokeWidth="2" />
          <path d="M352 176 Q 220 220 158 368" fill="none" stroke="rgba(253,101,194,0.2)" strokeWidth="2" />
        </svg>
      </div>

      {/* Label below */}
      <div className="text-center">
        {!loading && memories.length === 0 ? (
          <p className="text-slate-400 text-sm max-w-xs">
            {t("ستظهر خريطة معرفتك هنا عند إضافة ذكريات", "Your knowledge graph will appear here as you add memories")}
          </p>
        ) : (
          <p className="text-slate-500 font-medium">
            {t(`${memories.length} ذكريات في خريطتك`, `${memories.length} memories in your map`)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Quick actions header ───────────────────────────────────────────────────────

function VaultHeader() {
  const { t } = useLanguage();
  const router = useRouter();

  const actions = [
    { icon: Plus, href: "/vault/new-memory", ar: "ذكرى جديدة", en: "New Memory" },
    { icon: Mic, href: "/vault/voice-note", ar: "ملاحظة صوتية", en: "Voice Note" },
    { icon: Upload, href: "/vault/upload", ar: "رفع ملف", en: "Upload" },
  ];

  return (
    <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-slate-900 font-headline">
          {t("الخريطة العصبية", "Neural Map")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex gap-2">
          {actions.map(({ icon: Icon, href, ar, en }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f6f3f2] hover:bg-[#eae8e7] text-slate-700 text-sm font-semibold font-label transition-all"
            >
              <Icon className="w-4 h-4" />
              {t(ar, en)}
            </button>
          ))}
        </div>
        <MobileMenuButton />
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </header>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function VaultPageInner() {
  const { subscriptionType, loading: subscriptionLoading } = useSubscription();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const { t } = useLanguage();

  const fetchTeamData = useCallback(async () => {
    setIsLoadingTeam(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use maybeSingle so no error is thrown when user has no team yet
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership) return;

      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("id", membership.team_id)
        .maybeSingle();
      if (!team) return;
      setCurrentTeam(team as Team);

      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("team_id", team.id);

      setTeamMembers(
        (members ?? []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name ?? t("عضو الفريق", "Team Member"),
          avatar: m.profiles?.avatar_url ?? null,
        }))
      );
    } catch (err) {
      console.error("[VaultPage] fetchTeamData error:", err);
    } finally {
      setIsLoadingTeam(false);
    }
  }, [t]);

  useEffect(() => {
    if (subscriptionType === "team" || subscriptionType === "company") {
      fetchTeamData();
    }
  }, [subscriptionType, fetchTeamData]);

  const isTeamSubscription =
    subscriptionType === "team" || subscriptionType === "company";

  if (subscriptionLoading || (isTeamSubscription && isLoadingTeam)) {
    return <VaultSkeleton />;
  }

  // Team dashboard — only if team data loaded successfully
  // If user has teams subscription but no team yet, fall through to individual dashboard
  if (isTeamSubscription && currentTeam) {
    return (
      <PageShell>
        <VaultHeader />
        <div className="pt-24 lg:pt-28 px-6 md:px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TeamDashboard
              team={currentTeam}
              teamMembers={teamMembers.map((m) => ({ ...m, avatar: m.avatar ?? undefined }))}
            />
          </motion.div>
        </div>
      </PageShell>
    );
  }

  // Individual dashboard (also shown when user has teams tier but no team created yet)
  return (
    <PageShell>
      <VaultHeader />

      {/* Page background blobs — clipped by overflow-x-hidden on PageShell */}
      <div className="absolute top-40 right-0 w-64 h-64 lg:w-96 lg:h-96 bg-[#2552ca]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 lg:left-72 w-64 h-64 lg:w-80 lg:h-80 bg-[#ad1d7f]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="pt-16 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-8 min-h-screen relative">
        <div className="w-full space-y-3 lg:space-y-4">

          {/* ── Orb: full-width row, centered ── */}
          <motion.div
            id="neural-map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="w-full"
          >
            <AuraVisualization />
          </motion.div>

          {/* ── Cards: stacked on mobile, side by side on lg ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full min-w-0 space-y-6"
            >
              <RecentCaptures />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="w-full min-w-0 space-y-6"
            >
              <FocusStream />
              <AIInsight />
            </motion.div>
          </div>

        </div>

        {/* AI Chat section */}
        <div id="ai-chat" className="w-full mt-4 lg:mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-headline font-extrabold text-slate-800">
              {t("المساعد الذكي", "AI Assistant")}
            </h2>
            <p className="text-slate-500 mt-1">
              {t("تحدث مع ذكرياتك واحصل على رؤى.", "Chat with your memories and get insights.")}
            </p>
          </div>
          <AIChat />
        </div>
      </div>

      {/* FAB */}
      <Link href="/vault/new-memory">
        <button className="fixed bottom-8 right-8 w-16 h-16 rounded-full power-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform" />
        </button>
      </Link>
    </PageShell>
  );
}

export default function VaultPage() {
  return (
    <ErrorBoundary>
      <VaultPageInner />
    </ErrorBoundary>
  );
}
