"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  Clock,
  Calendar,
  Bookmark,
  Plus,
  Search,
  TrendingUp,
  Zap,
  ImageIcon,
  FileText,
  Link as LinkIcon,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlans } from "@/hooks/use-plans";
import { useMemories } from "@/hooks/use-memories";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Memory {
  id: string;
  type: "note" | "reminder" | "link" | "image" | "thought";
  content: string;
  timestamp: string;
  tags?: string[];
  dueDate?: string;
  completed?: boolean;
}

export function IndividualDashboard() {
  const [quickCapture, setQuickCapture] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { plans, addPlan } = usePlans();
  const { memories } = useMemories();

  // Convert plans to memories format
  const memoriesData: Memory[] = [
    ...memories.slice(0, 3).map((m) => ({
      id: m.id,
      type: m.type === "photo" ? ("image" as const) : ("note" as const),
      content: m.description || m.title || "",
      timestamp: new Date(m.created_at).toLocaleString(),
      tags: m.tags || [],
    })),
    ...plans.slice(0, 2).map((p) => ({
      id: p.id,
      type: "reminder" as const,
      content: p.title,
      timestamp: new Date(p.created_at).toLocaleString(),
      dueDate: p.plan_date || undefined,
      completed: p.status === "completed",
      tags: [],
    })),
  ];

  const upcomingReminders = memoriesData.filter(
    (m) => m.type === "reminder" && !m.completed,
  );

  const recentMemories = memoriesData.filter((m) => m.type !== "reminder");

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCapture.trim()) {
      try {
        await addPlan({
          title: quickCapture,
          category: "task",
          status: "pending",
        });
        toast.success("Captured successfully!");
        setQuickCapture("");
      } catch (error) {
        toast.error("Failed to capture");
      }
    }
  };

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return Clock;
      case "link":
        return LinkIcon;
      case "image":
        return ImageIcon;
      case "thought":
        return Brain;
      case "note":
      default:
        return FileText;
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "link":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "image":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "thought":
        return "bg-accent/10 text-accent border-accent/20";
      case "note":
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your Second Brain</h1>
          <p className="text-muted-foreground">
            Capture thoughts, save memories, never forget
          </p>
        </motion.div>

        {/* Quick Capture */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
            <CardContent className="pt-6">
              <form onSubmit={handleQuickCapture} className="space-y-3">
                <Textarea
                  placeholder="What's on your mind? Capture a thought, reminder, or idea..."
                  value={quickCapture}
                  onChange={(e) => setQuickCapture(e.target.value)}
                  className="min-h-[100px] text-base resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Reminder
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                  </div>
                  <Button type="submit" className="px-6">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-accent bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Daily Insight</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You've captured{" "}
                    <strong>{memoriesData.length} memories</strong> recently.
                    You have{" "}
                    <strong>{upcomingReminders.length} reminders</strong> coming
                    up.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search your memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card"
          />
        </motion.div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Memories</TabsTrigger>
            <TabsTrigger value="reminders">
              Reminders ({upcomingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          {/* All Memories */}
          <TabsContent value="all" className="space-y-3">
            {memoriesData.map((memory) => {
              const Icon = getMemoryIcon(memory.type);
              return (
                <Card
                  key={memory.id}
                  className="hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getMemoryColor(
                          memory.type,
                        )}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm leading-relaxed flex-1">
                            {memory.content}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {memory.type === "reminder" &&
                              !memory.completed && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span>{memory.timestamp}</span>
                          {memory.dueDate && (
                            <>
                              <span>·</span>
                              <span className="text-orange-500 font-medium">
                                Due: {memory.dueDate}
                              </span>
                            </>
                          )}
                          {memory.tags && memory.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <div className="flex gap-1">
                                {memory.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-2 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Reminders */}
          <TabsContent value="reminders" className="space-y-3">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((memory) => {
                const Icon = getMemoryIcon(memory.type);
                return (
                  <Card
                    key={memory.id}
                    className="hover:shadow-md transition-all cursor-pointer group border-orange-500/20"
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full border-2 border-orange-500/20 hover:bg-orange-500/10 flex-shrink-0"
                        >
                          <CheckCircle2 className="h-5 w-5 text-orange-500" />
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed mb-2">
                            {memory.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500 font-medium">
                              {memory.dueDate}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming reminders</p>
              </div>
            )}
          </TabsContent>

          {/* Recent */}
          <TabsContent value="recent" className="space-y-3">
            {recentMemories.slice(0, 5).map((memory) => {
              const Icon = getMemoryIcon(memory.type);
              return (
                <Card
                  key={memory.id}
                  className="hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getMemoryColor(
                          memory.type,
                        )}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed mb-2">
                          {memory.content}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span>{memory.timestamp}</span>
                          {memory.tags && memory.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <div className="flex gap-1">
                                {memory.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-2 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 pt-4"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {memories.length + plans.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Memories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{memories.length}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Bookmark className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{upcomingReminders.length}</p>
              <p className="text-xs text-muted-foreground">Active Reminders</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
