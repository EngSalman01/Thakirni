"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IndividualDashboard } from "@/components/thakirni/individual-dashboard";
import { TeamDashboardMain } from "@/components/thakirni/team-dashboard-main";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardRouter() {
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPlanTier("FREE");
          setIsLoading(false);
          return;
        }

        // Get user's plan tier
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_tier")
          .eq("id", user.id)
          .single();

        // Check if user is in any teams
        const { data: teamMemberships } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .limit(1);

        setPlanTier(profile?.plan_tier || "FREE");
        setHasTeam((teamMemberships?.length || 0) > 0);
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setPlanTier("FREE");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPlan();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Show team dashboard if user has team/company plan OR is member of any team
  const showTeamDashboard = planTier === "COMPANY" || hasTeam;

  return showTeamDashboard ? <TeamDashboardMain /> : <IndividualDashboard />;
}
