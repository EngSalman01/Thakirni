import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectViewClient } from "./project-view-client";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: PageProps) {
  // Await params correctly (in Next.js 15+ params is a promise, but in 14 it's an object, checking version... 14 app router usually object, but better safe)
  // user says Next.js 14.
  const { id } = params;

  const supabase = await createClient();

  // 1. Fetch Project Metadata
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*, teams(name, slug)")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    console.error("Project fetch error:", projectError);
    return notFound();
  }

  // 2. Fetch Tasks (Plans)
  const { data: tasks, error: tasksError } = await supabase
    .from("plans")
    .select(
      `
      *,
      assignee:profiles!assigned_to(full_name, avatar_url)
    `,
    )
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Tasks fetch error:", tasksError);
    // Render with empty tasks if error, or handle gracefully
  }

  // 3. Get current user for permission checks / UI logic
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ProjectViewClient
      project={project}
      initialTasks={tasks || []}
      currentUserId={user?.id || ""}
    />
  );
}
