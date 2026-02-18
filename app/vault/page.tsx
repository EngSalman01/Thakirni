"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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

  const { t } = useLanguage();
  const router = useRouter();

  const handleNewMemory = () => {
    router.push("/vault/new-memory");
  };

  const handleVoiceNote = () => {
    router.push("/vault/voice-note");
  };

  const handleUpload = () => {
    router.push("/vault/upload");
  };

  const handleReminders = () => {
    router.push("/vault/reminders");
  };

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
        <div className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Your Vault</h1>
                <p className="text-muted-foreground mt-2">
                  Your personal memory collection and reminders
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 gap-2 cursor-pointer"
                onClick={handleNewMemory}
              >
                <Plus className="w-4 h-4" />
                New Memory
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 gap-2 cursor-pointer"
                onClick={handleVoiceNote}
              >
                <Mic className="w-4 h-4" />
                Voice Note
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 gap-2 cursor-pointer"
                onClick={handleUpload}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 gap-2 cursor-pointer"
                onClick={handleReminders}
              >
                <Bell className="w-4 h-4" />
                Reminders
              </Button>
            </div>

            {/* Chat Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  Chat with your memories and get insights
                </p>
              </div>
              <AIChat />
            </div>

            {/* Placeholder for memories list */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Recent Memories</h2>
                <p className="text-sm text-muted-foreground">
                  Your saved memories and notes appear here
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors cursor-pointer"
                  >
                    <div className="text-sm text-muted-foreground mb-2">
                      Memory {i}
                    </div>
                    <div className="h-20 bg-muted/20 rounded flex items-center justify-center text-muted-foreground">
                      No memories yet
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
