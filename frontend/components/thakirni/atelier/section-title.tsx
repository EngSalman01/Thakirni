"use client"

/**
 * SectionTitle — Obsidian Assembly's canonical section header.
 *
 * Structure, top → bottom:
 *   1. eyebrow      — tiny uppercase tracked label, optional numeral ("01 / Places")
 *   2. headline     — oversized serif display, italic accent optional
 *   3. kicker       — short body-sans lede under the headline (optional)
 *   4. hairline     — thin full-width rule (optional, on by default)
 *
 * Uses atelier utility classes so typography stays locked to the system.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type SectionTitleProps = {
  eyebrow?: React.ReactNode
  eyebrowNumeral?: string // e.g., "01"
  headline: React.ReactNode
  /** Italic accent fragment rendered with SOFT axis. Wraps with a space. */
  accent?: React.ReactNode
  kicker?: React.ReactNode
  align?: "start" | "center"
  /** Render the thin dividing rule below the title. Defaults to true. */
  rule?: boolean
  /** Defaults to "h2". */
  as?: "h1" | "h2" | "h3"
  /** Arabic locale — swaps to Reem Kufi for the display line. */
  locale?: "ar" | "en"
  className?: string
}

const headlineSize: Record<NonNullable<SectionTitleProps["as"]>, string> = {
  h1: "atelier-h1",
  h2: "atelier-h2",
  h3: "atelier-h3",
}

export function SectionTitle({
  eyebrow,
  eyebrowNumeral,
  headline,
  accent,
  kicker,
  align = "start",
  rule = true,
  as = "h2",
  locale = "en",
  className,
}: SectionTitleProps) {
  const Headline = as
  const isRtl = locale === "ar"

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {(eyebrow || eyebrowNumeral) && (
        <div
          className={cn(
            "flex items-baseline gap-3 atelier-eyebrow",
            align === "center" && "justify-center",
          )}
        >
          {eyebrowNumeral && (
            <span className="tabular-nums text-[var(--c-ember)]">{eyebrowNumeral}</span>
          )}
          {eyebrowNumeral && eyebrow && (
            <span aria-hidden className="text-[var(--atelier-text-subtle)]">/</span>
          )}
          {eyebrow && <span>{eyebrow}</span>}
        </div>
      )}

      <Headline
        className={cn(
          headlineSize[as],
          isRtl ? "atelier-display-ar" : "atelier-display",
          "text-[var(--atelier-text)]",
          "max-w-[22ch]",
          align === "center" && "mx-auto",
        )}
      >
        {headline}
        {accent && (
          <>
            {" "}
            <span className="atelier-italic text-[var(--c-parchment-2)]">{accent}</span>
          </>
        )}
      </Headline>

      {kicker && (
        <p
          className={cn(
            "atelier-lead",
            "max-w-[56ch]",
            align === "center" && "mx-auto",
          )}
        >
          {kicker}
        </p>
      )}

      {rule && (
        <hr
          aria-hidden
          className={cn(
            "atelier-rule mt-2",
            align === "center" ? "w-24" : "w-full",
          )}
        />
      )}
    </div>
  )
}
