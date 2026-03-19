"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { Plus, RefreshCw, Brain, Mic, Upload, FileText, Code2, Network } from "lucide-react";

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
    <div className="min-h-screen bg-[#fbf9f8]">
      <VaultSidebar />
      <main className="lg:ml-72 transition-all duration-300">
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
  const { t } = useLanguage();
  const captures = [
    { icon: Mic, label: t("مذكرة صوتية #242", "Voice Memo #242"), sub: t("منذ دقيقتين • تم التوليف", "2 mins ago • AI Synthesized"), color: "bg-[#2552ca]/10 text-[#2552ca] group-hover:bg-[#2552ca] group-hover:text-white", href: "/vault/voice-note" },
    { icon: FileText, label: t("Project Brief.docx", "Project Brief.docx"), sub: t("منذ ساعة • رابط دلالي", "1 hour ago • Semantic Link"), color: "bg-[#ad1d7f]/10 text-[#ad1d7f] group-hover:bg-[#ad1d7f] group-hover:text-white", href: "/vault/upload" },
    { icon: Code2, label: t("مقتطف Python AI", "Python Neural Config"), sub: t("منذ 3 ساعات • استيراد ويب", "3 hours ago • Web Clipping"), color: "bg-[#385b9b]/10 text-[#385b9b] group-hover:bg-[#385b9b] group-hover:text-white", href: "/vault" },
  ];

  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("التقاطات الأخيرة", "Recent Captures")}
      </h2>
      <div className="glass-card p-6 rounded-2xl shadow-ambient space-y-3 border border-white/40">
        {captures.map(({ icon: Icon, label, sub, color, href }) => (
          <Link
            key={href + label}
            href={href}
            className="flex items-center gap-4 p-3 bg-[#f6f3f2] rounded-xl group hover:bg-white transition-all cursor-pointer"
          >
            <div className={`p-2 ${color} rounded-full transition-colors shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate font-label">{label as string}</p>
              <p className="text-xs text-slate-500">{sub as string}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── AI Insight card ───────────────────────────────────────────────────────────

function AIInsight() {
  const { t } = useLanguage();
  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("رؤى الذكاء الاصطناعي", "AI Insights")}
      </h2>
      <div className="bg-[#2552ca] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <span className="text-xl mb-4 block">✦</span>
        <p className="text-sm font-medium leading-relaxed mb-4">
          {t(
            "ذكرت \"الذكاء الاصطناعي الأخلاقي\" في 3 سياقات مختلفة اليوم. هل تريد توليفها في ملاحظة بحثية؟",
            "You've mentioned \"Ethical AI\" in 3 different contexts today. Would you like to synthesize these into a research note?"
          )}
        </p>
        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all">
          {t("مراجعة الاتصال", "Review Connection")}
        </button>
      </div>
    </section>
  );
}

// ── Focus Stream ──────────────────────────────────────────────────────────────

function FocusStream() {
  const { t } = useLanguage();
  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-extrabold tracking-tight text-slate-800">
        {t("تيار التركيز", "Focus Stream")}
      </h2>
      <div className="space-y-3">
        <div className="glass-card p-5 rounded-2xl border border-white/40">
          <div className="flex items-start justify-between mb-3">
            <span className="px-3 py-1 bg-[#ffd8e9] text-[#3c0029] text-[10px] font-bold rounded-full uppercase tracking-widest font-label">
              {t("مهمة نشطة", "Active Task")}
            </span>
            <span className="text-xs text-slate-400">00:42:15</span>
          </div>
          <h4 className="font-headline font-bold text-sm mb-2">
            {t("تحسين البنية العصبية", "Refining Neural Architecture")}
          </h4>
          <p className="text-xs text-slate-500 line-clamp-2">
            {t("العمل على رسم خريطة المساحة الكامنة لعقد الذاكرة.", "Working on latent space mapping for cognitive memory nodes.")}
          </p>
          <div className="mt-3 flex -space-x-2">
            {["bg-slate-300", "bg-slate-400", "bg-[#2552ca]"].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${c} flex items-center justify-center text-[8px] text-white font-bold`}>
                {i === 2 ? "+4" : ""}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-[#f6f3f2] rounded-2xl opacity-60">
          <h4 className="font-headline font-bold text-sm mb-1">
            {t("قادم: مزامنة الذاكرة", "Upcoming: Sync Mind")}
          </h4>
          <p className="text-xs text-slate-500">{t("مجدول للساعة 4:00 مساءً", "Scheduled for 4:00 PM")}</p>
        </div>
      </div>
    </section>
  );
}

// ── Central Aura visualization ────────────────────────────────────────────────

function AuraVisualization() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {/* Aura sphere */}
      <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center aura-gradient rounded-full mb-12">
        {/* Core */}
        <div className="relative z-10 w-52 h-52 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] shadow-[0_0_80px_rgba(37,82,202,0.4)] flex items-center justify-center">
          <span className="text-white text-4xl font-headline font-bold">ذ</span>
        </div>

        {/* Orbiting nodes */}
        {[
          { pos: "top-10 left-10", label: t("نظرية الكم", "Quantum Theory"), dot: "bg-[#ad1d7f]" },
          { pos: "top-1/4 right-0", label: t("مشروع أورا", "Project Aura"), dot: "bg-[#2552ca]" },
          { pos: "bottom-10 left-1/4", label: t("أهداف الأسبوع", "Weekly Goals"), dot: "bg-[#385b9b]" },
        ].map(({ pos, label, dot }) => (
          <div
            key={label as string}
            className={`absolute ${pos} p-3 glass-card rounded-xl shadow-lg border border-white/40 hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs font-bold font-label whitespace-nowrap">{label as string}</span>
            </div>
          </div>
        ))}

        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 440 440">
          <path d="M88 88 Q 220 220 280 160" fill="none" stroke="rgba(37,82,202,0.2)" strokeWidth="2" />
          <path d="M352 176 Q 220 220 158 368" fill="none" stroke="rgba(253,101,194,0.2)" strokeWidth="2" />
        </svg>
      </div>

      {/* Label below */}
      <div className="text-center">
        <h1 className="text-3xl font-headline font-extrabold tracking-tighter text-slate-900">
          {t("التركيز الحالي: العمل العميق", "Current Focus: Deep Work")}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {t("تم رصد 9 اتصالات عصبية نشطة", "9 active neural connections detected")}
        </p>
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

export default function VaultPage() {
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

      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();
      if (!membership) return;

      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("id", membership.team_id)
        .single();
      if (!team) return;
      setCurrentTeam(team as Team);

      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("team_id", team.id);

      setTeamMembers(
        members?.map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name ?? t("عضو الفريق", "Team Member"),
          avatar: m.profiles?.avatar_url ?? null,
        })) ?? []
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

  // Team dashboard
  if (isTeamSubscription) {
    if (!currentTeam) return <VaultSkeleton />;
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

  // Individual dashboard
  return (
    <PageShell>
      <VaultHeader />

      {/* Page background blobs */}
      <div className="absolute top-40 right-[-10%] w-96 h-96 bg-[#2552ca]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-72 w-80 h-80 bg-[#ad1d7f]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="pt-24 lg:pt-28 px-6 pb-16 min-h-screen relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── Left column ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="xl:col-span-3 space-y-8 order-2 xl:order-1"
          >
            <RecentCaptures />
            <AIInsight />
          </motion.div>

          {/* ── Center: Aura visualization ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="xl:col-span-6 order-1 xl:order-2"
          >
            <AuraVisualization />
          </motion.div>

          {/* ── Right column ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="xl:col-span-3 space-y-8 order-3"
          >
            <FocusStream />
            <MindMetrics />
          </motion.div>

        </div>

        {/* AI Chat section */}
        <div className="max-w-7xl mx-auto mt-16">
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
