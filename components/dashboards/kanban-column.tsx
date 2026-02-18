import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical } from "lucide-react";
import { Task } from "@/hooks/use-tasks";
import { TaskColumn } from "@/hooks/use-columns";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (columnId: string) => void;
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}

export function KanbanColumn({
  column,
  tasks,
  onTaskEdit,
  onTaskDelete,
  onTaskCreate,
  teamMembers,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const columnTasks = tasks.filter((t) => t.column_id === column.id);

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        await onTaskCreate(column.id);
        setNewTaskTitle("");
        setIsAddingTask(false);
      } catch (error) {
        console.error("Failed to create task:", error);
      }
    }
  };

  return (
    <motion.div
      layout
      className="flex-shrink-0 w-80 bg-slate-50 rounded-lg border border-slate-200 flex flex-col"
    >
      {/* Column Header */}
      <div className="p-4 border-b border-slate-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
          <h3 className="font-semibold text-slate-900 flex-1">{column.title}</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
            {columnTasks.length}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <motion.div layout className="flex-1 p-3 overflow-y-auto space-y-3">
        <AnimatePresence>
          {columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              assigneeInfo={
                task.assigned_to
                  ? teamMembers.find((m) => m.id === task.assigned_to)
                  : null
              }
            />
          ))}
        </AnimatePresence>

        {/* Add Task Form */}
        {isAddingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-lg border border-slate-200 p-3"
          >
            <Input
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") setIsAddingTask(false);
              }}
              autoFocus
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddTask}
                className="flex-1"
                disabled={!newTaskTitle.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingTask(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Add Task Button */}
      <div className="p-3 border-t border-slate-200">
        <Button
          onClick={() => setIsAddingTask(true)}
          variant="outline"
          className="w-full justify-start text-slate-600"
          disabled={isAddingTask}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add task
        </Button>
      </div>
    </motion.div>
  );
}
