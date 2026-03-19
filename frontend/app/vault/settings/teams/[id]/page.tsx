"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getTeamDetails,
  getTeamMembers,
  removeMember,
} from "@/app/actions/teams";
import { getTeamProjects } from "@/app/actions/projects";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { CreateProjectDialog } from "@/components/team/create-project-dialog";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { useLanguage } from "@/components/language-provider";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, Crown, Shield,
  User as UserIcon, Eye, AlertCircle, CheckCircle2,
  XCircle, FolderKanban, ArrowLeft, Sparkles, TrendingUp, Plus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "owner" | "admin" | "member" | "viewer";
type SubscriptionStatus = "active" | "trial" | "inactive";

interface Team {
  id: string;
  name: string;
  slug: string;
  tier: string;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, { ar: string; en: string }> = {
  starter: { ar: "المبتدئ", en: "Starter" },
  pro: { ar: "الاحترافي", en: "Professional" },
  enterprise: { ar: "المؤسسات", en: "Enterprise" },
};

const TIER_MEMBER_LIMIT: Record<string, number | null> = {
  starter: 5,
  pro: 20,
  enterprise: null,   // unlimited
};

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { bg: string; text: string; border: string; icon: React.ElementType; ar: string; en: string }> = {
  owner: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20", icon: Crown, ar: "مالك", en: "Owner" },
  admin: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-500", border: "border-blue-500/20", icon: Shield, ar: "مشرف", en: "Admin" },
  member: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-500", border: "border-teal-500/20", icon: UserIcon, ar: "عضو", en: "Member" },
  viewer: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", icon: Eye, ar: "مشاهد", en: "Viewer" },
};

function RoleBadge({ role, t }: { role: Role; t: (ar: string, en: string) => string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
  const Icon = cfg.icon;
  return (
    <Badge className={cn(cfg.bg, cfg.text, cfg.border, "border flex items-center gap-1.5 px-3 py-1 shrink-0")}>
      <Icon className="w-3.5 h-3.5" />
      {t(cfg.ar, cfg.en)}
    </Badge>
  );
}

// ── Subscription badge ────────────────────────────────────────────────────────

function SubscriptionBadge({ status, t }: { status: SubscriptionStatus; t: (ar: string, en: string) => string }) {
  const map: Record<SubscriptionStatus, { bg: string; text: string; border: string; icon: React.ElementType; ar: string; en: string }> = {
    active: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20", icon: CheckCircle2, ar: "نشط", en: "Active" },
    trial: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", icon: Sparkles, ar: "تجريبي", en: "Trial" },
    inactive: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", icon: XCircle, ar: "غير نشط", en: "Inactive" },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <div className={cn(cfg.bg, cfg.text, cfg.border, "flex items-center gap-2 px-4 py-2 rounded-full border w-fit text-sm font-medium")}>
      <Icon className="w-4 h-4" />
      {t(cfg.ar, cfg.en)}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamSettingsPage() {
  // Next.js 15: useParams() instead of props.params
  const { id: teamId } = useParams() as { id: string };
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<Role>("member");
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Remove confirmation dialog state
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const teamResult = await getTeamDetails(teamId);
      if (teamResult.error || !teamResult.data) {
        toast.error(t("لم يتم العثور على الفريق", "Team not found"));
        router.push("/vault");
        return;
      }

      setTeam(teamResult.data as Team);
      setUserRole((teamResult.userRole as Role) || "member");

      const [membersResult, projectsResult] = await Promise.all([
        getTeamMembers(teamId),
        getTeamProjects(teamId),
      ]);

      setMembers((membersResult.data ?? []) as Member[]);
      setProjects((projectsResult.data ?? []) as Project[]);
    } catch (err) {
      console.error("[TeamSettings] fetch error:", err);
      toast.error(t("فشل تحميل بيانات الفريق", "Failed to load team data"));
    } finally {
      setLoading(false);
    }
  }, [teamId, router, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Remove member ──────────────────────────────────────────────────────────

  const confirmRemove = async () => {
    if (!removingMember) return;
    setRemoveLoading(true);
    try {
      const result = await removeMember(teamId, removingMember.user_id);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Optimistic update — no re-fetch needed
        setMembers((prev) => prev.filter((m) => m.user_id !== removingMember.user_id));
        toast.success(t("تم إزالة العضو", "Member removed"));
      }
    } catch {
      toast.error(t("فشل إزالة العضو", "Failed to remove member"));
    } finally {
      setRemoveLoading(false);
      setRemovingMember(null);
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) return <PageSkeleton />;
  if (!team) return null;

  const tierLabel = t(TIER_LABELS[team.tier]?.ar ?? team.tier, TIER_LABELS[team.tier]?.en ?? team.tier);
  const memberLimit = TIER_MEMBER_LIMIT[team.tier];
  const canManage = userRole === "owner" || userRole === "admin";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Button variant="ghost" size="sm" asChild className="-ms-2">
              <Link href="/vault" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t("العودة للخزينة", "Back to Vault")}
              </Link>
            </Button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{team.name}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                  {t("إعدادات الفريق والتعاون", "Team settings and collaboration")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Subscription alert (owners only) */}
          <AnimatePresence>
            {team.subscription_status !== "active" && userRole === "owner" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">
                          {t("الاشتراك مطلوب", "Subscription Required")}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {t(
                            "اشتراك فريقك غير نشط. قم بالتجديد لاستعادة الوصول لجميع الأعضاء.",
                            "Your team's subscription is inactive. Renew to restore access for all members.",
                          )}
                        </p>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => router.push("/pricing")}
                        >
                          {t("تجديد الآن", "Renew Now")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-3 gap-4"
          >
            {[
              { icon: Users, color: "blue", value: members.length, labelAr: "أعضاء الفريق", labelEn: "Team Members" },
              { icon: FolderKanban, color: "orange", value: projects.length, labelAr: "المشاريع", labelEn: "Active Projects" },
              { icon: TrendingUp, color: "teal", value: tierLabel, labelAr: "الخطة الحالية", labelEn: "Current Plan" },
            ].map(({ icon: Icon, color, value, labelAr, labelEn }) => (
              <Card key={labelEn} className={`border-${color}-500/20 bg-${color}-500/5`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500 flex items-center justify-center shadow-lg shadow-${color}-500/30`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{t(labelAr, labelEn)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Team info */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {t("تفاصيل الفريق", "Team Details")}
                  </CardTitle>
                  <CardDescription>{t("المعلومات الأساسية", "Basic information")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("اسم الفريق", "Team Name")}
                    </p>
                    <p className="text-sm font-medium">{team.name}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("معرف الفريق", "Team Slug")}
                    </p>
                    <p className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg">{team.slug}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("الحالة", "Status")}
                    </p>
                    <SubscriptionBadge status={team.subscription_status} t={t} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("تاريخ الإنشاء", "Created")}
                    </p>
                    <p className="text-sm">
                      {new Date(team.created_at).toLocaleDateString("ar-SA", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>

                  {userRole === "owner" && (
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20"
                      onClick={() => router.push(`/vault/settings/billing?team=${teamId}`)}
                    >
                      {t("إدارة الفوترة", "Manage Billing")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Members + Projects */}
            <div className="lg:col-span-2 space-y-6">

              {/* Members */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          {t("أعضاء الفريق", "Team Members")}
                        </CardTitle>
                        <CardDescription>
                          {memberLimit
                            ? t(`${members.length} من ${memberLimit} عضو`, `${members.length} of ${memberLimit} members`)
                            : t(`${members.length} عضو`, `${members.length} members`)}
                        </CardDescription>
                      </div>
                      {canManage && team.subscription_status === "active" && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 gap-2 shrink-0"
                          onClick={() => setInviteOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                          {t("دعوة", "Invite")}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {members.map((member) => (
                          <motion.div
                            key={member.user_id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="w-9 h-9 border-2 border-background shadow-sm shrink-0">
                                <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
                                  {member.profile?.full_name?.[0]?.toUpperCase() ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {member.profile?.full_name ?? t("مستخدم غير معروف", "Unknown User")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(member.joined_at).toLocaleDateString("ar-SA")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <RoleBadge role={member.role} t={t} />
                              {userRole === "owner" && member.role !== "owner" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7"
                                  onClick={() => setRemovingMember(member)}
                                >
                                  {t("إزالة", "Remove")}
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Projects */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-orange-500" />
                          {t("المشاريع", "Projects")}
                        </CardTitle>
                        <CardDescription>
                          {t("نظّم العمل في مشاريع", "Organise work into projects")}
                        </CardDescription>
                      </div>
                      {canManage && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 gap-2 shrink-0"
                          onClick={() => setCreateProjectOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                          {t("مشروع جديد", "New Project")}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {projects.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <AnimatePresence>
                          {projects.map((project, i) => (
                            <motion.a
                              key={project.id}
                              href={`/vault/projects/${project.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.05 * i }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="block p-4 border border-border rounded-xl hover:border-orange-500/40 hover:shadow-md hover:shadow-orange-500/10 transition-all group"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                                <h3 className="font-semibold text-sm group-hover:text-orange-500 transition-colors truncate">
                                  {project.name}
                                </h3>
                              </div>
                              {project.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                              )}
                            </motion.a>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
                          <FolderKanban className="w-6 h-6 text-orange-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("لا توجد مشاريع بعد", "No projects yet")}
                        </p>
                        {canManage && (
                          <Button size="sm" variant="outline" onClick={() => setCreateProjectOpen(true)}>
                            {t("إنشاء مشروع", "Create a project")}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </div>
      </main>

      {/* ── Dialogs ── */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teamId={teamId}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        teamId={teamId}
      />

      {/* Remove member confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={(open) => !open && setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("إزالة العضو", "Remove Member")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `هل أنت متأكد من إزالة "${removingMember?.profile?.full_name ?? "هذا العضو"}" من الفريق؟ لا يمكن التراجع عن هذا الإجراء.`,
                `Are you sure you want to remove "${removingMember?.profile?.full_name ?? "this member"}" from the team? This action cannot be undone.`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLoading}>
              {t("إلغاء", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={removeLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("جاري الإزالة...", "Removing...")}
                </span>
              ) : (
                t("إزالة", "Remove")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}