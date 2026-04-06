"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, Copy, Check, Share2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface ShareData {
  code: string
  link: string
  message: string
  referralCount: number
  reward: { credits: number; description: string }
}

export function ReferralShare() {
  const { isArabic } = useLanguage()
  const [data, setData] = useState<ShareData | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch("/api/referral/share")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(data!.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for mobile
      const input = document.createElement("input")
      input.value = data!.link
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function shareWhatsApp() {
    const text = encodeURIComponent(data!.message)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#f0ede9] transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 text-start">
          <p className="text-sm font-label font-semibold text-slate-800">
            {isArabic ? "شارك ذكرني — وكسب ٥٠ رصيد" : "Share Thakirni — earn 50 credits"}
          </p>
          <p className="text-xs text-slate-500 font-label mt-0.5">
            {isArabic
              ? `دعيت ${data.referralCount} ${data.referralCount === 1 ? "شخص" : "أشخاص"} حتى الآن`
              : `${data.referralCount} ${data.referralCount === 1 ? "person" : "people"} referred so far`
            }
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 text-xs"
        >
          ▼
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Reward callout */}
              <div className="bg-indigo-600/5 border border-indigo-600/15 rounded-xl px-3 py-2.5 text-sm font-label text-slate-700">
                {data.reward.description}
              </div>

              {/* Link row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-600 truncate">
                  {data.link}
                </div>
                <button
                  onClick={copyLink}
                  className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                >
                  <AnimatePresence mode="wait">
                    {copied
                      ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4 text-green-500" /></motion.div>
                      : <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-3.5 h-3.5" /></motion.div>
                    }
                  </AnimatePresence>
                </button>
              </div>

              {/* WhatsApp share button */}
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25d366] text-white text-sm font-label font-semibold hover:opacity-90 transition-opacity"
              >
                <Share2 className="w-4 h-4" />
                {isArabic ? "شارك على واتساب" : "Share on WhatsApp"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
