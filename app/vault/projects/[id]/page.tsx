import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectTasks } from "@/app/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default async function ProjectPage({
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

  // Fetch project data and tasks
  const result = await getProjectTasks(params.id);

  if (result.error || !result.data) {
    notFound();
  }

  const { project, tasks } = result.data;

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
      completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
      cancelled: "bg-red-500/10 text-red-600 dark:text-red-500",
    };

    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: "قيد الانتظار", en: "Pending" },
      completed: { ar: "مكتمل", en: "Completed" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
    };

    return (
      <Badge className={variants[status] || ""}>
        {labels[status]?.ar || status}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (priority === "medium") {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {tasks && tasks.length > 0 ? (
          <div className="grid gap-4">
            {tasks.map((task: any) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Task Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(task.priority)}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Task Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {task.category && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{task.category}</Badge>
                          </div>
                        )}

                        {task.reminder_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(task.reminder_date), "PPP")}
                            </span>
                          </div>
                        )}

                        {task.location && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{task.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Assignee */}
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(task.status)}

                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Assigned to:
                          </span>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={task.assignee.avatar_url} />
                            <AvatarFallback>
                              {task.assignee.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {task.assignee.full_name || "Unknown"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                <p className="text-sm">
                  Tasks assigned to this project will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
