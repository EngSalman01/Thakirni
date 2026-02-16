"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  UserPlus,
  Users,
  Filter,
  ArrowUpDown,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { getTeamBySlug, getTeamTasks } from "@/app/actions/teams";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeamDashboard() {
  const { slug } = useParams();
  const [team, setTeam] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Grouped Tasks State
  const [sections, setSections] = useState({
    recent: true,
    today: true,
    upcoming: true,
    later: true,
  });

  const toggleSection = (section: keyof typeof sections) => {
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
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* 1. Header (Asana Style) */}
      <header className="flex items-center justify-between border-b px-6 py-3 bg-card sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {team.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {team.name}
              <ChevronDown className="w-4 h-4 text-muted-foreground/50 cursor-pointer" />
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Set status
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            {[1, 2, 3].map((i) => (
              <Avatar
                key={i}
                className="h-8 w-8 border-2 border-background ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-105"
              >
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                  U{i}
                </AvatarFallback>
              </Avatar>
            ))}
            <button
              onClick={() => setInviteOpen(true)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background hover:bg-muted/80 z-10 text-xs shadow-sm text-muted-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-2 px-4 shadow-sm"
          >
            Share
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-muted-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* 2. Tabs & Toolbar */}
      <div className="flex flex-col border-b bg-card/30">
        <Tabs defaultValue="list" className="w-full">
          <div className="px-6 flex items-center justify-between border-b bg-card">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              {[
                "Overview",
                "List",
                "Board",
                "Timeline",
                "Calendar",
                "Dashboard",
                "Messages",
                "More...",
              ].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  disabled={[
                    "Timeline",
                    "Dashboard",
                    "Messages",
                    "More...",
                  ].includes(tab)}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm disabled:opacity-50"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-[65px] z-10">
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 font-medium shadow-sm transition-all hover:translate-y-[1px]"
            >
              <Plus className="w-4 h-4" /> Add task{" "}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground gap-2 text-xs"
              >
                <Filter className="w-3.5 h-3.5" /> Filter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground gap-2 text-xs"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground gap-2 text-xs"
              >
                <ListFilter className="w-3.5 h-3.5" /> Group
              </Button>
            </div>
          </div>

          {/* 3. Main Content - List View */}
          <TabsContent value="list" className="m-0 focus-visible:ring-0">
            <div className="min-h-[calc(100vh-180px)] bg-background">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-8 py-2 border-b text-[11px] font-semibold text-muted-foreground/70 tracking-wide uppercase select-none sticky top-[118px] bg-background z-10">
                <div className="col-span-6 pl-8">Task Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-1 border-l pl-4">Category</div>
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
                  emptyText="Add task..."
                />
                <TaskSection
                  title="Do next week"
                  tasks={groupedTasks.upcoming}
                  isOpen={sections.upcoming}
                  onToggle={() => toggleSection("upcoming")}
                  emptyText="Add task..."
                />
                <TaskSection
                  title="Do later"
                  tasks={groupedTasks.later}
                  isOpen={sections.later}
                  onToggle={() => toggleSection("later")}
                  emptyText="Add task..."
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

function TaskSection({ title, tasks, isOpen, onToggle, emptyText }: any) {
  return (
    <div className="mt-6">
      <div
        className="flex items-center gap-2 px-6 py-2 cursor-pointer hover:bg-muted/30 group select-none"
        onClick={onToggle}
      >
        <div
          className={cn(
            "p-0.5 rounded-sm hover:bg-muted transition-transform duration-200",
            isOpen ? "rotate-90" : "",
          )}
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground ml-2 font-normal">
          {tasks.length > 0 ? tasks.length : ""}
        </span>
      </div>

      {isOpen && (
        <div className="mt-1">
          {tasks.length === 0 ? (
            <div className="px-8 py-2 ml-8 text-sm text-muted-foreground/50 italic hover:bg-muted/20 cursor-text transition-colors border-b border-transparent hover:border-border/50">
              {emptyText || "No tasks"}
            </div>
          ) : (
            tasks.map((task: any) => (
              <div
                key={task.id}
                className="group grid grid-cols-12 gap-4 px-8 py-2.5 border-b border-border/40 hover:bg-muted/30 cursor-pointer text-sm transition-all hover:shadow-sm items-center"
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
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
                      task.status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-muted-foreground/40 text-transparent hover:border-green-500 hover:text-green-500",
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={cn(
                      "font-medium truncate",
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {task.assignee ? (
                    <div className="flex items-center gap-2 group/assignee">
                      <Avatar className="h-6 w-6 border border-border">
                        <AvatarFallback className="text-[9px] bg-indigo-50 text-indigo-600 font-bold">
                          {task.assignee.full_name
                            ?.substring(0, 2)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate opacity-0 group-hover/assignee:opacity-100 transition-opacity max-w-[80px]">
                        {task.assignee.full_name?.split(" ")[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/60 transition-colors">
                      <UserPlus className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-muted-foreground text-xs flex items-center">
                  {task.plan_date ? (
                    <span
                      className={cn(
                        task.plan_date <
                          new Date().toISOString().split("T")[0] &&
                          task.status !== "completed"
                          ? "text-red-500 font-medium"
                          : "",
                      )}
                    >
                      {new Date(task.plan_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="col-span-1">
                  {task.priority && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium border inline-block text-center min-w-[60px]",
                        task.priority === "high"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : task.priority === "medium"
                            ? "bg-orange-50 text-orange-600 border-orange-100"
                            : "bg-slate-50 text-slate-600 border-slate-100",
                      )}
                    >
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>
                  )}
                </div>
                <div className="col-span-1 border-l pl-4">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium border border-border/50 truncate max-w-full block text-center">
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
