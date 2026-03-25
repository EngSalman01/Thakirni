"use client";

import dynamic from "next/dynamic";
import { Brain } from "lucide-react";
import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useLanguage } from "@/components/language-provider";
import { Sparkles } from "lucide-react";

const AIChat = dynamic(
  () => import("@/components/thakirni/ai-chat").then((m) => ({ default: m.AIChat })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-muted/30 rounded-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Brain className="w-8 h-8 animate-pulse text-primary" />
          <span className="text-sm font-medium">Loading assistant...</span>
        </div>
      </div>
    ),
  }
);

export default function AssistantPage() {
  const { t } = useLanguage();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <VaultSidebar />
        <main className="lg:ml-72 transition-all duration-300 pt-4 px-4 sm:px-6 lg:px-8 pb-8">
          {/* Header */}
          <div className="mb-6 pt-16 lg:pt-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("المساعد الذكي", "AI Assistant")}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm ms-13 ps-13">
              {t(
                "تحدث مع ذكاء اصطناعي يعرف ذكرياتك وخططك وعاداتك وأهدافك.",
                "Chat with an AI that knows your memories, plans, habits, and goals."
              )}
            </p>
          </div>

          {/* Chat */}
          <AIChat />
        </main>
      </div>
    </ErrorBoundary>
  );
}
