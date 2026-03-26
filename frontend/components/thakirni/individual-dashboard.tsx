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
      completed: p.status === "done",
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
          priority: "medium",
        });
        toast.success("Captured successfully!");
        setQuickCapture("");
      } catch {
        toast.error("Failed to capture");
      }
    }
  };

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case "reminder": return Clock;
      case "link": return LinkIcon;
      case "image": return ImageIcon;
      case "thought": return Brain;
      default: return FileText;
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case "reminder": return "bg-secondary/10 text-secondary";
      case "link": return "bg-tertiary/10 text-tertiary";
      case "image": return "bg-primary-container/30 text-primary-container";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="h-full overflow-auto bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full power-gradient mb-4 animate-soft-pulse">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">
            Your Second Brain
          </h1>
          <p className="text-on-surface-variant">
            Capture thoughts, save memories, never forget
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { icon: TrendingUp, value: memories.length + plans.length, label: "Total Memories", color: "text-primary" },
            { icon: Zap, value: memories.length, label: "This Week", color: "text-secondary" },
            { icon: Bookmark, value: upcomingReminders.length, label: "Active Reminders", color: "text-tertiary" },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 text-center shadow-ambient">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-headline font-bold text-on-surface">{stat.value}</p>
              <p className="text-xs text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Capture */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/30">
            <form onSubmit={handleQuickCapture} className="space-y-3">
              <Textarea
                placeholder="What's on your mind? Capture a thought, reminder, or idea..."
                value={quickCapture}
                onChange={(e) => setQuickCapture(e.target.value)}
                className="min-h-[100px] text-base resize-none bg-surface-container-low border-0 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { icon: Clock, label: "Reminder" },
                    { icon: ImageIcon, label: "Image" },
                    { icon: LinkIcon, label: "Link" },
                  ].map(({ icon: Icon, label }) => (
                    <Button key={label} type="button" variant="ghost" size="sm"
                      className="text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full">
                      <Icon className="h-4 w-4 me-1.5" />
                      {label}
                    </Button>
                  ))}
                </div>
                <Button type="submit"
                  className="power-gradient text-white font-bold rounded-full px-6 shadow-ambient">
                  <Sparkles className="h-4 w-4 me-2" />
                  Save
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4">
            <div className="h-12 w-12 rounded-full power-gradient flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-on-surface mb-1">Daily Insight</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                You've captured <strong className="text-on-surface">{memoriesData.length} memories</strong> recently.
                You have <strong className="text-on-surface">{upcomingReminders.length} reminders</strong> coming up.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
          <Input
            placeholder="Search your memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-12 h-12 bg-surface-container-lowest border-outline-variant/50 rounded-full focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-surface-container-high rounded-full p-1 w-full grid grid-cols-3">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-ambient">
              All Memories
            </TabsTrigger>
            <TabsTrigger value="reminders" className="rounded-full data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-ambient">
              Reminders ({upcomingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="rounded-full data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-ambient">
              Recent
            </TabsTrigger>
          </TabsList>

          {/* All Memories */}
          <TabsContent value="all" className="space-y-3">
            {memoriesData.map((memory) => {
              const Icon = getMemoryIcon(memory.type);
              return (
                <div key={memory.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient hover-lift cursor-pointer group flex gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getMemoryColor(memory.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-on-surface leading-relaxed flex-1">{memory.content}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {memory.type === "reminder" && !memory.completed && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                          <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
                      <span>{memory.timestamp}</span>
                      {memory.dueDate && (
                        <>
                          <span>·</span>
                          <span className="text-secondary font-medium">Due: {memory.dueDate}</span>
                        </>
                      )}
                      {memory.tags && memory.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <div className="flex gap-1">
                            {memory.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Reminders */}
          <TabsContent value="reminders" className="space-y-3">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((memory) => (
                <div key={memory.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient hover-lift cursor-pointer group flex gap-4 border-s-4 border-secondary">
                  <Button variant="ghost" size="icon"
                    className="h-10 w-10 rounded-full border-2 border-secondary/30 hover:bg-secondary/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed mb-1">{memory.content}</p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Calendar className="h-3 w-3 text-secondary" />
                      <span className="text-secondary font-medium">{memory.dueDate}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-on-surface-variant">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No upcoming reminders</p>
              </div>
            )}
          </TabsContent>

          {/* Recent */}
          <TabsContent value="recent" className="space-y-3">
            {recentMemories.slice(0, 5).map((memory) => {
              const Icon = getMemoryIcon(memory.type);
              return (
                <div key={memory.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient hover-lift cursor-pointer group flex gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getMemoryColor(memory.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed mb-1">{memory.content}</p>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
                      <span>{memory.timestamp}</span>
                      {memory.tags && memory.tags.length > 0 && (
                        <>
                          <span>·</span>
                          {memory.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
