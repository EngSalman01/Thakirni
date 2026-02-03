"use client"

import React from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRef, useEffect } from "react"

export function AIChat() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.log("[v0] Chat error:", err)
    },
  })

  // Log error for debugging
  if (error) {
    console.log("[v0] useChat error state:", error)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const suggestions = [
    "ذكرني بعيد ميلاد أمي يوم 15 مارس",
    "أضف موعد طبيب يوم الخميس الساعة 3",
    "اعرض لي خططي القادمة",
    "أريد تذكير سنوي بذكرى زواجي",
  ]

  return (
    <Card className="flex flex-col h-[600px] bg-card border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">مساعد ذكرني</h3>
          <p className="text-xs text-muted-foreground">أضف خططك وسأذكرك بها</p>
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
                مرحباً! كيف يمكنني مساعدتك؟
              </h4>
              <p className="text-sm text-muted-foreground mb-6">
                أخبرني بما تريد تذكره وسأساعدك في تنظيمه
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
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
              const text = message.content
              const toolInvocations = message.toolInvocations || []
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-left" : ""}`}>
                    {text && (
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{text}</p>
                      </div>
                    )}
                    
                    {/* Tool results */}
                    {toolInvocations.map((tool) => {
                      const result = tool.result as { success?: boolean; message?: string; plans?: Array<{ id: string; title: string; plan_date: string; category: string }> } | undefined
                      
                      if (tool.state === "result" && result) {
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
                                {tool.toolName === "create_plan" ? "إضافة خطة" : "عرض الخطط"}
                              </span>
                            </div>
                            
                            {result.message && (
                              <p className="text-sm text-muted-foreground">{result.message}</p>
                            )}
                            
                            {result.plans && result.plans.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {result.plans.slice(0, 5).map((plan) => (
                                  <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                                    <span className="text-sm font-medium">{plan.title}</span>
                                    <span className="text-xs text-muted-foreground">{plan.plan_date}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )
                      }
                      
                      if (tool.state === "call" || tool.state === "partial-call") {
                        return (
                          <div key={tool.toolCallId} className="mt-2 flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">جاري المعالجة...</span>
                          </div>
                        )
                      }
                      
                      return null
                    })}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
            >
              Error: {error.message}
            </motion.div>
          )}

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
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
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
  )
}
