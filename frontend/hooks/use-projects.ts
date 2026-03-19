"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
// Inline type to avoid missing @/types/supabase module
type Project = {
  id: string;
  user_id: string;
  team_id?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProjects([]);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    isLoading,
    refetch: fetchProjects,
  };
}
