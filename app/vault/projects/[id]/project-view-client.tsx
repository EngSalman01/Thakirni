"use client";

import { useState, useOptimistic } from "react";
import Link from "next/link";
import {
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Share2,
  MoreHorizontal,
  Calendar as CalendarIcon,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Search,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { updatePlanStatus } from "@/app/actions/plans";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { cn } from "@/lib/utils";
import { motion, Reorder } from "framer-motion";
import { toast } from "sonner";

// Types
type Task = any; // Using any for flexibility based on Supabase return, but ideally typed
type ViewMode = "list" | "board";

interface ProjectViewClientProps {
  project: any;
  initialTasks: Task[];
  currentUserId: string;
}

export function ProjectViewClient({
  project,
  initialTasks,
  currentUserId,
}: ProjectViewClientProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Optimistic UI for tasks
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state, updatedTask: Task) => {
      return state.map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
      );
    },
  );

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // 1. Optimistic update
    addOptimisticTask({ id: taskId, status: newStatus });

    // 2. Server action
    const result = await updatePlanStatus(taskId, newStatus as any);
    if (result.error) {
      toast.error("Failed to update task status");
      // Revert? (Complex with optimistic, usually we just toast error and refresh)
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* 1. Header & Breadcrumbs */}
      <header className="px-6 py-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/vault/teams/${project.teams?.slug}`}
              className="hover:underline hover:text-foreground transition-colors"
            >
              {project.teams?.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-foreground">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-sm`}
              style={{ backgroundColor: project.color || "#3b82f6" }}
            >
              {project.name[0]}
            </div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] bg-muted border border-border/50 uppercase tracking-wider font-medium text-muted-foreground`}
            >
              Project
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {/* Mock avatars based on tasks (unique assignees) - simplified */}
            {Array.from(
              new Set(
                optimisticTasks
                  .map((t) => t.assignee?.avatar_url)
                  .filter(Boolean),
              ),
            )
              .slice(0, 3)
              .map((url: any, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={url} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full ml-1 border-dashed bg-transparent"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          <Button
            className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => setInviteOpen(true)}
          >
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* 2. Tabs & Controls */}
      <div className="border-b bg-card/30 px-6 py-2 flex items-center justify-between sticky top-[73px] z-10 backdrop-blur-sm">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as ViewMode)}
          className="w-[400px]"
        >
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="list" className="gap-2 text-xs">
              <List className="w-4 h-4" /> List
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2 text-xs">
              <LayoutGrid className="w-4 h-4" /> Board
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="h-8 w-[200px] pl-8 bg-background text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* 3. Main Content Content */}
      <div className="flex-1 overflow-auto bg-muted/5 p-6">
        {view === "list" ? (
          <ListView
            tasks={optimisticTasks}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <BoardView
            tasks={optimisticTasks}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teamId={project.team_id}
      />
    </div>
  );
}

// --- List View Component ---
function ListView({
  tasks,
  onStatusChange,
}: {
  tasks: Task[];
  onStatusChange: (id: string, s: string) => void;
}) {
  const groups = {
    pending: tasks.filter((t) => t.status === "pending"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-6">Task Name</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-1 text-center">Status</div>
      </div>

      <div className="divide-y">
        {["pending", "in_progress", "completed"].map((status) => {
          const groupTasks = groups[status as keyof typeof groups];
          if (groupTasks.length === 0) return null;

          return (
            <div key={status}>
              {/* Group Header */}
              <div className="px-6 py-2 bg-muted/10 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold capitalize">
                  {status.replace("_", " ")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({groupTasks.length})
                </span>
              </div>

              {/* Rows */}
              {groupTasks.map((task) => (
                <div
                  key={task.id}
                  className="group grid grid-cols-12 gap-4 px-6 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, "completed");
                      }}
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                        task.status === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground/40 hover:border-green-500",
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={cn(
                        "font-medium text-sm",
                        task.status === "completed" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                            {task.assignee.full_name
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-[100px]">
                          {task.assignee.full_name}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    {task.plan_date && (
                      <>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(task.plan_date).toLocaleDateString()}
                      </>
                    )}
                  </div>
                  <div className="col-span-1">
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <StatusSelect
                      task={task}
                      onChange={(s) => onStatusChange(task.id, s)}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Board View (Kanban) ---
function BoardView({
  tasks,
  onStatusChange,
}: {
  tasks: Task[];
  onStatusChange: (id: string, s: string) => void;
}) {
  const columns = [
    { id: "pending", title: "To Do", color: "bg-slate-500" },
    { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
    { id: "completed", title: "Completed", color: "bg-green-500" },
  ];

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="min-w-[300px] w-[300px] bg-muted/40 rounded-xl p-3 border shadow-sm"
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                {col.title}{" "}
                <span className="text-muted-foreground font-normal opacity-70">
                  {colTasks.length}
                </span>
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="space-y-3 min-h-[100px]">
              {/* Note: In a real implementation with @hello-pangea/dnd, we would wrap this in a Droppable */}
              {colTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  className="bg-card p-4 rounded-lg border shadow-sm cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4
                      className={cn(
                        "text-sm font-medium leading-tight",
                        task.status === "completed" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 -mt-1 -mr-2 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {task.assignee ? (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.avatar_url} />
                          <AvatarFallback className="text-[9px]">
                            {task.assignee.full_name?.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted border border-border/50" />
                      )}
                      {task.plan_date && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                          {new Date(task.plan_date).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} mini />
                  </div>

                  {/* Quick action for demo */}
                  <div
                    className="mt-2 text-[10px] text-muted-foreground/50 text-center border-t pt-2 opacity-50 hover:opacity-100 cursor-pointer"
                    onClick={() => {
                      const next =
                        col.id === "pending"
                          ? "in_progress"
                          : col.id === "in_progress"
                            ? "completed"
                            : "pending";
                      onStatusChange(task.id, next);
                    }}
                  >
                    Move to{" "}
                    {next === "pending"
                      ? "To Do"
                      : next === "in_progress"
                        ? "Progress"
                        : "Done"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Helpers ---
function PriorityBadge({
  priority,
  mini,
}: {
  priority: string;
  mini?: boolean;
}) {
  if (!priority) return null;
  const styles =
    {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-orange-100 text-orange-700 border-orange-200",
      low: "bg-blue-100 text-blue-700 border-blue-200",
    }[priority] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full font-medium border text-center inline-block",
        mini ? "text-[9px] px-1.5 h-5 flex items-center" : "text-[10px]",
        styles,
      )}
    >
      {mini ? priority.charAt(0).toUpperCase() : priority.toUpperCase()}
    </span>
  );
}

function StatusSelect({
  task,
  onChange,
}: {
  task: Task;
  onChange: (s: string) => void;
}) {
  const styles =
    {
      pending: "bg-slate-100 text-slate-600 hover:bg-slate-200",
      in_progress: "bg-blue-100 text-blue-600 hover:bg-blue-200",
      completed: "bg-green-100 text-green-600 hover:bg-green-200",
    }[task.status as string] || "bg-slate-100";

  return (
    <select
      value={task.status}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "text-[10px] font-medium px-2 py-1 rounded cursor-pointer border-transparent focus:ring-0 outline-none appearance-none text-center min-w-[80px]",
        styles,
      )}
    >
      <option value="pending">To Do</option>
      <option value="in_progress">In Prog</option>
      <option value="completed">Done</option>
    </select>
  );
}
