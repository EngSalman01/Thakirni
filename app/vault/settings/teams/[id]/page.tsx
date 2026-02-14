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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
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
        bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
        text: "text-amber-600 dark:text-amber-500",
        icon: Crown,
        border: "border-amber-200 dark:border-amber-900",
      },
      admin: {
        bg: "bg-gradient-to-r from-indigo-500/10 to-purple-500/10",
        text: "text-indigo-600 dark:text-indigo-500",
        icon: Shield,
        border: "border-indigo-200 dark:border-indigo-900",
      },
      member: {
        bg: "bg-gradient-to-r from-sky-500/10 to-sky-600/10",
        text: "text-sky-600 dark:text-sky-500",
        icon: UserIcon,
        border: "border-sky-200 dark:border-sky-900",
      },
      viewer: {
        bg: "bg-slate-500/10",
        text: "text-slate-600 dark:text-slate-500",
        icon: Eye,
        border: "border-slate-200 dark:border-slate-900",
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
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900 w-fit">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Active</span>
        </div>
      );
    }

    if (team.subscription_status === "trial") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-900 w-fit">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Trial</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900 w-fit">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5">
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
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              {team.name}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
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
            <Card className="border-rose-200 dark:border-rose-900 bg-gradient-to-r from-rose-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
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
                      className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/20"
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
          <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-500/5 to-transparent overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-500/5 to-transparent overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
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

          <Card className="border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-500/5 to-transparent overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
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
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
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
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20">
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
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
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
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20"
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
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-md">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold">
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-600 hover:text-rose-500 hover:bg-rose-500/10"
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
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-purple-500" />
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
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20"
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
                          className="block p-4 border border-border/50 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: project.color }}
                            />
                            <h3 className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <FolderKanban className="w-8 h-8 text-purple-500" />
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
