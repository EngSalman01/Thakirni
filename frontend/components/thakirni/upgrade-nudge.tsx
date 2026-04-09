"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { X, Zap, TrendingUp, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface NudgeData {
  shouldShow: boolean
  urgency: "low" | "medium" | "high" | "critical"
  trigger: string | null
  usagePct: number
  messageAr: string
  messageEn: string
  ctaAr: string
  ctaEn: string
  pricingUrl: string
}

interface UpgradeNudgeProps {
  /** Pass featureLocked=true when user tries a PRO feature */
  featureLocked?: boolean
  /** Optional inline variant (inline bar vs floating card) */
  variant?: "banner" | "inline" | "floating"
  onDismiss?: () => void
}

const DISMISS_KEY = "thakirni_upgrade_nudge_dismissed"
const DISMISS_TTL = 4 * 60 * 60 * 1000 // 4 hours

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY)
    if (!ts) return false
    return Date.now() - parseInt(ts) < DISMISS_TTL
  } catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
}

export function UpgradeNudge({ featureLocked = false, variant = "banner", onDismiss }: UpgradeNudgeProps) {
  const { isArabic } = useLanguage()
  const [nudge, setNudge] = useState<NudgeData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!featureLocked && wasDismissedRecently()) return

    fetch(`/api/monetization/nudge${featureLocked ? "?featureLocked=1" : ""}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: NudgeData | null) => {
        if (data?.shouldShow) {
          setNudge(data)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [featureLocked])

  function dismiss() {
    if (!featureLocked) markDismissed()
    setVisible(false)
    onDismiss?.()
  }

  const urgencyColor: Record<string, string> = {
    low:      "#D97706",
    medium:   "#f59e0b",
    high:     "#ef4444",
    critical: "#dc2626",
  }
  const urgencyBg: Record<string, string> = {
    low:      "#D9770608",
    medium:   "#f59e0b08",
    high:     "#ef444408",
    critical: "#dc262608",
  }

  return (
    <AnimatePresence>
      {visible && nudge && (
        <motion.div
          initial={{ opacity: 0, y: variant === "floating" ? 20 : -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className={variant === "floating"
            ? "fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-2xl"
            : "w-full"
          }
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div
            className="rounded-2xl border p-4 flex items-start gap-3"
            style={{
              borderColor: `${urgencyColor[nudge.urgency]}30`,
              backgroundColor: urgencyBg[nudge.urgency],
            }}
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${urgencyColor[nudge.urgency]}15` }}
            >
              {nudge.urgency === "critical" || nudge.urgency === "high"
                ? <AlertTriangle className="w-4 h-4" style={{ color: urgencyColor[nudge.urgency] }} />
                : nudge.trigger === "feature_locked"
                  ? <Zap className="w-4 h-4" style={{ color: urgencyColor[nudge.urgency] }} />
                  : <TrendingUp className="w-4 h-4" style={{ color: urgencyColor[nudge.urgency] }} />
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-label text-muted-foreground leading-snug">
                {isArabic ? nudge.messageAr : nudge.messageEn}
              </p>

              {/* Usage bar */}
              {nudge.usagePct > 0 && nudge.trigger !== "feature_locked" && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(nudge.usagePct, 100)}%`,
                        backgroundColor: urgencyColor[nudge.urgency],
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-label shrink-0">{nudge.usagePct}%</span>
                </div>
              )}

              <Link
                href={nudge.pricingUrl}
                className="inline-block mt-2 text-sm font-semibold font-label transition-opacity hover:opacity-80"
                style={{ color: urgencyColor[nudge.urgency] }}
              >
                {isArabic ? nudge.ctaAr : nudge.ctaEn} →
              </Link>
            </div>

            {/* Dismiss */}
            {!featureLocked && (
              <button
                onClick={dismiss}
                className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-muted-foreground hover:bg-white/60 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
