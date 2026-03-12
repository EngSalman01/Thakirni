"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { TeamDashboard } from "@/components/dashboards/team-dashboard";
import { useSubscription } from "@/hooks/use-subscription";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ArrowRight } from "lucide-react";
import { getTeamBySlug } from "@/app/actions/teams";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
}

// ── Shared shell (keeps sidebar always visible) ───────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 transition-all duration-300 p-6">
        {children}
      </main>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TeamPageSkeleton() {
  return (
    <PageShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </PageShell>
  );
}

// ── Upgrade prompt ────────────────────────────────────────────────────────────

function UpgradePrompt() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <PageShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {t("ميزة الفرق", "Team Feature")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(
              "قم بالترقية إلى باقة الفرق للوصول إلى لوحة كانبان والتعاون مع فريقك.",
              "Upgrade to the Team plan to access the Kanban board and collaborate with your team.",
            )}
          </p>
          <Button
            className="gap-2 mt-2"
            onClick={() => router.push("/pricing")}
          >
            {t("ترقية الآن", "Upgrade Now")}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </motion.div>
      </div>
    </PageShell>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <PageShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" onClick={onRetry}>
            {t("حاول مرة أخرى", "Try again")}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { slug } = useParams() as { slug: string };
  const { subscriptionType, isLoading: subscriptionLoading } = useSubscription();
  const { t } = useLanguage();
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTeamData = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Auth guard
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      // Fetch team
      const teamData = await getTeamBySlug(slug) as Team | null;
      if (!teamData) {
        setError(t("لم يتم العثور على الفريق", "Team not found."));
        return;
      }
      setTeam(teamData);

      // Verify the user is actually a member of this team
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamData.id)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        setError(t("ليس لديك صلاحية الوصول لهذا الفريق", "You don't have access to this team."));
        return;
      }

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("team_id", teamData.id);

      if (membersError) throw membersError;

      setTeamMembers(
        membersData?.map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name ?? t("عضو الفريق", "Team Member"),
          avatar: m.profiles?.avatar_url ?? null,
        })) ?? [],
      );
    } catch (err: any) {
      console.error("[TeamPage] fetch error:", err);
      setError(t("فشل تحميل بيانات الفريق", "Failed to load team data."));
    } finally {
      setIsLoading(false);
    }
  }, [slug, router, t]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Wait for both subscription and team data
  if (subscriptionLoading || isLoading) return <TeamPageSkeleton />;

  // Error state
  if (error) return <ErrorState message={error} onRetry={fetchTeamData} />;

  // Non-team subscription — show upgrade prompt
  const isTeamSubscription =
    subscriptionType === "team" || subscriptionType === "company";

  if (!isTeamSubscription) return <UpgradePrompt />;

  // Team not found (shouldn't normally reach here after error check, but guards rendering)
  if (!team) return <UpgradePrompt />;

  // ── Team dashboard ──────────────────────────────────────────────────────

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <TeamDashboard team={team} teamMembers={teamMembers} />
      </motion.div>
    </PageShell>
  );
}