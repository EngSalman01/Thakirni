"use client";

import { cn } from "@/lib/utils";

type Plan = "free" | "pro" | "teams" | string;

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

function normalizePlan(plan: string): "free" | "pro" | "teams" {
  const lower = plan.toLowerCase();
  if (lower === "pro") return "pro";
  if (lower === "teams" || lower === "team" || lower === "company") return "teams";
  return "free";
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const normalized = normalizePlan(plan ?? "free");

  const styles: Record<string, string> = {
    free:  "bg-slate-800/60 text-slate-400 border border-slate-700/50",
    pro:   "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
    teams: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
  };

  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    teams: "Teams",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-label font-bold",
        styles[normalized],
        className
      )}
    >
      {labels[normalized]}
    </span>
  );
}
