import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useColumns } from "@/hooks/use-columns";
import { useTasks } from "@/hooks/use-tasks";
import { KanbanColumn } from "./kanban-column";
import { TaskModal } from "./task-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KanbanBoardProps {
  teamId: string;
  teamName: string;
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}

export function KanbanBoard({
  teamId,
  teamName,
  teamMembers,
}: KanbanBoardProps) {
  const { columns, createColumn, isLoading: columnsLoading } =
    useColumns(teamId);
  const { tasks, createTask, updateTask, deleteTask, isLoading: tasksLoading } =
    useTasks(teamId);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      try {
        await createColumn(newColumnTitle);
        setNewColumnTitle("");
        setIsAddingColumn(false);
      } catch (error) {
        console.error("Failed to create column:", error);
      }
    }
  };

  const handleCreateTask = async (columnId: string) => {
    try {
      await createTask(columnId, {
        title: "New Task",
        description: "",
        priority: "medium",
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{teamName} Board</h2>
          <p className="text-sm text-slate-600">
            {columns.length} columns, {tasks.length} tasks
          </p>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <motion.div layout className="flex gap-4 pb-4 h-fit">
          {/* Columns */}
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks}
              onTaskEdit={(task) => {
                setSelectedTask(task);
                setIsTaskModalOpen(true);
              }}
              onTaskDelete={handleDeleteTask}
              onTaskCreate={handleCreateTask}
              teamMembers={teamMembers}
            />
          ))}

          {/* Add Column Button */}
          <motion.div layout className="flex-shrink-0 w-80">
            {isAddingColumn ? (
              <div className="bg-white rounded-lg border border-slate-200 p-4 h-full">
                <Input
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") setIsAddingColumn(false);
                  }}
                  autoFocus
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddColumn}
                    disabled={!newColumnTitle.trim()}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingColumn(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingColumn(true)}
                variant="outline"
                className="w-full h-full justify-start text-slate-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add column
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={(updates) => {
          if (selectedTask) {
            updateTask(selectedTask.id, updates);
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }
        }}
        teamMembers={teamMembers}
      />
    </div>
  );
}
