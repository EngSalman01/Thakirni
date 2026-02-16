"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";

import { getTeamBySlug, getTeamTasks } from "@/app/actions/teams";
import { toast } from "sonner";

export default function TeamDashboard() {
  const { slug } = useParams();
  const [team, setTeam] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;

      try {
        // Fetch Team
        const teamRes = await getTeamBySlug(slug as string);
        if (teamRes.error) {
          toast.error(teamRes.error);
          return;
        }
        setTeam(teamRes.data);

        // Fetch Tasks
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Team not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* 1. Header Section (Asana Style) */}
      <header className="flex items-center justify-between border-b px-6 py-3 bg-card">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {team?.name?.[0] || "T"}
          </div>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {team?.name || "Project Launch"}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Public to Team
              </span>
              <span>•</span>
              <span className="text-green-500">On Track</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-2">
            {[1, 2, 3].map((i) => (
              <Avatar
                key={i}
                className="h-8 w-8 border-2 border-background ring-2 ring-background"
              >
                <AvatarFallback className="bg-muted text-xs">
                  U{i}
                </AvatarFallback>
              </Avatar>
            ))}
            <button
              onClick={() => setInviteOpen(true)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background hover:bg-muted/80 z-10 text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="h-8"
          >
            Share
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* 2. Tabs & Controls */}
      <div className="px-6 py-2 border-b bg-card/50 flex items-center justify-between">
        <Tabs defaultValue="list" className="w-full">
          <div className="flex items-center justify-between w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-2 text-muted-foreground data-[state=active]:text-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-2 text-muted-foreground data-[state=active]:text-foreground"
              >
                List
              </TabsTrigger>
              <TabsTrigger
                value="board"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-2 text-muted-foreground data-[state=active]:text-foreground"
              >
                Board
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-2 text-muted-foreground data-[state=active]:text-foreground"
              >
                Calendar
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-8"
              >
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            </div>
          </div>

          {/* 3. Main Content Area */}
          <div className="mt-4">
            <TabsContent value="list" className="m-0 focus-visible:ring-0">
              {/* Task List Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-6">Task Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-1">Status</div>
              </div>

              {/* Task Rows */}
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No tasks yet. Click "Add Task" to get started.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center border-b px-4 py-2 hover:bg-muted/50 cursor-pointer text-sm transition-colors"
                  >
                    <div className="col-span-6 flex items-center gap-3 flex-1 w-[50%]">
                      <button
                        className={`transition-colors ${task.status === "completed" ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <span
                        className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="w-[16.6%] flex items-center gap-2">
                      {task.assignee ? (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                            {task.assignee.full_name
                              ?.substring(0, 2)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="w-[16.6%] text-muted-foreground text-xs">
                      {task.plan_date
                        ? new Date(task.plan_date).toLocaleDateString()
                        : "-"}
                    </div>
                    <div className="w-[8.3%]">
                      {task.priority && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : task.priority === "medium"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="w-[8.3%]">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : task.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {task.status === "in_progress"
                          ? "In Prog"
                          : task.status.charAt(0).toUpperCase() +
                            task.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </div>
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
