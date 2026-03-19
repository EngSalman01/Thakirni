"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  LayoutList,
  KanbanSquare,
  MoreHorizontal,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types matching your DB exactly
type Task = {
  id: string;
  title: string;
  status: "pending" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  plan_date?: string; // or reminder_date based on your schema
  assignee?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function ProjectView({
  tasks,
  projectId,
}: {
  tasks: Task[];
  projectId: string;
}) {
  const [view, setView] = useState<"list" | "board">("list");

  // Group tasks for Board View
  const boardColumns = {
    pending: tasks.filter((t) => t.status === "pending"),
    completed: tasks.filter((t) => t.status === "completed"),
    cancelled: tasks.filter((t) => t.status === "cancelled"),
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 1. View Switcher Toolbar (Asana Style) */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background sticky top-0 z-10">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "board")}
          className="w-full"
        >
          <TabsList className="bg-transparent p-0 h-auto gap-4">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2"
            >
              <KanbanSquare className="w-4 h-4 mr-2" />
              Board
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        {/* === LIST VIEW === */}
        {view === "list" && (
          <ScrollArea className="h-full border rounded-lg bg-card shadow-sm">
            <div className="min-w-[800px]">
              {/* Table Header */}
              <div className="flex items-center border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
                <div className="flex-1">Task Name</div>
                <div className="w-40">Assignee</div>
                <div className="w-32">Due Date</div>
                <div className="w-24">Priority</div>
                <div className="w-24">Status</div>
              </div>

              {/* Rows */}
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No tasks found.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center border-b px-4 py-3 text-sm hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    {/* Task Name + Checkbox */}
                    <div className="flex-1 flex items-center gap-3">
                      <button className="text-muted-foreground hover:text-primary">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span
                        className={cn(
                          "font-medium",
                          task.status === "completed" &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="w-40 flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={task.assignee.avatar_url || ""} />
                            <AvatarFallback className="text-[10px]">
                              {task.assignee.full_name?.slice(0, 2) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs">
                            {task.assignee.full_name || "Unknown"}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> Unassigned
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-32 text-xs text-muted-foreground">
                      {task.plan_date
                        ? format(new Date(task.plan_date), "MMM d")
                        : "-"}
                    </div>

                    {/* Priority */}
                    <div className="w-24">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize border-0",
                          task.priority === "high"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : task.priority === "medium"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="w-24">
                      <span className="text-xs capitalize">{task.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* === BOARD VIEW === */}
        {view === "board" && (
          <ScrollArea className="h-full">
            <div className="flex gap-6 pb-4 h-full">
              {Object.entries(boardColumns).map(([status, items]) => (
                <div
                  key={status}
                  className="w-80 flex-shrink-0 flex flex-col h-full"
                >
                  <div className="font-semibold mb-3 flex items-center justify-between px-1 capitalize">
                    {status}
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex-1 bg-muted/20 rounded-lg p-2 space-y-3 overflow-y-auto">
                    {items.map((task) => (
                      <div
                        key={task.id}
                        className="bg-card border p-3 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 border-emerald-500/30 text-emerald-600"
                          >
                            {task.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-medium text-sm mb-3 line-clamp-2">
                          {task.title}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed">
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {task.plan_date
                              ? format(new Date(task.plan_date), "MMM d")
                              : "-"}
                          </div>
                          {task.assignee && (
                            <Avatar className="w-5 h-5">
                              <AvatarImage
                                src={task.assignee.avatar_url || ""}
                              />
                              <AvatarFallback className="text-[8px]">
                                U
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground border-dashed border"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Task
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
