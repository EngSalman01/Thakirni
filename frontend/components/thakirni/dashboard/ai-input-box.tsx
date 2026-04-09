"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useChat } from "ai/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, Send, Loader2, Bot, User, Mic, Square, AlertCircle, CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/components/language-provider"

const CHIPS_AR = ["وش عندي اليوم؟", "رتب لي يومي", "ذكرني أشتري أغراض"]
const CHIPS_EN = ["What do I have today?", "Organise my day", "Remind me to buy groceries"]

type ToolInvocation = {
  state: "call" | "partial-call" | "result"
  toolName: string
  result?: {
    success?: boolean
    message?: string
    plans?: Array<{ id: string; title: string; plan_date: string; plan_time?: string }>
  }
}

function ToolDisplay({ inv, t }: { inv: ToolInvocation; t: (ar: string, en: string) => string }) {
  if (inv.state !== "result" || !inv.result) return null
  const silent = ["store_fact", "preview_plan", "get_timeline", "set_reminder"]
  if (silent.includes(inv.toolName)) return null
  const { success, message, plans } = inv.result
  const unique = plans ? Array.from(new Map(plans.map(p => [p.id, p])).values()) : []
  return (
    <div className="p-2.5 rounded-xl bg-muted/50 border border-border text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        {success
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
        <span className="font-medium">
          {inv.toolName === "create_plan" ? t("تمت الإضافة", "Plan Added")
            : inv.toolName === "delete_plan" ? t("تم الحذف", "Deleted")
            : inv.toolName === "mark_done" ? t("تم الإنجاز", "Marked Done")
            : t("الخطط", "Plans")}
        </span>
      </div>
      {message && <p className="text-muted-foreground">{message}</p>}
      {(unique as Array<{ id: string; title: string; plan_date: string; plan_time?: string }>).slice(0, 5).map(p => (
        <div key={p.id} className="flex justify-between p-1.5 rounded-lg bg-background mt-1">
          <span className="font-medium">{p.title}</span>
          <span className="text-muted-foreground">{p.plan_date}{p.plan_time ? ` ${p.plan_time.slice(0, 5)}` : ""}</span>
        </div>
      ))}
    </div>
  )
}

export function AIInputBox() {
  const { t, isArabic } = useLanguage()
  const chips = isArabic ? CHIPS_AR : CHIPS_EN

  const [isListening, setIsListening] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({ api: "/api/chat" })

  const hasMessages = messages.length > 0

  useEffect(() => {
    if (!scrollAreaRef.current) return
    const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [messages, isLoading])

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  const submit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return
    handleSubmit(e as React.FormEvent<HTMLFormElement>)
  }, [input, handleSubmit])

  const handleChip = (chip: string) => {
    setInput(chip)
    setTimeout(() => formRef.current?.requestSubmit(), 50)
  }

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert(t("متصفحك لا يدعم الإملاء الصوتي.", "Your browser doesn't support voice input.")); return }
    if (recognitionRef.current) { recognitionRef.current.stop(); return }
    const r = new SR()
    recognitionRef.current = r
    r.lang = "ar-SA"; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false
    r.onstart = () => setIsListening(true)
    r.onresult = (ev: any) => setInput(prev => prev ? `${prev} ${ev.results[0][0].transcript}` : ev.results[0][0].transcript)
    r.onend = () => { setIsListening(false); recognitionRef.current = null }
    r.onerror = (ev: any) => {
      setIsListening(false); recognitionRef.current = null
      if (ev.error !== "aborted" && ev.error !== "no-speech") alert(t("خطأ في التعرف الصوتي.", "Voice recognition error."))
    }
    r.start()
  }, [t, setInput])

  const stopListening = useCallback(() => recognitionRef.current?.stop(), [])

  return (
    <div className="space-y-3" dir={isArabic ? "rtl" : "ltr"}>
      {/* ── The box ─────────────────────────────────────────────────────────── */}
      <motion.div
        layout
        className="rounded-2xl bg-card dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] overflow-hidden shadow-sm transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(127,119,221,0.18),0_2px_12px_rgba(127,119,221,0.10)]"
      >
        {/* Messages area — only when chat started */}
        <AnimatePresence>
          {hasMessages && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 320, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <ScrollArea ref={scrollAreaRef} className="h-[320px] px-4 pt-4">
                <div className="space-y-3 pb-3">
                  <AnimatePresence>
                    {messages.map(msg => {
                      const isUser = msg.role === "user"
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] ${isUser ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-white/[0.08] text-muted-foreground"}`}>
                            {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 max-w-[80%] space-y-1.5">
                            {msg.content && (
                              <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-white/[0.06] text-foreground"}`}>
                                {msg.content}
                              </div>
                            )}
                            {(msg as any).toolInvocations?.map((inv: ToolInvocation, i: number) => (
                              <ToolDisplay key={i} inv={inv} t={t} />
                            ))}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-muted dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="bg-muted dark:bg-white/[0.06] rounded-2xl px-3 py-2 flex gap-1 items-center">
                        {[0, 0.2, 0.4].map(d => (
                          <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t("حدث خطأ. حاول مرة أخرى.", "An error occurred. Please try again.")}
                    </div>
                  )}

                </div>
              </ScrollArea>
              {/* divider */}
              <div className="h-px bg-muted dark:bg-white/[0.06]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <form ref={formRef} onSubmit={submit} className="relative">
          {!hasMessages ? (
            /* Textarea style when no messages */
            <>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() } }}
                placeholder={t("وش تبغى أرتب لك اليوم؟ 👀", "What can I organise for you today? 👀")}
                rows={3}
                className="w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none px-5 py-4 pb-14 text-base text-foreground dark:text-slate-100 placeholder:text-slate-400/70 dark:placeholder:text-slate-500/70 leading-relaxed"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="absolute bottom-3 end-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-semibold text-sm shadow-md"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                {t("ابدأ بالذكاء", "Start with AI")}
              </motion.button>
            </>
          ) : (
            /* Compact inline input when chatting */
            <div className="flex gap-2 px-3 py-2.5 items-center">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit() } }}
                placeholder={t("اكتب رسالتك...", "Type your message...")}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm px-1 placeholder-muted-foreground/60"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${isListening ? "bg-red-500/15 text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"}`}
              >
                {isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
              </button>
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          )}
        </form>
      </motion.div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="px-3.5 py-1.5 rounded-full bg-card dark:bg-white/[0.06] text-muted-foreground dark:text-slate-300 text-sm font-medium cursor-pointer transition-colors duration-150 border border-border dark:border-white/[0.10] hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
