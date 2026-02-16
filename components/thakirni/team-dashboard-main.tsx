"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
  FolderKanban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from "@/hooks/use-projects";
import { usePlans } from "@/hooks/use-plans";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

interface Activity {
  id: string;
  type: "task" | "comment" | "meeting" | "ai";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export function TeamDashboardMain() {
  const [captureInput, setCaptureInput] = useState("");
  const { projects } = useProjects();
  const { plans, addPlan, stats } = usePlans();

  const statsData = [
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      change: "Active",
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      title: "Today's Reminders",
      value: stats.todayReminders.toString(),
      change: `${stats.todayReminders} today`,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Team Projects",
      value: projects.length.toString(),
      change: "Active",
      icon: FolderKanban,
      color: "text-purple-500",
    },
    {
      title: "Groceries",
      value: stats.pendingGroceries.toString(),
      change: "Pending",
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  const activities: Activity[] = [
    {
      id: "1",
      type: "ai",
      title: "AI Daily Briefing",
      description: `${stats.todayReminders} tasks need attention today. You have ${projects.length} active projects.`,
      timestamp: "2 hours ago",
    },
    ...plans.slice(0, 2).map((plan, idx) => ({
      id: `plan-${idx}`,
      type: "task" as const,
      title:
        plan.status === "completed" ? "Task Completed" : "New Task Created",
      description: plan.title,
      timestamp: new Date(plan.created_at).toLocaleString(),
      user: "You",
    })),
  ];

  const upcomingTasks = plans
    .filter((p) => p.status !== "completed" && p.status !== "cancelled")
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      title: p.title,
      project: p.category === "meeting" ? "Meetings" : "Tasks",
      priority: p.priority,
      dueDate: p.reminder_date
        ? new Date(p.reminder_date).toLocaleDateString()
        : "No date",
      assignee: "You",
    }));

  interface ProjectDisplay {
    id: string;
    name: string;
    progress: number;
    tasks: { total: number; completed: number };
    members: number;
  }

  const projectsData: ProjectDisplay[] = projects.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    progress: Math.round(Math.random() * 100),
    tasks: { total: 10, completed: Math.floor(Math.random() * 10) },
    members: 3,
  }));

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captureInput.trim()) {
      try {
        await addPlan({
          title: captureInput,
          category: "task",
          status: "pending",
        });
        toast.success("Captured successfully!");
        setCaptureInput("");
      } catch (error) {
        toast.error("Failed to capture");
      }
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Capture Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="pt-6">
              <form onSubmit={handleCapture} className="flex gap-2">
                <Input
                  placeholder="Capture anything... (e.g., 'Meeting with Sarah at 5pm' or 'Remember to review API docs')"
                  value={captureInput}
                  onChange={(e) => setCaptureInput(e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                <Button type="submit" size="lg" className="px-6">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {statsData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-primary">{stat.change}</span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Stream</CardTitle>
                  <Tabs defaultValue="all" className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs">
                        AI
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="text-xs">
                        Tasks
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const iconMap = {
                      task: CheckCircle2,
                      comment: MessageSquare,
                      meeting: Calendar,
                      ai: Sparkles,
                    };
                    const Icon = iconMap[activity.type];
                    const isAI = activity.type === "ai";

                    return (
                      <div
                        key={activity.id}
                        className={`flex gap-3 p-3 rounded-lg border ${
                          isAI ? "border-accent bg-accent/5" : "border-border"
                        } hover:bg-muted/50 transition-colors`}
                      >
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isAI ? "bg-accent" : "bg-secondary"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isAI
                                ? "text-accent-foreground"
                                : "text-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {activity.user && (
                              <>
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">
                                    {activity.user[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{activity.user}</span>
                                <span>·</span>
                              </>
                            )}
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{task.project}</span>
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/vault/plans">
                  <Button variant="outline" className="w-full mt-3" size="sm">
                    View All Tasks
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Projects Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectsData.map((project) => (
                    <Link
                      href={`/vault/projects/${project.id}`}
                      key={project.id}
                    >
                      <div className="space-y-2 hover:bg-muted/50 p-2 rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{project.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {project.progress}%
                          </span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {project.tasks.completed}/{project.tasks.total}{" "}
                            tasks
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{project.members}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
