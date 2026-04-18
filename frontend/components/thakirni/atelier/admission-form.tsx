"use client"

/**
 * AdmissionForm — the iconic OA "admission" panel, repurposed for Thakirni
 * waitlist / early-access capture. Brand-forward form that replaces the
 * generic mailing-list input on marketing pages.
 *
 * Anatomy:
 *   - Eyebrow label + oversized serif prompt ("Admission" / "الانضمام")
 *   - Short 2-line paragraph
 *   - Single email field with a hairline rule, not a boxed input — OA style
 *   - Submit pill "Request" with trailing arrow
 *   - Fine print caption
 *
 * This is a purely presentational component — the consumer handles submit.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type AdmissionFormProps = {
  eyebrow?: React.ReactNode // e.g., "Admission / 04"
  heading: React.ReactNode
  description?: React.ReactNode
  fineprint?: React.ReactNode
  submitLabel?: string
  placeholder?: string
  locale?: "en" | "ar"
  onSubmit?: (email: string) => Promise<void> | void
  className?: string
}

export function AdmissionForm({
  eyebrow,
  heading,
  description,
  fineprint,
  submitLabel = "Request entry",
  placeholder = "you@domain.com",
  locale = "en",
  onSubmit,
  className,
}: AdmissionFormProps) {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "pending" | "done" | "error">("idle")
  const [error, setError] = React.useState<string | null>(null)

  const isRtl = locale === "ar"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === "pending") return
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setError(isRtl ? "بريد إلكتروني غير صالح" : "That email doesn't look right.")
      setStatus("error")
      return
    }
    setStatus("pending")
    setError(null)
    try {
      await onSubmit?.(email)
      setStatus("done")
      setEmail("")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : isRtl ? "حدث خطأ" : "Something went wrong.")
    }
  }

  return (
    <section
      className={cn(
        "relative flex flex-col gap-8 p-8 md:p-12",
        "bg-[var(--atelier-bg-elevated)]",
        "border border-[var(--atelier-border)]",
        "rounded-[var(--atelier-radius-md)]",
        "shadow-[var(--atelier-shadow-card)]",
        className,
      )}
    >
      {/* Decorative flush-mark in corner */}
      <span
        aria-hidden
        className="absolute top-0 left-0 h-1 w-12 bg-[var(--c-ember)]"
      />

      {eyebrow && <div className="atelier-eyebrow text-[var(--atelier-text-subtle)]">{eyebrow}</div>}

      <h3
        className={cn(
          "atelier-h2",
          isRtl ? "atelier-display-ar" : "atelier-display",
          "text-[var(--atelier-text)]",
          "max-w-[20ch]",
        )}
      >
        {heading}
      </h3>

      {description && (
        <p className="atelier-lead max-w-[48ch] text-[var(--atelier-text-muted)]">
          {description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="group flex flex-col gap-2">
          <span className="atelier-label text-[var(--atelier-text-subtle)]">
            {isRtl ? "البريد الإلكتروني" : "Email"}
          </span>
          <div className="relative">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === "error") {
                  setStatus("idle")
                  setError(null)
                }
              }}
              placeholder={placeholder}
              className={cn(
                "w-full bg-transparent pb-3 pt-2 outline-none",
                "atelier-body text-[var(--c-parchment)]",
                "placeholder:text-[var(--atelier-text-subtle)]",
                "border-b border-[var(--atelier-border-strong)]",
                "focus:border-[var(--c-ember)]",
                "transition-colors duration-[var(--atelier-dur-2)]",
              )}
              disabled={status === "pending" || status === "done"}
            />
          </div>
          {status === "error" && error && (
            <span className="atelier-label text-[var(--c-ember)]">{error}</span>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={status === "pending" || status === "done"}
            className={cn(
              "inline-flex items-center gap-3 px-6 py-3",
              "rounded-full",
              "bg-[var(--c-parchment)] text-[var(--c-obsidian)]",
              "atelier-label !tracking-[var(--atelier-tracking-pill)]",
              "hover:bg-[var(--c-ivory)]",
              "transition-all duration-[var(--atelier-dur-2)]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "shadow-[0_10px_30px_-15px_var(--c-ember-glow)]",
              "hover:shadow-[0_18px_50px_-15px_var(--c-ember-glow)]",
            )}
          >
            <span>
              {status === "done"
                ? isRtl
                  ? "تم الإرسال"
                  : "Received"
                : status === "pending"
                  ? isRtl
                    ? "جارٍ الإرسال..."
                    : "Sending…"
                  : submitLabel}
            </span>
            <span
              aria-hidden
              className="transition-transform duration-[var(--atelier-dur-2)] group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>

          {fineprint && (
            <p className="atelier-label text-[var(--atelier-text-subtle)] max-w-xs">
              {fineprint}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
