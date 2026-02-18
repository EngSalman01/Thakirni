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
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-sm text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const getRoleBadge = (role: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: any; border: string }
    > = {
      owner: {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-500",
        icon: Crown,
        border: "border-amber-500/20",
      },
      admin: {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-500",
        icon: Shield,
        border: "border-blue-500/20",
      },
      member: {
        bg: "bg-teal-500/10",
        text: "text-teal-600 dark:text-teal-500",
        icon: UserIcon,
        border: "border-teal-500/20",
      },
      viewer: {
        bg: "bg-slate-500/10",
        text: "text-slate-600 dark:text-slate-400",
        icon: Eye,
        border: "border-slate-500/20",
      },
    };

    const { bg, text, icon: Icon, border } = config[role] || config.member;

    return (
      <Badge
        className={`${bg} ${text} ${border} border flex items-center gap-1.5 px-3 py-1`}
      >
        <Icon className="w-3.5 h-3.5" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionBadge = () => {
    if (team.subscription_status === "active") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 w-fit">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Active</span>
        </div>
      );
    }

    if (team.subscription_status === "trial") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 w-fit">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Trial</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 w-fit">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link href="/vault" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Vault
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              {team.name}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Team settings and collaboration
            </p>
          </div>
        </motion.div>

        {/* Subscription Alert */}
        {team.subscription_status !== "active" && userRole === "owner" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
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
                      className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                    >
                      Renew Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <FolderKanban className="w-6 h-6 text-white" />
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

          <Card className="border-teal-500/20 bg-teal-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getTierDisplay()}</p>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Team Details
                </CardTitle>
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
                  <p className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg mt-1">
                    {team.slug}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-2">{getSubscriptionBadge()}</div>
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
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">
                    Manage Billing
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Members & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Members */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Team Members
                      </CardTitle>
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
                          className="bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.map((member: any) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-md">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
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

                        <div className="flex items-center gap-3">
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
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-orange-500" />
                        Projects
                      </CardTitle>
                      <CardDescription>
                        Organize work into projects
                      </CardDescription>
                    </div>

                    {(userRole === "owner" || userRole === "admin") && (
                      <Button
                        size="sm"
                        onClick={() => setCreateProjectDialogOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
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
                      {projects.map((project: any, i) => (
                        <motion.a
                          key={project.id}
                          href={`/vault/projects/${project.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          whileHover={{ scale: 1.03, y: -3 }}
                          className="block p-4 border border-border rounded-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: project.color }}
                            />
                            <h3 className="font-semibold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                        <FolderKanban className="w-8 h-8 text-orange-500" />
                      </div>
                      <p className="text-sm">No projects yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
