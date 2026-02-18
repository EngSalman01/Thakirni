"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { TeamDashboard } from "@/components/dashboards/team-dashboard";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { getTeamBySlug, getTeamTasks } from "@/app/actions/teams";

export default function TeamPage() {
  const { slug } = useParams() as { slug: string };
  const { subscriptionType, loading: subscriptionLoading } = useSubscription();
  const [team, setTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch team details
        const teamData = await getTeamBySlug(slug);
        if (teamData) {
          setTeam(teamData);

          // Fetch team members
          const supabase = createClient();
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
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [slug]);

  // Show team's Kanban board if subscription is team or company
  if (subscriptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has team/company subscription, show enhanced Kanban board
  if ((subscriptionType === "team" || subscriptionType === "company") && team) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        <VaultSidebar />
        <main className="lg:me-64 p-6">
          <TeamDashboard team={team} teamMembers={teamMembers} />
        </main>
      </motion.div>
    );
  }

  // For individual subscription, show upgrade prompt
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <VaultSidebar />
      <main className="lg:me-64 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Team View</h2>
            <p className="text-muted-foreground">
              Upgrade to Team or Company plan to access full team collaboration features.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
