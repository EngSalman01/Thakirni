"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const CHIPS_AR = ["وش عندي اليوم؟", "رتب لي يومي", "ذكرني أشتري أغراض"]
const CHIPS_EN = ["What do I have today?", "Organise my day", "Remind me to buy groceries"]

export function AIInputBox() {
  const { t, isArabic } = useLanguage()
  const router = useRouter()
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const chips = isArabic ? CHIPS_AR : CHIPS_EN

  const handleSubmit = () => {
    const prompt = input.trim()
    if (!prompt) {
      router.push("/vault/assistant")
      return
    }
    router.push(`/vault/assistant?prompt=${encodeURIComponent(prompt)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3" dir={isArabic ? "rtl" : "ltr"}>
      {/* Input — primary action element */}
      <div
        className={[
          "relative rounded-2xl transition-all duration-200",
          focused
            ? "shadow-[0_0_0_3px_rgba(127,119,221,0.18),0_2px_12px_rgba(127,119,221,0.10)]"
            : "shadow-sm",
        ].join(" ")}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t("وش تبغى أرتب لك اليوم؟ 👀", "What can I organise for you today? 👀")}
          rows={3}
          className="w-full resize-none rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] focus:border-violet-400 dark:focus:border-violet-500 focus:ring-0 focus:outline-none px-5 py-4 pb-14 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400/70 dark:placeholder:text-slate-500/70 transition-colors duration-150 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="absolute bottom-3 end-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-md"
          style={{ willChange: "transform" }}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {t("ابدأ بالذكاء", "Start with AI")}
        </motion.button>
      </div>

      {/* Suggestion chips — max 3 */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setInput(chip)
              inputRef.current?.focus()
            }}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 text-sm font-medium cursor-pointer transition-colors duration-150 border border-slate-200 dark:border-white/[0.10] hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
