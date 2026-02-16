import { createClient } from "@/lib/supabase/server";
import { ProjectView } from "@/components/thakirni/project-view";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Share2, Settings } from "lucide-react";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // 1. Fetch Project Details
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*, teams(name, slug)")
    .eq("id", params.id)
    .single();

  if (projError || !project) {
    return notFound();
  }

  // 2. Fetch Tasks (Plans) with Assignee Profile
  // Note: We use the foreign key relationship to profiles
  const { data: tasks, error: taskError } = await supabase
    .from("plans")
    .select(
      `
      id, 
      title, 
      status, 
      priority, 
      plan_date,
      assigned_to,
      assignee:profiles!assigned_to(full_name, avatar_url)
    `,
    )
    .eq("project_id", params.id)
    .order("created_at", { ascending: false });

  // Transform data to match our component types safely
  const safeTasks = (tasks || []).map((t) => ({
    ...t,
    // Handle the case where assignee might be returned as an array or object depending on Supabase version
    assignee: Array.isArray(t.assignee) ? t.assignee[0] : t.assignee,
  }));

  return (
    <div className="flex flex-col h-screen">
      {/* === HEADER === */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{project.teams?.name}</span>
            <span>/</span>
            <span>Projects</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Project Icon Color */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: project.color || "#10b981" }}
            >
              <span className="text-white font-bold text-lg">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mock Member Avatars - In real app, fetch from team_members */}
          <div className="flex -space-x-2 mr-2">
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarFallback>AH</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
              +3
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* === MAIN CONTENT (CLIENT COMPONENT) === */}
      <div className="flex-1 overflow-hidden">
        {/* We pass the server-fetched data to the client component */}
        {/* @ts-ignore - Supabase type inference can be tricky, ignoring strict check for demo */}
        <ProjectView tasks={safeTasks} projectId={params.id} />
      </div>
    </div>
  );
}
