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
import { Plus, Brain, Mic, Upload, FileText, Sparkles, Target, Flame, ArrowRight } from "lucide-react";
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
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 6 + 3;
      const dur = Math.random() * 20 + 10;
      const delay = Math.random() * -20;
      p.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(37,82,202,0.10);border-radius:50%;filter:blur(1px);--drift-x:${(Math.random()-0.5)*180}px;--drift-y:${(Math.random()-0.5)*180}px;animation:particle-drift ${dur}s linear ${delay}s infinite;pointer-events:none;`;
      el.appendChild(p);
      ps.push(p);
    }
    return () => ps.forEach((p) => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

// ── Dynamic imports ────────────────────────────────────────────────────────────

const TeamDashboard = dynamic(
  () => import("@/components/dashboards/team-dashboard").then((m) => ({ default: m.TeamDashboard })),
  { ssr: false }
);

// ── Page shell ─────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />
      <main className="lg:ml-72 transition-all duration-300 min-w-0 max-w-full relative">
        {children}
      </main>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <PageShell>
      <div className="pt-28 px-8 pb-12 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          {[0,1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </PageShell>
  );
}

// ── Central Memory Map orb ─────────────────────────────────────────────────────

const ORBITAL_NODES = [
  { pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-5", label: "AI", color: "text-[#2552ca]" },
  { pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-5",  label: "⚡", color: "text-[#ad1d7f]" },
  { pos: "left-0 top-1/2 -translate-y-1/2 -translate-x-5",    label: "📄", color: "text-slate-600" },
  { pos: "right-0 top-1/2 -translate-y-1/2 translate-x-5",    label: "🎙️", color: "text-slate-600" },
];

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
        const { data } = await supabase
          .from("memories")
          .select("id, title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setMemories(data ?? []);
      } catch (err) {
        console.error("[MemoryMapOrb]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const memColors = [
    "from-[#2552ca] to-[#456ce4]",
    "from-[#ad1d7f] to-[#fd65c2]",
    "from-[#385b9b] to-[#2552ca]",
    "from-emerald-500 to-teal-400",
    "from-amber-500 to-orange-400",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-4 lg:py-8">
      {/* Orb container */}
      <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[500px] aspect-square flex items-center justify-center">

        {/* Gradient halo background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#dce1ff] via-[#f0eded] to-[#ffd8e9] opacity-60" />

        {/* Spinning rings */}
        <div className="absolute inset-[15%] rounded-full border-2 border-[#2552ca]/20 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-[22%] rounded-full border border-[#fd65c2]/20 animate-[spin_15s_linear_infinite_reverse]" />

        {/* Core orb */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] shadow-[0_0_80px_rgba(37,82,202,0.5)] flex items-center justify-center"
        >
          <span className="text-white text-3xl sm:text-5xl font-headline font-bold select-none">ذ</span>
        </motion.div>

        {/* Fixed orbital positions */}
        {ORBITAL_NODES.map(({ pos, label, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`absolute ${pos} w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-sm sm:text-base font-bold ${color}`}
          >
            {label}
          </motion.div>
        ))}

        {/* Memory nodes orbiting — shown on md+ */}
        {!loading && memories.map(({ id, title }, i) => {
          const angle = (i / Math.max(memories.length, 1)) * 2 * Math.PI - Math.PI / 2;
          const r = 47; // % radius
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className="hidden md:flex absolute items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-white/60 hover:scale-105 transition-transform cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${memColors[i % memColors.length]} shrink-0`} />
              <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap max-w-[100px] truncate">
                {title}
              </span>
            </motion.div>
          );
        })}

        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M50 10 Q65 35 82 50" fill="none" stroke="rgba(37,82,202,0.15)" strokeWidth="0.5" />
          <path d="M50 90 Q35 65 18 50" fill="none" stroke="rgba(253,101,194,0.15)" strokeWidth="0.5" />
          <path d="M10 50 Q35 35 50 10" fill="none" stroke="rgba(56,91,155,0.12)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-4"
      >
        {!loading && memories.length === 0 ? (
          <p className="text-slate-500 text-sm max-w-xs">
            {t("ستظهر خريطة ذاكرتك هنا عند إضافة ذكريات", "Your memory map will appear here as you add memories")}
          </p>
        ) : (
          <p className="text-slate-500 text-sm font-medium">
            {t(`${memories.length} ذكرى في خريطتك`, `${memories.length} ${memories.length === 1 ? "memory" : "memories"} in your map`)}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ── Recent Captures ────────────────────────────────────────────────────────────

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
        .from("memories").select("id, title, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setMemories(data ?? []);
    } catch (err) { console.error("[RecentCaptures]", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      await fetch("/api/memories/bulk-delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      await fetchMemories();
    } catch (err) { console.error(err); }
    finally { setBulkDeleting(false); }
  };

  function relativeTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
    if (isArabic) {
      if (m < 1) return "للتو";
      if (m < 60) return `منذ ${m} دقيقة`;
      if (h < 24) return `منذ ${h} ساعة`;
      return `منذ ${dy} يوم`;
    }
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${dy}d ago`;
  }

  const dotColors = ["bg-[#2552ca]", "bg-[#ad1d7f]", "bg-[#385b9b]", "bg-emerald-500", "bg-amber-500"];

  return (
    <div className="h-full flex flex-col">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2552ca] to-[#456ce4] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-slate-900 leading-tight">
            {t("التقاطات الأخيرة", "Recent Captures")}
          </h2>
          <p className="text-xs text-slate-500">{t("آخر الذكريات المحفوظة", "Latest saved memories")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-card border border-[#e4e2e1] p-4 space-y-2">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f0eded] flex items-center justify-center mb-3">
              <Brain className="w-7 h-7 text-[#2552ca]/40" />
            </div>
            <p className="text-sm text-slate-500 max-w-[200px]">
              {t("لا توجد ذكريات بعد", "No memories yet")}
            </p>
            <Link href="/vault/assistant" className="mt-3 text-xs font-bold text-[#2552ca] hover:underline flex items-center gap-1">
              {t("جرّب المساعد الذكي", "Try the AI Assistant")}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {memories.map(({ id, title, created_at }, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative flex items-center gap-3 p-3 rounded-xl group cursor-pointer transition-all ${
                  selectedIds.has(id) ? "bg-[#2552ca]/8 ring-1 ring-[#2552ca]/20" : "hover:bg-[#f6f3f2]"
                }`}
                onClick={() => toggleSelect(id)}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[i % dotColors.length]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
                  <p className="text-[11px] text-slate-400">{relativeTime(created_at)}</p>
                </div>
                <div className={`transition-opacity ${selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(id)}
                    onChange={() => toggleSelect(id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-[#2552ca] cursor-pointer"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
        deleting={bulkDeleting}
      />
    </div>
  );
}

// ── Focus Stream ───────────────────────────────────────────────────────────────

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
        const { data } = await supabase.from("plans")
          .select("id, title, plan_time")
          .eq("user_id", user.id).eq("plan_date", today).eq("status", "pending")
          .order("plan_time", { ascending: true }).limit(3);
        setPlans(data ?? []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ad1d7f] to-[#fd65c2] flex items-center justify-center shadow-lg shadow-[#ad1d7f]/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-slate-900 leading-tight">
            {t("تيار التركيز", "Focus Stream")}
          </h2>
          <p className="text-xs text-slate-500">{t("خططك اليوم", "Your plans for today")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e4e2e1] p-5 text-center">
            <p className="text-sm text-slate-400">{t("لا توجد خطط اليوم — استمتع بيومك 😊", "No plans today — enjoy your day 😊")}</p>
          </div>
        ) : plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={i === 0
              ? "bg-gradient-to-r from-[#ffd8e9] to-[#f0eded] rounded-2xl p-4 border border-[#fd65c2]/20"
              : "bg-white rounded-xl p-4 border border-[#e4e2e1] opacity-70"
            }
          >
            {i === 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-[#ad1d7f] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                  {t("التالي", "Up Next")}
                </span>
                {plan.plan_time && <span className="text-xs text-[#3c0029] font-medium">{plan.plan_time}</span>}
              </div>
            )}
            <p className="font-headline font-bold text-sm text-slate-800">{plan.title}</p>
            {i > 0 && plan.plan_time && <p className="text-xs text-slate-500 mt-1">{plan.plan_time}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── AI Insight ─────────────────────────────────────────────────────────────────

interface InsightData { ar: string; en: string; type: "overdue" | "memory" | "habit" | "plan" | "empty"; }

const INSIGHT_LINKS: Record<string, { ar: string; en: string; href: string }> = {
  overdue: { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  plan:    { ar: "عرض الخطط", en: "View Plans", href: "/vault/plans" },
  memory:  { ar: "عرض الذكريات", en: "View Memories", href: "/vault/new-memory" },
  habit:   { ar: "عرض العادات", en: "View Habits", href: "/vault/habits" },
  empty:   { ar: "ابدأ الآن", en: "Get Started", href: "/vault/plans" },
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
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center shadow-lg shadow-[#385b9b]/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-slate-900 leading-tight">
            {t("رؤى الذكاء الاصطناعي", "AI Insights")}
          </h2>
          <p className="text-xs text-slate-500">{t("مخصصة لك", "Personalised for you")}</p>
        </div>
      </div>

      <div className="relative bg-[#2552ca] rounded-2xl p-5 text-white overflow-hidden group">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#fd65c2]/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <motion.span
          animate={{ rotate: [0, 20, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl block mb-3"
        >
          ✦
        </motion.span>

        {loading ? (
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full bg-white/20 rounded" />
            <Skeleton className="h-4 w-3/4 bg-white/20 rounded" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed mb-4 relative z-10">
            {data ? t(data.ar, data.en) : t("ابدأ يومك بتسجيل ذكرى أو إنشاء خطة", "Start your day by capturing a memory or creating a plan")}
          </p>
        )}

        <Link href={btn.href}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all relative z-10 flex items-center justify-center gap-2"
          >
            {t(btn.ar, btn.en)}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}

// ── Quick actions header ────────────────────────────────────────────────────────

function VaultHeader() {
  const { t } = useLanguage();
  const router = useRouter();
  const actions = [
    { icon: Plus, href: "/vault/new-memory", ar: "ذكرى جديدة", en: "New Memory" },
    { icon: Mic,  href: "/vault/voice-note", ar: "ملاحظة صوتية", en: "Voice Note" },
    { icon: Upload, href: "/vault/upload",   ar: "رفع ملف", en: "Upload" },
  ];
  return (
    <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
      <span className="text-xl font-headline font-extrabold bg-gradient-to-r from-[#2552ca] to-[#fd65c2] bg-clip-text text-transparent">
        {t("خريطة الذاكرة", "Memory Map")}
      </span>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex gap-2">
          {actions.map(({ icon: Icon, href, ar, en }) => (
            <motion.button
              key={href}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(href)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f6f3f2] hover:bg-[#eae8e7] text-slate-700 text-sm font-semibold font-label transition-all shadow-sm"
            >
              <Icon className="w-4 h-4" />
              {t(ar, en)}
            </motion.button>
          ))}
        </div>
        <MobileMenuButton />
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </header>
  );
}

// ── Stat strip ─────────────────────────────────────────────────────────────────

function StatStrip() {
  const { t } = useLanguage();
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

  const items = [
    { label: t("الذكريات", "Memories"), value: stats.memories, color: "text-[#2552ca]", bg: "bg-[#dce1ff]" },
    { label: t("خطط اليوم", "Today's Plans"), value: stats.plans, color: "text-[#ad1d7f]", bg: "bg-[#ffd8e9]" },
    { label: t("العادات", "Habits"), value: stats.habits, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t("الأهداف", "Goals"), value: stats.goals, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, color, bg }, i) => (
        <motion.div
          key={label as string}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.07, ease: [0.2, 1, 0.3, 1] }}
          className="bg-white rounded-2xl p-4 border border-[#e4e2e1] hover-lift shadow-ambient text-center"
        >
          <p className={`text-2xl font-headline font-extrabold ${color}`}>{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label as string}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

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

  return (
    <PageShell>
      <VaultHeader />
      <ParticleLayer />

      {/* Background blobs */}
      <div className="absolute top-40 right-0 w-80 h-80 bg-[#2552ca]/6 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-[#ad1d7f]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 pt-16 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Memory Map orb ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
          className="mb-6"
        >
          <MemoryMapOrb />
        </motion.section>

        {/* ── Stat strip ── */}
        <section className="mb-8">
          <StatStrip />
        </section>

        {/* ── Three feature cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* Recent Captures */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
          >
            <RecentCaptures />
          </motion.div>

          {/* Focus Stream */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: [0.2, 1, 0.3, 1] }}
          >
            <FocusStream />
          </motion.div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: [0.2, 1, 0.3, 1] }}
          >
            <AIInsight />
          </motion.div>

        </div>

        {/* ── Quick nav shortcuts ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { href: "/vault/plans",   icon: "📋", ar: "خططي", en: "Plans",   from: "from-[#2552ca]", to: "to-[#456ce4]" },
            { href: "/vault/habits",  icon: "🔥", ar: "عاداتي", en: "Habits",  from: "from-[#ad1d7f]", to: "to-[#fd65c2]" },
            { href: "/vault/goals",   icon: "🎯", ar: "أهدافي", en: "Goals",   from: "from-[#385b9b]", to: "to-[#2552ca]" },
            { href: "/vault/assistant", icon: "✦", ar: "المساعد", en: "Assistant", from: "from-emerald-500", to: "to-teal-400" },
          ].map(({ href, icon, ar, en, from, to }) => (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${from} ${to} text-white shadow-lg cursor-pointer`}
              >
                <span className="text-xl">{icon}</span>
                <span className="font-bold text-sm">{t(ar, en)}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* FAB */}
      <Link href="/vault/new-memory">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full power-gradient text-white shadow-2xl shadow-[#2552ca]/30 flex items-center justify-center z-50 group btn-glow"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
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
