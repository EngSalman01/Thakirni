"use client"

/**
 * WordmarkStacked — Thakirni's atelier wordmark.
 *
 * Obsidian Assembly stacks "OBSIDIAN / ASSEMBLY" on two editorial serif lines
 * with a small flush mark. We mirror that with the Latin/Arabic pairing:
 *
 *   Thakirni
 *   ذكرني
 *
 * The Latin line uses Fraunces display; the Arabic line uses Reem Kufi.
 * Both center-justify on their own baselines. Optionally shows a tiny ember
 * accent bullet between the lines or an "EST. 2026 · MAKKAH" sub-caption.
 *
 * This component is the canonical brand anchor on hero, footer, and auth screens.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type WordmarkStackedProps = {
  /** "lg" for hero, "md" for nav, "sm" for inline caption. */
  size?: "sm" | "md" | "lg" | "xl"
  /** Primary orientation. "stacked" = two lines; "inline" = on one line. */
  orientation?: "stacked" | "inline"
  /** Append the "est 2026 · Riyadh" caption. */
  withCaption?: boolean
  /** Swap which line is primary. On English pages the Latin line is bold; on Arabic, the Arabic line. */
  primary?: "latin" | "arabic"
  className?: string
}

const latinSize: Record<NonNullable<WordmarkStackedProps["size"]>, string> = {
  sm: "text-[1.5rem] leading-none",
  md: "text-[2.25rem] leading-none",
  lg: "text-[4rem] leading-[0.9]",
  xl: "text-[clamp(4rem,10vw,9rem)] leading-[0.9]",
}

const arabicSize: Record<NonNullable<WordmarkStackedProps["size"]>, string> = {
  sm: "text-[1.25rem] leading-none",
  md: "text-[1.85rem] leading-none",
  lg: "text-[3rem] leading-[1]",
  xl: "text-[clamp(3rem,8vw,7rem)] leading-[1]",
}

export function WordmarkStacked({
  size = "md",
  orientation = "stacked",
  withCaption = false,
  primary = "latin",
  className,
}: WordmarkStackedProps) {
  const latinClasses = cn(
    "atelier-display tracking-[var(--atelier-tracking-tight)]",
    "text-[var(--c-parchment)]",
    latinSize[size],
    primary === "latin" ? "font-medium" : "font-light opacity-90",
  )

  const arabicClasses = cn(
    "atelier-display-ar",
    "text-[var(--c-parchment)]",
    arabicSize[size],
    primary === "arabic" ? "font-semibold" : "font-normal opacity-90",
  )

  const separator = (
    <span
      aria-hidden
      className="inline-block h-[2px] w-4 rounded-full bg-[var(--c-ember)] align-middle"
    />
  )

  if (orientation === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-3 whitespace-nowrap", className)}>
        <span className={latinClasses}>Thakirni</span>
        {separator}
        <span className={arabicClasses}>ذكرني</span>
      </div>
    )
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <span className={latinClasses}>Thakirni</span>
      <span className={arabicClasses} dir="rtl">
        ذكرني
      </span>
      {withCaption && (
        <span
          className="atelier-eyebrow mt-2 text-[var(--atelier-text-subtle)]"
        >
          Est. 2026 · Riyadh
        </span>
      )}
    </div>
  )
}
