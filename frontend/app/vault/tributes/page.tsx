"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, Plus, Search, ImageIcon, Mic, FileText,
  Download, Share2, Trash2, MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type MemoryType = "image" | "voice" | "text" | "file";
type FilterType = "all" | MemoryType;

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  file_url: string | null;
  tags: string[];
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<MemoryType, React.ElementType> = {
  image: ImageIcon,
  voice: Mic,
  text: FileText,
  file: FileText,
};

const FILTERS: { value: FilterType; ar: string; en: string }[] = [
  { value: "all", ar: "الكل", en: "All" },
  { value: "image", ar: "صور", en: "Photos" },
  { value: "voice", ar: "صوت", en: "Audio" },
  { value: "text", ar: "نص", en: "Text" },
  { value: "file", ar: "ملفات", en: "Files" },
];

const PAGE_SIZE = 20;

// ── Skeleton grid ─────────────────────────────────────────────────────────────

function MemoriesSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

// ── Memory card ───────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  onDelete,
  t,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  t: (ar: string, en: string) => string;
}) {
  const Icon = TYPE_ICON[memory.type] ?? FileText;

  const handleDownload = () => {
    if (!memory.file_url) return;
    const a = document.createElement("a");
    a.href = memory.file_url;
    a.download = memory.content;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share && memory.file_url) {
      try {
        await navigator.share({ title: memory.content, url: memory.file_url });
      } catch {
        // user dismissed — not an error
      }
    } else {
      await navigator.clipboard.writeText(memory.file_url ?? memory.content);
      toast.success(t("تم نسخ الرابط", "Link copied"));
    }
  };

  const formattedDate = new Date(memory.created_at).toLocaleDateString("ar-SA-u-ca-islamic", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer"
    >
      <Card className="aspect-square relative overflow-hidden border rounded-xl">

        {/* Content area */}
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {memory.type === "image" && memory.file_url ? (
            <img
              src={memory.file_url}
              alt={memory.content}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Icon className="w-10 h-10" />
              <p className="text-xs text-center px-3 line-clamp-3">{memory.content}</p>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "flex flex-col justify-between p-3",
        )}>
          {/* Top: type badge + more menu */}
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {t(
                memory.type === "image" ? "صورة" :
                  memory.type === "voice" ? "صوت" :
                    memory.type === "text" ? "نص" : "ملف",
                memory.type.charAt(0).toUpperCase() + memory.type.slice(1),
              )}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-white hover:bg-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {memory.file_url && (
                  <DropdownMenuItem onClick={handleShare} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    {t("مشاركة", "Share")}
                  </DropdownMenuItem>
                )}
                {memory.file_url && (
                  <DropdownMenuItem onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    {t("تحميل", "Download")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => onDelete(memory.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  {t("حذف", "Delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bottom: title + date */}
          <div>
            <p className="text-white font-medium text-sm line-clamp-2 mb-1">
              {memory.content}
            </p>
            <p className="text-white/60 text-xs">{formattedDate}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TributesPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMemories = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      let query = supabase
        .from("memories")
        .select("id, content, type, file_url, tags, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (searchQuery.trim()) query = query.ilike("content", `%${searchQuery.trim()}%`);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Memory[];
      setMemories((prev) => reset ? rows : [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
      if (!reset) setPage((p) => p + 1);
    } catch (err) {
      console.error("[Tributes] fetch error:", err);
      toast.error(t("فشل تحميل الذكريات", "Failed to load memories"));
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, searchQuery, router, t]);

  // Reset + refetch whenever filter or search changes
  useEffect(() => {
    setPage(0);
    setMemories([]);
    fetchMemories(true);
  }, [typeFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update
    setMemories((prev) => prev.filter((m) => m.id !== id));

    const supabase = createClient();
    const { error } = await supabase.from("memories").delete().eq("id", id);

    if (error) {
      toast.error(t("فشل الحذف", "Failed to delete"));
      fetchMemories(true); // rollback by refetching
    } else {
      toast.success(t("تم حذف الذكرى", "Memory deleted"));
    }
  }, [fetchMemories, t]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300">
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("ذكرياتي", "My Memories")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("احفظ ذكرياتك الثمينة للأبد", "Preserve your precious memories forever")}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LanguageToggle />
              <ThemeToggle />
              <Button className="gap-2" onClick={() => router.push("/vault/upload")}>
                <Plus className="w-4 h-4" />
                {t("ذكرى جديدة", "New Memory")}
              </Button>
            </div>
          </motion.div>

          {/* Search + filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("ابحث عن ذكرى...", "Search memories...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={typeFilter === f.value ? "default" : "outline"}
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    "h-9 text-xs",
                    typeFilter !== f.value && "bg-transparent",
                  )}
                >
                  {t(f.ar, f.en)}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Grid */}
          {isLoading ? (
            <MemoriesSkeletonGrid />
          ) : memories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">
                {searchQuery || typeFilter !== "all"
                  ? t("لا توجد نتائج", "No results found")
                  : t("لا توجد ذكريات بعد", "No memories yet")}
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                {t("ابدأ بحفظ أول ذكرى لك", "Start by saving your first memory")}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button onClick={() => router.push("/vault/upload")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("أضف ذكرى", "Add Memory")}
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {memories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onDelete={handleDelete}
                      t={t}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchMemories()}
                    disabled={isLoading}
                  >
                    {t("تحميل المزيد", "Load more")}
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}