"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getTeamDetails,
  getTeamMembers,
  removeMember,
} from "@/app/actions/teams";
import { getTeamProjects } from "@/app/actions/projects";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { CreateProjectDialog } from "@/components/team/create-project-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FolderKanban,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TeamSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth");
          return;
        }

        const teamResult = await getTeamDetails(params.id);
        if (teamResult.error || !teamResult.data) {
          router.push("/vault");
          return;
        }

        setTeam(teamResult.data);
        setUserRole(teamResult.userRole || "");

        const membersResult = await getTeamMembers(params.id);
        setMembers(membersResult.data || []);

        const projectsResult = await getTeamProjects(params.id);
        setProjects(projectsResult.data || []);
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast.error("Failed to load team data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const result = await removeMember(params.id, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member removed successfully");
        const membersResult = await getTeamMembers(params.id);
        setMembers(membersResult.data || []);
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-500/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-sm text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      owner: {
        bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
        text: "text-amber-600 dark:text-amber-500",
        icon: Crown,
      },
      admin: {
        bg: "bg-gradient-to-r from-violet-500/10 to-purple-500/10",
        text: "text-violet-600 dark:text-violet-500",
        icon: Shield,
      },
      member: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-600 dark:text-cyan-500",
        icon: UserIcon,
      },
      viewer: {
        bg: "bg-slate-500/10",
        text: "text-slate-600 dark:text-slate-500",
        icon: Eye,
      },
    };

    const { bg, text, icon: Icon } = config[role] || config.member;

    return (
      <Badge
        className={`${bg} ${text} border-0 flex items-center gap-1.5 px-2.5 py-1`}
      >
        <Icon className="w-3.5 h-3.5" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionBadge = () => {
    if (team.subscription_status === "active") {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 w-fit">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Active</span>
        </div>
      );
    }

    if (team.subscription_status === "trial") {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 w-fit">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Trial</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-500 w-fit">
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Inactive</span>
      </div>
    );
  };

  const getTierDisplay = () => {
    const tierLabels: Record<string, string> = {
      starter: "Starter",
      pro: "Professional",
      enterprise: "Enterprise",
    };
    return tierLabels[team.tier] || team.tier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-500/5">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link href="/vault" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Vault
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              {team.name}
            </h1>
            <p className="text-muted-foreground">
              Team settings and member management
            </p>
          </div>
        </div>

        {/* Subscription Alert */}
        {team.subscription_status !== "active" && userRole === "owner" && (
          <Card className="border-red-200 dark:border-red-900 bg-gradient-to-r from-red-500/5 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    Subscription Required
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your team's subscription is inactive. Renew to restore
                    access for all members.
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                  >
                    Renew Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-cyan-200/50 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200/50 dark:border-violet-900/50 bg-gradient-to-br from-violet-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Active Projects
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getTierDisplay()}</p>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Team Details</CardTitle>
              <CardDescription>Basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team Name
                </label>
                <p className="text-sm font-medium mt-1">{team.name}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team Slug
                </label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                  {team.slug}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </label>
                <div className="mt-1">{getSubscriptionBadge()}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Created
                </label>
                <p className="text-sm mt-1">
                  {new Date(team.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {userRole === "owner" && (
                <Button variant="outline" className="w-full mt-4">
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Members & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <CardDescription>
                      {members.length} of{" "}
                      {team.tier === "starter" ? "5" : "unlimited"} members
                    </CardDescription>
                  </div>

                  {(userRole === "owner" || userRole === "admin") &&
                    team.subscription_status === "active" && (
                      <Button
                        size="sm"
                        onClick={() => setInviteDialogOpen(true)}
                        className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 border-2 border-background shadow-sm">
                          <AvatarImage src={member.profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white text-sm">
                            {member.profile?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {member.profile?.full_name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}

                        {userRole === "owner" && member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-500 hover:bg-red-500/10"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Projects</CardTitle>
                    <CardDescription>
                      Organize work into projects
                    </CardDescription>
                  </div>

                  {(userRole === "owner" || userRole === "admin") && (
                    <Button
                      size="sm"
                      onClick={() => setCreateProjectDialogOpen(true)}
                      variant="outline"
                    >
                      <FolderKanban className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {projects.map((project: any) => (
                      <Link
                        key={project.id}
                        href={`/vault/projects/${project.id}`}
                        className="block p-3 border border-border/50 rounded-lg hover:border-violet-500/50 hover:shadow-md hover:shadow-violet-500/10 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <h3 className="font-semibold text-sm group-hover:text-violet-600 transition-colors">
                            {project.name}
                          </h3>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No projects yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={params.id}
      />

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        teamId={params.id}
      />
    </div>
  );
}
