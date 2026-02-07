"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";

export function DataExport() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      // 1. Fetch Plans
      const { data: plans, error: plansError } = await supabase
        .from("plans")
        .select("*")
        .order("start_datetime", { ascending: false });

      if (plansError) throw plansError;

      // 2. Fetch Memories
      const { data: memories, error: memoriesError } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false });

      if (memoriesError) throw memoriesError;

      // 3. Generate Excel
      const wb = XLSX.utils.book_new();

      // Sheet 1: Plans
      if (plans && plans.length > 0) {
        const plansWS = XLSX.utils.json_to_sheet(
          plans.map((p) => ({
            Title: p.title,
            Start: new Date(p.start_datetime).toLocaleString(),
            End: p.end_datetime
              ? new Date(p.end_datetime).toLocaleString()
              : "",
            Category: p.category,
            Location: p.location || "",
            Status: p.status,
            Description: p.description || "",
          })),
        );
        XLSX.utils.book_append_sheet(wb, plansWS, "Schedule");
      }

      // Sheet 2: Memories
      if (memories && memories.length > 0) {
        const memoriesWS = XLSX.utils.json_to_sheet(
          memories.map((m) => ({
            Content: m.content,
            Tags: m.tags ? m.tags.join(", ") : "",
            Created: new Date(m.created_at).toLocaleString(),
          })),
        );
        XLSX.utils.book_append_sheet(wb, memoriesWS, "My Brain");
      }

      // 4. Download
      XLSX.writeFile(
        wb,
        `Thakirni_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      toast({
        title: "Export Complete",
        description: "Your data has been downloaded.",
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Could not export data.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Data (Excel)
    </Button>
  );
}
