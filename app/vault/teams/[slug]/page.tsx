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

  // For individual subscription, show legacy team view if they're viewing a shared team
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
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    async function loadData() {
      if (!slug) return;

      try {
        const teamRes = await getTeamBySlug(slug as string);
        if (teamRes.error) {
          toast.error(teamRes.error);
          return;
        }
        setTeam(teamRes.data);

        if (teamRes.data?.id) {
          const tasksRes = await getTeamTasks(teamRes.data.id);
          if (tasksRes.data) {
            setTasks(tasksRes.data);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load team data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  if (!team)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Team not found
      </div>
    );

  // Group tasks logic (simplified for demo)
  const groupedTasks = {
    recent: tasks.slice(0, 2),
    today: tasks.filter(
      (t) => t.plan_date === new Date().toISOString().split("T")[0],
    ),
    upcoming: tasks.filter(
      (t) => t.plan_date > new Date().toISOString().split("T")[0],
    ),
    later: [],
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      {/* 1. Header (Enhanced Asana Style) */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/10 relative overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${team.color || "#6366f1"} 0%, ${adjustColor(team.color || "#6366f1", -20)} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <span className="relative z-10">{team.name[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {team.name}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-all hover:scale-105 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
              <span className="px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                {tasks.length} tasks
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-2">
            {[1, 2, 3].map((i) => (
              <Avatar
                key={i}
                className="h-9 w-9 border-2 border-background ring-1 ring-border cursor-pointer hover:z-10 transition-all hover:scale-110 hover:shadow-lg"
              >
                <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold">
                  U{i}
                </AvatarFallback>
              </Avatar>
            ))}
            <button
              onClick={() => setInviteOpen(true)}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center border-2 border-background ring-1 ring-border hover:from-primary/20 hover:to-primary/10 hover:ring-primary/50 z-10 text-xs shadow-sm text-muted-foreground hover:text-primary transition-all hover:scale-110"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 px-5 shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* 2. Tabs & Toolbar */}
      <div className="flex flex-col border-b bg-card/50 backdrop-blur-sm">
        <Tabs defaultValue="list" className="w-full">
          <div className="px-6 flex items-center justify-between border-b bg-card/30">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              {[
                { value: "overview", label: "Overview" },
                { value: "list", label: "List" },
                { value: "board", label: "Board" },
                { value: "timeline", label: "Timeline", disabled: true },
                { value: "calendar", label: "Calendar", disabled: true },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 py-3.5 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:text-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3.5 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-[73px] z-10 border-b border-border/50">
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground h-9 font-medium shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add task
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 text-xs transition-all"
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 text-xs transition-all"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 text-xs transition-all"
              >
                <ListFilter className="w-3.5 h-3.5" />
                Group
              </Button>
            </div>
          </div>

          {/* 3. Main Content - List View */}
          <TabsContent value="list" className="m-0 focus-visible:ring-0">
            <div className="min-h-[calc(100vh-220px)] bg-background/50">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-8 py-3 border-b border-border/50 text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase select-none sticky top-[145px] bg-background/95 backdrop-blur-sm z-10">
                <div className="col-span-6 pl-8">Task Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-1 border-l border-border/50 pl-4">
                  Category
                </div>
              </div>

              {/* Task Sections */}
              <div className="pb-20">
                <TaskSection
                  title="Recently assigned"
                  tasks={groupedTasks.recent}
                  isOpen={sections.recent}
                  onToggle={() => toggleSection("recent")}
                />
                <TaskSection
                  title="Do today"
                  tasks={groupedTasks.today}
                  isOpen={sections.today}
                  onToggle={() => toggleSection("today")}
                  emptyText="No tasks for today"
                />
                <TaskSection
                  title="Do next week"
                  tasks={groupedTasks.upcoming}
                  isOpen={sections.upcoming}
                  onToggle={() => toggleSection("upcoming")}
                  emptyText="No upcoming tasks"
                />
                <TaskSection
                  title="Do later"
                  tasks={groupedTasks.later}
                  isOpen={sections.later}
                  onToggle={() => toggleSection("later")}
                  emptyText="No tasks scheduled for later"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teamId={team?.id || "temp-id"}
      />
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number) {
  const clamp = (num: number) => Math.min(Math.max(num, 0), 255);
  const num = parseInt(color.replace("#", ""), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00ff) + amount);
  const b = clamp((num & 0x0000ff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function TaskSection({ title, tasks, isOpen, onToggle, emptyText }: any) {
  return (
    <div className="mt-4">
      <div
        className="flex items-center gap-2 px-6 py-2.5 cursor-pointer hover:bg-muted/40 group select-none rounded-lg mx-2 transition-all"
        onClick={onToggle}
      >
        <div
          className={cn(
            "p-0.5 rounded-md hover:bg-muted transition-all duration-200",
            isOpen ? "rotate-90" : "",
          )}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        {tasks.length > 0 && (
          <span className="text-xs text-muted-foreground ml-2 font-medium px-2 py-0.5 rounded-full bg-muted/50">
            {tasks.length}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="mt-1">
          {tasks.length === 0 ? (
            <div className="px-8 py-4 ml-8 text-sm text-muted-foreground/60 italic hover:bg-muted/30 cursor-pointer transition-all border-b border-transparent hover:border-border/50 rounded-lg mx-2 group">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>{emptyText || "No tasks"}</span>
              </div>
            </div>
          ) : (
            tasks.map((task: any) => (
              <div
                key={task.id}
                className="group grid grid-cols-12 gap-4 px-8 py-3 border-b border-border/30 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent cursor-pointer text-sm transition-all hover:border-border items-center mx-2 rounded-lg"
              >
                <div className="col-span-6 flex items-center gap-3 pl-2 relative">
                  <div className="absolute left-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                    <div className="flex flex-col gap-[2px]">
                      <div className="flex gap-[2px]">
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                      </div>
                      <div className="flex gap-[2px]">
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                      </div>
                      <div className="flex gap-[2px]">
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                        <div className="w-[2px] h-[2px] bg-muted-foreground/50 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <button
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110",
                      task.status === "completed"
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                        : "border-muted-foreground/40 text-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={cn(
                      "font-medium truncate transition-colors",
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : "text-foreground group-hover:text-primary",
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {task.assignee ? (
                    <div className="flex items-center gap-2 group/assignee">
                      <Avatar className="h-7 w-7 border-2 border-border ring-1 ring-background transition-transform group-hover:scale-110">
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 font-bold">
                          {task.assignee.full_name
                            ?.substring(0, 2)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate opacity-0 group-hover/assignee:opacity-100 transition-opacity max-w-[80px] font-medium">
                        {task.assignee.full_name?.split(" ")[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                      <UserPlus className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-muted-foreground text-xs flex items-center font-medium">
                  {task.plan_date ? (
                    <span
                      className={cn(
                        "transition-colors",
                        task.plan_date <
                          new Date().toISOString().split("T")[0] &&
                          task.status !== "completed"
                          ? "text-red-500 font-semibold"
                          : "",
                      )}
                    >
                      {new Date(task.plan_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">-</span>
                  )}
                </div>
                <div className="col-span-1">
                  {task.priority && (
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold border inline-block text-center min-w-[65px] transition-all hover:scale-105 shadow-sm",
                        task.priority === "high"
                          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                          : task.priority === "medium"
                            ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50"
                            : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
                      )}
                    >
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>
                  )}
                </div>
                <div className="col-span-1 border-l border-border/50 pl-4">
                  <span className="px-2.5 py-1 rounded-md bg-muted/70 text-muted-foreground text-[10px] font-semibold border border-border/50 truncate max-w-full block text-center hover:bg-muted transition-colors">
                    Project Launch
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
