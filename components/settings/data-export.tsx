"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DataExport() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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

      // 3. Generate CSV Content
      const escapeCsv = (str: string | null | undefined) => {
        if (!str) return "";
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      let csvContent = "Type,Title/Content,Date,Additional Info\n";

      plans?.forEach((p) => {
        csvContent += `Plan,${escapeCsv(p.title)},${escapeCsv(p.start_datetime)},${escapeCsv(p.category)}\n`;
      });

      memories?.forEach((m) => {
        csvContent += `Memory,${escapeCsv(m.content)},${escapeCsv(m.created_at)},${escapeCsv(m.tags?.join(", "))}\n`;
      });

      // 4. Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Thakirni_Export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export Complete", {
        description: "Your data has been downloaded as CSV.",
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast.error("Export Failed", {
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
