"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

/** Extract text from UIMessage parts */
function getMessageText(
  parts: Array<{ type: string; text?: string; [key: string]: any }>
): string {
  if (!parts || !Array.isArray(parts)) return "";
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function AIChat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const { t } = useLanguage();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const value = input;
    setInput("");
    sendMessage({ text: value });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput("");
    sendMessage({ text: suggestion });
  };

  const suggestions = [
    t("أضف اجتماع مع الفريق يوم الأحد", "Add team meeting on Sunday"),
    t("ذكرني بشراء حليب وخبز", "Remind me to buy milk and bread"),
    t(
      "عندي موعد طبيب غداً الساعة 4",
      "I have a doctor's appointment tomorrow at 4"
    ),
    t("اعرض لي مهام اليوم", "Show me today's tasks"),
  ];

  return (
    <Card className="flex flex-col h-[500px] md:h-[600px] bg-card border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border bg-muted/30">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm md:text-base">
            {t("مساعد ذكرني", "Thakirni Assistant")}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {t(
              "مساعدك لتنظيم مهامك ومواعيدك",
              "Your assistant for organizing tasks and appointments"
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3 md:p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6 md:py-8"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <h4 className="text-base md:text-lg font-semibold text-foreground mb-2">
                {t(
                  "مرحباً! كيف يمكنني مساعدتك؟",
                  "Hello! How can I help you?"
                )}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground mb-6">
                {t(
                  "يمكنني مساعدتك في تنظيم مهامك، ومشترياتك، ومواعيدك",
                  "I can help you organize tasks, groceries, and appointments"
                )}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => {
              const textContent = getMessageText(message.parts);
              const toolParts = message.parts.filter(
                (p) =>
                  p.type.startsWith("tool-") ||
                  p.type === "tool-invocation"
              );

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                  </div>

                  <div
                    className={`flex-1 max-w-[85%] md:max-w-[80%] space-y-2 ${
                      message.role === "user" ? "text-left" : ""
                    }`}
                  >
                    {textContent && (
                      <div
                        className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {textContent}
                        </p>
                      </div>
                    )}

                    {/* Render tool parts */}
                    {message.parts.map((part, idx) => {
                      // Handle tool invocations from parts
                      if (
                        part.type === "tool-invocation" ||
                        part.type.startsWith("tool-")
                      ) {
                        const toolPart = part as any;

                        // Loading state for tools
                        if (
                          toolPart.state === "input-streaming" ||
                          toolPart.state === "input-available" ||
                          toolPart.state === "call" ||
                          toolPart.state === "partial-call"
                        ) {
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs">
                                {t("جاري المعالجة...", "Processing...")}
                              </span>
                            </div>
                          );
                        }

                        // Result state
                        if (
                          toolPart.state === "output-available" ||
                          toolPart.state === "result"
                        ) {
                          const result = toolPart.output || toolPart.result;
                          if (!result) return null;

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 rounded-xl bg-muted/50 border border-border"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {result?.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-xs font-medium">
                                  {toolPart.toolName === "create_plan"
                                    ? t("إضافة خطة", "Add Plan")
                                    : t("عرض الخطط", "View Plans")}
                                </span>
                              </div>

                              {result?.message && (
                                <p className="text-sm text-muted-foreground">
                                  {result.message}
                                </p>
                              )}

                              {result?.plans &&
                                result.plans.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {result.plans
                                      .slice(0, 5)
                                      .map((plan: any) => (
                                        <div
                                          key={plan.id}
                                          className="flex items-center justify-between p-2 rounded-lg bg-background"
                                        >
                                          <span className="text-sm font-medium">
                                            {plan.title}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {plan.plan_date}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </motion.div>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 border-t border-border bg-muted/30"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(
              "اكتب رسالتك هنا...",
              "Type your message here..."
            )}
            className="flex-1 bg-background text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
