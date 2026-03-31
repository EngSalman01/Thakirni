"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const CHIPS_AR = ["أضف اجتماع الأحد", "ذكرني أشتري أغراض", "وش عندي اليوم؟", "رتب لي يومي"];
const CHIPS_EN = ["Make me a weekly plan", "Summarise this content", "Organise my tasks", "What did I achieve this week?"];

export function AIVaultHero() {
  const { t, isArabic } = useLanguage();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chips = isArabic ? CHIPS_AR : CHIPS_EN;

  const handleSubmit = () => {
    const prompt = input.trim();
    if (!prompt) {
      router.push("/vault/assistant");
      return;
    }
    router.push(`/vault/assistant?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Input container */}
      <div className={`relative transition-all duration-300 ${focused ? "input-glow-active" : ""}`}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t(
            "وش تبغى تسوي اليوم؟ خلني أساعدك",
            "What do you want to do today? Let me help you"
          )}
          rows={3}
          className="w-full resize-none rounded-3xl bg-white dark:bg-surface-container border-2 border-outline-variant/40 focus:border-primary/60 focus:ring-0 focus:outline-none px-6 py-5 pb-16 text-lg text-on-surface placeholder:text-on-surface-variant/50 shadow-card transition-all duration-300 font-arabic leading-relaxed"
        />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          className="absolute bottom-4 end-4 flex items-center gap-2 px-5 py-2.5 rounded-full power-gradient text-white font-bold text-sm shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          {t("ابدأ بالذكاء الاصطناعي", "Start with AI")}
        </motion.button>
      </div>

      {/* Prompt chips */}
      <div className="flex flex-wrap gap-2.5">
        {chips.map((chip) => (
          <motion.button
            key={chip}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setInput(chip);
              inputRef.current?.focus();
            }}
            className="px-4 py-2 rounded-full bg-[#f0eded] hover:bg-[#dce1ff] text-[#434654] hover:text-[#2552ca] text-sm font-semibold transition-all duration-200 border border-outline-variant/30 hover:border-[#2552ca]/30"
          >
            {chip}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
