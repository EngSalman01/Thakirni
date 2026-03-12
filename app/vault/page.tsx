"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Plus, Upload, Mic, Brain } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";

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

// ── Dynamic Imports (defined OUTSIDE component so they're stable references) ──

const AIChat = dynamic(
  () => import("@/components/thakirni/ai-chat").then((m) => ({ default: m.AIChat })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Brain className="w-8 h-8 animate-pulse" />
          <span className="text-sm">Loading assistant...</span>
        </div>
      </div>
    ),
  },
);

const TeamDashboard = dynamic(
  () =>
    import("@/components/dashboards/team-dashboard").then((m) => ({
      default: m.TeamDashboard,
    })),
  { ssr: false },
);

// ── Quick Actions config ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: Plus, href: "/vault/new-memory", labelAr: "ذكرى جديدة", labelEn: "New Memory" },
  { icon: Mic, href: "/vault/voice-note", labelAr: "ملاحظة صوتية", labelEn: "Voice Note" },
  { icon: Upload, href: "/vault/upload", labelAr: "رفع ملف", labelEn: "Upload" },
  { icon: Bell, href: "/vault/reminders", labelAr: "التذكيرات", labelEn: "Reminders" },
] as const;

// ── Shared page shell ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function VaultSkeleton() {
  return (
    <PageShell>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    </PageShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const { subscriptionType, isLoading: subscriptionLoading } = useSubscription();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const { t } = useLanguage();
  const router = useRouter();

  // ── Fetch team data ──────────────────────────────────────────────────────

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
        })) ?? [],
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

  // ── Loading ──────────────────────────────────────────────────────────────

  const isTeamSubscription =
    subscriptionType === "team" || subscriptionType === "company";

  if (subscriptionLoading || (isTeamSubscription && isLoadingTeam)) {
    return <VaultSkeleton />;
  }

  // ── Team dashboard ───────────────────────────────────────────────────────

  if (isTeamSubscription) {
    // Still loading team (edge case: subscription loaded, team fetch in flight)
    if (!currentTeam) return <VaultSkeleton />;

    return (
      <PageShell>
        <div className="p-6 md:p-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TeamDashboard team={currentTeam} teamMembers={teamMembers} />
          </motion.div>
        </div>
      </PageShell>
    );
  }

  // ── Individual dashboard ─────────────────────────────────────────────────

  return (
    <PageShell>
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("خزينتك", "Your Vault")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t(
                  "مجموعة ذكرياتك الشخصية وتذكيراتك",
                  "Your personal memory collection and reminders",
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MobileMenuButton />
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {QUICK_ACTIONS.map(({ icon: Icon, href, labelAr, labelEn }) => (
              <Button
                key={href}
                variant="outline"
                className="h-12 gap-2"
                onClick={() => router.push(href)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t(labelAr, labelEn)}</span>
              </Button>
            ))}
          </motion.div>

          {/* AI Chat */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-3"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("المساعد الذكي", "AI Assistant")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "تحدّث مع ذكرياتك واحصل على رؤى",
                  "Chat with your memories and get insights",
                )}
              </p>
            </div>
            <AIChat />
          </motion.div>

        </div>
      </div>
    </PageShell>
  );
}