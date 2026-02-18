"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Upload,
  ImageIcon,
  Mic,
  FileText,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useMemories } from "@/hooks/use-memories";
import { usePlans } from "@/hooks/use-plans";
import { useLanguage } from "@/components/language-provider";

// Dynamic import to prevent SSR issues with AI SDK
const AIChat = dynamic(
  () =>
    import("@/components/thakirni/ai-chat").then((mod) => ({
      default: mod.AIChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    ),
  },
);

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300">
        <DashboardRouter />
      </main>
    </div>
  );
}
