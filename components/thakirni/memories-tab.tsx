import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Heart, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/language-provider";

interface MemoriesTabProps {
  teamId: string;
}

interface Memory {
  id: string;
  team_id: string;
  title: string;
  content: string;
  tags: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const supabase = createClient();

export function MemoriesTab({ teamId }: MemoriesTabProps) {
  const { t } = useLanguage();
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: "", content: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const { data: memories, mutate } = useSWR(
    teamId ? `memories-${teamId}` : null,
    async () => {
      const { data } = await supabase
        .from("memories")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      return (data as Memory[]) || [];
    }
  );

  const handleAddMemory = async () => {
    if (newMemory.title.trim() && newMemory.content.trim()) {
      try {
        await supabase.from("memories").insert([
          {
            team_id: teamId,
            title: newMemory.title,
            content: newMemory.content,
            tags: [],
          },
        ]);
        setNewMemory({ title: "", content: "" });
        setIsAddingMemory(false);
        mutate();
      } catch (error) {
        console.error("Failed to add memory:", error);
      }
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await supabase.from("memories").delete().eq("id", memoryId);
      mutate();
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  const filteredMemories = (memories || []).filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header and Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("Search memories...", "ابحث عن الذكريات...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setIsAddingMemory(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("Add Memory", "إضافة ذكرى")}
        </Button>
      </div>

      {/* Add Memory Form */}
      {isAddingMemory && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
        >
          <Input
            placeholder={t("Memory title...", "عنوان الذكرى...")}
            value={newMemory.title}
            onChange={(e) =>
              setNewMemory({ ...newMemory, title: e.target.value })
            }
          />
          <Textarea
            placeholder={t("Write your memory...", "اكتب ذكرياتك...")}
            value={newMemory.content}
            onChange={(e) =>
              setNewMemory({ ...newMemory, content: e.target.value })
            }
            rows={4}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddMemory}
              disabled={!newMemory.title.trim() || !newMemory.content.trim()}
            >
              {t("Save", "حفظ")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAddingMemory(false)}
            >
              {t("Cancel", "إلغاء")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Memories Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredMemories.map((memory) => (
              <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedMemory(memory)}
              >
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                  {memory.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {memory.content}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMemory(memory.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-slate-400">
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMemory(null)}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <h2 className="text-2xl font-bold mb-4">{selectedMemory.title}</h2>
            <p className="text-slate-700 whitespace-pre-wrap mb-6">
              {selectedMemory.content}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {new Date(selectedMemory.created_at).toLocaleDateString()}
              </span>
              <Button
                variant="outline"
                onClick={() => setSelectedMemory(null)}
              >
                {t("Close", "إغلاق")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
