import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  User,
  MessageCircle,
} from "lucide-react";
import { Task } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  assigneeInfo?: { id: string; name: string; avatar?: string } | null;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  assigneeInfo,
}: TaskCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 cursor-grab active:cursor-grabbing"
      draggable
    >
      <div className="space-y-3">
        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 flex-1 break-words">
            {task.title}
          </h3>
          {isHovering && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  ⋯
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}

        {/* Assignee */}
        {assigneeInfo && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3 h-3" />
            {assigneeInfo.name}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MessageCircle className="w-3 h-3" />
            Comments
          </div>
          {task.status !== "done" && task.due_date && (
            <AlertCircle className="w-3 h-3 text-amber-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
