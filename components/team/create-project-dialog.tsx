"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/projects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FolderPlus, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

const PRESET_COLORS = [
  {
    value: "#6366f1",
    name: "Indigo",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    value: "#8b5cf6",
    name: "Purple",
    gradient: "from-purple-500 to-purple-600",
  },
  { value: "#ec4899", name: "Pink", gradient: "from-pink-500 to-pink-600" },
  { value: "#f43f5e", name: "Rose", gradient: "from-rose-500 to-rose-600" },
  { value: "#0ea5e9", name: "Sky", gradient: "from-sky-500 to-sky-600" },
  { value: "#14b8a6", name: "Teal", gradient: "from-teal-500 to-teal-600" },
  {
    value: "#10b981",
    name: "Emerald",
    gradient: "from-emerald-500 to-emerald-600",
  },
  { value: "#f59e0b", name: "Amber", gradient: "from-amber-500 to-amber-600" },
];

export function CreateProjectDialog({
  open,
  onOpenChange,
  teamId,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createProject(teamId, name, description, color);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Project "${name}" created successfully`);
        setName("");
        setDescription("");
        setColor(PRESET_COLORS[0].value);
        onOpenChange(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedColor = PRESET_COLORS.find((c) => c.value === color);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create New Project
            </span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            Projects help organize tasks and track progress. Pick a name and
            color to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label
                htmlFor="name"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                Project Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Mobile App Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                className="h-11 border-border/50 focus:border-purple-500"
              />
            </div>

            <div className="grid gap-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-500" />
                Project Color
              </Label>
              <div className="grid grid-cols-8 gap-2.5">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor.value}
                    type="button"
                    onClick={() => setColor(presetColor.value)}
                    className={`relative group w-full aspect-square rounded-xl transition-all ${
                      color === presetColor.value
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-110 hover:ring-2 hover:ring-muted-foreground/50 hover:ring-offset-2 hover:ring-offset-background"
                    }`}
                    disabled={isLoading}
                    title={presetColor.name}
                  >
                    <div
                      className={`w-full h-full rounded-xl bg-gradient-to-br ${presetColor.gradient} shadow-md`}
                    />
                    {color === presetColor.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-5 rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-muted/30 to-muted/10">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                Preview
              </p>
              <div
                className={`p-4 rounded-xl bg-gradient-to-br ${selectedColor?.gradient} bg-opacity-10 border border-${selectedColor?.name.toLowerCase()}-200 dark:border-${selectedColor?.name.toLowerCase()}-900`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-to-br ${selectedColor?.gradient} shadow-sm`}
                  />
                  <span className="font-semibold text-base">
                    {name || "Project Name"}
                  </span>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
