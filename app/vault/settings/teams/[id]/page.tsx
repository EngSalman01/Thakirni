import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamDetails, getTeamMembers } from "@/app/actions/teams";
import { getTeamProjects } from "@/app/actions/projects";
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
  User,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";

export default async function TeamSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch team details
  const teamResult = await getTeamDetails(params.id);
  if (teamResult.error || !teamResult.data) {
    notFound();
  }

  const team = teamResult.data;
  const userRole = teamResult.userRole;

  // Fetch team members
  const membersResult = await getTeamMembers(params.id);
  const members = membersResult.data || [];

  // Fetch projects
  const projectsResult = await getTeamProjects(params.id);
  const projects = projectsResult.data || [];

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "member":
        return <User className="w-4 h-4 text-muted-foreground" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      owner: "bg-yellow-500/10 text-yellow-600",
      admin: "bg-blue-500/10 text-blue-600",
      member: "bg-gray-500/10 text-gray-600",
      viewer: "bg-gray-500/10 text-gray-600",
    };

    return (
      <Badge className={variants[role] || ""}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionStatusBadge = () => {
    if (team.subscription_status === "active") {
      return (
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Active</span>
        </div>
      );
    }

    if (team.subscription_status === "trial") {
      return (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Trial</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
        <XCircle className="w-5 h-5" />
        <span className="font-medium">Inactive</span>
      </div>
    );
  };

  const getTierDisplay = () => {
    const tierLabels: Record<string, string> = {
      starter: "Starter (Up to 5 users)",
      pro: "Pro (Unlimited users)",
      enterprise: "Enterprise",
    };
    return tierLabels[team.tier] || team.tier;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8 text-emerald-600" />
              {team.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Team Settings & Management
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/vault">Back to Vault</Link>
          </Button>
        </div>

        {/* Subscription Warning */}
        {team.subscription_status !== "active" && userRole === "owner" && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Subscription Inactive
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your team subscription is currently inactive. Team members
                    cannot access team features until you renew your
                    subscription.
                  </p>
                  <Button className="bg-red-600 hover:bg-red-500 text-white">
                    Renew Subscription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Basic details about this team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Team Name
                </label>
                <p className="text-lg font-semibold">{team.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Team URL
                </label>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded">
                  thakirni.com/team/{team.slug}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">
                  {new Date(team.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Billing and plan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">{getSubscriptionStatusBadge()}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Plan
                </label>
                <p className="text-lg font-semibold">{getTierDisplay()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Members
                </label>
                <p className="text-sm">
                  {members.length} /{" "}
                  {team.tier === "starter" ? "5" : "Unlimited"}
                </p>
              </div>

              {userRole === "owner" && (
                <Button variant="outline" className="w-full">
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({members.length})
                </CardTitle>
                <CardDescription>
                  Manage who has access to this team
                </CardDescription>
              </div>

              {(userRole === "owner" || userRole === "admin") &&
                team.subscription_status === "active" && (
                  <Button>Invite Member</Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.profile?.avatar_url} />
                      <AvatarFallback>
                        {member.profile?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {member.profile?.full_name || "Unknown User"}
                        </p>
                        {member.user_id === team.owner_id && (
                          <Crown className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}

                    {userRole === "owner" && member.role !== "owner" && (
                      <Button variant="ghost" size="sm">
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
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" />
                  Projects ({projects.length})
                </CardTitle>
                <CardDescription>
                  Organize your team's tasks into projects
                </CardDescription>
              </div>

              {(userRole === "owner" || userRole === "admin") && (
                <Button>Create Project</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/vault/projects/${project.id}`}
                    className="block p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="font-semibold">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet. Create one to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
