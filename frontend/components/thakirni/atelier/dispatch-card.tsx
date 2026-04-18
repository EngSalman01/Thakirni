"use client"

/**
 * DispatchCard — editorial card used for blog posts, feature stories, and
 * case-study tiles. Modeled on OA's "Updates" tiles.
 *
 * Structure:
 *   ┌────────────────────────────┐
 *   │ [eyebrow · date]           │
 *   │                            │
 *   │  Serif headline (2-line)   │
 *   │                            │
 *   │  Body lede, max 3 lines    │
 *   │                            │
 *   │  ── read more →            │
 *   └────────────────────────────┘
 *
 * Optional cover image slides above. Hover raises the card + ember glow.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type DispatchCardProps = {
  eyebrow?: React.ReactNode
  date?: string
  title: React.ReactNode
  excerpt?: React.ReactNode
  href?: string
  cover?: React.ReactNode // slot for Image/video/svg
  /** Action label for the trailing link. Defaults to "Read". */
  readLabel?: string
  className?: string
  /** Locale — swaps title typography to Arabic display. */
  locale?: "en" | "ar"
}

export function DispatchCard({
  eyebrow,
  date,
  title,
  excerpt,
  href,
  cover,
  readLabel = "Read",
  className,
  locale = "en",
}: DispatchCardProps) {
  const inner = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        "bg-[var(--atelier-surface)] hover:bg-[var(--atelier-surface-hover)]",
        "border border-[var(--atelier-border)]",
        "rounded-[var(--atelier-radius-md)]",
        "shadow-[var(--atelier-shadow-card)] hover:shadow-[var(--atelier-shadow-hover)]",
        "transition-all duration-[var(--atelier-dur-3)] ease-[var(--atelier-ease-editorial)]",
        "hover:-translate-y-0.5",
        className,
      )}
    >
      {cover && (
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[var(--atelier-border)]">
          <div className="h-full w-full transition-transform duration-[var(--atelier-dur-4)] ease-[var(--atelier-ease-editorial)] group-hover:scale-[1.03]">
            {cover}
          </div>
          {/* Warm scrim */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[var(--c-obsidian)]/50 via-transparent to-transparent"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        {(eyebrow || date) && (
          <div className="flex items-baseline justify-between atelier-eyebrow">
            {eyebrow && <span>{eyebrow}</span>}
            {date && <time className="tabular-nums text-[var(--atelier-text-subtle)]">{date}</time>}
          </div>
        )}

        <h3
          className={cn(
            "atelier-h3",
            locale === "ar" ? "atelier-display-ar" : "atelier-display",
            "text-[var(--atelier-text)]",
            "line-clamp-3",
          )}
        >
          {title}
        </h3>

        {excerpt && (
          <p className="atelier-body text-[var(--atelier-text-muted)] line-clamp-3">
            {excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-4">
          <span
            aria-hidden
            className="h-[1px] w-8 bg-[var(--atelier-border-strong)] transition-all duration-[var(--atelier-dur-2)] group-hover:w-14 group-hover:bg-[var(--c-ember)]"
          />
          <span className="atelier-label text-[var(--atelier-text-muted)] group-hover:text-[var(--c-parchment)] transition-colors">
            {readLabel}
          </span>
          <span
            aria-hidden
            className="text-[var(--atelier-text-subtle)] transition-transform duration-[var(--atelier-dur-2)] group-hover:translate-x-1 group-hover:text-[var(--c-ember)]"
          >
            →
          </span>
        </div>
      </div>
    </div>
  )

  return href ? (
    <Link
      href={href}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--atelier-bg)] rounded-[var(--atelier-radius-md)]"
    >
      {inner}
    </Link>
  ) : (
    inner
  )
}
