"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "ai/react";
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
  Mic,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

// Types
interface ToolInvocation {
  state: "call" | "partial-call" | "result";
  toolName: string;
  result?: {
    success?: boolean;
    message?: string;
    plans?: Array<{
      id: string;
      title: string;
      plan_date: string;
    }>;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

// Extracted Components
const ChatHeader = ({ t }: { t: (ar: string, en: string) => string }) => (
  <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border bg-muted/30 shrink-0">
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
          "Your assistant for organizing tasks and appointments",
        )}
      </p>
    </div>
  </div>
);

const EmptyState = ({
  t,
  suggestions,
  onSuggestionClick,
}: {
  t: (ar: string, en: string) => string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-6 md:py-8"
  >
    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
      <Calendar className="w-7 h-7 md:w-8 md:h-8 text-primary" />
    </div>
    <h4 className="text-base md:text-lg font-semibold text-foreground mb-2">
      {t("مرحباً! كيف يمكنني مساعدتك؟", "Hello! How can I help you?")}
    </h4>
    <p className="text-xs md:text-sm text-muted-foreground mb-6">
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
          className="text-xs bg-transparent hover:bg-muted/50 transition-colors"
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  </motion.div>
);

const ToolInvocationDisplay = ({
  invocation,
  t,
}: {
  invocation: ToolInvocation;
  t: (ar: string, en: string) => string;
}) => {
  if (invocation.state === "call" || invocation.state === "partial-call") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">
          {t("جاري المعالجة...", "Processing...")}
        </span>
      </div>
    );
  }

  if (invocation.state === "result") {
    const result = invocation.result;
    if (!result) return null;

    // Deduplicate plans
    const uniquePlans = result.plans
      ? Array.from(new Map(result.plans.map((p) => [p.id, p])).values())
      : [];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 rounded-xl bg-muted/50 border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs font-medium">
            {invocation.toolName === "create_plan"
              ? t("إضافة خطة", "Add Plan")
              : t("عرض الخطط", "View Plans")}
          </span>
        </div>

        {result.message && (
          <p className="text-sm text-muted-foreground">{result.message}</p>
        )}

        {uniquePlans.length > 0 && (
          <div className="space-y-2 mt-2">
            {uniquePlans.slice(0, 5).map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{plan.title}</span>
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

  return null;
};

const MessageBubble = ({
  message,
  t,
}: {
  message: Message;
  t: (ar: string, en: string) => string;
}) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
        ) : (
          <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[85%] md:max-w-[80%] space-y-2 ${
          isUser ? "text-left" : ""
        }`}
      >
        {message.content && (
          <div
            className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )}

        {message.toolInvocations?.map((invocation, idx) => (
          <ToolInvocationDisplay key={idx} invocation={invocation} t={t} />
        ))}
      </div>
    </motion.div>
  );
};

const LoadingIndicator = () => (
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
);

// Main Component
export function AIChat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { t } = useLanguage();

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat(
    {
      api: "/api/chat",
      onError: (err) => {
        console.error("[AIChat] Error:", err.message);
      },
    },
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      // Submit form after state update
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 50);
    },
    [setInput],
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        t(
          "متصفحك لا يدعم الإملاء الصوتي. جرّب Chrome أو Edge.",
          "Your browser does not support voice input. Try Chrome or Edge.",
        ),
      );
      return;
    }

    // Stop existing recognition if any
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.lang = "ar-SA"; // Primary language - handles English words reasonably well
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error("[AIChat] Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;

      if (event.error !== "aborted" && event.error !== "no-speech") {
        alert(
          t(
            "حدث خطأ في التعرف على الصوت. حاول مرة أخرى.",
            "Voice recognition error. Please try again.",
          ),
        );
      }
    };

    recognition.start();
  }, [t, setInput]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

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
    <Card className="flex flex-col h-[500px] md:h-[600px] bg-card border-border overflow-hidden">
      <ChatHeader t={t} />

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ScrollArea ref={scrollRef} className="h-full w-full p-3 md:p-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && !isLoading && (
              <EmptyState
                t={t}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message as Message}
                  t={t}
                />
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <LoadingIndicator />
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-2"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {t(
                    "حدث خطأ. حاول مرة أخرى.",
                    "An error occurred. Please try again.",
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <form
        ref={formRef}
        data-chat-form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 border-t border-border bg-muted/30 shrink-0"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("اكتب رسالتك هنا...", "Type your message here...")}
            className="flex-1 bg-background text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={
              isListening
                ? "bg-red-500 text-white hover:bg-red-600 hover:text-white border-red-500 animate-pulse"
                : "text-muted-foreground hover:bg-muted"
            }
            title={t(
              isListening ? "إيقاف التسجيل" : "تحدث",
              isListening ? "Stop recording" : "Speak",
            )}
          >
            {isListening ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 shrink-0 disabled:opacity-50"
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
