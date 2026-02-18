import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "./kanban-board";
import { MemoriesTab } from "@/components/thakirni/memories-tab";
import { RemindersTab } from "@/components/thakirni/reminders-tab";
import { TeamMembersTab } from "./team-members-tab";
import { useLanguage } from "@/components/language-provider";

interface TeamDashboardProps {
  team: {
    id: string;
    name: string;
  };
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}

export function TeamDashboard({ team, teamMembers }: TeamDashboardProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col gap-4"
    >
      <Tabs defaultValue="board" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="board">{t("Board", "لوحة")}</TabsTrigger>
          <TabsTrigger value="memories">{t("Memories", "الذكريات")}</TabsTrigger>
          <TabsTrigger value="reminders">{t("Reminders", "التذكيرات")}</TabsTrigger>
          <TabsTrigger value="members">{t("Team", "الفريق")}</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="flex-1">
          <KanbanBoard
            teamId={team.id}
            teamName={team.name}
            teamMembers={teamMembers}
          />
        </TabsContent>

        <TabsContent value="memories" className="flex-1">
          <MemoriesTab teamId={team.id} />
        </TabsContent>

        <TabsContent value="reminders" className="flex-1">
          <RemindersTab teamId={team.id} />
        </TabsContent>

        <TabsContent value="members" className="flex-1">
          <TeamMembersTab
            teamId={team.id}
            teamName={team.name}
            members={teamMembers}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
