"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";
import {
  Plus, Upload, Sparkles, ArrowRight, CalendarDays,
  CheckSquare, Bell, Target, Flame, TrendingUp
} from "lucide-react";
import { BulkActionBar } from "@/components/thakirni/bulk-action-bar";
import { AIVaultHero } from "@/components/thakirni/ai-vault-hero";
import { UsageWidget } from "@/components/thakirni/usage-widget";
import { WhatsAppBanner } from "@/components/thakirni/whatsapp-banner";
import { DailyProgress } from "@/components/thakirni/daily-progress";
import { ReferralShare } from "@/components/thakirni/referral-share";
import { UpgradeNudge } from "@/components/thakirni/upgrade-nudge";

// ── Particles ─────────────────────────────────────────────────────────────────

function ParticleLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ps: HTMLDivElement[] = [];
    const colors = ["rgba(79,70,229,0.10)", "rgba(124,58,237,0.08)", "rgba(236,72,153,0.07)"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 8 + 4;
      const dur = Math.random() * 20 + 10;
      const delay = Math.random() * -20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:${color};border-radius:50%;filter:blur(2px);--drift-x:${(Math.random()-0.5)*200}px;--drift-y:${(Math.random()-0.5)*200}px;animation:particle-drift ${dur}s linear ${delay}s infinite;pointer-events:none;`;
      el.appendChild(p);
      ps.push(p);
    }
    return () => ps.forEach((p) => p.remove());
  }, []);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="pt-40 pb-32 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-16 w-80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0,1,2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </main>
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
      } catch (err) { console.error("[useStats] failed:", err); }
    })();
  }, []);
  return stats;
}

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting(isArabic: boolean): string {
  const h = new Date().getHours();
  if (isArabic) {
    if (h < 12) return "صباح الخير 🌅";
    if (h < 17) return "هلا 👋 جاهز ليومك؟";
    if (h < 21) return "مساء الخير 🌇";
    return "مساء النور 🌙";
  }
  if (h < 12) return "Good morning 🌅";
  if (h < 17) return "Hey there 👋 Ready for your day?";
  if (h < 21) return "Good evening 🌇";
  return "Good night 🌙";
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ stats }: { stats: { memories: number; plans: number; habits: number; goals: number } }) {
  const { t, isArabic } = useLanguage();

  const todayStr = new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const greeting = getGreeting(isArabic);

  const quickStats = [
    { icon: CheckSquare, value: stats.plans,    label: t("مهام اليوم", "Today's tasks"),   color: "text-indigo-500" },
    { icon: Bell,        value: stats.memories,  label: t("ذكريات",    "Memories"),          color: "text-violet-500" },
    { icon: Target,      value: stats.goals,     label: t("أهداف",     "Goals"),             color: "text-pink-500"   },
    { icon: Flame,       value: stats.habits,    label: t("عادات",     "Habits"),            color: "text-amber-500"  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/6"
    >
      {/* Left: greeting + date */}
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{greeting}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{todayStr}</p>
      </div>

      {/* Right: quick stats */}
      <div className="flex items-center gap-4 sm:gap-6">
        {quickStats.map(({ icon: Icon, value, label, color }) => (
          <div key={label as string} className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular">{value}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{label as string}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
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
    } catch (err) { console.error("[RecentCaptures] failed:", err); }
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

  const dotColors = ["bg-indigo-500","bg-violet-500","bg-pink-500","bg-emerald-500","bg-amber-500"];

  return (
    <div className="h-full flex flex-col">
      <span className="text-3xl mb-5 block">🧠</span>
      <h3 className="text-2xl font-headline font-bold mb-1 text-slate-900 dark:text-white">{t("شغلك", "Your Work")}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("آخر اللي حفظته", "Your latest saved memories")}</p>
      <div className="flex-1 space-y-1.5">
        {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />) :
         memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="text-3xl">😄</div>
            <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed">
              {t("واضح إنك توك تبدأ 👀\nتبغاني أرتب لك يومك؟", "Looks like you're just getting started 👀\nWant me to set up your day?")}
            </p>
            <Link href="/vault/assistant">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-full power-gradient text-white text-xs font-bold shadow-md btn-glow">
                {t("جرّب المساعد الذكي 👀", "Try AI Assistant 👀")}
              </motion.button>
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {memories.map(({ id, title, created_at }, i) => (
              <motion.div key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`relative flex items-center gap-3 p-3 rounded-xl group cursor-pointer transition-all ${selectedIds.has(id) ? "bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-300 dark:ring-indigo-700" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                onClick={() => toggleSelect(id)}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[i % dotColors.length]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{title}</p>
                  <p className="text-[11px] text-slate-400">{relativeTime(created_at)}</p>
                </div>
                <input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelect(id)} onClick={e => e.stopPropagation()}
                  className={`w-4 h-4 rounded accent-indigo-600 cursor-pointer transition-opacity ${selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <BulkActionBar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onClear={() => setSelectedIds(new Set())} deleting={bulkDeleting} />
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/8">
        <Link href="/vault/upload" className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          {t("رفع ذكرى جديدة", "Upload a memory")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
      <div className="absolute end-0 bottom-0 w-1/2 translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700 opacity-30 pointer-events-none">
        <div className="w-full h-48 bg-gradient-to-tl from-indigo-500/15 to-violet-500/10 rounded-tl-2xl" />
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
      } catch (err) { console.error("[FocusStream] failed:", err); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <span className="text-3xl mb-5 block">🔥</span>
      <h3 className="text-2xl font-headline font-bold mb-1 text-slate-900 dark:text-white">{t("تيار التركيز", "Focus Stream")}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("خططك اليوم", "Your plans for today")}</p>
      <div className="flex-1 space-y-2.5">
        {loading ? [1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />) :
         plans.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="text-3xl">😄</div>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              {t("ما عندك شي اليوم 😄\nتبغاني أرتب لك يومك؟ 👀", "No plans today 😄\nWant me to organise your day? 👀")}
            </p>
            <Link href="/vault/plans">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-full power-gradient text-white text-xs font-bold shadow-md btn-glow">
                {t("+ أضف مهمة", "+ Add task")}
              </motion.button>
            </Link>
          </div>
        ) : plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={i === 0
              ? "bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/40 dark:to-pink-950/30 rounded-2xl p-4 border border-violet-200/50 dark:border-violet-800/30"
              : "bg-white/60 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/8 opacity-70"}>
            {i === 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 power-gradient text-white text-[10px] font-bold rounded-full uppercase">{t("التالي", "Up Next")}</span>
                {plan.plan_time && <span className="text-xs text-violet-700 dark:text-violet-400 font-medium">{plan.plan_time}</span>}
              </div>
            )}
            <p className="font-headline font-bold text-sm text-slate-800 dark:text-slate-200">{plan.title}</p>
            {i > 0 && plan.plan_time && <p className="text-xs text-slate-400 mt-1">{plan.plan_time}</p>}
          </motion.div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/8">
        <Link href="/vault/plans" className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline">
          {t("عرض كل الخطط", "View all plans")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
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
      } catch (err) { console.error("[AIInsight] failed:", err); }
      finally { setLoading(false); }
    })();
  }, []);

  const btn = INSIGHT_LINKS[data?.type ?? "empty"];

  return (
    <div className="flex flex-col h-full">
      <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-3xl mb-5 block">✦</motion.span>
      <h3 className="text-2xl font-headline font-bold mb-1 text-white">{t("رؤى الذكاء الاصطناعي", "AI Insights")}</h3>
      <p className="text-sm text-white/70 mb-6">{t("مخصصة لك يومياً", "Personalised daily for you")}</p>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-white/20 rounded" />
            <Skeleton className="h-4 w-3/4 bg-white/20 rounded" />
          </div>
        ) : (
          <p className="text-white/90 text-base leading-relaxed">
            {data ? t(data.ar, data.en) : t("ابدأ يومك بتسجيل ذكرى أو إنشاء خطة", "Start your day by capturing a memory or creating a plan")}
          </p>
        )}
      </div>
      <Link href={btn.href} className="mt-6">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2 border border-white/20">
          {t(btn.ar, btn.en)} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </motion.button>
      </Link>
      {/* Decorative blobs */}
      <div className="absolute -top-12 -end-12 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -start-12 w-32 h-32 bg-white/8 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}

// ── Quick actions ──────────────────────────────────────────────────────────────

function QuickActions({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  const actions = [
    { href: "/vault/plans?new=1",    icon: CheckSquare, labelAr: "+ مهمة",    labelEn: "+ Task",      from: "from-indigo-500", to: "to-violet-500" },
    { href: "/vault/new-memory",     icon: Bell,        labelAr: "+ تذكير",   labelEn: "+ Reminder",  from: "from-violet-500", to: "to-purple-500" },
    { href: "/vault/calendar?new=1", icon: CalendarDays,labelAr: "+ موعد",    labelEn: "+ Event",     from: "from-pink-500",   to: "to-rose-500"   },
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {actions.map(({ href, icon: Icon, labelAr, labelEn, from, to }) => (
        <Link key={href} href={href}>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${from} ${to} text-white text-sm font-bold shadow-md btn-glow cursor-pointer`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {t(labelAr, labelEn)}
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function VaultPageInner() {
  const { loading: subscriptionLoading } = useSubscription();
  const { t, isArabic } = useLanguage();
  const stats = useStats();

  if (subscriptionLoading) return <VaultSkeleton />;

  const quickLinks = [
    { href: "/vault/plans",     emoji: "📋", ar: "خططي",        en: "Plans",      from: "from-indigo-500",  to: "to-violet-500"  },
    { href: "/vault/habits",    emoji: "🔥", ar: "عاداتي",      en: "Habits",     from: "from-pink-500",    to: "to-rose-500"    },
    { href: "/vault/goals",     emoji: "🎯", ar: "أهدافي",      en: "Goals",      from: "from-violet-600",  to: "to-purple-600"  },
    { href: "/vault/assistant", emoji: "✦",  ar: "المساعد",     en: "Assistant",  from: "from-emerald-500", to: "to-teal-400"    },
    { href: "/vault/meetings",  emoji: "🎙️", ar: "الاجتماعات",  en: "Meetings",   from: "from-amber-500",   to: "to-orange-500"  },
    { href: "/vault/focus",     emoji: "⏱️", ar: "التركيز",     en: "Focus",      from: "from-cyan-500",    to: "to-blue-500"    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="pt-14 pb-20 md:pb-0">

        {/* ── Summary bar ── */}
        <div className="sticky top-14 z-30">
          <SummaryBar stats={stats} />
        </div>

        {/* ── Hero section ── */}
        <section className="relative pt-10 pb-8 px-4 sm:px-8 overflow-hidden">
          <ParticleLayer />

          {/* Background glows */}
          <div className="absolute -top-20 end-0 w-80 h-80 bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-violet-500/6 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            {/* WhatsApp banner */}
            <WhatsAppBanner />

            {/* Title + quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{t("مساعدك الذكي", "Your AI Assistant")}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-3">
                {t("شغلك ", "Your ")}<span className="gradient-text">{t("اليوم", "Today")}</span>
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mb-5">
                {t(
                  "كل اللي تحتاجه في مكان واحد — جرّب الذكاء الاصطناعي أو ابدأ بمهمة جديدة.",
                  "Everything you need in one place — try AI or start a new task."
                )}
              </p>

              {/* Quick actions */}
              <QuickActions t={t} />
            </motion.div>

            {/* AI hero input */}
            <AIVaultHero />

            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-2.5 mt-5"
            >
              {[
                { value: stats.memories, label: t("ذكريات", "Memories"),  color: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900" },
                { value: stats.plans,    label: t("خطط اليوم", "Today"),   color: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900" },
                { value: stats.habits,   label: t("عادات", "Habits"),      color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900" },
                { value: stats.goals,    label: t("أهداف", "Goals"),       color: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900" },
              ].map(({ value, label, color }) => (
                <div key={label as string} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm ${color}`}>
                  <span className="text-sm font-headline font-extrabold tabular">{value}</span>
                  <span className="opacity-80 font-medium">{label as string}</span>
                </div>
              ))}
            </motion.div>

            {/* Daily progress */}
            <div className="mt-4"><DailyProgress /></div>
            {/* Usage widget */}
            <div className="mt-3"><UsageWidget /></div>
            {/* Upgrade nudge */}
            <div className="mt-3"><UpgradeNudge /></div>
            {/* Referral share */}
            <div className="mt-3"><ReferralShare /></div>
          </div>
        </section>

        {/* ── Quick nav ── */}
        <section className="px-4 sm:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickLinks.map(({ href, emoji, ar, en, from, to }, i) => (
                <Link key={href} href={href}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.06, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${from} ${to} text-white shadow-lg cursor-pointer`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="font-bold text-xs text-center leading-tight">{t(ar, en)}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bento grid ── */}
        <section className="py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Recent Captures — wide */}
              <motion.div
                custom={0}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="md:col-span-2 bg-white dark:bg-white/[0.04] rounded-2xl p-8 relative overflow-hidden border border-slate-100 dark:border-white/8 shadow-soft hover:shadow-[0_12px_40px_rgba(79,70,229,0.10)] transition-all duration-300"
              >
                <RecentCaptures />
              </motion.div>

              {/* AI Insight */}
              <motion.div
                custom={1}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(79,70,229,0.35)] transition-all duration-300"
              >
                <AIInsight />
              </motion.div>

              {/* Focus Stream */}
              <motion.div
                custom={2}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-white/[0.04] rounded-2xl p-8 relative overflow-hidden border border-slate-100 dark:border-white/8 shadow-soft hover:shadow-[0_12px_40px_rgba(124,58,237,0.10)] transition-all duration-300"
              >
                <FocusStream />
              </motion.div>

              {/* Upload */}
              <motion.div
                custom={3}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg transition-all duration-300"
              >
                <div>
                  <span className="text-3xl mb-5 block">📁</span>
                  <h3 className="text-xl font-headline font-bold mb-3">{t("رفع ذكرياتك", "Upload Memories")}</h3>
                  <p className="text-sm text-violet-100 leading-relaxed">{t("ارفع ملفات، صور، وصوتيات لتضاف إلى خريطة ذاكرتك.", "Upload files, images, and audio clips to your memory map.")}</p>
                </div>
                <Link href="/vault/upload" className="mt-6">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2 border border-white/20">
                    {t("رفع ملف", "Upload File")} <Upload className="w-4 h-4" />
                  </motion.button>
                </Link>
              </motion.div>

              {/* Meeting Summary */}
              <motion.div
                custom={4}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-white/[0.04] rounded-2xl p-8 flex flex-col border border-slate-100 dark:border-white/8 shadow-soft hover:shadow-[0_12px_40px_rgba(236,72,153,0.10)] transition-all duration-300"
              >
                <span className="text-3xl mb-5 block">🎙️</span>
                <h3 className="text-xl font-headline font-bold mb-3 text-slate-900 dark:text-white">{t("ملخص الاجتماعات", "Meeting Summary")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">{t("سجّل اجتماعاتك وذكّرني يلخصها ويستخرج نقاط العمل تلقائياً.", "Record your meetings and get automatic summaries with action items.")}</p>
                <Link href="/vault/meetings" className="mt-6 flex items-center gap-2 text-sm font-bold text-pink-600 dark:text-pink-400 hover:underline">
                  {t("ابدأ التسجيل", "Start recording")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── FAB ── */}
        <Link href="/vault/new-memory">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-[calc(4rem+1.25rem)] md:bottom-8 end-5 md:end-8 w-14 h-14 rounded-full power-gradient text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center z-40 group btn-glow"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </Link>

        {/* Trend indicator row — above FAB */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-[calc(4rem+5rem)] md:bottom-28 end-5 md:end-8 z-30"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#111827] border border-slate-100 dark:border-white/10 shadow-md text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            {t("شغّال ⚡", "On a roll ⚡")}
          </div>
        </motion.div>

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
