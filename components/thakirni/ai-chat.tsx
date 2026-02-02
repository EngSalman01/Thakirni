"use client";

import React from "react";
import dynamic from "next/dynamic";
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
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

function getUIMessageText(msg: {
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return "";
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function AIChat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const { t } = useLanguage();

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const suggestions = [
    t("أضف اجتماع مع الفريق يوم الأحد", "Add team meeting on Sunday"),
    t("ذكرني بشراء حليب وخبز", "Remind me to buy milk and bread"),
    t(
      "عندي موعد طبيب غداً الساعة 4",
      "I have a doctor's appointment tomorrow at 4",
    ),
    t("اعرض لي مهام اليوم", "Show me today's tasks"),
  ];

  return (
    <Card className="flex flex-col h-[600px] bg-card border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {t("مساعد ذكرني", "Thakirni Assistant")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              "مساعدك لتنظيم مهامك ومواعيدك",
              "Your assistant for organizing tasks and appointments",
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("مرحباً! كيف يمكنني مساعدتك؟", "Hello! How can I help you?")}
              </h4>
              <p className="text-sm text-muted-foreground mb-6">
                {t(
                  "يمكنني مساعدتك في تنظيم مهامك، ومشترياتك، ومواعيدك",
                  "I can help you organize tasks, groceries, and appointments",
                )}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => {
              const text = getUIMessageText(message);
              const toolInvocations =
                message.parts?.filter((p) => p.type === "tool-invocation") ||
                [];

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-left" : ""}`}
                  >
                    {text && (
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{text}</p>
                      </div>
                    )}

                    {/* Tool results */}
                    {toolInvocations.map((tool) => {
                      if (tool.type !== "tool-invocation") return null;
                      const result = tool.output as
                        | {
                            success?: boolean;
                            message?: string;
                            plans?: Array<{
                              id: string;
                              title: string;
                              plan_date: string;
                              category: string;
                            }>;
                          }
                        | undefined;

                      if (tool.state === "output-available" && result) {
                        return (
                          <motion.div
                            key={tool.toolCallId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 p-3 rounded-xl bg-muted/50 border border-border"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {result.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs font-medium">
                                {(tool as any).toolName === "create_plan"
                                  ? t("إضافة خطة", "Add Plan")
                                  : t("عرض الخطط", "View Plans")}
                              </span>
                            </div>

                            {result.message && (
                              <p className="text-sm text-muted-foreground">
                                {result.message}
                              </p>
                            )}

                            {result.plans && result.plans.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {result.plans
                                  .slice(0, 5)
                                  .map(
                                    (plan: {
                                      id: string;
                                      title: string;
                                      plan_date: string;
                                      category: string;
                                    }) => (
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
                                    ),
                                  )}
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      if (
                        tool.state === "input-streaming" ||
                        tool.state === "input-available"
                      ) {
                        return (
                          <div
                            key={tool.toolCallId}
                            className="mt-2 flex items-center gap-2 text-muted-foreground"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">
                              {t("جاري المعالجة...", "Processing...")}
                            </span>
                          </div>
                        );
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
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
        className="p-4 border-t border-border bg-muted/30"
      >
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("اكتب رسالتك هنا...", "Type your message here...")}
            className="flex-1 bg-background"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90"
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
