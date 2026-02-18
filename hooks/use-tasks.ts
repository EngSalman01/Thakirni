import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Task {
  id: string;
  team_id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string | null;
  due_date: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTasks(teamId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    teamId ? `tasks-${teamId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("team_id", teamId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Task[];
    }
  );

  const createTask = async (columnId: string, taskData: Partial<Task>) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          team_id: teamId,
          column_id: columnId,
          ...taskData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;
    mutate();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
    mutate();
  };

  const moveTask = async (
    taskId: string,
    columnId: string,
    position: number
  ) => {
    const { error } = await supabase
      .from("tasks")
      .update({ column_id: columnId, position })
      .eq("id", taskId);

    if (error) throw error;
    mutate();
  };

  return {
    tasks: data || [],
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}
