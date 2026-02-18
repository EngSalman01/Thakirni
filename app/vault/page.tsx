"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Upload,
  ImageIcon,
  Mic,
  FileText,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useMemories } from "@/hooks/use-memories";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";

// Dynamic import to prevent SSR issues with AI SDK
const AIChat = dynamic(
  () =>
    import("@/components/thakirni/ai-chat").then((mod) => ({
      default: mod.AIChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    ),
  },
);

export default function VaultPage() {
  const { subscriptionType, isLoading: subscriptionLoading } = useSubscription();
  const [currentTeam, setCurrentTeam] = React.useState<any>(null);
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = React.useState(false);

  // Fetch team for team/company subscriptions
  React.useEffect(() => {
    if (subscriptionType === "team" || subscriptionType === "company") {
      fetchTeamData();
    }
  }, [subscriptionType]);

  const fetchTeamData = async () => {
    setIsLoadingTeam(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teamMemberData } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (teamMemberData) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamMemberData.team_id)
          .single();

        if (teamData) {
          setCurrentTeam(teamData);

          const { data: membersData } = await supabase
            .from("team_members")
            .select("user_id, profiles(full_name, avatar_url)")
            .eq("team_id", teamData.id);

          setTeamMembers(
            membersData?.map((m: any) => ({
              id: m.user_id,
              name: m.profiles?.full_name || "Team Member",
              avatar: m.profiles?.avatar_url,
            })) || []
          );
        }
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // Import TeamDashboard dynamically to avoid circular imports
  const TeamDashboard = dynamic(
    () => import("@/components/dashboards/team-dashboard").then(mod => ({ default: mod.TeamDashboard })),
    { ssr: false }
  );

  if (subscriptionLoading || isLoadingTeam) {
    return (
      <div className="min-h-screen bg-background">
        <VaultSidebar />
        <main className="lg:me-64 p-6">
          <Skeleton className="h-12 w-1/3 mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show team dashboard for team/company subscriptions
  if ((subscriptionType === "team" || subscriptionType === "company") && currentTeam) {
    return (
      <div className="min-h-screen bg-background">
        <VaultSidebar />
        <main className="lg:me-64 p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TeamDashboard team={currentTeam} teamMembers={teamMembers} />
          </motion.div>
        </main>
      </div>
    );
  }

  // Individual dashboard (original vault content)
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300">
        <DashboardRouter />
      </main>
    </div>
  );
}
