"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, X, ExternalLink } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const CONSENT_KEY = "thakirni_consent_v1"

export function ConsentModal() {
  const [visible, setVisible] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const { isArabic } = useLanguage()

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(CONSENT_KEY) : null
    if (stored === "accepted") return

    fetch("/api/user/consent")
      .then((r) => (r.ok ? r.json() as Promise<{ consented?: boolean }> : null))
      .then((d) => {
        if (!d) return
        if (!d.consented) {
          setVisible(true)
        } else {
          localStorage.setItem(CONSENT_KEY, "accepted")
        }
      })
      .catch(() => {})
  }, [])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const res = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "1.0" }),
      })
      if (res.ok) localStorage.setItem(CONSENT_KEY, "accepted")
    } catch {
      // ignore — will re-prompt next load
    } finally {
      setAccepting(false)
      setVisible(false)
    }
  }

  const handleDecline = () => setVisible(false)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 end-5 z-50 w-[min(340px,calc(100vw-2.5rem))] shell-panel rounded-2xl p-4 shadow-xl"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {/* Dismiss X */}
          <button
            onClick={handleDecline}
            className="absolute top-3 end-3 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {isArabic ? "موافقة على الخصوصية" : "Privacy Notice"}
            </p>
          </div>

          {/* Body */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {isArabic
              ? "تستخدم ذاكرني الذكاء الاصطناعي لمعالجة مدخلاتك وتقديم خدمات التذكير والتخطيط. بياناتك محمية وفق نظام PDPL."
              : "Thakirni uses AI to process your inputs for reminders and planning. Your data is protected under Saudi Arabia's PDPL."}
            {" "}
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
            >
              {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white power-gradient disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {accepting && (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {isArabic ? "أوافق" : "Accept"}
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {isArabic ? "لاحقاً" : "Later"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
