import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trash2, Plus, Calendar, Clock, Edit2, Check } from "lucide-react";
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
import { useLanguage } from "@/components/language-provider";

interface RemindersTabProps {
  teamId: string;
}

interface Reminder {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time: string;
  recurrence: "once" | "daily" | "weekly" | "monthly";
  is_active: boolean;
  created_at: string;
}

const supabase = createClient();

export function RemindersTab({ teamId }: RemindersTabProps) {
  const { t } = useLanguage();
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminder_date: "",
    reminder_time: "09:00",
    recurrence: "once" as const,
  });

  const { data: reminders, mutate } = useSWR(
    teamId ? `reminders-${teamId}` : null,
    async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("team_id", teamId)
        .eq("plan_type", "reminder")
        .order("plan_date", { ascending: true });
      return (data as any[]) || [];
    }
  );

  const handleAddReminder = async () => {
    if (
      newReminder.title.trim() &&
      newReminder.reminder_date
    ) {
      try {
        await supabase.from("plans").insert([
          {
            team_id: teamId,
            title: newReminder.title,
            description: newReminder.description,
            plan_date: newReminder.reminder_date,
            plan_time: newReminder.reminder_time,
            plan_type: "reminder",
            status: "active",
          },
        ]);
        setNewReminder({
          title: "",
          description: "",
          reminder_date: "",
          reminder_time: "09:00",
          recurrence: "once",
        });
        setIsAddingReminder(false);
        mutate();
      } catch (error) {
        console.error("Failed to add reminder:", error);
      }
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await supabase.from("plans").delete().eq("id", reminderId);
      mutate();
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await supabase
        .from("plans")
        .update({ status: "completed" })
        .eq("id", reminderId);
      mutate();
    } catch (error) {
      console.error("Failed to complete reminder:", error);
    }
  };

  const activeReminders = (reminders || []).filter(
    (r) => r.status === "active"
  );
  const completedReminders = (reminders || []).filter(
    (r) => r.status === "completed"
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold">
            {t("Reminders", "التذكيرات")}
          </h3>
        </div>
        <Button
          onClick={() => setIsAddingReminder(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("Add Reminder", "إضافة تذكير")}
        </Button>
      </div>

      {/* Add Reminder Form */}
      {isAddingReminder && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
        >
          <Input
            placeholder={t("Reminder title...", "عنوان التذكير...")}
            value={newReminder.title}
            onChange={(e) =>
              setNewReminder({ ...newReminder, title: e.target.value })
            }
          />
          <Textarea
            placeholder={t("Description (optional)", "الوصف (اختياري)")}
            value={newReminder.description}
            onChange={(e) =>
              setNewReminder({ ...newReminder, description: e.target.value })
            }
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Date", "التاريخ")}
              </label>
              <Input
                type="date"
                value={newReminder.reminder_date}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    reminder_date: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Time", "الوقت")}
              </label>
              <Input
                type="time"
                value={newReminder.reminder_time}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    reminder_time: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddReminder}
              disabled={!newReminder.title.trim() || !newReminder.reminder_date}
            >
              {t("Save", "حفظ")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAddingReminder(false)}
            >
              {t("Cancel", "إلغاء")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active Reminders */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {activeReminders.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">
                {t("Active Reminders", "التذكيرات النشطة")} ({activeReminders.length})
              </h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {activeReminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          {reminder.title}
                        </h4>
                        {reminder.description && (
                          <p className="text-sm text-slate-600 mt-1">
                            {reminder.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(reminder.plan_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reminder.plan_time}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          onClick={() => handleCompleteReminder(reminder.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-opacity-50">
                {t("Completed", "مكتملة")} ({completedReminders.length})
              </h4>
              <div className="space-y-2 opacity-60">
                {completedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="bg-slate-50 rounded-lg border border-slate-200 p-4 line-through text-slate-600"
                  >
                    <h4 className="font-medium">{reminder.title}</h4>
                    <span className="text-xs">
                      {new Date(reminder.plan_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
