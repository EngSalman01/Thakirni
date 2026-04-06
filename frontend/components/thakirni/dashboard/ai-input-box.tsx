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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
      className="space-y-3"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Input */}
      <div
        className={[
          "relative rounded-2xl transition-shadow duration-200",
          focused
            ? "shadow-[0_0_0_3px_rgba(99,102,241,0.18),0_4px_24px_rgba(99,102,241,0.10)]"
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
          className="w-full resize-none rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-0 focus:outline-none px-5 py-4 pb-14 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-150 leading-relaxed"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="absolute bottom-3 end-3 flex items-center gap-2 px-4 py-2 rounded-xl power-gradient text-white font-semibold text-sm shadow-md"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {t("ابدأ بالذكاء", "Start with AI")}
        </motion.button>
      </div>

      {/* Max 3 chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <motion.button
            key={chip}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setInput(chip)
              inputRef.current?.focus()
            }}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors duration-150 border border-slate-200 dark:border-white/[0.08] hover:border-indigo-200 dark:hover:border-indigo-700"
          >
            {chip}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
