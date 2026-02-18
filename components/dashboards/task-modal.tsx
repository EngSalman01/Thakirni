import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users } from "lucide-react";
import { Task } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}

export function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  teamMembers,
}: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: "",
      description: "",
      priority: "medium",
      assigned_to: null,
      due_date: null,
      status: "todo",
    }
  );

  useEffect(() => {
    if (task) {
      setFormData(task);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Edit Task</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Title
                </label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Task description"
                  rows={3}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Priority
                </label>
                <Select
                  value={formData.priority || "medium"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status || "todo"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assign to
                </label>
                <Select
                  value={formData.assigned_to || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      assigned_to: value || null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due date
                </label>
                <Input
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => onSave(formData)}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
