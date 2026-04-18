"use client"

/**
 * FooterConstellation — the oversized closing footer.
 *
 * Mirrors OA's closing page:
 *   - Giant serif "Thakirni / ذكرني" wordmark on the first row
 *   - Multi-column link grid below (Assembly, Vault, Dispatches, Legal)
 *   - A hairline rule
 *   - Fine caption + locale/theme controls on the last row
 *
 * Each link uses the atelier-h3 serif — footer links are meant to feel like
 * chapter titles, not tiny nav lines.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { WordmarkStacked } from "./wordmark-stacked"

export type FooterLink = {
  label: React.ReactNode
  href: string
  external?: boolean
}

export type FooterColumn = {
  heading: React.ReactNode
  links: FooterLink[]
}

export type FooterConstellationProps = {
  columns: FooterColumn[]
  /** Closing line of fine print, e.g., copyright. */
  colophon?: React.ReactNode
  /** Right-rail slot for locale + theme toggles. */
  controls?: React.ReactNode
  /** Subtitle under the wordmark. */
  tagline?: React.ReactNode
  locale?: "en" | "ar"
  className?: string
}

export function FooterConstellation({
  columns,
  colophon,
  controls,
  tagline,
  locale = "en",
  className,
}: FooterConstellationProps) {
  const isRtl = locale === "ar"

  return (
    <footer
      className={cn(
        "relative overflow-hidden",
        "bg-[var(--atelier-bg)]",
        "text-[var(--atelier-text)]",
        "border-t border-[var(--atelier-border)]",
        className,
      )}
    >
      {/* Ambient ember wash behind the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,81,19,0.12), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="atelier-container relative">
        {/* Wordmark row */}
        <div className="flex flex-col items-start gap-8 pb-16 pt-24 md:pb-24 md:pt-32">
          <WordmarkStacked
            size="xl"
            orientation="stacked"
            primary={isRtl ? "arabic" : "latin"}
          />
          {tagline && (
            <p className="atelier-lead max-w-[40ch] text-[var(--atelier-text-muted)]">
              {tagline}
            </p>
          )}
        </div>

        <hr className="atelier-rule" />

        {/* Link grid */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-4"
        >
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-6">
              <div className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
                {col.heading}
              </div>
              <ul className="flex flex-col gap-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "atelier-h3",
                        isRtl ? "atelier-display-ar" : "atelier-display",
                        "block py-1 text-[var(--atelier-text-muted)]",
                        "transition-colors duration-[var(--atelier-dur-2)]",
                        "hover:text-[var(--c-parchment)]",
                        "relative group",
                      )}
                    >
                      <span>{link.label}</span>
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-[var(--c-ember)] transition-all duration-[var(--atelier-dur-2)] group-hover:w-full"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <hr className="atelier-rule" />

        {/* Colophon + controls */}
        <div className="flex flex-col items-start gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="atelier-label text-[var(--atelier-text-subtle)] max-w-[60ch]">
            {colophon}
          </div>
          {controls && <div className="flex items-center gap-3">{controls}</div>}
        </div>
      </div>
    </footer>
  )
}
