"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { Plus, Upload, Sparkles, ArrowRight, Network } from "lucide-react";
import { BulkActionBar } from "@/components/thakirni/bulk-action-bar";

interface Team { id: string; name: string; [key: string]: unknown; }
interface TeamMember { id: string; name: string; avatar?: string | null; }

// ── Particles ─────────────────────────────────────────────────────────────────

function ParticleLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ps: HTMLDivElement[] = [];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 8 + 4;
      const dur = Math.random() * 20 + 10;
      const delay = Math.random() * -20;
      p.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(37,82,202,0.12);border-radius:50%;filter:blur(2px);--drift-x:${(Math.random()-0.5)*200}px;--drift-y:${(Math.random()-0.5)*200}px;animation:particle-drift ${dur}s linear ${delay}s infinite;pointer-events:none;`;
      el.appendChild(p);
      ps.push(p);
    }
    return () => ps.forEach((p) => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

const TeamDashboard = dynamic(
  () => import("@/components/dashboards/team-dashboard").then((m) => ({ default: m.TeamDashboard })),
  { ssr: false }
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />
      <main className="lg:ml-72 pt-40 pb-32 px-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-16 w-80 rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          {[0,1,2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </main>
    </div>
  );
}

// ── Memory Map Orb ────────────────────────────────────────────────────────────

function MemoryMapOrb() {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("memories").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
        setMemories(data ?? []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const memColors = ["from-[#2552ca] to-[#456ce4]","from-[#ad1d7f] to-[#fd65c2]","from-[#385b9b] to-[#2552ca]","from-emerald-500 to-teal-400","from-amber-500 to-orange-400"];

  return (
    <div className="relative bg-white rounded-2xl p-4 shadow-card hover-lift">
      <div className="rounded-xl w-full h-[420px] bg-gradient-to-br from-[#dce1ff] via-[#f0eded] to-[#ffd8e9] flex items-center justify-center relative overflow-hidden">
        <div className="relative w-56 h-56">
          <div className="absolute inset-0 rounded-full border-2 border-[#2552ca]/20 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-[#fd65c2]/20 animate-[spin_15s_linear_infinite_reverse]" />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-10 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] shadow-[0_0_60px_rgba(37,82,202,0.5)] flex items-center justify-center"
          >
            <span className="text-white text-3xl font-headline font-bold select-none">ذ</span>
          </motion.div>
          {[
            { pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-4", label: "AI", color: "text-[#2552ca]" },
            { pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-4", label: "⚡", color: "text-[#ad1d7f]" },
            { pos: "left-0 top-1/2 -translate-y-1/2 -translate-x-4", label: "📄", color: "text-slate-600" },
            { pos: "right-0 top-1/2 -translate-y-1/2 translate-x-4", label: "🎙️", color: "text-slate-600" },
          ].map(({ pos, label, color }) => (
            <motion.div key={label} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 }}
              className={`absolute ${pos} w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-base font-bold ${color}`}>
              {label}
            </motion.div>
          ))}
          {!loading && memories.slice(0,3).map(({ id, title }, i) => {
            const angle = (i / 3) * 2 * Math.PI - Math.PI / 2;
            const r = 44;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            return (
              <motion.div key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="absolute hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-white/60"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}>
                <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${memColors[i % memColors.length]} shrink-0`} />
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap max-w-[90px] truncate">{title}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
      {/* Floating notification */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="absolute -bottom-5 -left-5 max-w-xs">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border-l-4 border-[#ad1d7f]">
          <div className="w-9 h-9 rounded-full power-gradient flex items-center justify-center shrink-0">
            <span className="text-white text-base">🧠</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 font-label">{t("محفوظ!", "Saved!")}</p>
            <p className="text-xs text-slate-500">{t("ذكرياتك قابلة للبحث", "Your memories are searchable")}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Stats hook ────────────────────────────────────────────────────────────────

function useStats() {
  const [stats, setStats] = useState({ memories: 0, plans: 0, habits: 0, goals: 0 });
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().split("T")[0];
        const [m, p, h, g] = await Promise.all([
          supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("plans").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("plan_date", today),
          supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);
        setStats({ memories: m.count ?? 0, plans: p.count ?? 0, habits: h.count ?? 0, goals: g.count ?? 0 });
      } catch {}
    })();
  }, []);
  return stats;
}

// ── Recent Captures ───────────────────────────────────────────────────────────

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
      const { data } = await supabase.from("memories").select("id, title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setMemories(data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      await fetch("/api/memories/bulk-delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
      setSelectedIds(new Set());
      await fetchMemories();
    } catch (err) { console.error(err); }
    finally { setBulkDeleting(false); }
  };

  function relativeTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
    if (isArabic) {
      if (m < 1) return "للتو"; if (m < 60) return `${m}د`; if (h < 24) return `${h}س`; return `${dy}ي`;
    }
    if (m < 1) return "just now"; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`; return `${dy}d`;
  }

  const dotColors = ["bg-[#2552ca]","bg-[#ad1d7f]","bg-[#385b9b]","bg-emerald-500","bg-amber-500"];

  return (
    <div className="h-full flex flex-col">
      <span className="text-4xl text-[#2552ca] mb-6 block">🧠</span>
      <h3 className="text-3xl font-headline font-bold mb-2 text-slate-900">{t("التقاطات أخيرة", "Recent Captures")}</h3>
      <p className="text-lg text-slate-500 mb-8">{t("آخر الذكريات المحفوظة", "Your latest saved memories")}</p>
      <div className="flex-1 space-y-2">
        {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />) :
         memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-slate-400 text-sm">{t("لا توجد ذكريات بعد", "No memories yet")}</p>
            <Link href="/vault/assistant" className="mt-2 text-xs font-bold text-[#2552ca] hover:underline flex items-center gap-1">
              {t("جرّب المساعد الذكي", "Try AI Assistant")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {memories.map(({ id, title, created_at }, i) => (
              <motion.div key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`relative flex items-center gap-3 p-3 rounded-xl group cursor-pointer transition-all ${selectedIds.has(id) ? "bg-[#2552ca]/8 ring-1 ring-[#2552ca]/20" : "hover:bg-white/60"}`}
                onClick={() => toggleSelect(id)}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[i % dotColors.length]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
                  <p className="text-[11px] text-slate-400">{relativeTime(created_at)}</p>
                </div>
                <input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelect(id)} onClick={e => e.stopPropagation()}
                  className={`w-4 h-4 rounded accent-[#2552ca] cursor-pointer transition-opacity ${selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <BulkActionBar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onClear={() => setSelectedIds(new Set())} deleting={bulkDeleting} />
      <div className="mt-8 pt-4 border-t border-slate-200">
        <Link href="/vault/upload" className="flex items-center gap-2 text-sm font-bold text-[#2552ca] hover:underline">
          {t("رفع ذكرى جديدة", "Upload a memory")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Decorative */}
      <div className="absolute right-0 bottom-0 w-1/2 translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-40 pointer-events-none">
        <div className="w-full h-48 bg-gradient-to-tl from-[#2552ca]/20 to-[#fd65c2]/20 rounded-tl-2xl" />
      </div>
    </div>
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
        const { data } = await supabase.from("plans").select("id, title, plan_time").eq("user_id", user.id).eq("plan_date", today).eq("status", "pending").order("plan_time", { ascending: true }).limit(4);
        setPlans(data ?? []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <span className="text-4xl mb-6 block">🔥</span>
      <h3 className="text-3xl font-headline font-bold mb-2 text-slate-900">{t("تيار التركيز", "Focus Stream")}</h3>
      <p className="text-lg text-slate-500 mb-8">{t("خططك اليوم", "Your plans for today")}</p>
      <div className="flex-1 space-y-3">
        {loading ? [1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />) :
         plans.length === 0 ? (
          <p className="text-slate-400 text-center py-8">{t("لا خطط اليوم — استمتع 😊", "No plans today — enjoy 😊")}</p>
        ) : plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={i === 0 ? "bg-gradient-to-r from-[#ffd8e9] to-[#f0eded] rounded-2xl p-4 border border-[#fd65c2]/20" : "bg-white/60 rounded-xl p-3 border border-[#e4e2e1] opacity-70"}>
            {i === 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-[#ad1d7f] text-white text-[10px] font-bold rounded-full uppercase">{t("التالي", "Up Next")}</span>
                {plan.plan_time && <span className="text-xs text-[#3c0029] font-medium">{plan.plan_time}</span>}
              </div>
            )}
            <p className="font-headline font-bold text-sm text-slate-800">{plan.title}</p>
            {i > 0 && plan.plan_time && <p className="text-xs text-slate-500 mt-1">{plan.plan_time}</p>}
          </motion.div>
        ))}
      </div>
      <div className="mt-8 pt-4 border-t border-slate-200">
        <Link href="/vault/plans" className="flex items-center gap-2 text-sm font-bold text-[#ad1d7f] hover:underline">
          {t("عرض كل الخطط", "View all plans")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ── AI Insight ────────────────────────────────────────────────────────────────

interface InsightData { ar: string; en: string; type: "overdue" | "memory" | "habit" | "plan" | "empty"; }
const INSIGHT_LINKS: Record<string, { ar: string; en: string; href: string }> = {
  overdue: { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  plan: { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  memory: { ar: "عرض الذكريات", en: "View Memories", href: "/vault/new-memory" },
  habit: { ar: "عرض العادات", en: "View Habits", href: "/vault/habits" },
  empty: { ar: "ابدأ الآن", en: "Get Started", href: "/vault/plans" },
};

function AIInsight() {
  const { t } = useLanguage();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/vault/insights");
        if (res.ok) setData(await res.json() as InsightData);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const btn = INSIGHT_LINKS[data?.type ?? "empty"];

  return (
    <div className="flex flex-col h-full">
      <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="text-4xl mb-6 block">✦</motion.span>
      <h3 className="text-3xl font-headline font-bold mb-2 text-white">{t("رؤى الذكاء الاصطناعي", "AI Insights")}</h3>
      <p className="text-lg text-white/70 mb-8">{t("مخصصة لك يومياً", "Personalised daily for you")}</p>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-full bg-white/20 rounded" /><Skeleton className="h-4 w-3/4 bg-white/20 rounded" /></div>
        ) : (
          <p className="text-white/90 text-lg leading-relaxed">
            {data ? t(data.ar, data.en) : t("ابدأ يومك بتسجيل ذكرى أو إنشاء خطة", "Start your day by capturing a memory or creating a plan")}
          </p>
        )}
      </div>
      <Link href={btn.href} className="mt-8">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
          {t(btn.ar, btn.en)} <ArrowRight className="w-4 h-4" />
        </motion.button>
      </Link>
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#fd65c2]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function VaultPageInner() {
  const { subscriptionType, loading: subscriptionLoading } = useSubscription();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const { t } = useLanguage();
  const stats = useStats();

  const fetchTeamData = useCallback(async () => {
    setIsLoadingTeam(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (!membership) return;
      const { data: team } = await supabase.from("teams").select("*").eq("id", membership.team_id).maybeSingle();
      if (!team) return;
      setCurrentTeam(team as Team);
      const { data: members } = await supabase.from("team_members").select("user_id, profiles(full_name, avatar_url)").eq("team_id", team.id);
      setTeamMembers((members ?? []).map((m: any) => ({ id: m.user_id, name: m.profiles?.full_name ?? t("عضو الفريق", "Team Member"), avatar: m.profiles?.avatar_url ?? null })));
    } catch (err) { console.error("[VaultPage]", err); }
    finally { setIsLoadingTeam(false); }
  }, [t]);

  useEffect(() => {
    if (subscriptionType === "team" || subscriptionType === "company") fetchTeamData();
  }, [subscriptionType, fetchTeamData]);

  const isTeam = subscriptionType === "team" || subscriptionType === "company";
  if (subscriptionLoading || (isTeam && isLoadingTeam)) return <VaultSkeleton />;

  if (isTeam && currentTeam) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
        <VaultSidebar />
        <main className="lg:ml-72">
          <TeamDashboard team={currentTeam} teamMembers={teamMembers.map((m) => ({ ...m, avatar: m.avatar ?? undefined }))} />
        </main>
      </div>
    );
  }

  const quickLinks = [
    { href: "/vault/plans",    emoji: "📋", ar: "خططي",       en: "Plans",     from: "from-[#2552ca]",   to: "to-[#456ce4]" },
    { href: "/vault/habits",   emoji: "🔥", ar: "عاداتي",     en: "Habits",    from: "from-[#ad1d7f]",   to: "to-[#fd65c2]" },
    { href: "/vault/goals",    emoji: "🎯", ar: "أهدافي",     en: "Goals",     from: "from-[#385b9b]",   to: "to-[#2552ca]" },
    { href: "/vault/assistant",emoji: "✦",  ar: "المساعد",    en: "Assistant", from: "from-emerald-500", to: "to-teal-400" },
    { href: "/vault/meetings", emoji: "🎙️", ar: "الاجتماعات", en: "Meetings",  from: "from-[#456ce4]",   to: "to-[#ad1d7f]" },
    { href: "/vault/focus",    emoji: "⏱️", ar: "التركيز",    en: "Focus",     from: "from-amber-500",   to: "to-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />
      <main className="lg:ml-72">

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="absolute -top-20 right-0 w-96 h-96 bg-[#2552ca]/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#ad1d7f]/6 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Copy */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2,1,0.3,1] }} className="space-y-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <MobileMenuButton />
                  <div className="flex-1" />
                  <ThemeToggle /><LanguageToggle />
                </div>
                <div className="hidden lg:flex justify-end gap-3">
                  <ThemeToggle /><LanguageToggle />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#dce1ff] rounded-full mb-6">
                    <Network className="w-4 h-4 text-[#2552ca]" />
                    <span className="text-sm font-bold text-[#2552ca]">{t("الفولت", "Your Vault")}</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    {t("خريطة ", "Memory ")}<span className="gradient-text">{t("الذاكرة", "Map")}</span>
                  </h1>
                  <p className="text-xl text-slate-500 mt-5 leading-relaxed max-w-lg">
                    {t("كل ذكرياتك وخططك وعاداتك وأهدافك في مكان واحد.", "All your memories, plans, habits, and goals — connected and always accessible.")}
                  </p>
                </div>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: stats.memories, label: t("ذكريات", "Memories"), color: "bg-[#dce1ff] text-[#2552ca]" },
                    { value: stats.plans,    label: t("خطط اليوم", "Today"),   color: "bg-[#ffd8e9] text-[#ad1d7f]" },
                    { value: stats.habits,   label: t("عادات", "Habits"),      color: "bg-emerald-50 text-emerald-700" },
                    { value: stats.goals,    label: t("أهداف", "Goals"),       color: "bg-amber-50 text-amber-700" },
                  ].map(({ value, label, color }) => (
                    <div key={label as string} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${color}`}>
                      <span className="text-xl font-headline font-extrabold">{value}</span>
                      <span className="opacity-80">{label as string}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link href="/vault/new-memory">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="px-8 py-4 rounded-full power-gradient text-white font-bold text-base shadow-xl btn-glow font-label flex items-center gap-2">
                      <Plus className="w-5 h-5" /> {t("ذكرى جديدة", "New Memory")}
                    </motion.button>
                  </Link>
                  <Link href="/vault/assistant">
                    <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                      className="px-8 py-4 rounded-full bg-[#eae8e7] text-[#2552ca] font-bold text-base hover:bg-[#e4e2e1] transition-all font-label flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> {t("المساعد الذكي", "AI Assistant")}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              {/* Orb */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2,1,0.3,1] }} className="relative hidden lg:block">
                <MemoryMapOrb />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Quick nav ── */}
        <section className="px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickLinks.map(({ href, emoji, ar, en, from, to }, i) => (
                <Link key={href} href={href}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, ease: [0.2,1,0.3,1] }}
                    whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl bg-gradient-to-br ${from} ${to} text-white shadow-lg cursor-pointer`}>
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-sm text-center">{t(ar, en)}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bento grid ── */}
        <section className="py-16 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <motion.div custom={0} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, ease: [0.2,1,0.3,1] }}
                className="md:col-span-2 bg-[#f6f3f2] rounded-2xl p-12 relative overflow-hidden group hover-lift cursor-default">
                <RecentCaptures />
              </motion.div>

              <motion.div custom={1} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.2,1,0.3,1] }}
                className="bg-[#2552ca] text-white rounded-2xl p-12 relative overflow-hidden hover-lift cursor-default">
                <AIInsight />
              </motion.div>

              <motion.div custom={2} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.2,1,0.3,1] }}
                className="bg-[#f6f3f2] rounded-2xl p-12 relative overflow-hidden group hover-lift cursor-default">
                <FocusStream />
                <div className="absolute right-0 bottom-0 w-1/2 translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-30 pointer-events-none">
                  <div className="w-full h-40 bg-gradient-to-tl from-[#ad1d7f]/20 to-[#fd65c2]/20 rounded-tl-2xl" />
                </div>
              </motion.div>

              <motion.div custom={3} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.2,1,0.3,1] }}
                className="bg-[#456ce4] text-white rounded-2xl p-12 flex flex-col justify-between hover-lift cursor-default">
                <div>
                  <span className="text-4xl mb-6 block">📁</span>
                  <h3 className="text-3xl font-headline font-bold mb-4">{t("رفع ذكرياتك", "Upload Memories")}</h3>
                  <p className="text-lg opacity-90">{t("ارفع ملفات، صور، وصوتيات لتضاف إلى خريطة ذاكرتك.", "Upload files, images, and audio clips to your memory map.")}</p>
                </div>
                <Link href="/vault/upload" className="mt-8">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
                    {t("رفع ملف", "Upload File")} <Upload className="w-4 h-4" />
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div custom={4} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.2,1,0.3,1] }}
                className="bg-[#f6f3f2] rounded-2xl p-12 flex flex-col hover-lift cursor-default">
                <span className="text-4xl mb-6 block">🎙️</span>
                <h3 className="text-3xl font-headline font-bold mb-4 text-slate-900">{t("ملخص الاجتماعات", "Meeting Summary")}</h3>
                <p className="text-lg text-slate-500 flex-1">{t("سجّل اجتماعاتك وذكرني يلخصها ويستخرج نقاط العمل تلقائياً.", "Record your meetings and get automatic summaries with action items.")}</p>
                <Link href="/vault/meetings" className="mt-8 flex items-center gap-2 text-sm font-bold text-[#2552ca] hover:underline">
                  {t("ابدأ التسجيل", "Start recording")} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* FAB */}
        <Link href="/vault/new-memory">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full power-gradient text-white shadow-2xl shadow-[#2552ca]/30 flex items-center justify-center z-50 group btn-glow">
            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </Link>

      </main>
    </div>
  );
}

export default function VaultPage() {
  return (
    <ErrorBoundary>
      <VaultPageInner />
    </ErrorBoundary>
  );
}
