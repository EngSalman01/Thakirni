import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface TaskColumn {
  id: string;
  team_id: string;
  title: string;
  position: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useColumns(teamId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    teamId ? `columns-${teamId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("task_columns")
        .select("*")
        .eq("team_id", teamId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as TaskColumn[];
    }
  );

  const createColumn = async (title: string) => {
    const { data, error } = await supabase
      .from("task_columns")
      .insert([
        {
          team_id: teamId,
          title,
          position: (data?.length || 0) + 1,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateColumn = async (columnId: string, updates: Partial<TaskColumn>) => {
    const { error } = await supabase
      .from("task_columns")
      .update(updates)
      .eq("id", columnId);

    if (error) throw error;
    mutate();
  };

  const deleteColumn = async (columnId: string) => {
    const { error } = await supabase
      .from("task_columns")
      .delete()
      .eq("id", columnId);

    if (error) throw error;
    mutate();
  };

  return {
    columns: data || [],
    isLoading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
  };
}
