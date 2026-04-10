"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  AlertCircle,
  Mic,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import type { UIMessage } from "ai";

// Extracted Components
const ChatHeader = ({ t }: { t: (ar: string, en: string) => string }) => (
  <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border bg-muted/30 shrink-0">
    <motion.div
      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)" }}
    >
      <Bot className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
    </motion.div>
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
    <motion.div
      className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)" }}
    >
      <Calendar className="w-7 h-7 md:w-8 md:h-8 text-emerald-500" />
    </motion.div>
    <h4 className="text-base md:text-lg font-semibold text-foreground mb-2">
      {t("هلا! كيف أقدر أساعدك؟", "Hello! How can I help you?")}
    </h4>
    <p className="text-xs md:text-sm text-muted-foreground mb-6">
      {t(
        "أقدر أساعدك تنظم مهامك، ومشترياتك، ومواعيدك",
        "I can help you organize tasks, groceries, and appointments",
      )}
    </p>

    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion, i) => (
        <motion.div key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))"
            }}
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

// Check if message has any in-progress tool calls (v6: tool parts are typed as `tool-${toolName}`)
function hasActiveToolCall(message: UIMessage): boolean {
  return message.parts.some(
    (p) => p.type.startsWith("tool-") &&
      (p as { state?: string }).state !== "output-available" &&
      (p as { state?: string }).state !== "output-error"
  );
}

const MessageBubble = ({
  message,
  t,
}: {
  message: UIMessage;
  t: (ar: string, en: string) => string;
}) => {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const activeCall = hasActiveToolCall(message);

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
        {text && (
          <div
            className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
          </div>
        )}

        {/* Show spinner while tool is executing */}
        {activeCall && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">{t("جاري المعالجة...", "Processing...")}</span>
          </div>
        )}
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
    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
      <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
    </div>
    <div className="bg-muted rounded-2xl px-4 py-2 flex gap-1">
      <motion.span
        className="w-2 h-2 rounded-full bg-emerald-500"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      <motion.span
        className="w-2 h-2 rounded-full bg-emerald-500"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="w-2 h-2 rounded-full bg-emerald-500"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  </motion.div>
);

// Main Component
export function AIChat() {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<unknown>(null);
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState("");
  const { t } = useLanguage();

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      console.error("[AIChat] Error:", err.message);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom on every new message or while streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  }, [input, sendMessage]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion });
    },
    [sendMessage],
  );

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: (new () => any) | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
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
      (recognitionRef.current as { stop: () => void }).stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognitionRef.current = recognition;

    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: { results: [{ 0: { transcript: string } }] }) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: { error: string }) => {
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
      (recognitionRef.current as { stop: () => void }).stop();
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
        <ScrollArea className="h-full w-full p-3 md:p-4">
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
                  message={message}
                  t={t}
                />
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <LoadingIndicator />
            )}

            <div ref={bottomRef} />

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

      {/* Input Area - Floating glass style */}
      <form
        data-chat-form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 md:p-4 shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent"
      >
        <motion.div
          className="flex gap-2 glass-dark rounded-2xl p-2 md:p-3"
          whileHover={{ boxShadow: "0 0 30px rgba(16, 185, 129, 0.15)" }}
          transition={{ duration: 0.3 }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("اكتب رسالتك هنا...", "Type your message here...")}
            className="flex-1 bg-transparent text-sm border-0 focus:ring-0 placeholder-muted-foreground/60"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={
              isListening
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 shrink-0"
                : "text-muted-foreground hover:text-foreground hover:bg-white/10 shrink-0"
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
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 disabled:opacity-50 disabled:bg-emerald-600/50"
              style={{
                boxShadow: !input.trim() || isLoading ? "none" : "0 0 20px rgba(16, 185, 129, 0.4)"
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </Card>
  );
}
