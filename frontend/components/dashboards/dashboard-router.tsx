'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/hooks/use-subscription';
import { Skeleton } from '@/components/ui/skeleton';
import { VaultSidebar } from '@/components/thakirni/vault-sidebar';
import { Loader2 } from 'lucide-react';

const supabase = createClient();

const VaultPage = dynamic(
  () => import('@/app/vault/page'),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

const TeamDashboard = dynamic(
  () => import('@/components/dashboards/team-dashboard').then(mod => mod.TeamDashboard),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardRouter() {
  const { subscriptionType, loading: subscriptionLoading } = useSubscription();
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  // Fetch team and members for team/company subscriptions
  useEffect(() => {
    if (subscriptionType === 'team' || subscriptionType === 'company') {
      fetchTeamData();
    }
  }, [subscriptionType]);

  const fetchTeamData = async () => {
    setIsLoadingTeam(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team where user is a member
      const { data: teamMemberData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (teamMemberData) {
        // Get team details
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamMemberData.team_id)
          .single();

        if (teamData) {
          setCurrentTeam(teamData);

          // Get all team members with profiles
          const { data: membersData } = await supabase
            .from('team_members')
            .select('user_id, profiles(full_name, avatar_url)')
            .eq('team_id', teamData.id);

          setTeamMembers(
            membersData?.map((m: any) => ({
              id: m.user_id,
              name: m.profiles?.full_name || 'Team Member',
              avatar: m.profiles?.avatar_url,
            })) || []
          );
        }
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  if (subscriptionLoading || isLoadingTeam) {
    return <DashboardSkeleton />;
  }

  // Individual subscription - show memory-focused dashboard (Memorae-style)
  if (subscriptionType === 'individual') {
    return <VaultPage />;
  }

  // Team subscription - show Asana-style Kanban board with memories and reminders
  if (subscriptionType === 'team' && currentTeam) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex flex-col"
      >
        <VaultSidebar />
        <main className="lg:me-64 flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="p-6">
              <TeamDashboard team={currentTeam} teamMembers={teamMembers} />
            </div>
          </div>
        </main>
      </motion.div>
    );
  }

  // Company subscription - show Asana-style Kanban board with memories and reminders
  if (subscriptionType === 'company' && currentTeam) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex flex-col"
      >
        <VaultSidebar />
        <main className="lg:me-64 flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="p-6">
              <TeamDashboard team={currentTeam} teamMembers={teamMembers} />
            </div>
          </div>
        </main>
      </motion.div>
    );
  }

  // Fallback - show individual dashboard
  return <VaultPage />;
}
